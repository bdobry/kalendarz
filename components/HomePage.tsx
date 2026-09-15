import React from 'react';
import { yearPath } from '../utils/seo';

export function HomePage({ currentYear }: { currentYear: number }) {
  return <div className="home-page">
    <section className="home-hero" aria-labelledby="home-heading">
      <p className="leave-eyebrow">KALENDARZ DNI WOLNYCH / PLANER URLOPU</p>
      <h1 id="home-heading">Nie robię.<br /><span>Mam wolne.</span></h1>
      <p>Wakacje, długi weekend czy święty spokój? Połącz urlop ze świętami i weekendami. Zrób sobie więcej miejsca na to, co lubisz.</p>
      <span className="home-sticker" aria-hidden="true"><span>☺</span>ZAJĘTE<br />NIEROBIENIEM</span>
    </section>

    <section className="home-year-picker" aria-labelledby="home-years-heading">
      <div className="home-section-heading"><h2 id="home-years-heading">Kiedy nie robisz?</h2><p>Wybierz rok. Zaplanuj wolne.</p></div>
      <nav aria-label="Kalendarze lat" className="home-year-actions">
        <a href={yearPath(currentYear)} className="home-year-card home-year-primary">
          <span className="home-year-top"><span>PLAN NA TERAZ</span><span className="home-year-tag">Bieżący rok</span></span>
          <strong className="home-year-number">{currentYear}</strong>
          <span className="home-year-description">Mam jeszcze plany na nierobienie.</span>
          <span className="home-year-bottom"><span>Otwieram kalendarz {currentYear}</span><span className="home-card-arrow" aria-hidden="true">↗</span></span>
        </a>
        <a href={yearPath(currentYear + 1)} className="home-year-card home-year-next">
          <span className="home-year-top"><span>PLAN NA POTEM</span><span className="home-year-tag">Przyszły rok</span></span>
          <strong className="home-year-number">{currentYear + 1}</strong>
          <span className="home-year-description">Nie robię planów na ostatnią chwilę.</span>
          <span className="home-year-bottom"><span>Otwieram kalendarz {currentYear + 1}</span><span className="home-card-arrow" aria-hidden="true">↗</span></span>
        </a>
      </nav>
      <p className="home-year-note">Polskie święta · Długie weekendy · Konkretne dni do wzięcia urlopu</p>
    </section>

    <section className="home-how" aria-labelledby="home-how-heading">
      <div className="home-how-intro"><p className="leave-eyebrow">DOBRZE ZAPLANOWANE NIC</p><h2 id="home-how-heading">Trzy kroki.<br /><span>Potem wolne.</span></h2><p>Planowanie urlopu może być krótkie. Sam urlop — już niekoniecznie.</p><span className="home-how-doodle" aria-hidden="true">↳ ☀</span></div>
      <ol className="home-steps">
        <li><span className="home-step-number" aria-hidden="true">01</span><div><h3>Zerkam w kalendarz.</h3><p>Sprawdź, kiedy wypadają święta i dni wolne w Polsce. Majówka, Boże Ciało, a może przerwa na koniec roku?</p></div></li>
        <li><span className="home-step-number" aria-hidden="true">02</span><div><h3>Łączę dni w dłuższą przerwę.</h3><p>Porównaj propozycje długich weekendów. Zobacz, ile dni urlopu potrzebujesz i ile dni wypoczynku z tego wyjdzie.</p></div></li>
        <li><span className="home-step-number" aria-hidden="true">03</span><div><h3>Ustawiam status: nie robię.</h3><p>Wybierz termin, uzgodnij wolne w pracy i zaplanuj wakacje. Albo nic. Nic też jest dobrym planem.</p></div></li>
      </ol>
    </section>

    <section className="home-calculator" aria-labelledby="home-calculator-heading">
      <div><p className="leave-eyebrow">KALKULATOR DNI URLOPU</p><h2 id="home-calculator-heading">Termin już masz?<br /><span>Policz swoje nierobienie.</span></h2><p>Wpisz daty wyjazdu. Sprawdź liczbę dni urlopu, weekendów i świąt w całej przerwie.</p><a href="/kalkulator-urlopu/">Przelicz mój urlop <span aria-hidden="true">↗</span></a></div>
      <div className="home-off" aria-hidden="true"><span>MÓJ STATUS</span><strong>OFF</strong><span>nie robię. odpoczywam.</span></div>
    </section>
  </div>;
}
