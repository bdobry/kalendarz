export const REGIONS = ['dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie', 'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie', 'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie', 'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'];
const months = { stycznia: 1, lutego: 2, marca: 3, kwietnia: 4, maja: 5, czerwca: 6, lipca: 7, sierpnia: 8, września: 9, października: 10, listopada: 11, grudnia: 12 };
export function plainText(html) {
  const entities = { nbsp: ' ', ndash: '-', mdash: '-', oacute: 'ó', Oacute: 'Ó', amp: '&', lt: '<', gt: '>', quot: '"', sect: '§' };
  return html.replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (all, name) => name.startsWith('#') ? String.fromCodePoint(parseInt(name.slice(name[1] === 'x' ? 2 : 1), name[1] === 'x' ? 16 : 10)) : entities[name] ?? all).replace(/[\u00a0\s]+/g, ' ').replace(/[–—]/g, '-').trim();
}
function ranges(text, year) {
  const month = Object.keys(months).join('|');
  const pattern = new RegExp(`(\\d{1,2})\\s*(?:(${month})\\s*)?-\\s*(\\d{1,2})\\s*(${month})\\s*(\\d{4})?`, 'g');
  return [...text.matchAll(pattern)].map(m => {
    if (m[5] && +m[5] !== year) throw new Error(`Niezgodny rok komunikatu: ${m[5]} zamiast ${year}.`);
    const key = (d, name) => `${year}-${String(months[name]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return { start: key(+m[1], m[2] || m[4]), end: key(+m[3], m[4]), index: m.index, length: m[0].length };
  });
}
function validDate(key) { return /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(key)) && new Date(key).toISOString().slice(0, 10) === key; }
export function validateWinter(groups, year) {
  const seen = [];
  if (![3, 4].includes(groups.length)) throw new Error(`Ferie ${year}: oczekiwano 3 lub 4 tur.`);
  for (const group of groups) {
    if (!validDate(group.start) || !validDate(group.end) || group.start.slice(0, 4) !== String(year) || group.end.slice(0, 4) !== String(year) || +group.start.slice(5, 7) > 2 || +group.end.slice(5, 7) > 3 || Date.parse(group.end) - Date.parse(group.start) !== 13 * 86400000 || new Date(group.start).getUTCDay() !== 1 || !Array.isArray(group.regions) || !group.regions.length) throw new Error(`Ferie ${year}: błędny zakres dat.`);
    seen.push(...group.regions);
  }
  if (seen.length !== 16 || new Set(seen).size !== 16 || seen.some(r => !REGIONS.includes(r))) throw new Error(`Ferie ${year}: niepełny lub powtórzony zestaw województw.`);
  return groups;
}
export function parseWinter(html, year) {
  const article = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)?.[0];
  if (!article || !plainText(article).includes(`${year - 1}/${year}`)) throw new Error(`Ferie ${year}: brak treści komunikatu MEN.`);
  const text = plainText(article);
  const dates = ranges(text, year);
  const groups = dates.map((range, i) => {
    const tail = text.slice(range.index + range.length, dates[i + 1]?.index ?? text.length);
    const regions = tail.split(/[,;:.\s]+/).filter(word => REGIONS.includes(word));
    return { start: range.start, end: range.end, regions };
  });
  return validateWinter(groups, year);
}
export function parseSummer(text, year) {
  const normalized = plainText(text).replace(/\s*-\s*/g, '-');
  const section = normalized.split(/Ferie letnie/i)[1];
  if (!section) throw new Error(`Wakacje ${year}: brak sekcji Ferie letnie.`);
  const range = ranges(section.slice(0, 220), year)[0];
  if (!range || !validDate(range.start) || range.start < `${year}-06-20` || range.start > `${year}-07-01` || range.end !== `${year}-08-31`) throw new Error(`Wakacje ${year}: nierozpoznany termin.`);
  return { start: range.start, end: range.end };
}
export function validateDataset(data) {
  if (data?.version !== 1 || !data.years || !Object.keys(data.years).length) throw new Error('Brak poprawnej kopii danych szkolnych.');
  for (const [year, entry] of Object.entries(data.years)) {
    if (!/^20\d{2}$/.test(year)) throw new Error('Błędny rok danych szkolnych.');
    if (entry.winter) validateWinter(entry.winter.groups, +year);
    if (entry.summer && (!validDate(entry.summer.start) || entry.summer.start < `${year}-06-20` || entry.summer.start > `${year}-07-01` || entry.summer.end !== `${year}-08-31`)) throw new Error(`Błędne wakacje ${year}.`);
    for (const record of [entry.winter, entry.summer].filter(Boolean)) {
      const url = new URL(record.source);
      if (url.origin !== 'https://www.gov.pl' || !url.pathname.startsWith('/web/edukacja/') || !validDate(record.verifiedAt)) throw new Error('Brak oficjalnego źródła lub daty weryfikacji.');
    }
  }
  return data;
}
