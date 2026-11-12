// Usage report from Workers Analytics Engine (dataset easypoker_events, written by src/main.js).
//
//   npm run stats            # last 7 days
//   npm run stats -- 30      # last 30 days
//   npm run stats -- 7 "SELECT ... FROM easypoker_events ..."   # your own query
//
// Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (a token with "Account Analytics: Read"),
// from the environment or web/.env. Column meanings are listed at the top of src/main.js.
// Analytics Engine keeps data for 3 months and may sample at high volume: always count with
// SUM(_sample_interval), never COUNT().
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

const days = Number(process.argv[2]) || 7;
const since = `timestamp > NOW() - INTERVAL '${days}' DAY`;
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

const reports = process.argv[3] ? { 'Custom query': process.argv[3] } : {
  'Events': `SELECT blob1 AS event, ${n} AS count, COUNT(DISTINCT blob9) AS visitors
    FROM easypoker_events WHERE ${since} AND blob8 != 'bot' GROUP BY event ORDER BY count DESC`,
  'Visitors per day (page views by humans)': `SELECT toDate(timestamp) AS day, COUNT(DISTINCT blob9) AS visitors, ${n} AS views
    FROM easypoker_events WHERE ${since} AND blob1 = 'page' AND blob8 != 'bot' GROUP BY day ORDER BY day`,
  'Where from (country / city)': `SELECT blob4 AS country, blob6 AS city, COUNT(DISTINCT blob9) AS visitors, ${n} AS events
    FROM easypoker_events WHERE ${since} AND blob8 != 'bot' GROUP BY country, city ORDER BY visitors DESC LIMIT 25`,
  'Referrers': `SELECT blob7 AS referrer, COUNT(DISTINCT blob9) AS visitors
    FROM easypoker_events WHERE ${since} AND blob7 != '' AND blob8 != 'bot' GROUP BY referrer ORDER BY visitors DESC LIMIT 20`,
  'Pages': `SELECT blob3 AS page, ${n} AS views, COUNT(DISTINCT blob9) AS visitors
    FROM easypoker_events WHERE ${since} AND blob1 = 'page' AND blob8 != 'bot' GROUP BY page ORDER BY views DESC LIMIT 20`,
  'Tables (games)': `SELECT blob2 AS code, MIN(timestamp) AS first_seen, MAX(timestamp) AS last_seen,
      COUNT(DISTINCT blob11) AS players, SUM(IF(blob1 = 'action', _sample_interval, 0)) AS actions,
      any(blob4) AS country, any(blob6) AS city
    FROM easypoker_events WHERE ${since} AND blob2 != '' AND blob1 != 'page'
    GROUP BY code ORDER BY last_seen DESC LIMIT 30`,
  'Players': `SELECT blob11 AS player, blob2 AS code, blob4 AS country, blob6 AS city, ${n} AS actions, MAX(timestamp) AS last_seen
    FROM easypoker_events WHERE ${since} AND blob11 != '' GROUP BY player, code, country, city ORDER BY last_seen DESC LIMIT 50`,
  'Devices': `SELECT blob8 AS device, COUNT(DISTINCT blob9) AS visitors
    FROM easypoker_events WHERE ${since} GROUP BY device ORDER BY visitors DESC`,
};

console.log(`easypoker.cc, last ${days} days (Analytics Engine dataset easypoker_events)\n`);
for (const [title, query] of Object.entries(reports)) {
  try {
    const rows = await sql(query);
    console.log(`## ${title}`);
    if (rows.length) console.table(rows);
    else console.log('(no rows)');
    console.log();
  } catch (e) {
    console.log(`## ${title}\nquery failed: ${e.message}\n`);
  }
}
