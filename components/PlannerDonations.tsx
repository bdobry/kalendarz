import React, { useEffect, useMemo, useState } from 'react';
import { bloodLimit, donationCandidateIssue, donationIssues, donationWindow, DONATION_RULES_SOURCE, type DonorProfile } from '../utils/donationRules';
import { nextDonationSlot } from '../utils/donationPlanning';
import { displayDate, displayRange, PLAN_MIN_YEAR, PLAN_MAX_YEAR, shiftDay, validPlanDate, type Donation, type PersonalPlan } from '../utils/personalPlan';

const scrollToForm = () => {
  const input = document.getElementById('donation-date');
  input?.focus({ preventScroll: true });
  input?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};

function DonorProfileControl({ plan, ready, onChange }: {
  plan: PersonalPlan; ready: boolean; onChange: (plan: PersonalPlan, message: string) => void;
}) {
  const [error, setError] = useState('');
  useEffect(() => setError(''), [plan.donations, plan.donorProfile]);
  return <fieldset className="donor-profile" aria-describedby="donor-profile-help">
    <legend>Limit krwi pełnej w 12 miesiącach</legend>
    <div className="donor-profile-options">{([
      { profile: 'unspecified', limit: 4, description: 'Kobiety · domyślnie' },
      { profile: 'male', limit: 6, description: 'Mężczyźni' }
    ] as const).map(option => <button key={option.limit} type="button" disabled={!ready} aria-pressed={bloodLimit(plan.donorProfile) === option.limit} aria-label={`Limit ${option.limit} donacji krwi`} aria-describedby={`donor-profile-description-${option.limit}`} onClick={() => {
      if (bloodLimit(plan.donorProfile) === option.limit) { setError(''); return; }
      const donorProfile: DonorProfile = option.profile;
      const issue = donationIssues(plan.donations, donorProfile)[0];
      if (issue) { setError(`Nie zmieniono limitu. ${issue.message}`); return; }
      onChange({ ...plan, donorProfile }, 'Zaktualizowano limit donacji krwi.'); setError('');
    }}><strong>{option.limit} {option.limit === 4 ? 'donacje' : 'donacji'}</strong><span id={`donor-profile-description-${option.limit}`}>{option.description}</span></button>)}</div>
    <small id="donor-profile-help">Kolejne 12 miesięcy, także na przełomie lat.</small>
    {error && <p className="donor-error" role="alert">{error}</p>}
  </fieldset>;
}

