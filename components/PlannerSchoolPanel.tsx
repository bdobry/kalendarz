import React from 'react';
import { displayRange, REGIONS, type PersonalPlan } from '../utils/personalPlan';
import { getSchoolBreaks } from '../utils/schoolBreaks';

export function PlannerSchoolPanel({ year, school, onChange }: {
  year: number;
  school: PersonalPlan['school'];
  onChange: (school: PersonalPlan['school']) => void;
}) {
  const ranges = getSchoolBreaks(year, school.region);
  return <section className="school-panel" aria-labelledby="school-panel-title">
    <div className="school-panel-heading">
      <h3 id="school-panel-title">Przerwy szkolne <span>{year}</span></h3>
      <label htmlFor="school-region">Województwo<select id="school-region" value={school.region} onChange={e => onChange({ ...school, region: e.target.value })}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select></label>
    </div>
    <div className="school-periods">{(['Ferie zimowe', 'Wakacje'] as const).map(label => {
      const range = ranges.find(r => r.label === label);
      const summer = label === 'Wakacje';
      return <article className={`school-period ${summer ? 'school-summer' : 'school-winter'}`} key={label}>
        {range ? <><button type="button" aria-label={`Pokaż ${label.toLocaleLowerCase('pl-PL')} w kalendarzu: ${displayRange(range.start, range.end)}`} onClick={() => document.getElementById(`plan-month-${year}-${Number(range.start.slice(5, 7)) - 1}`)?.scrollIntoView({ block: 'start' })}><span className="school-period-label">{label}</span><strong>{displayRange(range.start, range.end)}</strong><span className="school-period-arrow" aria-hidden="true">↓</span></button><a href={range.source} target="_blank" rel="noreferrer" title={`Terminy MEN, sprawdzono ${range.verifiedAt}`}>MEN ↗</a></> : <><h4 className="school-period-label">{label}</h4><p className="plan-data-missing">Brak zweryfikowanych terminów na {year}. Uzupełnimy je po publikacji MEN.</p></>}
      </article>;
    })}</div>
    <p className="school-footnote">Wolne od szkoły podkreślamy. Urlop rodzica liczony osobno. Bez dodatkowych dni ustalanych przez szkołę.</p>
  </section>;
}
