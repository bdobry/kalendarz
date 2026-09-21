import React, { useMemo } from 'react';
import { type VacationOpportunity } from '../utils/vacationStrategyUtils';
import { calculateYearCuriosities } from '../utils/statsUtils';
import { getPolishHolidays } from '../utils/dateUtils';
import { displayDate, displayRange, displayLeaveDates, rankVacationSuggestions, getVacationCandidates } from '../utils/vacationSuggestions';
import { PlanningFaq, type FaqItem } from './PlanningFaq';
import { getYearSearchExample } from '../utils/seo';
import { strategyPlannerHref } from '../utils/strategyPreview';

function OpportunityAnswer({ strategy }: { strategy: VacationOpportunity }) {
  return <div className="faq-opportunity"><p><strong>{strategy.freeDays} dni wypoczynku</strong> · {displayRange(strategy.startDate, strategy.endDate)}</p><p>Weź {strategy.daysToTake === 1 ? '1 dzień' : `${strategy.daysToTake} dni`} urlopu: <strong>{displayLeaveDates(strategy.vacationDays)}</strong>.</p></div>;
}

export function SeoContent({ year, strategies = [] }: { year: number; strategies?: VacationOpportunity[] }) {
  const curiosities = useMemo(() => calculateYearCuriosities(year), [year]);
  const holidays = useMemo(() => [...getPolishHolidays(year)].sort(([a], [b]) => a.localeCompare(b)).map(([key, name]) => ({ key, name, date: new Date(`${key}T12:00:00`) })), [year]);
  const candidates = useMemo(() => getVacationCandidates(year), [year]);
  const best = useMemo(() => rankVacationSuggestions(candidates, year, `${year}-01-01`, 3), [year, candidates]);
  const mayBreak = useMemo(() => rankVacationSuggestions(candidates.filter(s => s.periodName === 'Majówka'), year, `${year}-01-01`, 3, 1)[0], [year, candidates]);
  const longBreak = useMemo(() => [...strategies].filter(s => s.startDate.getFullYear() === year && s.freeDays >= 14 && s.daysToTake <= 10).sort((a, b) => a.daysToTake - b.daysToTake || a.freeDays - b.freeDays || a.startDate.getTime() - b.startDate.getTime())[0], [strategies, year]);
  const saturdays = holidays.filter(holiday => holiday.date.getDay() === 6);
  const may1 = new Date(year, 4, 1), may3 = new Date(year, 4, 3);
  const { holiday: corpus, leave: corpusFriday, end: corpusSunday } = useMemo(() => getYearSearchExample(year), [year]);
  const faq: FaqItem[] = [
    { question: `Mam najwyżej 3 dni urlopu. Kiedy warto je wykorzystać w ${year} roku?`, answer: <><p>Te terminy dają najdłuższy ciągły wypoczynek przy limicie 3 dni urlopu. Przy tej samej długości przerwy wybieramy mniejsze zużycie urlopu. Porównujemy cały {year} rok, więc część dat może już być za nami.</p>{best.length ? best.map(strategy => <OpportunityAnswer key={strategy.id} strategy={strategy} />) : <p><a href={strategyPlannerHref(year)}>Sprawdź większy limit w strategii urlopowej planera →</a></p>}<p>Wybieraj jedną z propozycji lub łącz rozłączne terminy, pilnując sumy wykorzystanych dni.</p></> },
    { question: `Jak przedłużyć majówkę ${year}?`, answer: <><p>W {year} roku 1 maja to <strong>{may1.toLocaleDateString('pl-PL', { weekday: 'long' })}</strong>, a 3 maja to <strong>{may3.toLocaleDateString('pl-PL', { weekday: 'long' })}</strong>.</p>{mayBreak ? <><p>Tak możesz połączyć święta z weekendem przy limicie do 3 dni urlopu:</p><OpportunityAnswer strategy={mayBreak} /></> : <p>Porównaj dni przed 1 maja i po 3 maja w kalendarzu. Jeśli chcesz wydłużyć wyjazd, <a href={strategyPlannerHref(year)}>ustaw większy limit dni w strategii urlopowej planera</a>.</p>}<p>Jeśli święto przypada w sobotę, termin dodatkowego dnia wolnego zależy od ustaleń w pracy. Nie doliczamy go automatycznie do majówki.</p></> },
    { question: `Który dzień wziąć wolny przy Bożym Ciele ${year}?`, answer: <p>Boże Ciało wypada w czwartek, <strong>{displayDate(corpus)}</strong>. Weź urlop w piątek, <strong>{displayDate(corpusFriday)}</strong>, a uzyskasz <strong>4 dni ciągłego wypoczynku za 1 dzień urlopu</strong>: {displayRange(corpus, corpusSunday)}. To gotowy układ dla osób z wolnymi sobotami i niedzielami.</p> },
    { question: `Jak znaleźć przynajmniej dwa tygodnie wolnego w ${year}?`, answer: <><p>Szukaj dłuższych bloków obejmujących dwa weekendy i święta. W <a href={strategyPlannerHref(year)}>strategii urlopowej planera</a> ustaw minimum 14 dni wolnego oraz tyle dni urlopu, ile możesz przeznaczyć na wyjazd.</p>{longBreak && <><p>Przykład z kalendarza {year}:</p><OpportunityAnswer strategy={longBreak} /></>}<p>Bez świąt 14 kolejnych dni to 10 dni roboczych przy pracy od poniedziałku do piątku. <a href={`/kalkulator-urlopu/#rok=${year}`}>Sprawdź własny termin w planerze urlopu →</a></p></> },
    { question: `Za które sobotnie święta w ${year} mogę odebrać wolne?`, answer: <>{saturdays.length ? <><p>W sobotę wypadają:</p><ul>{saturdays.map(holiday => <li key={holiday.key}><strong>{displayDate(holiday.date)}</strong> — {holiday.name}.</li>)}</ul><p>Przy standardowym grafiku od poniedziałku do piątku pracodawca wyznacza inny dzień wolny w tym samym okresie rozliczeniowym. Dopiero gdy znasz jego datę, możesz uwzględnić go w planie wyjazdu. To nie jest dodatkowy dzień do dowolnego wykorzystania przez cały rok.</p></> : <p>W {year} roku żadne z uwzględnionych świąt ustawowych nie przypada w sobotę. W tym kalendarzu nie doliczamy więc dni do odbioru za sobotnie święta.</p>}<p><a href="https://gdansk.pip.gov.pl/aktualnosci/dzien-wolny-z-tytulu-swieta-przypadajacego-w-sobote-wyjasniamy">Sprawdź zasady odbioru dnia wolnego w PIP ↗</a></p></> },
    { question: 'Co sprawdzić, gdy wypoczynek przechodzi z grudnia na styczeń?', answer: <p>Lista „dni urlopu” może obejmować dwa lata, nawet jeśli oglądasz jeden rocznik. Policz oddzielnie dni robocze w grudniu i w styczniu, a możliwość wykorzystania zaległego urlopu ustal w pracy. Liczba dni wypoczynku obejmuje całą przerwę, łącznie ze świętami i weekendami po obu stronach Nowego Roku.</p> }
  ];

  return <div className="year-details mt-12 mb-8">
    <PlanningFaq title={`Długie weekendy ${year}. Kiedy wziąć urlop?`} intro={`Porównaj konkretne terminy w ${year} roku: od majówki po przerwę świąteczną. Sprawdź, ile dni urlopu potrzebujesz i ile dni wypoczynku zyskasz. Zakładamy wolne soboty i niedziele.`} items={faq} />
    <section id="liczby-roku" className="year-curiosities scroll-mt-24" aria-labelledby="year-curiosities-heading">
      <p className="leave-eyebrow">ROCZNY BILANS NIEROBIENIA</p>
      <h2 id="year-curiosities-heading">{year} w kilku liczbach</h2>
      <p className="year-curiosities-intro">Ile dni roboczych, wolnych i weekendów ma {year} rok? Liczymy dla pełnego etatu: 8 godzin dziennie, od poniedziałku do piątku, z odbiorem za święta w sobotę i bez urlopu wypoczynkowego.</p>
      <div className="year-curiosities-grid">
        <div><strong>{curiosities.workingDaysWithRedemption}</strong><h3>Dni robocze w {year}</h3><span>Po uwzględnieniu {curiosities.holidaysOnSaturday} dni do odbioru za sobotnie święta.</span></div>
        <div><strong>{curiosities.workingHours.toLocaleString('pl-PL')}</strong><h3>Godziny pracy w {year}</h3><span>Roczny wymiar czasu pracy przy 8-godzinnym dniu pracy.</span></div>
        <div><strong>{curiosities.freeDaysWithRedemption}</strong><h3>Dni wolne w {year}</h3><span>Weekendy, święta i odbiór za sobotę. Bez doliczania urlopu.</span></div>
        <div><strong>{curiosities.fullWeekendsCount}</strong><h3>Pełne weekendy w {year}</h3><span>Pary sobota–niedziela w całości w roku. Łącznie {curiosities.weekendDaysCount} dni weekendowych.</span></div>
      </div>
      <dl className="year-calendar-facts">
        <div><dt>Soboty w {year} roku</dt><dd>{curiosities.saturdaysCount}</dd></div>
        <div><dt>Niedziele w {year} roku</dt><dd>{curiosities.sundaysCount}</dd></div>
        <div><dt>Dni świąt ustawowych</dt><dd>{curiosities.holidaysCount}</dd></div>
        <div><dt>Święta w sobotę</dt><dd>{curiosities.holidaysOnSaturday}</dd></div>
      </dl>
      <div className="year-count-explanation">
        <h3>Jak liczymy dni robocze i wolne w {year} roku?</h3>
        <p>Rok {year} ma <strong>{curiosities.totalDays} dni</strong> i {curiosities.isLeap ? 'jest przestępny' : 'nie jest przestępny'}. Po odjęciu {curiosities.weekendDaysCount} sobót i niedziel oraz {curiosities.holidaysOnWeekdays} świąt od poniedziałku do piątku zostaje <strong>{curiosities.workingDaysCount} dni roboczych w kalendarzu</strong>. Odbiór za {curiosities.holidaysOnSaturday} sobotnie święta zmniejsza tę liczbę do <strong>{curiosities.workingDaysWithRedemption} dni pracy</strong>.</p>
        <p>Same weekendy i święta dają {curiosities.freeDaysCount} dni wolnych; z odbiorem za sobotę jest ich {curiosities.freeDaysWithRedemption}. Święta w niedzielę ({curiosities.holidaysOnSunday}) są już wliczone w weekendy. Termin odbioru ustala pracodawca w tym samym okresie rozliczeniowym. <a href="https://www.pip.gov.pl/dla-pracownikow/porady-prawne/czas-pracy">Zasady obliczania wymiaru czasu pracy — PIP ↗</a></p>
      </div>
      <details className="year-monthly-stats">
        <summary>Dni robocze i godziny pracy {year} — miesiąc po miesiącu <span aria-hidden="true">+</span></summary>
        <p>Wymiar dla pełnego etatu i miesięcznych okresów rozliczeniowych. Przy dłuższym okresie dzień wolny za sobotnie święto może przypaść w innym miesiącu.</p>
        <div className="overflow-x-auto"><table>
          <caption className="sr-only">Miesięczny wymiar czasu pracy {year}</caption>
          <thead><tr><th scope="col">Miesiąc</th><th scope="col">Dni pracy</th><th scope="col">Godziny pracy</th><th scope="col">Święta w sobotę</th></tr></thead>
          <tbody>{curiosities.months.map(month => <tr key={month.name}><th scope="row">{month.name}</th><td>{month.workingDays}</td><td>{month.workingHours}</td><td>{month.saturdayHolidays}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row">Cały {year} rok</th><td>{curiosities.workingDaysWithRedemption}</td><td>{curiosities.workingHours.toLocaleString('pl-PL')}</td><td>{curiosities.holidaysOnSaturday}</td></tr></tfoot>
        </table></div>
      </details>
      <div className="year-extra-facts">
        <div><h3>Najwięcej wolnego w miesiącu</h3><p><strong>{curiosities.maxFreeDays} dni</strong> weekendów i świąt: {curiosities.lazyMonthNames.join(', ')}. Bez urlopu i odbioru za sobotę.</p></div>
        <div><h3>Najdłuższa przerwa między świętami</h3><p><strong>{curiosities.maxDrought} dni</strong> bez święta ustawowego, pomiędzy datami {curiosities.maxDroughtMonth}. Weekendy nadal są wolne.</p></div>
      </div>
    </section>
    <section id="swieta" className="year-holidays scroll-mt-40 bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8 mt-10">
      <p className="leave-eyebrow">DATY ZAREZERWOWANE NA WOLNE</p><h2 className="text-2xl font-bold mb-3">Święta i dni ustawowo wolne od pracy {year}</h2>
      <p className="text-neutral-600 mb-5">Pełna lista dat do sprawdzenia przed rezerwacją wyjazdu. Obliczenia dla przyszłych lat przyjmują obecne zasady świąt w Polsce.</p>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left border-collapse">
        <caption className="sr-only">Kalendarz świąt w Polsce na {year} rok</caption>
        <thead><tr className="border-b border-neutral-200"><th scope="col" className="p-3">Data</th><th scope="col" className="p-3">Dzień tygodnia</th><th scope="col" className="p-3">Święto</th></tr></thead>
        <tbody>{holidays.map(({ key, date, name }) => <tr key={key} className="border-b border-neutral-100"><td className={`p-3 whitespace-nowrap${date.getDay() === 0 || date.getDay() === 6 ? ' holiday-weekend-date' : ''}`}><time dateTime={key}>{date.toLocaleDateString('pl-PL')}</time></td><td className={`p-3${date.getDay() === 0 || date.getDay() === 6 ? ' holiday-weekend-date' : ''}`}>{date.toLocaleDateString('pl-PL', { weekday: 'long' })}</td><th scope="row" className="p-3 font-medium">{name}</th></tr>)}</tbody>
      </table></div>
      <p className="text-xs text-neutral-500 mt-4">Od 2025 roku lista obejmuje także Wigilię. <a className="underline" href="https://www.pip.gov.pl/aktualnosci/wigilia-bozego-narodzenia-dniem-wolnym-od-pracy-przepisy-wlasnie-weszly-w-zycie">Źródło: Państwowa Inspekcja Pracy</a>.</p>
    </section>
  </div>;
}