export function PlannerDonationBrief({ plan, year, planningDate, ready, tool, onToolChange, onCalendar, onChooseDate, onChange }: {
  plan: PersonalPlan; year: number; planningDate: string; ready: boolean; tool: Donation['type'];
  onToolChange: (tool: Donation['type']) => void; onCalendar: (date: string) => void; onChooseDate: (date: string) => void;
  onChange: (plan: PersonalPlan, message: string) => void;
}) {
  const fromDate = planningDate > `${year}-01-01` ? planningDate : `${year}-01-01`;
  const slot = useMemo(() => nextDonationSlot(plan, tool, fromDate, `${year}-12-31`), [plan.donations, plan.donorProfile, tool, fromDate, year]);
  const hasHistory = plan.donations.some(entry => entry.date < planningDate);
  const next = plan.donations.find(entry => entry.date >= fromDate && entry.date <= `${year}-12-31`);
  const pastYear = `${year}-12-31` < planningDate;
  return <section className={`planner-donor-brief ${next ? 'has-next-donation' : 'without-next-donation'}`} aria-label="Terminy donacji">
    <div className="planner-donor-settings"><div className="planner-donor-tool">
      <span>Co planujesz oddać?</span>
      <div className="planner-donation-tool-toggle"><div role="group" aria-label="Co zaznaczasz w kalendarzu">{(['blood', 'plasma'] as const).map(type => <button type="button" key={type} disabled={!ready} aria-pressed={tool === type} onClick={() => onToolChange(type)}>{type === 'blood' ? 'Krew' : 'Osocze'}</button>)}</div></div>
      <button type="button" className="planner-text-button" onClick={scrollToForm}>Wcześniejsze donacje ↓</button>
    </div><div className="planner-donor-profile"><DonorProfileControl plan={plan} ready={ready} onChange={onChange} /></div></div>
    <div className="planner-donor-slot">
      <h2>Kiedy kolejna donacja?</h2>
      {!ready ? <p>Odczytuję zapisane terminy…</p> : pastYear ? <><strong>Ten rok już minął</strong><p>W kalendarzu możesz uzupełnić wcześniejsze wpisy.</p></> : slot.status === 'conflict' ? <><strong>Sprawdź kolidujące wpisy</strong><p>{slot.issue}</p><button type="button" className="planner-text-button" onClick={() => { const heading = document.getElementById('donor-list-heading'); heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>Przejdź do wpisów ↓</button></> : !hasHistory ? <><strong>Dodaj wcześniejsze donacje</strong><p>Bez nich nie uwzględnimy Twoich odstępów i limitów. Jeśli oddajesz pierwszy raz, wybierz dzień w kalendarzu.</p><button className="planner-text-button" type="button" onClick={scrollToForm}>Uzupełnij historię ↓</button></> : slot.date ? <>
        <div className="planner-donor-slot-date"><time dateTime={slot.date}>{displayDate(slot.date)} {slot.date.slice(0, 4)}</time><button className="planner-button" type="button" onClick={() => onChooseDate(slot.date!)}>Wybierz termin <span aria-hidden="true">↗</span></button></div>
        <p>Termin wg zapisanych donacji · {tool === 'blood' ? 'krew pełna' : 'osocze'}. Kwalifikację potwierdza centrum.</p>
      </> : <><strong>Brak terminu w {year}</strong><p>Zapisane odstępy i limity wykraczają poza ten rok.</p></>}
    </div>
    {next && <div className="planner-donor-next"><span>Następny zapisany wpis · {year}</span><button type="button" onClick={() => onCalendar(next.date)}><time dateTime={next.date}>{displayDate(next.date)}</time><span aria-hidden="true">↗</span></button><p>{next.type === 'blood' ? 'Krew pełna' : 'Osocze'} · pokaż w kalendarzu</p></div>}
    <div className="planner-donor-booking">
      <span>Umów wizytę</span>
      <a href="https://pacjent.gov.pl/ikp/zaloguj" target="_blank" rel="noopener noreferrer">Otwórz IKP <span aria-hidden="true">↗</span></a>
      <a href="https://pacjent.gov.pl/chce-oddac-krew" target="_blank" rel="noopener noreferrer">Znajdź centrum <span aria-hidden="true">↗</span></a>
      <details><summary>Jak się umówić?</summary><p>W IKP wybierz <strong>Apteczka → Krwiodawstwo</strong>. Dostępność rezerwacji zależy od centrum. Jeśli jej nie widzisz, sprawdź stronę lub telefon swojego centrum. Zapis w tym planerze nie rezerwuje wizyty.</p></details>
    </div>
  </section>;
}

export function PlannerDonations({ plan, year, planningDate, ready, tool, onToolChange, draft, onCalendar, onChange }: {
  plan: PersonalPlan; year: number; planningDate: string; ready: boolean; tool: Donation['type'];
  onToolChange: (tool: Donation['type']) => void; draft?: { date: string; request: number }; onCalendar: (date: string) => void;
  onChange: (plan: PersonalPlan, message: string) => void;
}) {
  const [date, setDate] = useState('');
  const [editing, setEditing] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [savedDate, setSavedDate] = useState('');
  const [showAllYears, setShowAllYears] = useState(false);
  const type = tool;
  const entries = plan.donations.filter(d => d.date.startsWith(`${year}-`));
  const otherEntries = plan.donations.filter(d => !d.date.startsWith(`${year}-`));
  const visibleEntries = showAllYears ? [...entries, ...otherEntries].sort((a, b) => a.date.localeCompare(b.date)) : entries;
  const issues = useMemo(() => donationIssues(plan.donations, plan.donorProfile), [plan.donations, plan.donorProfile]);
  const problemDates = new Set(issues.flatMap(issue => issue.dates));
  const candidateError = validPlanDate(date) ? donationCandidateIssue(plan, { date, type }, editing) : '';
  const reference = validPlanDate(date) ? date : planningDate;
  useEffect(() => {
    if (!draft) return;
    setDate(draft.date); setEditing(undefined); setError(''); setFormMessage('');
  }, [draft]);
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validPlanDate(date)) { setError('Wybierz poprawną datę donacji.'); return; }
    if (candidateError) { setError(candidateError); return; }
    onChange({ ...plan, donations: [...plan.donations.filter(d => d.date !== editing), { date, type }].sort((a, b) => a.date.localeCompare(b.date)) }, editing ? 'Zmieniono termin donacji.' : 'Dodano donację. Uwzględniliśmy ją w kalendarzu i limitach.');
    setFormMessage(`${editing ? 'Zmieniono wpis' : 'Dodano do kalendarza'}: ${displayDate(date)} ${date.slice(0, 4)} · ${type === 'blood' ? 'krew pełna' : 'osocze'}.`); setSavedDate(date);
    setDate(''); setEditing(undefined); setError('');
  };
  return <section className="donor-panel" id="donacje-info" aria-labelledby="donations-heading">
    <div className="donor-heading"><div><h2 id="donations-heading">Twoje wpisy</h2><p>Uzupełnij wcześniejsze donacje i planowane terminy. Odstępy sprawdzamy dla wszystkich zapisanych lat.</p></div></div>
    <div className="donor-layout">
      <div className="donor-compose">
        <form id="donation-form" onSubmit={save}>
          <div className="planner-section-heading"><h3>{editing ? 'Zmień wpis' : 'Dodaj donację'}</h3>{editing && <span>Edycja</span>}</div>
          <div className="donor-form-fields"><label>Rodzaj<select aria-label="Rodzaj donacji" disabled={!ready} value={type} onChange={event => { onToolChange(event.target.value as Donation['type']); setError(''); setFormMessage(''); }}><option value="blood">Krew pełna</option><option value="plasma">Osocze</option></select></label><label>Data<input id="donation-date" aria-label="Data donacji" type="date" disabled={!ready} required value={date} min={`${PLAN_MIN_YEAR}-01-01`} max={`${PLAN_MAX_YEAR}-12-31`} onChange={event => { setDate(event.target.value); setError(''); setFormMessage(''); }} /></label></div>
          <p className="donor-form-hint">Możesz wpisać również wcześniejszą donację, np. z poprzedniego roku.</p>
          {(candidateError || error) && <p className="donor-error" role="alert">{candidateError || error}</p>}
          <div className="donor-form-actions"><button className="plan-primary" disabled={!ready || !date || !!candidateError}>{editing ? 'Zapisz zmianę' : 'Dodaj do kalendarza'} <span aria-hidden="true">＋</span></button>{editing && <button type="button" onClick={() => { setEditing(undefined); setDate(''); setError(''); }}>Anuluj</button>}{validPlanDate(date) && <button type="button" className="planner-text-button" onClick={() => onCalendar(date)}>Pokaż datę ↗</button>}</div>
          <div className="donor-form-feedback" role="status">{formMessage && <><span>{formMessage}</span><button type="button" className="planner-text-button" onClick={() => onCalendar(savedDate)}>Pokaż w kalendarzu ↗</button></>}</div>
        </form>
        <p className="donor-window">W zapisach z 12 miesięcy do {reference.split('-').reverse().join('.')}: <strong>{donationWindow(plan.donations, reference, 'blood')} krwi</strong> i <strong>{donationWindow(plan.donations, reference, 'plasma')} osocza</strong>.</p>
        <details className="donor-rules"><summary>Jak sprawdzamy odstępy i limity?</summary><ul><li>Krew → krew: 8 tygodni.</li><li>Krew → osocze: 4 tygodnie.</li><li>Osocze → osocze: 2 tygodnie.</li><li>Osocze → krew: 48 godzin. Ponieważ zapisujemy daty bez godzin, planer zostawia co najmniej 3 dni; 4, jeśli w tym czasie zmiana czasu skraca dobę.</li></ul><p>Okresy tygodniowe liczymy z dniem pobrania, zgodnie z tabelą rozporządzenia. Kontrolujemy także wcześniejsze donacje tego samego rodzaju i późniejsze wpisy. Wyjątki wymagające decyzji lekarza nie są dostępne w planerze.</p><a href={DONATION_RULES_SOURCE} target="_blank" rel="noreferrer">Rozporządzenie, załącznik 3 ↗</a><small>Zweryfikowano 16.09.2026.</small></details>
      </div>
      <div className="donor-timeline"><div className="donor-list-heading"><h3 id="donor-list-heading" tabIndex={-1}>Zapisane donacje · {year}</h3><span>{entries.length}</span></div>
        {otherEntries.length > 0 && <button type="button" className="planner-text-button donor-history-toggle" aria-pressed={showAllYears} onClick={() => setShowAllYears(!showAllYears)}>{showAllYears ? 'Pokaż tylko wybrany rok' : `Pokaż też inne lata (${otherEntries.length})`}</button>}
        {issues.length > 0 && <p className="donor-error" role="alert">W zapisanym planie są kolidujące donacje. Popraw oznaczone wpisy; do tego czasu nie dodamy kolejnych. {issues[0].message}</p>}
        {visibleEntries.length === 0 ? <div className="donor-empty"><strong>Nie masz jeszcze wpisów w {year}.</strong><p>Dodaj wcześniejsze donacje z ostatnich 12 miesięcy, żeby uwzględnić je w obliczeniach.</p><button type="button" className="planner-text-button" disabled={!ready} onClick={scrollToForm}>Dodaj pierwszy wpis ↗</button></div> : <ul>{visibleEntries.map(donation => <li key={donation.date} className={problemDates.has(donation.date) ? 'has-conflict' : ''}>
          <time dateTime={donation.date} className="donor-date"><strong>{Number(donation.date.slice(8))}</strong><span>{displayDate(donation.date).split(' ').slice(1).join(' ')}</span><small>{donation.date.slice(0, 4)}</small></time>
          <div className="donor-entry-copy"><div><strong>{donation.type === 'blood' ? 'Krew pełna' : 'Osocze'}</strong><span className="donor-entry-tag">{donation.date < planningDate ? 'Data minęła' : 'W planie'}</span></div><p>Zwolnienie: {displayRange(donation.date, shiftDay(donation.date, 1))}</p>{problemDates.has(donation.date) && <small>Termin wymaga poprawy</small>}<div className="donor-entry-actions"><button type="button" disabled={!ready} onClick={() => { setEditing(donation.date); setDate(donation.date); onToolChange(donation.type); setError(''); setFormMessage(''); scrollToForm(); }} aria-label={`Edytuj donację ${donation.date}`}>Zmień</button><button type="button" disabled={!ready} onClick={() => onCalendar(donation.date)} aria-label={`Pokaż donację ${donation.date} w kalendarzu`}>Kalendarz ↗</button><button type="button" disabled={!ready} onClick={() => { onChange({ ...plan, donations: plan.donations.filter(item => item.date !== donation.date) }, 'Usunięto donację.'); if (editing === donation.date) { setEditing(undefined); setDate(''); } }} aria-label={`Usuń donację ${donation.date}`}>Usuń</button></div></div>
        </li>)}</ul>}
        <p className="donor-history-note">Miniona data nie potwierdza, że donacja się odbyła. Usuń odwołane terminy, żeby obliczenia uwzględniały właściwe wpisy.</p>
      </div>
    </div>
    <div className="donor-footer"><p>Po donacji przysługuje zwolnienie w dniu oddania i w następnym dniu kalendarzowym. Weekend nie przesuwa go na poniedziałek. <a href="https://www.gov.pl/web/nck/uprawnienia-krwiodawcow" target="_blank" rel="noreferrer">Uprawnienia — NCK ↗</a></p><p>Terminy wynikają z zapisanych dat. Kwalifikację, objętość pobrania i dodatkowe przeciwwskazania ocenia centrum krwiodawstwa. Uzgodnij nieobecność w pracy i uzyskaj zaświadczenie.</p></div>
  </section>;
}
