export const SITE_URL = 'https://nierobie.pl';
export const YEAR_MIN = 1991;
export const YEAR_MAX = 2099;
export const yearPath = (year: number) => `/${year}/`;
export const featuredYears = (buildYear: number) => [buildYear, buildYear + 1, buildYear + 2].filter(y => y <= YEAR_MAX);
export const indexedYears = (buildYear: number) => Array.from({ length: Math.min(buildYear + 5, YEAR_MAX) - 2024 + 1 }, (_, i) => i + 2024);
export type Page = { kind: 'home' | 'calculator' | 'not-found'; path: string } | { kind: 'year'; path: string; year: number };
export interface PageData { path: string; buildYear: number; }

export function resolvePage(pathname: string): Page {
  if (pathname === '/' || pathname === '/index.html') return { kind: 'home', path: '/' };
  if (/^\/kalkulator-urlopu(?:\/|\/index\.html)?$/.test(pathname)) return { kind: 'calculator', path: '/kalkulator-urlopu/' };
  const match = /^\/(\d{4})(?:\/|\/index\.html)?$/.exec(pathname);
  if (match) {
    const year = Number(match[1]);
    if (year >= YEAR_MIN && year <= YEAR_MAX) return { kind: 'year', year, path: yearPath(year) };
  }
  return { kind: 'not-found', path: '/404.html' };
}

export function getSeo(page: Page, buildYear: number) {
  const title = page.kind === 'home' ? 'NieRobie.pl – planer urlopu i kalendarz dni wolnych'
    : page.kind === 'year' ? `Dni wolne i długie weekendy ${page.year} – kalendarz | NieRobie.pl`
    : page.kind === 'calculator' ? 'Kalkulator dni urlopu – zaplanuj wakacje | NieRobie.pl'
    : 'Nie znaleziono strony | NieRobie.pl';
  const description = page.kind === 'home' ? 'Zaplanuj więcej wolnego z NieRobie.pl. Kalendarz świąt, długie weekendy i kalkulator dni urlopu pomogą wybrać termin wakacji i krótkiego wypoczynku.'
    : page.kind === 'year' ? `Sprawdź dni wolne i długie weekendy ${page.year} w Polsce. Kalendarz świąt, majówka, Boże Ciało i konkretne dni urlopu, które wydłużą Twój wypoczynek.`
    : page.kind === 'calculator' ? 'Oblicz, ile dni urlopu potrzebujesz na wakacje. Wybierz daty, a kalkulator policzy dni robocze, weekendy i polskie święta w całym terminie wyjazdu.'
    : 'Ten adres nie istnieje. Przejdź do kalendarza dni wolnych lub kalkulatora urlopu w NieRobie.pl.';
  const canonical = SITE_URL + page.path;
  const indexable = page.kind !== 'not-found' && (page.kind !== 'year' || indexedYears(buildYear).includes(page.year));
  const image = SITE_URL + '/og/default.png';
  const graph: object[] = [
    { '@type': 'WebSite', '@id': SITE_URL + '/#website', name: 'NieRobie.pl', alternateName: ['NieRobie', 'Nie Robię'], url: SITE_URL + '/', inLanguage: 'pl-PL' },
    { '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: title, description, inLanguage: 'pl-PL', isPartOf: { '@id': SITE_URL + '/#website' } }
  ];
  if (page.kind === 'calculator') graph.push({ '@type': 'WebApplication', '@id': canonical + '#calculator', name: 'Kalkulator dni urlopu NieRobie.pl', url: canonical, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, inLanguage: 'pl-PL', description });
  if (page.kind !== 'home' && page.kind !== 'not-found') graph.push({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'NieRobie.pl', item: SITE_URL + '/' },
    { '@type': 'ListItem', position: 2, name: page.kind === 'year' ? `Kalendarz ${page.year}` : 'Kalkulator dni urlopu', item: canonical }
  ] });
  return { title, description, canonical, image, robots: indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow', structuredData: { '@context': 'https://schema.org', '@graph': graph } };
}

export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function renderSeoHead(page: Page, buildYear: number): string {
  const seo = getSeo(page, buildYear);
  const meta = (name: string, content: string, attr = 'name') => `<meta ${attr}="${name}" content="${escapeHtml(content)}" />`;
  return [
    `<title>${escapeHtml(seo.title)}</title>`, meta('description', seo.description), meta('robots', seo.robots),
    ...(page.kind === 'not-found' ? [] : [`<link rel="canonical" href="${seo.canonical}" />`]),
    meta('theme-color', '#5C5CFF'), meta('og:type', 'website', 'property'), meta('og:locale', 'pl_PL', 'property'),
    meta('og:site_name', 'NieRobie.pl', 'property'), meta('og:title', seo.title, 'property'), meta('og:description', seo.description, 'property'),
    meta('og:url', seo.canonical, 'property'), meta('og:image', seo.image, 'property'), meta('og:image:alt', 'NieRobie.pl – kalendarz dni wolnych i planer urlopu', 'property'),
    meta('twitter:card', 'summary_large_image'), meta('twitter:title', seo.title), meta('twitter:description', seo.description), meta('twitter:image', seo.image),
    `<script id="seo-json-ld" type="application/ld+json">${safeJson(seo.structuredData)}</script>`
  ].join('\n    ');
}
