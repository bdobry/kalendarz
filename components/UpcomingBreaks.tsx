import React, { useMemo } from 'react';
import { getUpcomingBreaks } from '../utils/upcomingBreaks';
import { formatDateKey } from '../utils/dateUtils';
import { plannerHref } from '../utils/personalPlan';
import { displayRange, displayDate } from '../utils/vacationSuggestions';

export function UpcomingBreaks({ planningDate }: { planningDate: string }) {
  const { natural, bridge } = useMemo(() => getUpcomingBreaks(planningDate), [planningDate]);
  if (!natural && !bridge) return null;
  return <section className="upcoming-breaks" aria-labelledby="upcoming-heading">
    <div className="home-section-heading"><h2 id="upcoming-heading">Najbliższy długi weekend</h2><p>Wolne już jest. Albo dzieli Cię od niego jeden dzień.</p></div>
    <div className="upcoming-options">
      {natural && <article className="upcoming-option">
        <span className="leave-eyebrow">BEZ URLOPU</span>
        <h3><strong>{natural.days}</strong> dni wolnego</h3>
        <p>{displayRange(natural.start, natural.end)}</p>
        <a href={`/${natural.start.getFullYear()}/#kalendarz`}>Zobacz w kalendarzu <span aria-hidden="true">↗</span></a>
      </article>}
      {bridge && <article className="upcoming-option upcoming-bridge">
        <span className="leave-eyebrow">MOSTEK ZA 1 DZIEŃ URLOPU</span>
        <h3><strong>{bridge.days}</strong> dni wolnego</h3>
        <p>{displayRange(bridge.start, bridge.end)}</p>
        <p className="upcoming-leave">Weź urlop <time dateTime={formatDateKey(bridge.leave!)}>{displayDate(bridge.leave!)}</time>.</p>
        <a href={plannerHref(bridge.leave!.getFullYear(), [formatDateKey(bridge.leave!)])}>Dodaj mostek do planera <span aria-hidden="true">↗</span></a>
      </article>}
    </div>
    <p className="upcoming-note">Najbliższe jeszcze nierozpoczęte przerwy. Zakładamy wolne soboty i niedziele, bez doliczania odbioru za sobotnie święta.</p>
  </section>;
}
