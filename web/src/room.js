import { DurableObject } from 'cloudflare:workers';
import {
  GameError, playerActions, hostActions, validateSettings, snapshotOf, applySnapshot,
  publicState, newGameId,
} from './game.js';

const RECENT_LOG_SIZE = 50;
const MAX_BODY_BYTES = 10_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
const error = (message, status = 400) => json({ error: message }, status);

/**
 * One table, identified by its join code. All of the table's games live here in an
 * append-only SQLite journal: one row per action, each carrying the full state after
 * it, so any row is a point the game can be restored to. Nothing deletes a row.
 *
 * Browsers connect with hibernating WebSockets, so an idle table costs nothing.
 */
export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.game = null; // { gameId, createdAt, seq, players, pot, startingChips, smallBlind, bigBlind }
    this.log = [];
    this.meta = {};
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    ctx.blockConcurrencyWhile(async () => this.load());
  }

  // --- storage ---

  initialized() {
    return this.sql.exec(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='meta'`).toArray().length > 0;
  }

  load() {
    if (!this.initialized()) return;
    for (const row of this.sql.exec('SELECT k, v FROM meta')) this.meta[row.k] = row.v;
    this.loadGame(this.meta.currentGameId);
  }

  setMeta(k, v) {
    this.sql.exec('INSERT INTO meta(k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, v);
    this.meta[k] = v;
  }

  entries(gameId) {
    return this.sql
      .exec('SELECT seq, ts, message, snap FROM journal WHERE game_id = ? ORDER BY seq', gameId)
      .toArray();
  }

  /** Makes a stored game the current one, exactly as its last entry left it. */
  loadGame(gameId) {
    const last = this.sql
      .exec('SELECT seq, snap FROM journal WHERE game_id = ? ORDER BY seq DESC LIMIT 1', gameId)
      .toArray()[0];
    if (!last) return false;
    const first = this.sql
      .exec('SELECT ts FROM journal WHERE game_id = ? ORDER BY seq LIMIT 1', gameId)
      .one();
    const game = { gameId, createdAt: first.ts, seq: last.seq };
    applySnapshot(game, JSON.parse(last.snap));
    this.game = game;
    this.log = this.sql
      .exec(
        'SELECT ts, message FROM (SELECT seq, ts, message FROM journal WHERE game_id = ? ORDER BY seq DESC LIMIT ?) ORDER BY seq',
        gameId, RECENT_LOG_SIZE,
      )
      .toArray()
      .map((r) => ({ timestamp: r.ts, message: r.message }));
    this.setMeta('currentGameId', gameId);
    return true;
  }

  beginGame(players, pot, settings) {
    const now = Date.now();
    this.game = {
      gameId: newGameId(now),
      createdAt: now,
      seq: 0,
      players,
      pot,
      ...settings,
    };
    this.log = [];
    this.setMeta('currentGameId', this.game.gameId);
  }

  record(message) {
    const g = this.game;
    g.seq += 1;
    const now = Date.now();
    this.sql.exec(
      'INSERT INTO journal(game_id, seq, ts, message, snap) VALUES (?, ?, ?, ?, ?)',
      g.gameId, g.seq, now, message, JSON.stringify(snapshotOf(g)),
    );
    this.log.push({ timestamp: now, message });
    if (this.log.length > RECENT_LOG_SIZE) this.log.shift();
  }

  state() {
    return publicState(this.game, this.meta.code, this.log);
  }

  broadcast() {
    const frame = JSON.stringify(this.state());
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(frame); } catch (_) { /* gone; the runtime closes it */ }
    }
  }

  /** Runs a rule on a copy, so a rejected action can never leave half a change behind. */
  apply(rule, body) {
    const draft = structuredClone(this.game);
    const { message, result } = rule(draft, body);
    if (message) {
      this.game = draft;
      this.record(message);
      this.broadcast();
    }
    return result ?? { ok: true };
  }

  // --- HTTP ---

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === '/init' && request.method === 'POST') return this.init(await readJson(request));
      if (!this.game) return error('Game not found', 404);

      if (path === '/ws') return this.acceptSocket(request);
      if (path === '/state' && request.method === 'GET') return json(this.state());

      if (path.startsWith('/pot/') || path === '/join' || path === '/buy-in') {
        if (request.method !== 'POST') return error('Method not allowed', 405);
        const body = await readJson(request);
        const rule = {
          '/join': playerActions.join,
          '/pot/add': playerActions.bet,
          '/pot/take': playerActions.take,
          '/pot/take-all': playerActions.takeAll,
          '/buy-in': playerActions.buyIn,
        }[path];
        if (!rule) return error('Not found', 404);
        return json(this.apply(rule, body));
      }

      if (path.startsWith('/host/')) {
        if (request.headers.get('x-host-key') !== this.meta.hostKey) return error('Only the host can do that', 403);
        return await this.host(path.slice('/host/'.length), request, url);
      }
      return error('Not found', 404);
    } catch (e) {
      if (e instanceof GameError) return error(e.message);
      if (e instanceof BadRequest) return error(e.message);
      throw e;
    }
  }

  init(body) {
    if (this.initialized()) return error('Code already taken', 409);
    const settings = validateSettings(body);
    const code = String(body.code);
    const hostKey = String(body.hostKey);
    this.ctx.storage.transactionSync(() => {
      this.sql.exec('CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)');
      this.sql.exec(`CREATE TABLE journal (
        game_id TEXT NOT NULL, seq INTEGER NOT NULL, ts INTEGER NOT NULL,
        message TEXT NOT NULL, snap TEXT NOT NULL, PRIMARY KEY (game_id, seq))`);
      this.setMeta('code', code);
      this.setMeta('hostKey', hostKey);
      this.setMeta('createdAt', String(Date.now()));
      this.beginGame([], 0, settings);
      this.record(`New table: ${settings.startingChips} chips each, blinds ${settings.smallBlind}/${settings.bigBlind}` +
        (settings.allowBuyIn ? `, buy-ins ${settings.buyInAmount}` : ''));
    });
    return json({ code, hostKey }, 201);
  }

  acceptSocket(request) {
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return error('Expected a WebSocket', 426);
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.send(JSON.stringify(this.state()));
    return new Response(null, { status: 101, webSocket: client });
  }

  async host(action, request, url) {
    if (request.method === 'GET') {
      if (action === 'check') return json({ ok: true });
      if (action === 'games') return json(this.listGames());
      if (action === 'history') {
        const id = url.searchParams.get('game') || this.game.gameId;
        const rows = this.entries(id);
        if (!rows.length) return error('Game not found', 404);
        return json(rows.map((r) => ({ seq: r.seq, timestamp: r.ts, message: r.message, ...JSON.parse(r.snap) })));
      }
      return error('Not found', 404);
    }
    if (request.method !== 'POST') return error('Method not allowed', 405);
    const body = await readJson(request);
    const rule = {
      'player-chips': hostActions.setChips,
      pot: hostActions.setPot,
      remove: hostActions.remove,
      blinds: hostActions.setBlinds,
      'starting-chips': hostActions.setStartingChips,
      'buy-in': hostActions.buyIn,
      'buy-in-settings': hostActions.setBuyIn,
    }[action];
    if (rule) return json(this.apply(rule, body));

    if (action === 'new-game') {
      // A fresh game with the same players on starting chips. The old one stays in history.
      const g = this.game;
      const names = g.players.map((p) => p.name);
      this.beginGame(names.map((name) => ({ name, chips: g.startingChips, invested: g.startingChips, buyIns: 0 })), 0, {
        startingChips: g.startingChips, smallBlind: g.smallBlind, bigBlind: g.bigBlind,
        allowBuyIn: g.allowBuyIn, buyInAmount: g.buyInAmount,
      });
      this.record(names.length ? `New game: ${names.length} players on ${g.startingChips}` : 'New game');
      this.broadcast();
      return json({ ok: true });
    }
    if (action === 'resume') {
      if (!this.loadGame(String(body.gameId))) return error('Game not found', 404);
      this.record('Game resumed');
      this.broadcast();
      return json({ ok: true });
    }
    if (action === 'restore') {
      // Rewinds to the state right after entry `seq`, recorded as a new entry at the
      // end of that game's journal so the rewind itself can be undone.
      const gameId = String(body.gameId);
      const target = this.sql
        .exec('SELECT seq, message, snap FROM journal WHERE game_id = ? AND seq = ?', gameId, Number(body.seq))
        .toArray()[0];
      if (!target) return error('History entry not found', 404);
      this.loadGame(gameId);
      applySnapshot(this.game, JSON.parse(target.snap));
      this.record(`Restored to state after #${target.seq}: ${target.message}`);
      this.broadcast();
      return json({ ok: true });
    }
    return error('Not found', 404);
  }

  listGames() {
    return this.sql
      .exec(`SELECT j.game_id, j.ts AS updated, j.snap, x.created, x.n
             FROM journal j
             JOIN (SELECT game_id, MIN(ts) AS created, MAX(seq) AS last, COUNT(*) AS n
                   FROM journal GROUP BY game_id) x
               ON j.game_id = x.game_id AND j.seq = x.last
             ORDER BY j.ts DESC`)
      .toArray()
      .map((r) => {
        const snap = JSON.parse(r.snap);
        return {
          gameId: r.game_id,
          createdAt: r.created,
          updatedAt: r.updated,
          actions: r.n,
          players: snap.players,
          pot: snap.pot,
          smallBlind: snap.smallBlind,
          bigBlind: snap.bigBlind,
          current: r.game_id === this.game.gameId,
        };
      });
  }

  // --- WebSocket (hibernation API) ---

  webSocketMessage(ws, message) {
    // "ping" is answered by the auto-response without waking us; anything else is ignored.
    if (message === 'ping') ws.send('pong');
  }

  webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch (_) {}
  }

  webSocketError(ws) {
    try { ws.close(1011, 'error'); } catch (_) {}
  }
}

class BadRequest extends Error {}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new BadRequest('Request too large');
  if (!text) return {};
  try {
    const body = JSON.parse(text);
    if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch (_) {
    throw new BadRequest('Invalid JSON');
  }
}
