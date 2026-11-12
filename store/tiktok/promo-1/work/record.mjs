// Records one real host session of the easypoker.cc table page at phone size (390x693 @3x)
// through Chrome's screencast, against a local `wrangler dev` (never production).
// Friends join and bet through the same public API their phones would use.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = 'http://127.0.0.1:8788';
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' });
const ctx = await b.newContext({
  viewport: { width: 390, height: 693 }, deviceScaleFactor: 3, isMobile: true, hasTouch: false, locale: 'en-US',
});
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
// "Show touches" dot, as a phone screen recording shows taps.
await ctx.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'fixed', width: '38px', height: '38px', margin: '-19px 0 0 -19px', borderRadius: '50%',
      background: 'rgba(200,200,206,.38)', border: '1.5px solid rgba(255,255,255,.85)', pointerEvents: 'none', zIndex: 2147483647,
      opacity: 0, transition: 'opacity .12s' });
    document.documentElement.appendChild(d);
    const at = (e) => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; };
    addEventListener('mousedown', (e) => { at(e); d.style.opacity = 1; }, true);
    addEventListener('mousemove', at, true);
    addEventListener('mouseup', () => setTimeout(() => (d.style.opacity = 0), 90), true);
    // The recording runs on localhost; show the invite link as players would see it.
    const fix = () => { for (const el of document.querySelectorAll('#invite-link, #host-code')) {
      if (el.textContent.includes('127.0.0.1:8788')) el.textContent = el.textContent.replace('127.0.0.1:8788', 'easypoker.cc'); } };
    new MutationObserver(fix).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  });
});
const p = await ctx.newPage();
fs.rmSync('rec', { recursive: true, force: true });
fs.mkdirSync('rec/frames', { recursive: true });
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  const n = frames.length;
  fs.writeFileSync(`rec/frames/${String(n).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64'));
  frames.push([n, f.metadata.timestamp]);
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1170, maxHeight: 2079, everyNthFrame: 1 });
const T0 = Date.now();
const log = [];
const mark = (name) => { log.push([name, (Date.now() - T0) / 1000]); console.log(name, ((Date.now() - T0) / 1000).toFixed(2)); };
const wait = (ms) => p.waitForTimeout(ms);
const rnd = (a, z) => a + Math.random() * (z - a);
async function scroll(dy, steps = 14) { for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, dy / steps); await wait(28); } }
async function tap(loc, hold = 90) {
  let bb = await loc.boundingBox();
  if (bb.y + bb.height > 693 - 30 || bb.y < 40) { await scroll(bb.y - 693 * 0.5, 14); await wait(400); bb = await loc.boundingBox(); }
  const x = bb.x + bb.width * rnd(0.4, 0.6), y = bb.y + bb.height * rnd(0.4, 0.6);
  await p.mouse.move(x, y); await p.mouse.down(); await wait(hold); await p.mouse.up();
}
async function type(text) { for (const ch of text) { await p.keyboard.type(ch); await wait(rnd(80, 190)); } }
let code;
const api = async (path, body) => {
  const r = await fetch(`${BASE}/api/t/${code}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(path + ' ' + r.status + ' ' + (await r.text()));
};

await p.goto(BASE + '/'); await p.evaluate(() => document.fonts.ready); await wait(900);
mark('home');
await wait(1300);
await tap(p.locator('#host-name')); await wait(450);
mark('type');
await type('Anna'); await wait(300);
await p.keyboard.press('Backspace'); await wait(380);
await wait(500);
mark('create');
await tap(p.locator('#create-btn'));
await p.waitForURL(/\/[A-Z0-9]{6}$/);
code = new URL(p.url()).pathname.slice(1);
await p.waitForSelector('#host-view:not(.hidden)');
await p.waitForSelector('#qr svg', { timeout: 5000 }).catch(() => {});
mark('table');
await wait(1600);
await tap(p.locator('#copy-btn')); await wait(1500);
mark('joins');
for (const n of ['Tom', 'Kasia', 'Leo', 'Maya']) { await api('join', { name: n }); await wait(rnd(650, 1000)); }
// show the players list filling up
const pl = await p.locator('#host-players').boundingBox();
await scroll(pl.y - 200, 16); await wait(1800);
mark('play');
await tap(p.locator('#tab-play')); await wait(1100);
mark('bets');
await api('pot/add', { name: 'Tom', amount: 10 }); await wait(700);
await api('pot/add', { name: 'Kasia', amount: 20 }); await wait(900);
await api('pot/add', { name: 'Leo', amount: 60 }); await wait(1000);
mark('mybet');
await tap(p.locator('.quick-btn:has-text("3 BB")')); await wait(700);
await tap(p.locator('#add-btn')); await wait(900);
await api('pot/add', { name: 'Maya', amount: 60 }); await wait(500);
await api('pot/add', { name: 'Tom', amount: 50 }); await wait(500);
await api('pot/add', { name: 'Kasia', amount: 40 }); await wait(1400);
mark('win');
await tap(p.locator('#take-all-btn')); await wait(2600);
mark('end');
await cdp.send('Page.stopScreencast');
fs.writeFileSync('rec/log.json', JSON.stringify({ code, T0: T0 / 1000, log, frames }, null, 1));
await ctx.close(); await b.close();
console.log('saved', frames.length, 'frames, table', code);
