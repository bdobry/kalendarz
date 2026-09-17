import React, { useEffect, useState } from 'react';

interface MonthSlot {
  id: string;
  span: number;
  content: React.ReactNode;
}

/** Group the visible grid rows so an edge preview makes room across its own row. */
export function PlannerMonthGrid({ items, calendarRef }: { items: MonthSlot[]; calendarRef: React.Ref<HTMLDivElement> }) {
  const [columns, setColumns] = useState(6);
  useEffect(() => {
    const queries = [440, 767, 1279].map(width => window.matchMedia(`(max-width: ${width}px)`));
    const resize = () => setColumns(queries[0].matches ? 1 : queries[1].matches ? 2 : queries[2].matches ? 3 : 6);
    resize();
    queries.forEach(query => query.addEventListener('change', resize));
    return () => queries.forEach(query => query.removeEventListener('change', resize));
  }, []);

  const rows: MonthSlot[][] = [];
  let occupied = columns;
  for (const item of items) {
    const span = Math.min(item.span, columns);
    if (occupied + span > columns) { rows.push([]); occupied = 0; }
    rows[rows.length - 1].push(item);
    occupied += span;
  }
  return <div className="plan-months calendar-months" ref={calendarRef}>
    {rows.map(row => <div className="plan-month-row" key={row[0].id}>
      {row.map(item => <React.Fragment key={item.id}>{item.content}</React.Fragment>)}
    </div>)}
  </div>;
}
