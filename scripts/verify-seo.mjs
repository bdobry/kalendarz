import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const read = path => readFile(`dist/${path}`, 'utf8');
const origin = 'https://nierobie.pl';
function meta(head, name) {
  const matches = [...head.matchAll(/<meta\b[^>]*>/g)].map(match => match[0]).filter(tag => tag.includes(`name="${name}"`) || tag.includes(`property="${name}"`));
  assert.equal(matches.length, 1, `Exactly one ${name} meta tag`);
  return matches[0].match(/content="([^"]*)"/)?.[1];
}
function pngDimensions(bytes, label) {
  assert.ok(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${label}: actual PNG bytes required`);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
function verifyIco(bytes) {
  const sizes = [16, 32, 48];
  const directoryLength = 6 + sizes.length * 16;
  assert.ok(bytes.length >= directoryLength, 'ICO: truncated directory');
  assert.equal(bytes.readUInt16LE(0), 0, 'ICO: reserved field');
  assert.equal(bytes.readUInt16LE(2), 1, 'ICO: icon type');
  assert.equal(bytes.readUInt16LE(4), sizes.length, 'ICO: three image entries');
  let nextOffset = directoryLength;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    assert.deepEqual([bytes[entry], bytes[entry + 1]], [size, size], `ICO: ${size}px directory dimensions`);
    assert.equal(bytes[entry + 3], 0, 'ICO: entry reserved byte');
    assert.equal(bytes.readUInt16LE(entry + 4), 1, 'ICO: color planes');
    assert.equal(bytes.readUInt16LE(entry + 6), 32, 'ICO: color depth');
    const length = bytes.readUInt32LE(entry + 8), offset = bytes.readUInt32LE(entry + 12);
    assert.equal(offset, nextOffset, 'ICO: contiguous payloads without gaps or overlap');
    assert.ok(length >= 24 && offset + length <= bytes.length, 'ICO: payload stays inside file');
    const payload = bytes.subarray(offset, offset + length);
    assert.deepEqual(pngDimensions(payload, `ICO ${size}px payload`), [size, size]);
    assert.equal(payload.toString('ascii', payload.length - 8, payload.length - 4), 'IEND', 'ICO: complete PNG payload');
    nextOffset = offset + length;
  });
  assert.equal(nextOffset, bytes.length, 'ICO: no extra payload outside the image entries');
}
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
  assert.ok(!html.includes('BreadcrumbList'), `Do not restore breadcrumbs: ${url}`);
  assert.ok(!html.includes('aggregateRating'), `No invented ratings: ${url}`);
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
// Every prerendered year can be shared, even outside the indexed/sitemap window.
const socialPaths = ['/', '/kalkulator-urlopu/', '/planer-krwiodawcy/', ...Array.from({ length: 109 }, (_, index) => `/${1991 + index}/`)];
const imageHashes = new Set();
for (const path of socialPaths) {
  const html = await read(path.slice(1) + 'index.html');
  const head = html.split('</head>')[0];
  const imageKey = path === '/' ? 'home' : path === '/kalkulator-urlopu/' ? 'planner' : path === '/planer-krwiodawcy/' ? 'donor' : path.slice(1, 5);
  const imagePath = `/og/v2/${imageKey}.png`;
  assert.equal(meta(head, 'og:url'), origin + path);
  assert.equal(meta(head, 'og:image'), origin + imagePath);
  assert.equal(meta(head, 'og:image:secure_url'), origin + imagePath);
  assert.equal(meta(head, 'twitter:image'), origin + imagePath);
  assert.equal(meta(head, 'og:image:type'), 'image/png');
  assert.equal(meta(head, 'og:image:width'), '1200');
  assert.equal(meta(head, 'og:image:height'), '630');
  assert.equal(meta(head, 'twitter:card'), 'summary_large_image');
  assert.equal(meta(head, 'twitter:title'), meta(head, 'og:title'));
  assert.equal(meta(head, 'twitter:description'), meta(head, 'og:description'));
  assert.equal(meta(head, 'twitter:image:alt'), meta(head, 'og:image:alt'));
  assert.ok(meta(head, 'og:image:alt').length > 20, `${path}: describe the card image`);
  const bytes = await readFile(resolve('dist', '.' + imagePath));
  assert.deepEqual(pngDimensions(bytes, imagePath), [1200, 630]);
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.ok(!imageHashes.has(hash), `${path}: card must not reuse another page's image`); imageHashes.add(hash);
  const graph = JSON.parse(head.match(/id="seo-json-ld" type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
  const webpage = graph.find(node => node['@type'] === 'WebPage');
  assert.equal(webpage.url, origin + path);
  assert.ok(graph.some(node => node['@id'] === webpage.primaryImageOfPage['@id'] && node.contentUrl === origin + imagePath));
  if (imageKey === 'planner' || imageKey === 'donor') {
    assert.ok(graph.some(node => node['@id'] === webpage.mainEntity['@id'] && node['@type'] === 'WebApplication' && node.url === origin + path));
  }
  if (/^\d{4}$/.test(imageKey)) {
    const body = html.split('</head>')[1];
    assert.ok(body.includes(`Długie weekendy ${imageKey}. Kiedy wziąć urlop?`));
    assert.ok(body.includes('Długi weekend przy Bożym Ciele:'));
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
for (const path of ['/icons/icon.svg', '/icons/favicon-96.png', '/icons/favicon.ico', '/icons/apple-touch-icon.png', '/site.webmanifest']) {
  assert.ok(home.split('</head>')[0].includes(`href="${path}"`), `Homepage must expose ${path}`);
  await access(resolve('dist', '.' + path));
}
assert.deepEqual(pngDimensions(await readFile('dist/icons/favicon-96.png'), 'Search favicon'), [96, 96]);
assert.deepEqual(pngDimensions(await readFile('dist/icons/apple-touch-icon.png'), 'Apple touch icon'), [180, 180]);
const ico = await readFile('dist/icons/favicon.ico');
verifyIco(ico);
assert.ok(ico.equals(await readFile('dist/favicon.ico')), 'Legacy favicon.ico must match the current icon');
const manifest = JSON.parse(await read('site.webmanifest'));
assert.equal(meta(home.split('</head>')[0], 'theme-color'), manifest.theme_color);
assert.deepEqual(manifest.icons.map(icon => icon.sizes).sort(), ['192x192', '512x512']);
for (const icon of manifest.icons) {
  const size = Number(icon.sizes.split('x')[0]);
  assert.equal(icon.type, 'image/png');
  assert.deepEqual(pngDimensions(await readFile(resolve('dist', '.' + icon.src)), icon.src), [size, size]);
}
await access('dist/.nojekyll');
assert.equal((await read('CNAME')).trim(), 'nierobie.pl');
assert.ok((await read('robots.txt')).includes('Sitemap: https://nierobie.pl/sitemap.xml'));
console.log(`SEO verification passed: ${urls.length} indexable pages, ${socialPaths.length} distinct PNG social cards, metadata, structured data, favicons, local links, boundary years and 404.`);
