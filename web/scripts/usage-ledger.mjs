// Print the daily usage ledger for easypoker.cc as a markdown table, for pasting into
// CLAUDE.md ("The usage ledger").
//
//   npm run ledger                 # every day Analytics Engine still holds (3 months)
//   npm run ledger -- 2026-11-01   # from that date
//
// Source: Workers Analytics Engine, dataset easypoker_events (written by src/main.js;
// column layout at the top of that file). Bots are excluded (blob8 = 'bot'), which also
// drops headless Playwright runs such as test/e2e.mjs against production.
// Read-only: every statement is a SELECT. Prints counts only, never table codes or names.
// Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN ("Account Analytics: Read") in
// web/.env or the environment, the same as scripts/stats.mjs.
//
// Analytics Engine keeps 3 months and may sample: counts use SUM(_sample_interval).
// Days older than 3 months disappear from the API, so rows already recorded in
// CLAUDE.md keep their values; only append and refresh recent rows.
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (_) { /* no .env */ }

const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Account Analytics: Read) in web/.env');
  process.exit(1);
}

const since = process.argv[2] || '';
if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
  console.error('Usage: npm run ledger -- [YYYY-MM-DD]');
  process.exit(1);
}
const days = since ? Math.ceil((Date.now() - Date.parse(`${since}T00:00:00Z`)) / 864e5) + 1 : 92;
const where = `timestamp > NOW() - INTERVAL '${days}' DAY AND blob8 != 'bot'`;
const n = 'SUM(_sample_interval)';

async function sql(query) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: `${query} FORMAT JSON`,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return JSON.parse(text).data;
}

const [events, active, pages, joins] = await Promise.all([
  sql(`SELECT toDate(timestamp) AS d, blob1 AS e, ${n} AS n
    FROM easypoker_events WHERE ${where} GROUP BY d, e`),
  sql(`SELECT toDate(timestamp) AS d, COUNT(DISTINCT blob2) AS n
    FROM easypoker_events WHERE ${where} AND blob2 != '' AND blob1 IN ('join', 'action', 'host_action')
    GROUP BY d`),
  sql(`SELECT toDate(timestamp) AS d, ${n} AS views, COUNT(DISTINCT blob9) AS visitors
    FROM easypoker_events WHERE ${where} AND blob1 = 'page' GROUP BY d`),
  // Per table: distinct joined player names and last activity. Only counts leave this script.
  sql(`SELECT blob2 AS code, COUNT(DISTINCT blob11) AS players, MAX(timestamp) AS last
    FROM easypoker_events WHERE ${where} AND blob2 != '' AND blob1 IN ('join', 'action', 'host_action')
    GROUP BY code`),
]);

const day = (d) => String(d).slice(0, 10);
const byDay = {};
const row = (d) => (byDay[day(d)] ??= { created: 0, joins: 0, active: 0, actions: 0, host: 0, views: 0, visitors: 0 });
for (const r of events) {
  const k = { table_created: 'created', join: 'joins', action: 'actions', host_action: 'host' }[r.e];
  if (k) row(r.d)[k] += Number(r.n);
}
for (const r of active) row(r.d).active = Number(r.n);
for (const r of pages) Object.assign(row(r.d), { views: Number(r.views), visitors: Number(r.visitors) });

const dates = Object.keys(byDay).filter((d) => !since || d >= since).sort();
console.log('| date | tables created | players joined | tables in play | player actions | host actions | page views | visitors |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const d of dates) {
  const r = byDay[d];
  console.log(`| ${d} | ${r.created} | ${r.joins} | ${r.active} | ${r.actions} | ${r.host} | ${r.views} | ${r.visitors} |`);
}

const sum = (k) => dates.reduce((s, d) => s + byDay[d][k], 0);
const weekAgo = Date.now() - 7 * 864e5;
const shared = joins.filter((t) => Number(t.players) >= 2).length;
const active7 = joins.filter((t) => Date.parse(`${String(t.last).replace(' ', 'T')}Z`) >= weekAgo).length;
console.log();
console.log(`Totals over these ${dates.length} days: tables created ${sum('created')}, joins ${sum('joins')}; `
  + `tables with 2+ named players ${shared}; tables played in the last 7 days ${active7}. `
  + 'Web version only: the Android app keeps its games on the host phone and reports nothing.');
