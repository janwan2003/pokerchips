// Game rules for one table, ported from the Android app's GameManager.kt.
//
// Every function here works on a plain state object and either throws GameError
// (nothing changed) or returns { message, result }. A `message` means the state
// changed and must be journaled; no message means it was a no-op.

export const MAX_NAME_LENGTH = 20;
export const MAX_PLAYERS = 30;
export const MAX_AMOUNT = 1_000_000_000;
export const DEFAULT_STARTING_CHIPS = 1000;
export const DEFAULT_SMALL_BLIND = 10;
export const DEFAULT_BIG_BLIND = 20;

export const BLIND_LEVELS = [
  [1, 2], [5, 10], [10, 20], [20, 40], [50, 100],
  [100, 200], [200, 400], [500, 1000], [1000, 2000],
];

export class GameError extends Error {}

function fail(message) {
  throw new GameError(message);
}

function wholeNumber(value, what) {
  if (typeof value === 'string' && value.trim() !== '') value = Number(value);
  if (!Number.isSafeInteger(value)) fail(`${what} must be a whole number`);
  if (value > MAX_AMOUNT) fail(`${what} is too large`);
  return value;
}

function positive(value, what) {
  const n = wholeNumber(value, what);
  if (n <= 0) fail(`${what} must be positive`);
  return n;
}

function nonNegative(value, what) {
  const n = wholeNumber(value, what);
  if (n < 0) fail(`${what} cannot be negative`);
  return n;
}

export function cleanName(raw) {
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (!name) fail('Name cannot be empty');
  if (name.length > MAX_NAME_LENGTH) fail('Name too long');
  return name;
}

export function findPlayer(game, name) {
  const wanted = String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  return game.players.find((p) => p.name.toLowerCase() === wanted);
}

function requirePlayer(game, name) {
  return findPlayer(game, name) ?? fail('Player not found');
}

/** Checks table settings for a new table; returns them cleaned. */
export function validateSettings({ startingChips, smallBlind, bigBlind } = {}) {
  const chips = positive(startingChips ?? DEFAULT_STARTING_CHIPS, 'Starting chips');
  const small = positive(smallBlind ?? DEFAULT_SMALL_BLIND, 'Small blind');
  const big = positive(bigBlind ?? DEFAULT_BIG_BLIND, 'Big blind');
  if (small > big) fail('Small blind cannot exceed big blind');
  return { startingChips: chips, smallBlind: small, bigBlind: big };
}

/** Actions any player can take. */
export const playerActions = {
  join(game, { name }) {
    const clean = cleanName(name);
    const existing = findPlayer(game, clean);
    if (existing) {
      return { result: { name: existing.name, chips: existing.chips, isRejoin: true } };
    }
    if (game.players.length >= MAX_PLAYERS) fail('The table is full');
    game.players.push({ name: clean, chips: game.startingChips });
    return {
      message: `${clean} joined with ${game.startingChips}`,
      result: { name: clean, chips: game.startingChips, isRejoin: false },
    };
  },

  bet(game, { name, amount }) {
    const player = requirePlayer(game, name);
    const n = positive(amount, 'Amount');
    if (player.chips < n) fail('Not enough chips');
    player.chips -= n;
    game.pot += n;
    return { message: `${player.name} bet ${n} (pot ${game.pot})` };
  },

  take(game, { name, amount }) {
    const player = requirePlayer(game, name);
    const n = positive(amount, 'Amount');
    if (game.pot < n) fail('Not enough in pot');
    player.chips += n;
    game.pot -= n;
    return { message: `${player.name} took ${n} from pot` + (game.pot > 0 ? ` (pot ${game.pot})` : '') };
  },

  /** The winner takes whatever the pot holds when the request lands. */
  takeAll(game, { name }) {
    const player = requirePlayer(game, name);
    if (game.pot <= 0) fail('Pot is empty');
    const won = game.pot;
    player.chips += won;
    game.pot = 0;
    return { message: `${player.name} took the whole pot (${won})`, result: { taken: won } };
  },
};

/** Corrections only the host can make. */
export const hostActions = {
  setChips(game, { name, chips }) {
    const player = requirePlayer(game, name);
    const n = nonNegative(chips, 'Chips');
    if (player.chips === n) return {};
    const before = player.chips;
    player.chips = n;
    return { message: `Host set ${player.name}'s chips ${before} → ${n}` };
  },

  setPot(game, { amount }) {
    const n = nonNegative(amount, 'Pot');
    if (n === game.pot) return {};
    const before = game.pot;
    game.pot = n;
    return { message: `Host set pot ${before} → ${n}` };
  },

  remove(game, { name }) {
    const player = requirePlayer(game, name);
    game.players = game.players.filter((p) => p !== player);
    return { message: `${player.name} left the game with ${player.chips}` };
  },

  setBlinds(game, { small, big }) {
    const s = positive(small, 'Small blind');
    const b = positive(big, 'Big blind');
    if (s > b) fail('Small blind cannot exceed big blind');
    if (s === game.smallBlind && b === game.bigBlind) return {};
    game.smallBlind = s;
    game.bigBlind = b;
    return { message: `Blinds set to ${s}/${b}` };
  },

  setStartingChips(game, { amount }) {
    const n = positive(amount, 'Starting chips');
    if (n === game.startingChips) return {};
    game.startingChips = n;
    return { message: `Starting chips set to ${n}` };
  },
};

/** The part of a game that is journaled with every entry. */
export function snapshotOf(game) {
  return {
    players: game.players.map((p) => ({ name: p.name, chips: p.chips })),
    pot: game.pot,
    startingChips: game.startingChips,
    smallBlind: game.smallBlind,
    bigBlind: game.bigBlind,
  };
}

export function applySnapshot(game, snap) {
  game.players = snap.players.map((p) => ({ name: p.name, chips: p.chips }));
  game.pot = snap.pot;
  game.startingChips = snap.startingChips;
  game.smallBlind = snap.smallBlind;
  game.bigBlind = snap.bigBlind;
}

/** What every browser sees. Same shape as the Android app's GameState. */
export function publicState(game, code, log) {
  const players = {};
  for (const p of game.players) players[p.name] = { name: p.name, chips: p.chips };
  return {
    code,
    gameId: game.gameId,
    createdAt: game.createdAt,
    players,
    order: game.players.map((p) => p.name),
    pot: game.pot,
    startingChips: game.startingChips,
    smallBlind: game.smallBlind,
    bigBlind: game.bigBlind,
    log,
  };
}

export function newGameId(now, random = Math.random) {
  const d = new Date(now);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  const suffix = Math.floor(0x1000 + random() * (0xffff - 0x1000)).toString(16);
  return `${stamp}-${suffix}`;
}
