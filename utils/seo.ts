import { getPolishHolidays } from './dateUtils';

export const SITE_URL = 'https://nierobie.pl';
export const YEAR_MIN = 1991;
export const YEAR_MAX = 2099;
export const yearPath = (year: number) => `/${year}/`;
export const featuredYears = (buildYear: number) => [buildYear, buildYear + 1, buildYear + 2].filter(y => y <= YEAR_MAX);
export const indexedYears = (buildYear: number) => Array.from({ length: Math.min(buildYear + 5, YEAR_MAX) - 2024 + 1 }, (_, i) => i + 2024);
export type Page = { kind: 'home' | 'calculator' | 'donor' | 'not-found'; path: string } | { kind: 'year'; path: string; year: number };
export interface PageData { path: string; buildYear: number; buildDate?: string; }

export function resolvePage(pathname: string): Page {
  if (pathname === '/' || pathname === '/index.html') return { kind: 'home', path: '/' };
  if (/^\/kalkulator-urlopu(?:\/|\/index\.html)?$/.test(pathname)) return { kind: 'calculator', path: '/kalkulator-urlopu/' };
  if (/^\/planer-krwiodawcy(?:\/|\/index\.html)?$/.test(pathname)) return { kind: 'donor', path: '/planer-krwiodawcy/' };
  const match = /^\/(\d{4})(?:\/|\/index\.html)?$/.exec(pathname);
  if (match) {
    const year = Number(match[1]);
    if (year >= YEAR_MIN && year <= YEAR_MAX) return { kind: 'year', year, path: yearPath(year) };
  }
  return { kind: 'not-found', path: '/404.html' };
}

/** One concrete example shared by search metadata and the visible year introduction. */
export function getYearSearchExample(year: number) {
  const key = [...getPolishHolidays(year)].find(([, name]) => name === 'Boże Ciało')![0];
  const holiday = new Date(`${key}T12:00:00`);
  const leave = new Date(holiday); leave.setDate(holiday.getDate() + 1);
  const end = new Date(holiday); end.setDate(holiday.getDate() + 3);
  const dateLabel = (date: Date) => date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
  const rangeLabel = holiday.getMonth() === end.getMonth()
    ? `${holiday.getDate()}–${dateLabel(end)}`
    : `${dateLabel(holiday)} – ${dateLabel(end)}`;
  return { holiday, leave, end, rangeLabel, leaveLabel: dateLabel(leave) };
}

