import assert from 'node:assert/strict';
const origin = 'https://nierobie.pl';
const year = Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Warsaw', year: 'numeric' }).format(new Date()));
const paths = ['/', `/${year}/`, `/${Math.min(year + 1, 2099)}/`, '/kalkulator-urlopu/', '/planer-krwiodawcy/'];
function meta(html, name) {
  const matches = [...html.split('</head>')[0].matchAll(/<meta\b[^>]*>/g)].map(match => match[0]).filter(tag => tag.includes(`name="${name}"`) || tag.includes(`property="${name}"`));
  assert.equal(matches.length, 1, `Exactly one ${name} tag`);
  return matches[0].match(/content="([^"]*)"/)?.[1];
}
async function checkPng(path, width, height) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, `${path}: image unavailable`);
  assert.match(response.headers.get('content-type') || '', /^image\/png(?:;|$)/, `${path}: wrong HTTP MIME`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${path}: not PNG bytes`);
  assert.equal(bytes.readUInt32BE(16), width, `${path}: wrong width`);
  assert.equal(bytes.readUInt32BE(20), height, `${path}: wrong height`);
}
for (const path of paths) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, `${path} must return 200`);
  const html = await response.text();
  assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`), `${path}: canonical missing or stale cache`);
  assert.ok(html.includes('<h1'), `${path}: missing prerendered content`);
  assert.ok(html.includes('content="index, follow'), `${path}: indexing disabled`);
  const imageKey = path === '/' ? 'home' : path === '/kalkulator-urlopu/' ? 'planner' : path === '/planer-krwiodawcy/' ? 'donor' : path.slice(1, 5);
  const imagePath = `/og/v2/${imageKey}.png`;
  assert.equal(meta(html, 'og:url'), origin + path);
  assert.equal(meta(html, 'og:image'), origin + imagePath, `${path}: stale sharing image`);
  assert.equal(meta(html, 'twitter:image'), origin + imagePath);
  assert.equal(meta(html, 'og:image:type'), 'image/png');
  assert.equal(meta(html, 'og:image:width'), '1200');
  assert.equal(meta(html, 'og:image:height'), '630');
  assert.equal(meta(html, 'twitter:image:alt'), meta(html, 'og:image:alt'));
  await checkPng(imagePath, 1200, 630);
  console.log(`OK ${response.status} ${response.url}`);
}
for (const path of paths.filter(path => path !== '/').map(path => path.slice(0, -1))) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  assert.ok([301, 308].includes(response.status), `${path} needs permanent slash redirect`);
  assert.equal(new URL(response.headers.get('location'), origin).href, origin + path + '/');
}
const missing = await fetch(origin + '/seo-test-nieistniejacy-adres', { redirect: 'manual' });
assert.equal(missing.status, 404);
assert.ok((await missing.text()).includes('noindex, follow'));
const sitemap = await fetch(origin + '/sitemap.xml');
assert.equal(sitemap.status, 200);
assert.ok((await sitemap.text()).includes(`<loc>https://nierobie.pl/${year}/</loc>`));
await checkPng('/icons/favicon-96.png', 96, 96);
console.log('Live SEO checks passed. Confirm coverage and Google-selected canonical separately in Search Console.');
