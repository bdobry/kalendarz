import React, { useMemo, useState } from 'react';
import { bloodLimit, donationCandidateIssue, donationIssues, donationWindow, DONATION_RULES_SOURCE, type DonorProfile } from '../utils/donationRules';
import { displayDate, displayRange, PLAN_MIN_YEAR, PLAN_MAX_YEAR, shiftDay, validPlanDate, type Donation, type PersonalPlan } from '../utils/personalPlan';

export function PlannerDonations({ plan, year, planningDate, ready, onChange }: {
  plan: PersonalPlan; year: number; planningDate: string; ready: boolean;
  onChange: (plan: PersonalPlan, message: string) => void;
}) {
  const [date, setDate] = useState('');
  const [type, setType] = useState<Donation['type']>('blood');
  const [editing, setEditing] = useState<string | undefined>();
  const [error, setError] = useState('');
  const entries = plan.donations.filter(d => d.date.startsWith(`${year}-`));
  const issues = useMemo(() => donationIssues(plan.donations, plan.donorProfile), [plan.donations, plan.donorProfile]);
  const problemDates = new Set(issues.flatMap(issue => issue.dates));
  const candidateError = validPlanDate(date) ? donationCandidateIssue(plan, { date, type }, editing) : '';
  const reference = validPlanDate(date) ? date : planningDate;
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validPlanDate(date)) { setError('Wybierz poprawną datę donacji.'); return; }
    if (candidateError) { setError(candidateError); return; }
    onChange({ ...plan, donations: [...plan.donations.filter(d => d.date !== editing), { date, type }].sort((a, b) => a.date.localeCompare(b.date)) }, editing ? 'Zmieniono termin donacji.' : 'Dodano donację. Uwzględniliśmy ją w kalendarzu i limitach.');
    setDate(''); setEditing(undefined); setError('');
  };
  return <section className="donor-panel" id="donacje-info" aria-labelledby="donations-heading">
    <div className="donor-heading"><div><p className="leave-eyebrow">WOLNE, KTÓRE POMAGA</p><h2 id="donations-heading">Twoje donacje.<br /><span>Z czasem na regenerację.</span></h2><p>Dodaj planowaną datę albo wcześniejszą donację. Sprawdzimy odstępy i limity, również na przełomie lat.</p></div><fieldset className="donor-profile" aria-describedby="donor-profile-help"><legend>Profil dawcy</legend>
      <div className="donor-profile-options">{([
        { profile: 'unspecified', limit: 4, label: '4 donacje', description: 'Domyślnie · kobiety' },
        { profile: 'male', limit: 6, label: '6 donacji', description: 'Mężczyźni' }
      ] as const).map(option => <button key={option.limit} type="button" disabled={!ready} aria-pressed={bloodLimit(plan.donorProfile) === option.limit} aria-label={`Limit ${option.limit} donacji krwi`} aria-describedby={`donor-profile-description-${option.limit}`} onClick={() => {
        if (bloodLimit(plan.donorProfile) === option.limit) { setError(''); return; }
        const donorProfile: DonorProfile = option.profile;
        const issue = donationIssues(plan.donations, donorProfile)[0];
        if (issue) { setError(`Nie zmieniono profilu. ${issue.message}`); return; }
        onChange({ ...plan, donorProfile }, 'Zaktualizowano limit donacji krwi.'); setError('');
      }}><strong>{option.label}</strong><span id={`donor-profile-description-${option.limit}`}>{option.description}</span></button>)}</div>
      <small id="donor-profile-help">Krwi pełnej w kolejnych 12 miesiącach.</small>
    </fieldset></div>
    <div className="donor-layout">
      <div className="donor-compose">
        <div className="donor-limits"><div><span>Krew pełna</span><strong>{bloodLimit(plan.donorProfile)}<small> / 12 mies.</small></strong><p>8 tygodni między donacjami</p></div><div><span>Osocze</span><strong>33<small> / 12 mies.</small></strong><p>2 tygodnie między donacjami</p></div></div>
        <form id="donation-form" onSubmit={save}>
          <h3>{editing ? 'Zmień wpis' : 'Dodaj donację'}</h3>
          <div className="donor-form-fields"><label>Rodzaj<select aria-label="Rodzaj donacji" value={type} onChange={e => { setType(e.target.value as Donation['type']); setError(''); }}><option value="blood">Krew pełna</option><option value="plasma">Osocze</option></select></label><label>Data<input aria-label="Data donacji" type="date" required value={date} min={`${PLAN_MIN_YEAR}-01-01`} max={`${PLAN_MAX_YEAR}-12-31`} onChange={e => { setDate(e.target.value); setError(''); }} /></label></div>
          {(candidateError || error) && <p className="donor-error" role="alert">{candidateError || error}</p>}
          <div className="donor-form-actions"><button className="plan-primary" disabled={!ready || !!candidateError}>{editing ? 'Zapisz zmianę' : 'Dodaj do kalendarza'} <span aria-hidden="true">＋</span></button>{editing && <button type="button" onClick={() => { setEditing(undefined); setDate(''); setError(''); }}>Anuluj</button>}</div>
        </form>
        <p className="donor-window">Zapisane donacje w 12 miesiącach do {reference.split('-').reverse().join('.')}: <strong>{donationWindow(plan.donations, reference, 'blood')} krwi</strong> i <strong>{donationWindow(plan.donations, reference, 'plasma')} osocza</strong>.</p>
        <details className="donor-rules"><summary>Jak sprawdzamy odstępy?</summary><ul><li>Krew → krew: 8 tygodni.</li><li>Krew → osocze: 4 tygodnie.</li><li>Osocze → osocze: 2 tygodnie.</li><li>Osocze → krew: 48 godzin. Ponieważ zapisujemy daty bez godzin, planer zostawia co najmniej 3 dni; 4, jeśli w tym czasie zmiana czasu skraca dobę.</li></ul><p>Okresy tygodniowe liczymy z dniem pobrania, zgodnie z tabelą rozporządzenia. Kontrolujemy także wcześniejsze donacje tego samego rodzaju i późniejsze wpisy. Wyjątki wymagające decyzji lekarza nie są dostępne w planerze.</p><a href={DONATION_RULES_SOURCE} target="_blank" rel="noreferrer">Rozporządzenie, załącznik 3 ↗</a><small>Zweryfikowano 16.09.2026.</small></details>
      </div>
      <div className="donor-timeline"><div className="donor-list-heading"><h3>Twoje donacje w {year}</h3><span>{entries.length} {entries.length === 1 ? 'donacja' : 'donacji'}</span></div>
        {issues.length > 0 && <p className="donor-error" role="alert">W zapisanym planie są kolidujące donacje. Popraw oznaczone wpisy; do tego czasu nie dodamy kolejnych. {issues[0].message}</p>}
        {entries.length === 0 ? <div className="donor-empty"><span aria-hidden="true">♡</span><strong>Brak zapisanych donacji.</strong><p>Dodaj termin w formularzu lub zaznacz dzień w kalendarzu w trybie „Krew” albo „Osocze”. Tutaj zobaczysz donacje z {year} roku.</p></div> : <ul>{entries.map(d => <li key={d.date} className={problemDates.has(d.date) ? 'has-conflict' : ''}>
          <time dateTime={d.date} className="donor-date"><strong>{Number(d.date.slice(8))}</strong><span>{displayDate(d.date).split(' ').slice(1).join(' ')}</span></time>
          <div className="donor-entry-copy"><div><strong>{d.type === 'blood' ? 'Krew pełna' : 'Osocze'}</strong><span className="donor-entry-tag">{d.date < planningDate ? 'Data minęła' : 'W planie'}</span></div><p>Zwolnienie: {displayRange(d.date, shiftDay(d.date, 1))}</p>{problemDates.has(d.date) && <small>Termin wymaga poprawy</small>}<div className="donor-entry-actions"><button type="button" onClick={() => { setEditing(d.date); setDate(d.date); setType(d.type); setError(''); document.getElementById('donation-form')?.scrollIntoView({ block: 'center' }); }} aria-label={`Edytuj donację ${d.date}`}>Zmień</button><button type="button" onClick={() => { onChange({ ...plan, donations: plan.donations.filter(item => item.date !== d.date) }, 'Usunięto donację.'); if (editing === d.date) { setEditing(undefined); setDate(''); } }} aria-label={`Usuń donację ${d.date}`}>Usuń</button></div></div>
        </li>)}</ul>}
        <p className="donor-history-note">Dodaj również donacje z poprzednich 12 miesięcy. Bierzemy pod uwagę wszystkie zapisane lata. Miniona data nie potwierdza, że donacja się odbyła — usuń odwołane wpisy.</p>
      </div>
    </div>
    <div className="donor-footer"><p>Po donacji przysługuje zwolnienie w dniu oddania i w następnym dniu kalendarzowym. Weekend nie przesuwa go na poniedziałek. <a href="https://www.gov.pl/web/nck/uprawnienia-krwiodawcow" target="_blank" rel="noreferrer">Uprawnienia — NCK ↗</a></p><p>Sprawdzamy terminy na podstawie Twoich wpisów. Kwalifikację, objętość pobrania i dodatkowe przeciwwskazania ocenia centrum krwiodawstwa. Uzgodnij nieobecność w pracy i uzyskaj zaświadczenie.</p></div>
  </section>;
}
