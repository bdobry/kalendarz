import snapshot from '../data/schoolBreaks.json';
export interface SchoolRange { start: string; end: string; source: string; verifiedAt: string; label: string }
interface SchoolYear {
  winter?: { groups: { start: string; end: string; regions: string[] }[]; source: string; verifiedAt: string };
  summer?: { start: string; end: string; source: string; verifiedAt: string };
}
export const schoolData = snapshot as { version: number; years: Record<string, SchoolYear> };
export function getSchoolBreaks(year: number, region: string): SchoolRange[] {
  const entry = schoolData.years[year];
  if (!entry) return [];
  const result: SchoolRange[] = [];
  const winter = entry.winter?.groups.find(group => group.regions.includes(region));
  if (winter) result.push({ start: winter.start, end: winter.end, source: entry.winter!.source, verifiedAt: entry.winter!.verifiedAt, label: 'Ferie zimowe' });
  if (entry.summer) result.push({ ...entry.summer, label: 'Wakacje' });
  return result;
}
