import { describe, it, expect } from 'vitest';
import { parseSummer, parseWinter, validateDataset } from '../scripts/school-breaks.mjs';
import data from '../data/schoolBreaks.json';
import { getSchoolBreaks } from './schoolBreaks';
import { REGIONS } from './personalPlan';

const announcement = `<article><h2>Terminy ferii zimowych w roku szkolnym 2025/2026</h2><ul>
<li><strong>19 stycznia -&nbsp;1 lutego 2026:</strong><br />mazowieckie, pomorskie, podlaskie, świętokrzyskie, warmińsko-mazurskie</li>
<li><strong>2 lutego&nbsp;- 15 lutego&nbsp;2026:</strong><br />dolnośląskie, kujawsko-pomorskie, ł&oacute;dzkie, zachodniopomorskie, małopolskie, opolskie</li>
<li><strong>16 lutego - 1 marca 2026:</strong><br />podkarpackie, lubelskie, wielkopolskie, lubuskie, śląskie</li></ul></article>`;

describe('official school data', () => {
  it('parses MEN HTML with entities and different month boundaries', () => {
    expect(parseWinter(announcement, 2026)).toEqual(data.years['2026'].winter.groups);
  });
  it('rejects incomplete regions, impossible dates and unexpected source changes', () => {
    for (const changed of [announcement.replace('mazowieckie, ', ''), announcement.replace('19 stycznia', '20 stycznia'), announcement.replace('1 lutego 2026', '1 lutego 2027'), announcement.replace('śląskie</li>', 'lubuskie</li>'), '<html>error</html>']) expect(() => parseWinter(changed, 2026)).toThrow();
  });
  it('extracts summer dates from PDF text and rejects an unrecognized layout', () => {
    expect(parseSummer('8. Ferie letnie 27 czerwca – 31 sierpnia 2026 r. Podstawa prawna', 2026)).toEqual({ start: '2026-06-27', end: '2026-08-31' });
    expect(() => parseSummer('Ferie letnie 31 lutego - 31 sierpnia 2026', 2026)).toThrow();
    expect(() => parseSummer('Nie znaleziono', 2026)).toThrow();
  });
  it('validates the reusable snapshot and covers every region', () => {
    expect(validateDataset(data)).toBe(data);
    for (const region of REGIONS) expect(getSchoolBreaks(2026, region)).toHaveLength(2);
    expect(getSchoolBreaks(2026, 'mazowieckie')[0]).toMatchObject({ start: '2026-01-19', end: '2026-02-01' });
    expect(getSchoolBreaks(2099, 'mazowieckie')).toEqual([]);
  });
});
