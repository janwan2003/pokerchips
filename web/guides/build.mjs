// Renders guides/pages.mjs into public/guides/*.html, public/privacy.html and
// public/sitemap.xml. Run `npm run guides` after editing pages.mjs; test/guides.test.js
// fails when the committed output is stale.
import { writeFileSync, mkdirSync } from 'node:fs';
import { pages, hub, privacy, UPDATED } from './pages.mjs';

const ORIGIN = 'https://easypoker.cc';
const OG_IMAGE = `${ORIGIN}/og.png`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const url = (slug) => (slug === undefined ? `${ORIGIN}/` : `${ORIGIN}/guides/${slug}`);
const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));

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
    <header class="ep-doc-top">
        <a class="ep-brand" href="/"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#chip"/></svg>EasyPoker</a>
        <a class="ep-btn ep-btn-red ep-doc-top-cta" href="/">Start a free table</a>
    </header>`;

function footer() {
  const links = pages.map((p) => `<li><a href="/guides/${p.slug}">${esc(p.h1)}</a></li>`).join('');
  return `
    <footer class="ep-doc-foot">
        <nav aria-label="Guides"><ul>${links}<li><a href="/guides/">All guides</a></li><li><a href="/privacy">Privacy</a></li></ul></nav>
        <p>EasyPoker tracks chips for poker games you play with a real deck. It does not deal cards or handle money.</p>
    </footer>`;
}

const cta = `
        <aside class="ep-cta">
            <p class="ep-cta-title">Play tonight without a chip set</p>
            <p>Host a table in your browser, share the link, and everyone bets from their own phone. Free, no app, no sign-up.</p>
            <a class="ep-btn ep-btn-red ep-btn-lg" href="/">Start a free table</a>
        </aside>`;

const crumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});

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
      author: { '@type': 'Organization', name: 'EasyPoker', url: `${ORIGIN}/` },
      publisher: { '@type': 'Organization', name: 'EasyPoker', url: `${ORIGIN}/` },
    },
    crumbs([['EasyPoker', `${ORIGIN}/`], ['Guides', `${ORIGIN}/guides/`], [p.h1, canonical]]),
  ];
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
  return `${head({ title: p.title, description: p.description, canonical, schema })}
<body class="ep-page ep-scope">${topbar}
    <main class="ep-doc">
        <nav class="ep-crumbs" aria-label="Breadcrumb"><a href="/">EasyPoker</a><span aria-hidden="true">/</span><a href="/guides/">Guides</a></nav>
        <article class="ep-prose">
            <h1>${esc(p.h1)}</h1>
            <p class="ep-doc-lede">${esc(p.lede)}</p>
${p.body.trim()}
        </article>${cta}${faq}
        <section class="ep-related" aria-labelledby="related-title">
            <h2 id="related-title">Related guides</h2>
            <ul>${related}</ul>
        </section>
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
  const cards = pages
    .map((p) => `<li><a href="/guides/${p.slug}"><strong>${esc(p.h1)}</strong><span>${esc(p.description)}</span></a></li>`)
    .join('\n                ');
  return `${head({ title: hub.title, description: hub.description, canonical, type: 'website', schema })}
<body class="ep-page ep-scope">${topbar}
    <main class="ep-doc">
        <nav class="ep-crumbs" aria-label="Breadcrumb"><a href="/">EasyPoker</a></nav>
        <article class="ep-prose">
            <h1>${esc(hub.h1)}</h1>
            <p class="ep-doc-lede">${esc(hub.lede)}</p>
        </article>
        <section class="ep-related ep-related-hub">
            <ul>
                ${cards}
            </ul>
        </section>${cta}
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
        <article class="ep-prose">
            <h1>${esc(privacy.h1)}</h1>
            <p class="ep-muted ep-small">Last updated ${UPDATED}</p>
${privacy.body.trim()}
        </article>
    </main>${footer()}
    ${CHIP_SYMBOL}
</body>
</html>
`;
}

function renderSitemap() {
  const entries = [
    [`${ORIGIN}/`, '1.0'],
    [`${ORIGIN}/guides/`, '0.6'],
    ...pages.map((p) => [url(p.slug), '0.8']),
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
  const out = { 'guides/index.html': renderHub(), 'privacy.html': renderPrivacy(), 'sitemap.xml': renderSitemap() };
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
