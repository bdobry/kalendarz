import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { parseWinter, parseSummer, validateDataset } from './school-breaks.mjs';

const target = new URL('../data/schoolBreaks.json', import.meta.url);
const strict = process.argv.includes('--strict');
const offline = process.env.SCHOOL_DATA_OFFLINE === '1';
const today = new Date().toISOString().slice(0, 10);
let data;
try { data = validateDataset(JSON.parse(await readFile(target, 'utf8'))); }
catch (error) { if (offline) throw error; data = { version: 1, years: {} }; }
if (offline) {
  await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
  await writeFile(new URL('../public/data/school-breaks.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
  console.log('School data: validated committed snapshot (offline).'); process.exit(0);
}
const failures = [];
const origin = 'https://www.gov.pl';
async function fetchOfficial(url, optional = false) {
  if (new URL(url).origin !== origin) throw new Error('Niedozwolone źródło danych.');
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'nierobie-school-calendar/1.0' } });
  if (optional && response.status === 404) return null;
  if (!response.ok || new URL(response.url).origin !== origin) throw new Error(`HTTP ${response.status}: ${url}`);
  return response;
}
try {
  const listing = await (await fetchOfficial(`${origin}/web/edukacja/kalendarz-roku-szkolnego`)).text();
  const links = [...listing.matchAll(/href="(\/web\/edukacja\/(?:terminy-ferii-zimowych-w-roku-szkolnym-|kalendarz-roku-szkolnego-)\d{8})"/g)].map(m => origin + m[1]);
  // Also keep checking older sources and the next publication years.
  for (let year = 2024; year <= Math.min(2099, +today.slice(0, 4) + 2); year++) {
    for (const stem of ['terminy-ferii-zimowych-w-roku-szkolnym-', 'kalendarz-roku-szkolnego-']) links.push(`${origin}/web/edukacja/${stem}${year - 1}${year}`);
  }
  for (const url of new Set(links)) {
    const year = Number(url.slice(-4));
    if (year < 2024) continue;
    const kind = url.includes('/terminy-') ? 'winter' : 'summer';
    try {
      const response = await fetchOfficial(url, !data.years[year]?.[kind]);
      if (!response) continue;
      const html = await response.text();
      if (/<title>Portal Gov\.pl<\/title>/.test(html) && !data.years[year]?.[kind]) continue;
      let record;
      if (kind === 'winter') record = { groups: parseWinter(html, year) };
      else {
        const attachment = html.match(/href="(\/attachment\/[a-f0-9-]+)"/i)?.[1];
        if (!attachment) throw new Error(`Wakacje ${year}: brak załącznika MEN.`);
        const pdf = new Uint8Array(await (await fetchOfficial(origin + attachment)).arrayBuffer());
        const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const task = getDocument({ data: pdf, useSystemFonts: true, isEvalSupported: false });
        const doc = await task.promise;
        let text = '';
        try { for (let p = 1; p <= doc.numPages; p++) text += (await (await doc.getPage(p)).getTextContent()).items.map(item => item.str ?? '').join(' ') + ' '; }
        finally { await task.destroy(); }
        record = { ...parseSummer(text, year), document: origin + attachment };
      }
      data.years[year] ??= {};
      data.years[year][kind] = { ...record, source: url, verifiedAt: today };
      console.log(`School data: ${kind} ${year} verified.`);
    } catch (error) { failures.push(error.message); }
  }
} catch (error) { failures.push(error.message); }
validateDataset(data); // Never replace the cache with incomplete/invalid data.
const serialized = JSON.stringify(data, null, 2) + '\n';
const temporary = new URL('../data/schoolBreaks.json.tmp', import.meta.url);
await writeFile(temporary, serialized);
await rename(temporary, target);
// Public, reusable build artifact for future SEO pages; contains no personal data.
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/data/school-breaks.json', import.meta.url), serialized);
if (failures.length) {
  console.warn(`School data: preserved last valid data for failed sources:\n${failures.join('\n')}`);
  if (strict) process.exitCode = 1;
} else console.log('School data: all available sources verified.');
