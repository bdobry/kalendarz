import React from 'react';
import { displayRange, REGIONS, type PersonalPlan } from '../utils/personalPlan';
import { getSchoolBreaks } from '../utils/schoolBreaks';

export function PlannerSchoolControl({ school, ready, onChange }: {
  school: PersonalPlan['school'];
  ready: boolean;
  onChange: (school: PersonalPlan['school']) => void;
}) {
  return <div className={`plan-school-control ${school.enabled ? 'is-enabled' : ''}`}>
    <label className="plan-school-toggle">
      <input className="plan-school-input" type="checkbox" role="switch" checked={school.enabled} disabled={!ready} onChange={e => onChange({ ...school, enabled: e.target.checked })} />
      <span className="calendar-mode-track" aria-hidden="true"><span /></span>
      <span>Tryb uczniowski</span>
    </label>
    {school.enabled && <select aria-label="Województwo" aria-describedby="school-region-hint" value={school.region} disabled={!ready} onChange={e => onChange({ ...school, region: e.target.value })}>
      {REGIONS.map(region => <option key={region}>{region}</option>)}
    </select>}
    <span id="school-region-hint" className="sr-only">Pamiętamy ten region dla wszystkich lat, także po wyłączeniu trybu.</span>
  </div>;
}

export function PlannerSchoolPanel({ year, school }: { year: number; school: PersonalPlan['school'] }) {
  const ranges = getSchoolBreaks(year, school.region);
  return <section className="school-panel" aria-labelledby="school-panel-title">
    <h3 id="school-panel-title" className="sr-only">Przerwy szkolne {year}, {school.region}</h3>
    <div className="school-periods">{(['Ferie zimowe', 'Wakacje'] as const).map(label => {
      const range = ranges.find(r => r.label === label);
      const summer = label === 'Wakacje';
      return <article className={`school-period ${summer ? 'school-summer' : 'school-winter'}`} key={label}>
        <span className="school-period-label">{label}</span>
        {range ? <><strong>{displayRange(range.start, range.end)}</strong><a href={range.source} target="_blank" rel="noreferrer" aria-label={`${label} ${year} — terminy MEN`} title={`Terminy MEN, sprawdzono ${range.verifiedAt}`}>MEN ↗</a></> : <p className="plan-data-missing">Brak zweryfikowanych terminów na {year}.</p>}
      </article>;
    })}</div>
  </section>;
}
