import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GameError, playerActions as P, hostActions as H, validateSettings, snapshotOf, applySnapshot,
  publicState, newGameId, MAX_PLAYERS,
} from '../src/game.js';

function table(overrides = {}) {
  return {
    gameId: 'g', createdAt: 0, seq: 0, players: [], pot: 0,
    startingChips: 1000, smallBlind: 10, bigBlind: 20, allowBuyIn: false, buyInAmount: 1000, ...overrides,
  };
}

const rejects = (fn, msg) => assert.throws(fn, (e) => e instanceof GameError && e.message === msg);

test('join adds a player on starting chips; rejoin is case-insensitive and changes nothing', () => {
  const g = table();
  const first = P.join(g, { name: '  Ana  ' });
  assert.equal(first.message, 'Ana joined with 1000');
  assert.deepEqual(first.result, { name: 'Ana', chips: 1000, isRejoin: false });
  const again = P.join(g, { name: 'ANA' });
  assert.equal(again.message, undefined);
  assert.deepEqual(again.result, { name: 'Ana', chips: 1000, isRejoin: true });
  assert.equal(g.players.length, 1);
});

test('join validates the name and the table size', () => {
  rejects(() => P.join(table(), { name: '   ' }), 'Name cannot be empty');
  rejects(() => P.join(table(), { name: 'x'.repeat(21) }), 'Name too long');
  const g = table();
  for (let i = 0; i < MAX_PLAYERS; i++) P.join(g, { name: `p${i}` });
  rejects(() => P.join(g, { name: 'one more' }), 'The table is full');
});

test('bet moves chips into the pot; take and take-all move them back', () => {
  const g = table();
  P.join(g, { name: 'Ana' });
  P.join(g, { name: 'Bo' });
  assert.equal(P.bet(g, { name: 'ana', amount: 100 }).message, 'Ana bet 100 (pot 100)');
  P.bet(g, { name: 'Bo', amount: '50' });
  assert.equal(P.take(g, { name: 'Bo', amount: 30 }).message, 'Bo took 30 from pot (pot 120)');
  const all = P.takeAll(g, { name: 'Ana' });
  assert.deepEqual(all.result, { taken: 120 });
  assert.equal(g.pot, 0);
  assert.deepEqual(g.players.map((p) => [p.name, p.chips]), [['Ana', 1020], ['Bo', 980]]);
});

test('chip actions reject bad amounts and unknown players without changing anything', () => {
  const g = table();
  P.join(g, { name: 'Ana' });
  const before = structuredClone(g);
  rejects(() => P.bet(g, { name: 'Ana', amount: 0 }), 'Amount must be positive');
  rejects(() => P.bet(g, { name: 'Ana', amount: 1.5 }), 'Amount must be a whole number');
  rejects(() => P.bet(g, { name: 'Ana', amount: 'abc' }), 'Amount must be a whole number');
  rejects(() => P.bet(g, { name: 'Ana', amount: 2e9 }), 'Amount is too large');
  rejects(() => P.bet(g, { name: 'Ana', amount: 1001 }), 'Not enough chips');
  rejects(() => P.bet(g, { name: 'Zed', amount: 1 }), 'Player not found');
  rejects(() => P.take(g, { name: 'Ana', amount: 1 }), 'Not enough in pot');
  rejects(() => P.takeAll(g, { name: 'Ana' }), 'Pot is empty');
  assert.deepEqual(g, before);
});

test('balances may not overflow the app\'s Int range', () => {
  const g = table({ players: [{ name: 'Ana', chips: 2_000_000_000 }], pot: 1_000_000_000 });
  rejects(() => P.takeAll(g, { name: 'Ana' }), 'Chips would be too large');
  assert.equal(g.pot, 1_000_000_000);
});

