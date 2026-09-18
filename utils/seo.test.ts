import { describe, it, expect } from 'vitest';
import { resolvePage, getSeo, getYearSearchExample, indexedYears, renderSeoHead, safeJson, YEAR_MIN, YEAR_MAX } from './seo';
describe('static route and SEO contract', () => {
  it('accepts only complete, supported routes', () => {
    for (const path of ['/2026', '/2026/', '/2026/index.html']) expect(resolvePage(path)).toEqual({ kind: 'year', year: 2026, path: '/2026/' });
    for (const path of ['/2026xyz', '/2026/anything', '/1990', '/2100', '/foo', '/2026//']) expect(resolvePage(path).kind).toBe('not-found');
    expect(resolvePage('/').kind).toBe('home');
    expect(resolvePage('/kalkulator-urlopu').kind).toBe('calculator');
    for (const path of ['/planer-krwiodawcy', '/planer-krwiodawcy/', '/planer-krwiodawcy/index.html']) expect(resolvePage(path)).toEqual({ kind: 'donor', path: '/planer-krwiodawcy/' });
    expect(resolvePage('/planer-krwiodawcy/anything').kind).toBe('not-found');
  });
  it('keeps homepage, year and calculator canonicals distinct', () => {
    const urls = ['/', '/2026', '/2027/', '/kalkulator-urlopu/', '/planer-krwiodawcy/'].map(path => getSeo(resolvePage(path), 2026).canonical);
    expect(new Set(urls).size).toBe(5);
    expect(urls).toContain('https://nierobie.pl/2026/');
  });
  it('gives the donor planner its own indexable application metadata', () => {
    const seo = getSeo(resolvePage('/planer-krwiodawcy/'), 2026);
    expect(seo.robots).toBe('index, follow, max-image-preview:large');
    expect(seo.title).toContain('Planer krwiodawcy');
    expect(seo.structuredData['@graph']).toContainEqual(expect.objectContaining({ '@type': 'WebApplication', name: 'Planer krwiodawcy', url: 'https://nierobie.pl/planer-krwiodawcy/' }));
    expect(seo.description).not.toBe(getSeo(resolvePage('/kalkulator-urlopu/'), 2026).description);
  });
  it('keeps existing indexed years when the publication year rolls over', () => {
    expect(indexedYears(2027)).toEqual(expect.arrayContaining(indexedYears(2026)));
    expect(indexedYears(2027)).toContain(2032);
    expect(getSeo(resolvePage('/2099/'), 2026).robots).toBe('noindex, follow');
  });
  it('marks missing routes noindex without a misleading canonical', () => {
    const head = renderSeoHead(resolvePage('/missing'), 2026);
    expect(head).toContain('noindex, follow');
    expect(head).not.toContain('rel="canonical"');
    expect(safeJson({ text: '</script>' })).not.toContain('</script>');
  });
  it('matches search intent to the actual tool and separates share copy', () => {
    const home = getSeo(resolvePage('/'), 2026);
    const leave = getSeo(resolvePage('/kalkulator-urlopu/'), 2026);
    const donor = getSeo(resolvePage('/planer-krwiodawcy/'), 2026);
    expect(home.title).toContain('kalendarz dni wolnych');
    expect(leave.title).toContain('kalendarz urlopowy');
    expect(leave.description).toContain('ile dni urlopu zużyje wyjazd');
    expect(donor.description).toContain('krwi i osocza');
    expect(donor.description).not.toContain('urlopu');
    for (const seo of [home, leave, donor]) {
      expect(seo.shareTitle).not.toBe(seo.title);
      expect(seo.shareDescription).not.toBe(seo.description);
    }
  });
  it.each([
    [2026, '4–7 czerwca', '5 czerwca'],
    [2027, '27–30 maja', '28 maja'],
    [2024, '30 maja – 2 czerwca', '31 maja']
  ])('uses the actual dates of the %i bridge, including month boundaries', (year: number, range: string, leave: string) => {
    const example = getYearSearchExample(year);
    const seo = getSeo(resolvePage(`/${year}/`), 2026);
    expect(example.rangeLabel).toBe(range);
    expect(example.leaveLabel).toBe(leave);
    expect(example.holiday.getDay()).toBe(4);
    expect(example.leave.getDay()).toBe(5);
    expect(example.end.getDay()).toBe(0);
    expect(seo.description).toContain(range);
    expect(seo.description).toContain(leave);
    expect(seo.shareDescription).toContain(`Boże Ciało ${year}`);
  });
  it('has page-specific complete social cards for every supported year and workspace', () => {
    const cases = [['/', 'home'], ['/kalkulator-urlopu/', 'planner'], ['/planer-krwiodawcy/', 'donor'],
    ...Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, index) => [`/${YEAR_MIN + index}/`, String(YEAR_MIN + index)])];
    const images = new Set<string>();
    for (const [path, key] of cases) {
      const page = resolvePage(path), seo = getSeo(page, 2026), head = renderSeoHead(page, 2026);
      expect(seo.image).toBe(`https://nierobie.pl/og/v2/${key}.png`);
      expect(images.has(seo.image)).toBe(false); images.add(seo.image);
      expect(head).toContain('property="og:image:width" content="1200"');
      expect(head).toContain('property="og:image:height" content="630"');
      expect(head).toContain('property="og:image:type" content="image/png"');
      expect(head).toContain('name="theme-color" content="#d9fa66"');
      expect(head).toContain(`property="og:image:alt" content="${seo.imageAlt}"`);
      expect(head).toContain(`name="twitter:image:alt" content="${seo.imageAlt}"`);
      expect(head).toContain(`name="twitter:title" content="${seo.shareTitle}"`);
      expect(head).not.toMatch(/og\/default|BreadcrumbList|aggregateRating|SearchAction/);
    }
  });
  it('links each planner application and primary image to its actual page', () => {
    for (const path of ['/kalkulator-urlopu/', '/planer-krwiodawcy/']) {
      const seo = getSeo(resolvePage(path), 2026);
      const graph = seo.structuredData['@graph'];
      const application = graph.find(node => node['@type'] === 'WebApplication');
      expect(graph).toContainEqual(expect.objectContaining({ '@type': 'WebPage', mainEntity: { '@id': application['@id'] }, primaryImageOfPage: { '@id': seo.canonical + '#image' } }));
      expect(application).toEqual(expect.objectContaining({ mainEntityOfPage: { '@id': seo.canonical + '#webpage' }, isAccessibleForFree: true }));
      expect(graph).toContainEqual(expect.objectContaining({ '@type': 'ImageObject', contentUrl: seo.image, width: 1200, height: 630 }));
      expect(graph.some(node => node['@type'] === 'WebSite')).toBe(false);
    }
    expect(getSeo(resolvePage('/'), 2026).structuredData['@graph']).toContainEqual(expect.objectContaining({ '@type': 'WebSite', name: 'nierobie.pl', url: 'https://nierobie.pl/' }));
  });
});
