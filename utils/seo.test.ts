import { describe, it, expect } from 'vitest';
import { resolvePage, getSeo, indexedYears, renderSeoHead, safeJson } from './seo';
describe('static route and SEO contract', () => {
  it('accepts only complete, supported routes', () => {
    for (const path of ['/2026', '/2026/', '/2026/index.html']) expect(resolvePage(path)).toEqual({ kind: 'year', year: 2026, path: '/2026/' });
    for (const path of ['/2026xyz', '/2026/anything', '/1990', '/2100', '/foo', '/2026//']) expect(resolvePage(path).kind).toBe('not-found');
    expect(resolvePage('/').kind).toBe('home');
    expect(resolvePage('/kalkulator-urlopu').kind).toBe('calculator');
  });
  it('keeps homepage, year and calculator canonicals distinct', () => {
    const urls = ['/', '/2026', '/2027/', '/kalkulator-urlopu/'].map(path => getSeo(resolvePage(path), 2026).canonical);
    expect(new Set(urls).size).toBe(4);
    expect(urls).toContain('https://nierobie.pl/2026/');
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
});
