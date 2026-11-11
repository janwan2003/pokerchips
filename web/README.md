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

## Develop, test, deploy

```bash
cd web
npm install
npm test                 # rule unit tests (node:test)
npx wrangler dev         # http://localhost:8787
npx wrangler deploy      # needs `npx wrangler login` once
```

Never remove the `v1` migration or rename the `Room` class in `wrangler.jsonc`: that
would delete every table's history.
