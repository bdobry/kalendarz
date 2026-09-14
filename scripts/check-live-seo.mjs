import assert from 'node:assert/strict';
const origin = 'https://nierobie.pl';
for (const path of ['/', '/2026/', '/2027/', '/kalkulator-urlopu/']) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, `${path} must return 200`);
  const html = await response.text();
  assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`), `${path}: canonical missing or stale cache`);
  assert.ok(html.includes('<h1'), `${path}: missing prerendered content`);
  assert.ok(html.includes('content="index, follow'), `${path}: indexing disabled`);
  console.log(`OK ${response.status} ${response.url}`);
}
for (const path of ['/2026', '/2027', '/kalkulator-urlopu']) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  assert.ok([301, 308].includes(response.status), `${path} needs permanent slash redirect`);
  assert.equal(new URL(response.headers.get('location'), origin).href, origin + path + '/');
}
const missing = await fetch(origin + '/seo-test-nieistniejacy-adres', { redirect: 'manual' });
assert.equal(missing.status, 404);
assert.ok((await missing.text()).includes('noindex, follow'));
const sitemap = await fetch(origin + '/sitemap.xml');
assert.equal(sitemap.status, 200);
assert.ok((await sitemap.text()).includes('<loc>https://nierobie.pl/2027/</loc>'));
console.log('Live SEO checks passed. Confirm coverage and Google-selected canonical separately in Search Console.');