test('host corrections record what changed and skip no-ops', () => {
  const g = table();
  P.join(g, { name: 'Ana' });
  assert.equal(H.setChips(g, { name: 'ana', chips: 500 }).message, "Host set Ana's chips 1000 → 500");
  assert.equal(H.setChips(g, { name: 'Ana', chips: 500 }).message, undefined);
  assert.equal(H.setPot(g, { amount: 40 }).message, 'Host set pot 0 → 40');
  assert.equal(H.setBlinds(g, { small: 25, big: 50 }).message, 'Blinds set to 25/50');
  rejects(() => H.setBlinds(g, { small: 60, big: 50 }), 'Small blind cannot exceed big blind');
  assert.equal(H.setStartingChips(g, { amount: 2000 }).message, 'Starting chips set to 2000');
  assert.equal(H.remove(g, { name: 'ANA' }).message, 'Ana left the game with 500');
  assert.equal(g.players.length, 0);
});

test('settings default like the app and are validated', () => {
  assert.deepEqual(validateSettings({}),
    { startingChips: 1000, smallBlind: 10, bigBlind: 20, allowBuyIn: false, buyInAmount: 1000 });
  assert.deepEqual(validateSettings({ startingChips: '5000', smallBlind: 50, bigBlind: 100, allowBuyIn: true }),
    { startingChips: 5000, smallBlind: 50, bigBlind: 100, allowBuyIn: true, buyInAmount: 5000 });
  rejects(() => validateSettings({ buyInAmount: 0 }), 'Buy-in must be positive');
  rejects(() => validateSettings({ smallBlind: 30, bigBlind: 20 }), 'Small blind cannot exceed big blind');
});

test('a snapshot round-trips and the public state has the app\'s shape', () => {
  const g = table();
  P.join(g, { name: 'Ana' });
  P.bet(g, { name: 'Ana', amount: 10 });
  const copy = table();
  applySnapshot(copy, JSON.parse(JSON.stringify(snapshotOf(g))));
  assert.deepEqual(snapshotOf(copy), snapshotOf(g));
  const s = publicState(g, 'ABCDEF', []);
  assert.deepEqual(s.players, { Ana: { name: 'Ana', chips: 990, invested: 1000, buyIns: 0 } });
  assert.equal(s.pot, 10);
  assert.equal(s.code, 'ABCDEF');
});

test('game ids sort by time', () => {
  assert.match(newGameId(Date.UTC(2026, 10, 12, 9, 5, 3), () => 0), /^20261112-090503-1000$/);
});

test('buy-ins: players only when allowed, host always; counted as money put in', () => {
  const g = table({ allowBuyIn: false, buyInAmount: 500 });
  P.join(g, { name: 'Ana' });
  rejects(() => P.buyIn(g, { name: 'Ana' }), 'Buy-ins are off at this table');
  assert.equal(H.buyIn(g, { name: 'ana' }).message, 'Host gave Ana a buy-in of 500');
  assert.equal(H.setBuyIn(g, { allow: true, amount: 300 }).message, 'Buy-ins on: 300 each');
  assert.equal(H.setBuyIn(g, { allow: true, amount: 300 }).message, undefined);
  assert.equal(P.buyIn(g, { name: 'Ana' }).message, 'Ana bought in for 300');
  assert.deepEqual(g.players[0], { name: 'Ana', chips: 1800, invested: 1800, buyIns: 2 });
  assert.equal(H.setBuyIn(g, { allow: false }).message, 'Buy-ins off');
  const s = publicState(g, 'ABCDEF', []);
  assert.equal(s.allowBuyIn, false);
  assert.equal(s.players.Ana.invested, 1800);
});

test('journal entries written before buy-ins existed still load', () => {
  const g = table();
  applySnapshot(g, { players: [{ name: 'Ana', chips: 700 }], pot: 300, startingChips: 1000, smallBlind: 10, bigBlind: 20 });
  assert.deepEqual(g.players, [{ name: 'Ana', chips: 700, invested: 1000, buyIns: 0 }]);
  assert.equal(g.allowBuyIn, false);
  assert.equal(g.buyInAmount, 1000);
});
