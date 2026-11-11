// Two-browser end-to-end check (host + player). Not part of `npm test`: needs Playwright.
// Usage: node test/e2e.mjs [base URL, default http://127.0.0.1:8788]  (CHROME=/path/to/chrome optional)
import { chromium, devices } from 'playwright';
const B = process.argv[2] || 'http://127.0.0.1:8788';
const out = (n) => `${process.env.SHOTS || '/tmp'}/easypoker-${n}.png`;
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const phone = { ...devices['Pixel 7'] };
const hostCtx = await browser.newContext(phone);
const playerCtx = await browser.newContext(phone);
const host = await hostCtx.newPage();
const player = await playerCtx.newPage();
const errors = [];
for (const p of [host, player]) p.on('pageerror', (e) => errors.push(e.message));
const check = (cond, msg) => { if (!cond) { console.log('FAIL', msg); process.exitCode = 1; } else console.log('ok  ', msg); };

await host.goto(B + '/');
await host.screenshot({ path: out('1-home'), fullPage: true });
await host.fill('#host-name', 'Ana');
await host.selectOption('#blinds', '5/10');
await host.fill('#starting-chips', '500');
await host.click('#create-btn');
await host.waitForURL(/\/[A-Z0-9]{6}$/);
const code = new URL(host.url()).pathname.slice(1);
await host.waitForSelector('#host-view:not(.hidden)');
check(await host.isVisible('#tabs'), 'host sees Play/Host tabs');
check(await host.isVisible('#host-view'), 'host lands on Host tab while alone');
check(await host.isVisible('#invite'), 'invite card visible on Host tab');
await host.waitForSelector('#qr svg', { timeout: 5000 }).catch(() => {});
check(await host.isVisible('#qr svg'), 'QR code drawn');
await host.screenshot({ path: out('2-host'), fullPage: true });

await player.goto(B + '/' + code.toLowerCase());
await player.waitForSelector('#join-screen:not(.hidden)');
await player.fill('#name-input', 'Bo');
await player.click('#join-btn');
await player.waitForSelector('#game-screen:not(.hidden)');
check(!(await player.isVisible('#tabs')) && !(await player.isVisible('#host-view')), 'player has no tabs or host view');
check((await player.textContent('#my-chips')).includes('500'), 'player starts with 500');

await player.click('.quick-btn:has-text("5 BB")');
await player.click('#add-btn');
await host.waitForFunction(() => document.querySelector('#host-summary').textContent.includes('pot 50'), null, { timeout: 5000 });
check(true, 'host view sees pot 50 live after player bet');
await host.screenshot({ path: out('2b-host-2players'), fullPage: true });
await host.click('#tab-play');
check(await host.isVisible('#game-screen'), 'Play tab shows the game view');
check((await host.textContent('#pot-amount')) === '50', 'game view pot 50');

await host.click('#take-all-btn');
await player.waitForFunction(() => document.querySelector('#pot-amount').textContent === '0', null, { timeout: 5000 });
const hostChips = await host.textContent('#my-chips');
check(hostChips.includes('550'), 'host took whole pot: ' + hostChips);

// Host corrects Bo's chips via the sheet
await host.click('#tab-host');
await host.click('.ep-player:has-text("Bo")');
await host.fill('#sheet-chips', '777');
await host.click('#sheet-save');
await player.waitForFunction(() => document.querySelector('#my-chips').textContent.startsWith('777'), null, { timeout: 5000 });
check(true, 'player sees host correction 777');

// Reload player: auto-rejoins with same name, same chips
await player.reload();
await player.waitForSelector('#game-screen:not(.hidden)');
check((await player.textContent('#my-chips')).startsWith('777'), 'player reload keeps seat and chips');

// History & restore to the entry after Bo's bet
await host.click('#history-btn');
await host.waitForSelector('.ep-game');
await host.click('.ep-game');
const entry = await host.locator('.ep-entry', { hasText: 'Bo bet 50' }).elementHandle();
await entry.click();
await host.screenshot({ path: out('3-history'), fullPage: true });
await entry.click();
await player.waitForFunction(() => document.querySelector('#pot-amount').textContent === '50', null, { timeout: 5000 });
check((await player.textContent('#my-chips')).startsWith('450'), 'restore rewound Bo to 450 and pot 50');

// Unknown table
const p3 = await playerCtx.newPage();
await p3.goto(B + '/ZZZZZZ');
await p3.waitForSelector('#missing-screen:not(.hidden)');
check(true, 'unknown code shows missing screen');

// Player cannot use host endpoint
const r = await player.evaluate(async (c) => (await fetch(`/api/t/${c}/host/pot`, { method: 'POST', body: '{"amount":0}' })).status, code);
check(r === 403, 'host endpoint without key is 403');

await player.screenshot({ path: out('4-player'), fullPage: true });
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const d = await desk.newPage();
await d.goto(B + '/');
await d.screenshot({ path: out('5-home-desktop') });
await d.evaluate(([c, k]) => localStorage.setItem('easypoker.host.' + c, k), [code, await host.evaluate((c) => localStorage.getItem('easypoker.host.' + c), code)]);
await d.goto(B + '/' + code);
await d.waitForSelector('#tabs:not(.hidden)');
await d.click('#tab-host');
await d.waitForTimeout(500);
await d.screenshot({ path: out('6-host-desktop'), fullPage: true });
check(errors.length === 0, 'no page errors ' + errors.join(' | '));
await browser.close();
