// Worker entry point: the app in index.js, wrapped with usage analytics.
//
// HTML pages on easypoker.cc get the Cloudflare Web Analytics beacon (visitors, countries,
// referrers, browsers, load times — see the Cloudflare dashboard).
//
// Every page view, table creation, join and table action is written as one data point to
// Workers Analytics Engine (dataset `easypoker_events`, see wrangler.jsonc). Nothing here
// changes a response or touches a table's journal; a failed write is ignored.
// Query with `npm run stats` (scripts/stats.mjs) or the Analytics Engine SQL API.
//
// Columns (Analytics Engine has positional blobs/doubles; keep this order, only append):
//   index1  event      page | table_created | join | action | host_action | connect
//   blob1   event      same as index1, so SQL can filter without the index
//   blob2   code       table code, '' for pages
//   blob3   detail     page path, or action name (add, take, take-all, buy-in, host chips, …)
//   blob4   country    ISO code from Cloudflare, e.g. PL
//   blob5   region     e.g. Mazovia
//   blob6   city       e.g. Warsaw
//   blob7   referrer   host of the Referer header when it is another site, else ''
//   blob8   device     mobile | desktop | bot
//   blob9   visitor    daily-rotating hash of IP + user agent (counts unique visitors, not reversible)
//   blob10  asOrg      network operator, e.g. Orange Polska
//   blob11  player     player name from the request body (join, bet, take, …), else ''
//   double1 status     HTTP status of the response
//   double2 amount     chips in the request body (bet/take/buy-in), else 0
import app, { Room } from './index.js';

export { Room };

// Cloudflare Web Analytics (dashboard: Analytics > Web analytics > easypoker.cc). Its
// automatic injection does not reach Worker responses, so the beacon is added here.
// The token is public by design: it is in every page's HTML.
const WEB_ANALYTICS_TOKEN = '7f54049b38ef485c805fd2c3a429da3d';
const BEACON = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${WEB_ANALYTICS_TOKEN}"}'></script>`;

function withBeacon(url, response) {
  if (url.hostname !== 'easypoker.cc' || response.status !== 200) return response;
  if (!(response.headers.get('content-type') || '').startsWith('text/html')) return response;
  return new HTMLRewriter()
    .on('body', { element(el) { el.append(BEACON, { html: true }); } })
    .transform(response);
}

const CODE = '[A-Z2-9]{6}';
const API_RE = new RegExp(`^/api/t/(${CODE})(/.*)$`, 'i');
const TABLE_PAGE_RE = new RegExp(`^/(${CODE})/?$`, 'i');
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|curl|wget|python|headless/i;

function classify(request, url, status) {
  const path = url.pathname;
  if (path === '/api/tables' && request.method === 'POST') return { event: 'table_created' };
  const m = path.match(API_RE);
  if (m) {
    const code = m[1].toUpperCase();
    const rest = m[2];
    if (rest === '/ws') return { event: 'connect', code };
    if (request.method !== 'POST') return null; // state polls: too noisy to be useful
    if (rest === '/join') return { event: 'join', code, detail: 'join' };
    if (rest.startsWith('/host/')) return { event: 'host_action', code, detail: rest.slice(6) };
    return { event: 'action', code, detail: rest.slice(1).replace('pot/', '') };
  }
  if (request.method !== 'GET' || status >= 300) return null;
  const t = path.match(TABLE_PAGE_RE);
  if (t) return { event: 'page', code: t[1].toUpperCase(), detail: '/<table>' };
  // Pages only, not assets: no extension, or .html.
  if (/\.[a-z0-9]+$/i.test(path) && !path.endsWith('.html')) return null;
  return { event: 'page', detail: path };
}

async function visitorHash(request) {
  const day = new Date().toISOString().slice(0, 10);
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ua = request.headers.get('user-agent') || '';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${day}|${ip}|${ua}`));
  return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function referrerHost(request, url) {
  try {
    const host = new URL(request.headers.get('referer') || '').hostname;
    return host && host !== url.hostname && host !== `www.${url.hostname}` ? host : '';
  } catch (_) {
    return '';
  }
}

async function readBody(request) {
  try {
    return JSON.parse(await request.text());
  } catch (_) {
    return {};
  }
}

async function record(env, request, url, status, ev, bodyPromise, createdPromise) {
  const body = bodyPromise ? await bodyPromise : {};
  const created = createdPromise ? await createdPromise : {};
  const code = ev.code || created.code || '';
  const detail = ev.detail || '';
  const player = String(body.name || '').slice(0, 40);
  const amount = Number(body.amount ?? body.chips ?? 0) || 0;
  const cf = request.cf || {};
  const ua = request.headers.get('user-agent') || '';
  const device = BOT_RE.test(ua) ? 'bot' : /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
  env.ANALYTICS.writeDataPoint({
    indexes: [ev.event],
    blobs: [
      ev.event, code, detail,
      cf.country || '', cf.region || '', cf.city || '',
      referrerHost(request, url), device, await visitorHash(request), cf.asOrganization || '',
      player,
    ],
    doubles: [status, amount],
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Read the body from a copy before the app consumes the original.
    const wantsBody = request.method === 'POST' && url.pathname.startsWith('/api/t/');
    const bodyPromise = wantsBody ? readBody(request.clone()) : null;
    const response = await app.fetch(request, env, ctx);
    if (env.ANALYTICS) {
      const ev = classify(request, url, response.status);
      if (ev) {
        // Clone now: once the response is returned its body is streamed to the client.
        const createdPromise = ev.event === 'table_created' && response.ok
          ? response.clone().json().catch(() => ({}))
          : null;
        ctx.waitUntil(record(env, request, url, response.status, ev, bodyPromise, createdPromise).catch(() => {}));
      }
    }
    return withBeacon(url, response);
  },
};
