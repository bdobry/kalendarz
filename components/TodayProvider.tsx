import React, { createContext, useEffect, useState } from 'react';
export const TodayContext = createContext<Date | null>(null);
export function TodayProvider({ children }: { children: React.ReactNode }) {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => { setToday(new Date()); }, []);
  return <TodayContext.Provider value={today}>{children}</TodayContext.Provider>;
}
