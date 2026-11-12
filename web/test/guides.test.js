// The /guides/ pages, privacy page and sitemap are generated from guides/pages.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { render, strip } from '../guides/build.mjs';
import { pages } from '../guides/pages.mjs';

const pub = (p) => new URL(`../public/${p}`, import.meta.url);

test('generated pages are up to date (run `npm run guides`)', () => {
  for (const [path, html] of Object.entries(render())) {
    assert.ok(existsSync(pub(path)), `missing public/${path}`);
    assert.equal(readFileSync(pub(path), 'utf8'), html, `public/${path} is stale`);
  }
});

test('every guide has unique title, description and enough text', () => {
  const titles = new Set(), descs = new Set();
  for (const p of pages) {
    assert.ok(p.title.length <= 60, `${p.slug} title is ${p.title.length} chars`);
    assert.ok(p.description.length >= 110 && p.description.length <= 160, `${p.slug} description is ${p.description.length} chars`);
    assert.ok(!titles.has(p.title) && !descs.has(p.description), `${p.slug} duplicates another page`);
    titles.add(p.title); descs.add(p.description);
    const words = strip(p.body).split(' ').length + p.faq.flat().join(' ').split(' ').length;
    assert.ok(words >= 450, `${p.slug} has only ${words} words`);
    for (const r of p.related) assert.ok(pages.some((x) => x.slug === r), `${p.slug} links to unknown ${r}`);
  }
});

test('internal links in generated pages point at real files', () => {
  const html = Object.values(render()).join('') + readFileSync(pub('index.html'), 'utf8');
  for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
    if (href === '/') continue;
    const file = href.endsWith('/') ? `${href}index.html` : /\.\w+$/.test(href) ? href : `${href}.html`;
    assert.ok(existsSync(pub(file.slice(1))), `broken link ${href}`);
  }
});

test('sitemap lists every guide', () => {
  const xml = readFileSync(pub('sitemap.xml'), 'utf8');
  for (const p of pages) assert.ok(xml.includes(`https://easypoker.cc/guides/${p.slug}</loc>`), p.slug);
});
