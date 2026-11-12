// Renders guides/pages.mjs into public/guides/*.html, public/privacy.html and
// public/sitemap.xml. Run `npm run guides` after editing pages.mjs; test/guides.test.js
// fails when the committed output is stale.
import { writeFileSync, mkdirSync } from 'node:fs';
import { pages, hub, privacy, about, UPDATED } from './pages.mjs';
import { SOURCES } from './sources.mjs';

const ORIGIN = 'https://easypoker.cc';
const OG_IMAGE = `${ORIGIN}/og.png`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const url = (slug) => (slug === undefined ? `${ORIGIN}/` : `${ORIGIN}/guides/${slug}`);
const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));

// Hub and footer sections. A guide not listed here falls into the last group.
const GROUPS = [
  ['Chips without a chip set', ['virtual-poker-chips', 'poker-chip-app', 'online-poker-chips', 'poker-without-chips', 'best-poker-chip-apps']],
  ['Running a home game', ['how-to-host-a-poker-night', 'home-poker-blind-structure', 'poker-chip-calculator', 'poker-tournament-payouts', 'home-poker-house-rules']],
  ['Rules and reference', ['texas-holdem-rules', 'omaha-poker-rules', 'poker-hand-rankings', 'side-pots', 'how-to-deal-poker', 'poker-terms-glossary']],
  ['Strategy basics', ['texas-holdem-starting-hands', 'poker-positions', 'poker-outs-and-odds', 'pot-odds']],
];
const grouped = () => {
  const placed = new Set(GROUPS.flatMap(([, s]) => s));
  return GROUPS.map(([name, slugs], i) => [
    name,
    [...slugs.filter((s) => bySlug[s]).map((s) => bySlug[s]), ...(i === GROUPS.length - 1 ? pages.filter((p) => !placed.has(p.slug)) : [])],
  ]);
};

const slugify = (t) => strip(t).toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Give every h2 in a body an id, and return the table of contents.
function withAnchors(body) {
  const toc = [];
  const html = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
    const id = slugify(inner);
    toc.push([id, strip(inner)]);
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html, toc };
}

// "Q♥" in prose becomes a small playing card; red suits are red.
const cards = (html) =>
  html.replace(/(?<![\w])(10|[2-9AKQJ])([♠♥♦♣])/g, (_, r, s) =>
    `<span class="ep-pc${'♥♦'.includes(s) ? ' ep-pc-red' : ''}">${r}<span>${s}</span></span>`);

const CHIP_SYMBOL = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
        <symbol id="chip" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#e94560"/><circle cx="24" cy="24" r="22" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="7.5 9.77" transform="rotate(-12 24 24)"/><circle cx="24" cy="24" r="14" fill="#c7364f"/><circle cx="24" cy="24" r="14" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="2 2.4"/><path d="M24 15.5c-3.2 3.3-7 5.4-7 9 0 2.2 1.7 3.8 3.8 3.8 1 0 2-.4 2.6-1.1-.3 1.6-1 3-2.2 4h5.6c-1.2-1-1.9-2.4-2.2-4 .7.7 1.6 1.1 2.6 1.1 2.1 0 3.8-1.6 3.8-3.8 0-3.6-3.8-5.7-7-9z" fill="#fff"/></symbol>
    </svg>`;

function head({ title, description, canonical, type = 'article', schema = [] }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="EasyPoker">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${OG_IMAGE}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#11121d">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Inter:wght@400..700&display=swap">
    <link rel="stylesheet" href="/css/site.css">
    <link rel="stylesheet" href="/css/guides.css">
    ${schema.map(ld).join('\n    ')}
</head>`;
}

const topbar = `
    <header class="ep-doc-top"><div class="ep-doc-top-inner">
        <a class="ep-brand" href="/"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#chip"/></svg>EasyPoker</a>
        <nav class="ep-doc-nav" aria-label="Site"><a href="/guides/">Guides</a></nav>
        <a class="ep-btn ep-btn-red ep-doc-top-cta" href="/">Start a free table</a>
    </div></header>`;

