import { describe, expect, it } from 'vitest';
import { buildSocialMeta } from './metaUtils';

describe('buildSocialMeta', () => {
  it('builds meta payload with normalized class and provided origin', () => {
    const meta = buildSocialMeta({ year: 2026, efficiencyClass: 'b', origin: 'https://example.com/app' });

    expect(meta.title).toContain('2026');
    expect(meta.title).toContain('B');
    expect(meta.description).toContain('2026');
    expect(meta.image).toBe('https://example.com/social/card-b.png');
    expect(meta.url).toBe('https://example.com/?year=2026');
    expect(meta.imageAlt).toContain('B');
  });

  it('falls back to default host and default card for unknown class', () => {
    const meta = buildSocialMeta({ year: 2025, efficiencyClass: 'z' });

    expect(meta.image).toBe('https://nierobie.pl/social/card-default.png');
    expect(meta.url).toBe('https://nierobie.pl/?year=2025');
    expect(meta.title).toContain('DEFAULT');
  });
});
