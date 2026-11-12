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

    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

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
      return env.ASSETS.fetch(new Request(new URL('/table', url), request));
    }

    return env.ASSETS.fetch(request);
  },
};