function footer() {
  const cols = grouped()
    .map(([name, list]) => `<div><p class="ep-doc-foot-h">${esc(name)}</p><ul>${list.map((p) => `<li><a href="/guides/${p.slug}">${esc(p.h1)}</a></li>`).join('')}</ul></div>`)
    .join('');
  return `
    <footer class="ep-doc-foot"><div class="ep-doc-foot-inner">
        <nav class="ep-doc-foot-cols" aria-label="Guides">${cols}<div><p class="ep-doc-foot-h">EasyPoker</p><ul><li><a href="/">Start a free table</a></li><li><a href="/guides/">All guides</a></li><li><a href="/about">About</a></li><li><a href="/privacy">Privacy</a></li></ul></div></nav>
        <p class="ep-doc-foot-note"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#chip"/></svg>EasyPoker tracks chips for poker games you play with a real deck. It does not deal cards or handle money.</p>
    </div></footer>`;
}

const cta = `
        <aside class="ep-cta">
            <div class="ep-cta-copy">
                <p class="ep-cta-title">Play tonight without a chip set</p>
                <p>Host a table in your browser, share the link, and everyone bets from their own phone. Free, no app, no sign-up.</p>
                <a class="ep-btn ep-btn-red ep-btn-lg" href="/">Start a free table</a>
            </div>
            <div class="ep-cta-stack" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="#chip"/></svg><svg viewBox="0 0 48 48"><use href="#chip"/></svg><svg viewBox="0 0 48 48"><use href="#chip"/></svg></div>
        </aside>`;

const crumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});

function sourcesHtml(slug) {
  const list = SOURCES[slug];
  if (!list) return '';
  return `
        <section class="ep-sources" aria-labelledby="sources-title">
            <h2 id="sources-title">Sources</h2>
            <ol>${list.map(([name, u]) => `<li><a href="${u}" rel="noopener">${esc(name)}</a> <span>${esc(new URL(u).hostname.replace(/^www\./, ''))}</span></li>`).join('')}</ol>
            <p>Checked ${UPDATED}. Odds and counts on this page are exact calculations from a standard 52-card deck unless stated otherwise.</p>
        </section>`;
}

function renderGuide(p) {
  const canonical = url(p.slug);
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: p.h1,
      description: p.description,
      image: OG_IMAGE,
      dateModified: UPDATED,
      mainEntityOfPage: canonical,
      ...(SOURCES[p.slug] ? { citation: SOURCES[p.slug].map(([name, u]) => ({ '@type': 'CreativeWork', name, url: u })) } : {}),
      author: { '@type': 'Organization', name: 'EasyPoker', url: `${ORIGIN}/` },
      publisher: { '@type': 'Organization', name: 'EasyPoker', url: `${ORIGIN}/` },
    },
    crumbs([['EasyPoker', `${ORIGIN}/`], ['Guides', `${ORIGIN}/guides/`], [p.h1, canonical]]),
  ];
  if (p.howto) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: p.howto.name,
      step: p.howto.steps.map(([name, text], i) => ({ '@type': 'HowToStep', position: i + 1, name, text })),
    });
  }
  if (p.faq?.length) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
  }
  const faq = p.faq?.length
    ? `
        <section class="ep-faq" aria-labelledby="faq-title">
            <h2 id="faq-title">Frequently asked questions</h2>
${p.faq.map(([q, a]) => `            <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
        </section>`
    : '';
  const related = p.related
    .map((s) => bySlug[s])
    .map((r) => `<li><a href="/guides/${r.slug}"><strong>${esc(r.h1)}</strong><span>${esc(r.description)}</span></a></li>`)
    .join('');
  const { html: body, toc } = withAnchors(cards(p.body.trim()));
  const tocLinks = toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')
    + (SOURCES[p.slug] ? '<li><a href="#sources-title">Sources</a></li>' : '')
    + (p.faq?.length ? '<li><a href="#faq-title">Frequently asked questions</a></li>' : '');
  return `${head({ title: p.title, description: p.description, canonical, schema })}
<body class="ep-page ep-scope">${topbar}
    <main class="ep-doc ep-doc-guide">
        <header class="ep-doc-head">
            <nav class="ep-crumbs" aria-label="Breadcrumb"><a href="/">EasyPoker</a><span aria-hidden="true">/</span><a href="/guides/">Guides</a></nav>
            <h1>${esc(p.h1)}</h1>
            <p class="ep-doc-lede">${esc(p.lede)}</p>
            <p class="ep-doc-meta">Updated <time datetime="${UPDATED}">${UPDATED}</time></p>
        </header>
        <nav class="ep-toc" aria-label="On this page">
            <details class="ep-toc-inline"><summary>On this page</summary><ol>${tocLinks}</ol></details>
            <div class="ep-toc-side"><p class="ep-toc-h">On this page</p><ol>${tocLinks}</ol></div>
        </nav>
        <div class="ep-doc-main">
        <article class="ep-prose">
