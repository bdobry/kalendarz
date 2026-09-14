import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const read = path => readFile(`dist/${path}`, 'utf8');
const sitemap = await read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
const titles = new Set(), descriptions = new Set();
for (const url of urls) {
  const path = new URL(url).pathname;
  assert.ok(path.endsWith('/'), `Canonical needs trailing slash: ${url}`);
  const html = await read(path.slice(1) + 'index.html');
  const head = html.split('</head>')[0];
  assert.equal((head.match(/rel="canonical"/g) || []).length, 1, `Exactly one canonical: ${url}`);
  assert.ok(head.includes(`href="${url}"`));
  assert.ok(head.includes('content="index, follow, max-image-preview:large"'));
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `Exactly one H1: ${url}`);
  const title = head.match(/<title>(.*?)<\/title>/)?.[1];
  const description = head.match(/name="description" content="([^"]+)"/)?.[1];
  assert.ok(title && !titles.has(title), `Unique title: ${url}`); titles.add(title);
  assert.ok(description && !descriptions.has(description), `Unique description: ${url}`); descriptions.add(description);
  const jsonLd = JSON.parse(head.match(/id="seo-json-ld" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(jsonLd['@context'], 'https://schema.org');
  assert.ok(!html.includes('cdn.tailwindcss.com'));
  assert.ok(!html.includes('Ładowanie strategii'));
  if (/^\/\d{4}\/$/.test(path)) {
    const year = path.slice(1, 5);
    assert.ok(html.includes(`Dni wolne i długie weekendy ${year}`));
    assert.ok(html.includes(`<time dateTime="${year}-01-01">`));
    assert.ok(html.includes('id="planer-urlopu"'));
    assert.ok(html.includes(`strategy-card-`), `Strategies must exist without JS: ${url}`);
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const target = match[1];
    const file = target.endsWith('/') ? `${target}index.html` : target;
    await access(resolve('dist', '.' + file));
  }
}
for (const year of [1991, 2099]) {
  const html = await read(`${year}/index.html`);
  assert.ok(html.includes('content="noindex, follow"'));
  assert.ok(!html.includes(`href="/${year === 1991 ? 1990 : 2100}/"`));
}
const error = await read('404.html');
assert.ok(error.includes('content="noindex, follow"'));
assert.ok(error.includes('Nie znaleziono strony'));
assert.ok(!error.includes('rel="canonical"'));
const home = await read('index.html');
assert.ok(!/pushState|location\.(replace|assign)|http-equiv="refresh"/.test(home));
await access('dist/.nojekyll');
assert.equal((await read('CNAME')).trim(), 'nierobie.pl');
assert.ok((await read('robots.txt')).includes('Sitemap: https://nierobie.pl/sitemap.xml'));
console.log(`SEO verification passed: ${urls.length} indexable pages, metadata, structured data, local links/assets, boundary years and 404.`);
