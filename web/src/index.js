// easypoker.cc — routes requests to the table (Durable Object) named by the join code.
import { Room } from './room.js';

export { Room };

// No 0/O, 1/I/L: codes get read out loud across a table.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

function randomString(alphabet, length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

// Lets the PokerChips Android app open easypoker.cc table links (Android App Links).
// The fingerprint is the app's signing key (keystore/, CN=PokerChips), which never changes.
const ASSET_LINKS = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'com.pokerchips',
    sha256_cert_fingerprints: ['78:C4:58:75:D1:D1:C5:A5:4C:0C:F1:C0:0F:46:4C:16:C3:E8:AD:E5:84:14:A7:AF:0D:D0:E6:BB:D0:F3:D6:17'],
  },
}];

// Table pages are per-game and mostly "no such table": keep them out of search results.
function noindex(res) {
  const out = new Response(res.body, res);
  out.headers.set('x-robots-tag', 'noindex, nofollow');
  return out;
}

function roomStub(env, code) {
  return env.ROOMS.get(env.ROOMS.idFromName(code));
}

async function createTable(request, env) {
  let settings = {};
  try {
    settings = await request.json();
  } catch (_) { /* defaults */ }
  const hostKey = randomString('abcdefghijklmnopqrstuvwxyz0123456789', 32);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomString(CODE_ALPHABET, CODE_LENGTH);
    const res = await roomStub(env, code).fetch('https://room/init', {
      method: 'POST',
      body: JSON.stringify({
        code,
        hostKey,
        startingChips: settings.startingChips,
        smallBlind: settings.smallBlind,
        bigBlind: settings.bigBlind,
        allowBuyIn: settings.allowBuyIn,
        buyInAmount: settings.buyInAmount,
      }),
    });
    if (res.status !== 409) return res;
  }
  return json({ error: 'Could not find a free code, try again' }, 503);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // One canonical origin: https, no www. The visitor's scheme comes from Cloudflare's
    // headers: `wrangler dev` rewrites the URL to http://easypoker.cc and sets neither.
    const isProd = url.hostname === 'easypoker.cc' || url.hostname === 'www.easypoker.cc';
    const plainHttp = (request.headers.get('cf-visitor') || '').includes('"http"')
      || request.headers.get('x-forwarded-proto') === 'http';
    if (url.hostname.startsWith('www.') || (isProd && plainHttp)) {
      url.hostname = url.hostname.replace(/^www\./, '');
      if (isProd) url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    if (path === '/.well-known/assetlinks.json') return json(ASSET_LINKS);

    if (path === '/api/tables') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      return createTable(request, env);
    }

    let m = path.match(/^\/api\/t\/([A-Za-z0-9]+)(\/.*)$/);
    if (m) {
      const code = m[1].toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: 'Game not found' }, 404);
      return roomStub(env, code).fetch(new Request(`https://room${m[2]}${url.search}`, request));
    }

    m = path.match(/^\/([A-Za-z0-9]{6})\/?$/);
    if (m) {
      const code = m[1].toUpperCase();
      if (!CODE_RE.test(code)) return env.ASSETS.fetch(request);
      if (path !== `/${code}`) return Response.redirect(new URL(`/${code}`, url).toString(), 302);
      return noindex(await env.ASSETS.fetch(new Request(new URL('/table', url), request)));
    }

    const res = await env.ASSETS.fetch(request);
    if (path === '/table' || path === '/table.html') return noindex(res);
    if (isProd && res.status === 200 && (res.headers.get('content-type') || '').startsWith('text/html')) {
      const out = new Response(res.body, res);
      out.headers.set('strict-transport-security', 'max-age=31536000');
      return out;
    }
    return res;
  },
};