${body}
        </article>${sourcesHtml(p.slug)}${cta}${faq}
        <section class="ep-related" aria-labelledby="related-title">
            <h2 id="related-title">Related guides</h2>
            <ul>${related}</ul>
        </section>
        </div>
    </main>${footer()}
    ${CHIP_SYMBOL}${p.script ? `\n    <script src="${p.script}"></script>` : ''}
</body>
</html>
`;
}

function renderHub() {
  const canonical = `${ORIGIN}/guides/`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: hub.h1,
      description: hub.description,
      url: canonical,
      hasPart: pages.map((p) => ({ '@type': 'Article', headline: p.h1, url: url(p.slug) })),
    },
    crumbs([['EasyPoker', `${ORIGIN}/`], ['Guides', canonical]]),
  ];
  const sections = grouped()
    .map(([name, list]) => `
        <section class="ep-related ep-related-hub" aria-labelledby="g-${slugify(name)}">
            <h2 id="g-${slugify(name)}">${esc(name)}</h2>
            <ul>${list.map((p) => `<li><a href="/guides/${p.slug}"><strong>${esc(p.h1)}</strong><span>${esc(p.description)}</span></a></li>`).join('')}</ul>
        </section>`)
    .join('');
  return `${head({ title: hub.title, description: hub.description, canonical, type: 'website', schema })}
<body class="ep-page ep-scope">${topbar}
    <main class="ep-doc">
        <header class="ep-doc-head">
            <nav class="ep-crumbs" aria-label="Breadcrumb"><a href="/">EasyPoker</a></nav>
            <h1>${esc(hub.h1)}</h1>
            <p class="ep-doc-lede">${esc(hub.lede)}</p>
        </header>
        <div class="ep-doc-main">${sections}${cta}
        </div>
    </main>${footer()}
    ${CHIP_SYMBOL}
</body>
</html>
`;
}

function renderPrivacy() {
  const canonical = `${ORIGIN}/privacy`;
  return `${head({ title: privacy.title, description: privacy.description, canonical, type: 'website' })}
<body class="ep-page ep-scope">${topbar}
    <main class="ep-doc">
        <header class="ep-doc-head">
            <h1>${esc(privacy.h1)}</h1>
            <p class="ep-doc-meta">Updated <time datetime="${UPDATED}">${UPDATED}</time></p>
        </header>
        <div class="ep-doc-main">
        <article class="ep-prose">
${privacy.body.trim()}
        </article>
        </div>
    </main>${footer()}
    ${CHIP_SYMBOL}
</body>
</html>
`;
}

function renderAbout() {
  const canonical = `${ORIGIN}/about`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: about.h1,
      url: canonical,
      dateModified: UPDATED,
      mainEntity: {
        '@type': 'WebApplication',
        '@id': `${ORIGIN}/#app`,
        name: 'EasyPoker',
        alternateName: 'easypoker.cc',
        url: `${ORIGIN}/`,
        description: strip(about.body).split('. ')[0] + '.',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any (web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    },
    crumbs([['EasyPoker', `${ORIGIN}/`], ['About', canonical]]),
  ];
  return `${head({ title: about.title, description: about.description, canonical, type: 'website', schema })}
<body class="ep-page ep-scope">${topbar}
    <main class="ep-doc">
        <header class="ep-doc-head">
            <h1>${esc(about.h1)}</h1>
            <p class="ep-doc-meta">Updated <time datetime="${UPDATED}">${UPDATED}</time></p>
        </header>
        <div class="ep-doc-main">
        <article class="ep-prose">
${about.body.trim()}
        </article>
        </div>
    </main>${footer()}
    ${CHIP_SYMBOL}
</body>
</html>
`;
}