export function getSeo(page: Page, buildYear: number) {
  const example = page.kind === 'year' ? getYearSearchExample(page.year) : undefined;
  const title = page.kind === 'home' ? 'nierobie.pl – kalendarz dni wolnych i planer urlopu'
    : page.kind === 'year' ? `Dni wolne i długie weekendy ${page.year} – kalendarz | nierobie.pl`
      : page.kind === 'calculator' ? 'Planer urlopu – kalendarz urlopowy online i bilans dni | nierobie.pl'
        : page.kind === 'donor' ? 'Planer krwiodawcy – kalendarz donacji krwi i osocza | nierobie.pl'
          : 'Nie znaleziono strony | nierobie.pl';
  const description = page.kind === 'home' ? 'Kalendarz dni wolnych w Polsce: święta, długie weekendy i pomysły na urlop. Wybierz rok, połącz wolne dni i ułóż swój plan bez konta w nierobie.pl.'
    : page.kind === 'year' ? `Kalendarz dni wolnych ${page.year}: święta, długie weekendy, dni robocze i godziny pracy. Sprawdź konkretne terminy i ile dni urlopu potrzeba na dłuższy wypoczynek.`
      : page.kind === 'calculator' ? 'Kalendarz urlopowy online bez konta. Sprawdź, ile dni urlopu zużyje wyjazd i ile zostanie w puli. Plan zapisuje się w tej przeglądarce; pobierz go do kalendarza ICS.'
        : page.kind === 'donor' ? 'Kalendarz donacji krwi i osocza bez konta. Zapisuj terminy, sprawdzaj odstępy i limity oraz planuj kolejną donację z uwzględnieniem swojej historii.'
          : 'Ten adres nie istnieje. Przejdź do kalendarza dni wolnych lub planera urlopu w nierobie.pl.';
  // A shared link is a small invitation; search titles describe the page's specific intent.
  const shareTitle = page.kind === 'home' ? 'Nie robię. Mam wolne. | nierobie.pl'
    : page.kind === 'year' ? `Długie weekendy ${page.year}. Zrób sobie więcej wolnego.`
      : page.kind === 'calculator' ? 'Planer urlopu. Cały plan w jednym miejscu.'
        : page.kind === 'donor' ? 'Planer krwiodawcy. Zaplanuj kolejny raz.' : title;
  const shareDescription = page.kind === 'home' ? 'Wakacje, długi weekend czy święty spokój? Sprawdź kalendarz, połącz urlop ze świętami i zaplanuj więcej wolnego.'
    : page.kind === 'year' ? `Boże Ciało ${page.year}: ${example!.rangeLabel} to 4 dni wolnego z urlopem ${example!.leaveLabel}. Zobacz pozostałe mostki i ułóż swój plan.`
      : page.kind === 'calculator' ? 'Ile urlopu zostało? Kiedy następna przerwa? Policz dni, porównaj terminy i miej swój plan pod ręką. Bez konta.'
        : page.kind === 'donor' ? 'Twoja historia, odstępy i kalendarz krwi oraz osocza. Wszystko w jednym miejscu, bez konta.' : description;
  const canonical = SITE_URL + page.path;
  const indexable = page.kind !== 'not-found' && (page.kind !== 'year' || indexedYears(buildYear).includes(page.year));
  const imageKey = page.kind === 'year' ? page.year : page.kind === 'calculator' ? 'planner' : page.kind === 'donor' ? 'donor' : 'home';
  const image = `${SITE_URL}/og/v2/${imageKey}.png`;
  const imageAlt = page.kind === 'year' ? `nierobie.pl. Długie weekendy. Karta kalendarza ${page.year} z limonkowym mostkiem: urlop w piątek łączy święto z weekendem.`
    : page.kind === 'calculator' ? 'nierobie.pl. Planer urlopu. Przykładowy plan: 5 dni urlopu i weekendy dają 9 dni wolnego.'
      : page.kind === 'donor' ? 'nierobie.pl. Dobro wraca. Planer krwiodawcy: krew, osocze, kalendarz donacji, odstępy i historia.'
        : 'nierobie.pl. Nie robię. Mam wolne. Przykładowy mostek: 1 dzień urlopu łączy święto z weekendem w 4 dni wolnego.';
  const imageWidth = 1200, imageHeight = 630, imageType = 'image/png';
  const applicationId = page.kind === 'calculator' ? canonical + '#calculator' : page.kind === 'donor' ? canonical + '#donor-planner' : undefined;
  const graph: object[] = [
    ...(page.kind === 'home' ? [{ '@type': 'WebSite', '@id': SITE_URL + '/#website', name: 'nierobie.pl', alternateName: ['nierobie.pl', 'Nie Robię'], url: SITE_URL + '/', inLanguage: 'pl-PL' }] : []),
    { '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: title, description, inLanguage: 'pl-PL', isPartOf: { '@id': SITE_URL + '/#website' }, ...(page.kind !== 'not-found' ? { primaryImageOfPage: { '@id': canonical + '#image' } } : {}), ...(applicationId ? { mainEntity: { '@id': applicationId } } : {}) },
    ...(page.kind !== 'not-found' ? [{ '@type': 'ImageObject', '@id': canonical + '#image', contentUrl: image, width: imageWidth, height: imageHeight, encodingFormat: imageType, caption: imageAlt }] : [])
  ];
  if (applicationId) graph.push({ '@type': 'WebApplication', '@id': applicationId, name: page.kind === 'calculator' ? 'Planer urlopu' : 'Planer krwiodawcy', url: canonical, mainEntityOfPage: { '@id': canonical + '#webpage' }, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, inLanguage: 'pl-PL', description });
  return { title, description, shareTitle, shareDescription, canonical, image, imageAlt, imageWidth, imageHeight, imageType, robots: indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow', structuredData: { '@context': 'https://schema.org', '@graph': graph } };
}

export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function renderSeoHead(page: Page, buildYear: number): string {
  const seo = getSeo(page, buildYear);
  const meta = (name: string, content: string, attr = 'name') => `<meta ${attr}="${name}" content="${escapeHtml(content)}" />`;
  return [
    `<title>${escapeHtml(seo.title)}</title>`, meta('description', seo.description), meta('robots', seo.robots),
    ...(page.kind === 'not-found' ? [] : [`<link rel="canonical" href="${seo.canonical}" />`]),
    meta('theme-color', '#d9fa66'), meta('og:type', 'website', 'property'), meta('og:locale', 'pl_PL', 'property'),
    meta('og:site_name', 'nierobie.pl', 'property'), meta('og:title', seo.shareTitle, 'property'), meta('og:description', seo.shareDescription, 'property'),
    meta('og:url', seo.canonical, 'property'), meta('og:image', seo.image, 'property'), meta('og:image:secure_url', seo.image, 'property'),
    meta('og:image:type', seo.imageType, 'property'), meta('og:image:width', String(seo.imageWidth), 'property'), meta('og:image:height', String(seo.imageHeight), 'property'), meta('og:image:alt', seo.imageAlt, 'property'),
    meta('twitter:card', 'summary_large_image'), meta('twitter:title', seo.shareTitle), meta('twitter:description', seo.shareDescription), meta('twitter:image', seo.image), meta('twitter:image:alt', seo.imageAlt),
    `<script id="seo-json-ld" type="application/ld+json">${safeJson(seo.structuredData)}</script>`
  ].join('\n    ');
}
