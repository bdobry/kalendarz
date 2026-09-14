import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { render, YEAR_MIN, YEAR_MAX, indexedYears, SITE_URL, yearPath } from '../.ssr/entry-server.js';

// Serialize the build year so server HTML and first browser render always agree, even at New Year.
const buildYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Europe/Warsaw' }).format(new Date()));
const template = await readFile('dist/index.html', 'utf8');
for (const marker of ['<!--seo-head-->', '<!--app-html-->', '<!--page-data-->']) {
  if (!template.includes(marker)) throw new Error(`Missing template marker: ${marker}`);
}
const routes = ['/', '/kalkulator-urlopu/', ...Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => yearPath(YEAR_MIN + i)), '/404.html'];
for (const path of routes) {
  const page = render({ path, buildYear });
  const html = template.replace('<!--seo-head-->', () => page.head).replace('<!--app-html-->', () => page.html).replace('<!--page-data-->', () => page.data);
  const directory = path === '/404.html' ? 'dist' : `dist${path}`;
  await mkdir(directory, { recursive: true });
  await writeFile(path === '/404.html' ? 'dist/404.html' : `${directory}index.html`, html);
}
const canonicalPaths = ['/', '/kalkulator-urlopu/', ...indexedYears(buildYear).map(yearPath)];
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${canonicalPaths.map(path => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Prerendered ${routes.length} pages; sitemap contains ${canonicalPaths.length} canonical URLs.`);