// Plain-markdown rendering of a page body, for llms-full.txt.
function toMarkdown(html) {
  const abs = (h) => (h.startsWith('/') ? ORIGIN + h : h);
  let md = html
    .replace(/<tr>([\s\S]*?)<\/tr>/g, (_, row) => '| ' + [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1]).join(' | ') + ' |\n')
    .replace(/<\/thead>/g, '|---|\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n')
    .replace(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g, '- **$1**: $2\n')
    .replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, h, t) => `[${t}](${abs(h)})`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '\n$1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&');
  // The header separator row must match the column count of the header above it.
  md = md.replace(/(\| .* \|)\n\|---\|/g, (_, hdr) => `${hdr}\n|${'---|'.repeat(hdr.split(' | ').length)}`);
  md = md.replace(/^[ \t]+/gm, '').replace(/\n{3,}/g, '\n\n');
  // Rows of a table and items of a list must not be separated by blank lines.
  for (let prev = ''; prev !== md; ) {
    prev = md;
    md = md.replace(/^(\|.*\|)\n\n(?=\|)/gm, '$1\n').replace(/^((?:-|\d+\.) .*)\n\n(?=- )/gm, '$1\n');
  }
  return md.trim();
}

const LLMS_INTRO = `# EasyPoker (easypoker.cc)

> EasyPoker is a free, browser-based poker chip tracker for live home games. The host creates a table, players join from their own phones by link or QR code, and every bet, pot and payout updates on every phone at once. No app, no sign-up, no payment. Players still deal a real deck of cards.

- Up to 30 players per table; host sets starting chips and blinds (presets 1/2 to 1,000/2,000) and can allow fixed buy-ins.
- Every action is saved on the server; a closed tab or dead battery loses nothing. The host can correct any stack or the pot and restore any earlier moment.
- It does not deal cards, decide winners, compute side pots automatically, or handle money.
- easypoker.cc is independent and not affiliated with the "Poker with Friends – EasyPoker" app or easy.poker.`;

function renderLlms() {
  const list = pages.map((p) => `- [${p.h1}](${url(p.slug)}): ${p.description}`).join('\n');
  return `${LLMS_INTRO}

## App

- [Start or join a table](${ORIGIN}/): host a free table or join one with a 6-character code
- [About EasyPoker](${ORIGIN}/about): what it does and does not do
- [Privacy](${ORIGIN}/privacy): what is stored

## Guides

${list}

## Optional

- [All guides as one text file](${ORIGIN}/llms-full.txt)
`;
}

function renderLlmsFull() {
  const sections = pages.map((p) => {
    const faq = p.faq.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n');
    const refs = SOURCES[p.slug] ? `\n\n## Sources\n\n${SOURCES[p.slug].map(([n, u]) => `- [${n}](${u})`).join('\n')}` : '';
    return `# ${p.h1}\n\nSource: ${url(p.slug)}\nLast updated: ${UPDATED}\n\n${p.lede}\n\n${toMarkdown(p.body)}${refs}\n\n## Frequently asked questions\n\n${faq}`;
  });
  return `${LLMS_INTRO}\n\n---\n\n# About EasyPoker\n\nSource: ${ORIGIN}/about\n\n${toMarkdown(about.body)}\n\n---\n\n${sections.join('\n\n---\n\n')}\n`;
}

function renderSitemap() {
  const entries = [
    [`${ORIGIN}/`, '1.0'],
    [`${ORIGIN}/guides/`, '0.6'],
    ...pages.map((p) => [url(p.slug), '0.8']),
    [`${ORIGIN}/about`, '0.4'],
    [`${ORIGIN}/privacy`, '0.2'],
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(([loc, pr]) => `  <url><loc>${loc}</loc><lastmod>${UPDATED}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`;
}

/** Every generated file, path relative to web/public. */
export function render() {
  const out = {
    'guides/index.html': renderHub(),
    'privacy.html': renderPrivacy(),
    'about.html': renderAbout(),
    'sitemap.xml': renderSitemap(),
    'llms.txt': renderLlms(),
    'llms-full.txt': renderLlmsFull(),
  };
  for (const p of pages) out[`guides/${p.slug}.html`] = renderGuide(p);
  return out;
}

export { strip };

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = new URL('../public/', import.meta.url);
  mkdirSync(new URL('guides/', root), { recursive: true });
  for (const [path, html] of Object.entries(render())) {
    writeFileSync(new URL(path, root), html);
    console.log('wrote public/' + path);
  }
}
