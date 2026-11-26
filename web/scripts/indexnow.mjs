// Pings IndexNow (Bing, Yandex, Seznam, Naver) with every URL in public/sitemap.xml.
// Runs after `npm run deploy`; safe to re-run. The key file public/<KEY>.txt must stay
// deployed and unchanged, or every submission fails authentication.
import { readFileSync } from 'node:fs';

const KEY = '734bf2ccccc245d7e1c74693317cebe2';
const HOST = 'easypoker.cc';
const xml = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// api.indexnow.org relays to Bing and friends. Yandex is asked directly because on
// 2026-11-26 Bing answered 403 UserForbiddedToAccessSite for a byte-exact key file
// while Yandex accepted (202); one failing engine should not hide the other.
const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://yandex.com/indexnow'];
const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList });
let ok = 0;
for (const endpoint of ENDPOINTS) {
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
  const good = res.status === 200 || res.status === 202;
  ok += good;
  console.log(`IndexNow ${new URL(endpoint).host}: ${res.status} for ${urlList.length} URLs${good ? '' : ` ${(await res.text()).slice(0, 200)}`}`);
}
if (!ok) process.exitCode = 1;
