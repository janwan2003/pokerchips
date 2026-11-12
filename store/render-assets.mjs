// Renders the Play Store graphics into store/: icon, feature graphic and four phone
// screenshots taken from a real table. Run against a local server, not the live site:
//   cd web && npx wrangler dev --port 8789
//   CHROME=/path/to/chrome node store/render-assets.mjs   (needs the playwright package)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const B = 'http://127.0.0.1:8789', OUT = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const chip = readFileSync(new URL('../web/public/favicon.svg', import.meta.url), 'utf8');
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const font = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700..800&family=Inter:wght@500;600&display=swap">`;

// 512x512 icon
let p = await b.newPage({ viewport: { width: 512, height: 512 } });
await p.setContent(`<body style="margin:0;width:512px;height:512px;background:#1A1A2E;display:grid;place-items:center">${chip.replace('<svg ', '<svg width="360" height="360" ')}</body>`);
await p.screenshot({ path: OUT + '/icon-512.png' });

// 1024x500 feature graphic
p = await b.newPage({ viewport: { width: 1024, height: 500 } });
await p.setContent(`<html><head>${font}</head><body style="margin:0;width:1024px;height:500px;background:radial-gradient(120% 120% at 85% 50%,#1b2a55 0%,#11121d 60%);color:#f4f1e8;font-family:Inter;display:flex;align-items:center;gap:56px;padding:0 72px;box-sizing:border-box;overflow:hidden">
<div style="flex:1"><div style="font-family:'Bricolage Grotesque';font-weight:800;font-size:30px;display:flex;align-items:center;gap:12px">${chip.replace('<svg ', '<svg width="44" height="44" ')}EasyPoker</div>
<div style="font-family:'Bricolage Grotesque';font-weight:800;font-size:64px;line-height:.98;letter-spacing:-.035em;margin-top:22px">Bring the cards.<br><span style="color:#f1c40f">We bring the chips.</span></div>
<div style="color:#aeacc0;font-size:22px;margin-top:20px">Every player's stack on their own phone.</div></div>
<div style="transform:rotate(-12deg);filter:drop-shadow(0 20px 30px rgba(0,0,0,.5))">${chip.replace('<svg ', '<svg width="300" height="300" ')}</div></body></html>`);
await p.waitForTimeout(1200);
await p.screenshot({ path: OUT + '/feature-1024x500.png' });

// Screenshots 1080x1920 from a real table on the local server
const phone = { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const host = await (await b.newContext(phone)).newPage();
await host.goto(B + '/');
await host.fill('#host-name', 'Ana'); await host.selectOption('#blinds', '50/100');
await host.fill('#starting-chips', '2000'); await host.check('#allow-buyin', { force: true });
await host.click('#create-btn'); await host.waitForURL(/\/[A-Z0-9]{6}$/);
const code = new URL(host.url()).pathname.slice(1);
const api = (path, body) => fetch(`${B}/api/t/${code}${path}`, { method: 'POST', body: JSON.stringify(body) });
for (const n of ['Bo', 'Kasia', 'Marek']) await api('/join', { name: n });
await api('/pot/add', { name: 'Bo', amount: 150 }); await api('/pot/add', { name: 'Kasia', amount: 150 });
await api('/pot/add', { name: 'Marek', amount: 400 }); await api('/pot/add', { name: 'Bo', amount: 250 });
await api('/pot/take-all', { name: 'Kasia' });
await api('/buy-in', { name: 'Marek' });
await api('/pot/add', { name: 'Kasia', amount: 100 }); await api('/pot/add', { name: 'Marek', amount: 100 });
const player = await (await b.newContext(phone)).newPage();
await player.goto(B + '/' + code); await player.waitForSelector('html[data-ready]');
await player.fill('#name-input', 'Kasia'); await player.click('#join-btn');
await player.waitForSelector('#game-screen:not(.hidden)'); await player.waitForTimeout(800);
await player.click('.quick-btn:has-text("3 BB")');
await player.screenshot({ path: OUT + '/screenshot-1-play.png' });
await player.evaluate(() => window.scrollTo(0, 520)); await player.waitForTimeout(300);
await player.screenshot({ path: OUT + '/screenshot-2-players.png' });
await host.reload(); await host.waitForSelector('#tabs:not(.hidden)');
await host.click('#tab-host'); await host.waitForSelector('#qr svg'); await host.waitForTimeout(800);
// Show what players see on the live site, not the local test server's address.
await host.evaluate((c) => {
  const url = 'https://easypoker.cc/' + c;
  document.querySelector('#invite-link').textContent = 'easypoker.cc/' + c;
  const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
  document.querySelector('#qr').innerHTML = qr.createSvgTag({ cellSize: 5, margin: 1, scalable: true });
}, code);
await host.screenshot({ path: OUT + '/screenshot-3-invite.png' });
await host.evaluate(() => { document.querySelector('#players-title').scrollIntoView(); window.scrollBy(0, -84); }); await host.waitForTimeout(300);
await host.screenshot({ path: OUT + '/screenshot-4-host.png' });
console.log('table', code);
await b.close();
