// The players' game view must be exactly the Android app's player client.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = (p) => readFileSync(new URL(`../../app/src/main/assets/web/${p}`, import.meta.url), 'utf8');
const web = (p) => readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');

test('game.css is the app stylesheet, byte for byte', () => {
  assert.equal(web('css/game.css'), app('css/style.css'));
});

test('table.html carries the app join and game screens verbatim', () => {
  const html = app('index.html');
  const block = html.slice(html.indexOf('<div id="join-screen"'), html.indexOf('<div id="toast"'));
  assert.ok(block.length > 500);
  assert.ok(web('table.html').includes(block), 'app markup changed: re-copy it into web/public/table.html');
});
