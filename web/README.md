# easypoker.cc — the browser version

The same chip manager as the Android app, but hosted on the web: anyone can create a
table at https://easypoker.cc, share the link or QR code, and everyone plays in their
browser from anywhere. No app, no sign-up.

## How it works

- **Cloudflare Worker** (`src/index.js`) serves the pages in `public/` and routes
  `/api/t/<CODE>/…` to the table's Durable Object.
- **One Durable Object per table** (`src/room.js`), keyed by its 6-character code
  (alphabet without 0/O/1/I/L). It keeps the table's state and its WebSocket
  connections (hibernating, so idle tables cost nothing).
- **Rules** (`src/game.js`) are a port of `app/.../game/GameManager.kt`: join, bet,
  take, take whole pot; host corrections (chips, pot, remove, blinds, starting chips);
  new game, resume, restore to any entry.
- **History** is an append-only SQLite journal inside the Durable Object: one row per
  action with the full state after it, like the app's `files/games/*.jsonl`. Nothing
  deletes a row.
- **Host** = whoever created the table. They get a secret host key, kept in their
  browser's localStorage; "Copy host link" puts it in a `#host=` fragment so the host
  can move to another device. Players are identified by name only, as in the app.

## Analytics

- **Cloudflare Web Analytics** (dashboard: Analytics > Web analytics > easypoker.cc):
  visitors, countries, referrers, browsers, page load times. Cookie-free. The zone's
  automatic injection does not reach Worker responses, so `src/main.js` appends the
  beacon to every HTML page served on easypoker.cc.
- **Workers Analytics Engine**, dataset `easypoker_events`: `src/main.js` (the Worker
  entry, wrapping `src/index.js`) writes one row per page view, table created, join,
  player action and host action, with table code, player name, country/region/city,
  referrer, device, network operator and a daily-rotating visitor hash. Column layout is
  at the top of `src/main.js`. Kept 3 months.
- `npm run stats [days]` prints the usual reports (visitors per day, where from, referrers,
  pages, tables, players). It needs `CLOUDFLARE_ACCOUNT_ID` and a `CLOUDFLARE_API_TOKEN`
  with *Account Analytics: Read* in `web/.env` (gitignored).
- Live request logs: Workers Observability (`"observability"` in `wrangler.jsonc`).

## Develop, test, deploy

```bash
cd web
npm install
npm test                 # rule unit tests (node:test)
npx wrangler dev         # http://localhost:8787
npx wrangler deploy      # needs `npx wrangler login` once
node test/e2e.mjs https://easypoker.cc   # host + player in two browsers (needs Playwright)
```

Never remove the `v1` migration or rename the `Room` class in `wrangler.jsonc`: that
would delete every table's history.
