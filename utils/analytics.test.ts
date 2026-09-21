import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackPlannerAction } from './analytics';

afterEach(() => vi.unstubAllGlobals());
describe('minimal planner analytics', () => {
  it('requires an explicit analytics consent', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag, location: { hostname: 'nierobie.pl' }, localStorage: { getItem: () => 'denied' } });
    trackPlannerAction('plan_started', 'planner', 'calendar');
    expect(gtag).not.toHaveBeenCalled();
  });
  it('sends only a fixed action schema, never a URL or plan payload', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag, location: { hostname: 'nierobie.pl', hash: '#rok=2027&dni=2027-05-28' }, localStorage: { getItem: () => 'granted' } });
    trackPlannerAction('plan_suggestion_added', 'year', 'strategy');
    expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'plan_suggestion_added', {
      event_category: 'Planner', event_label: undefined, value: undefined, surface: 'year', source: 'strategy'
    });
  });
  it('does not interrupt planning when storage is unavailable', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag, localStorage: { getItem: () => { throw new Error('Unavailable'); } } });
    expect(() => trackPlannerAction('plan_exported', 'planner')).not.toThrow();
    expect(gtag).not.toHaveBeenCalled();
  });
});
