const DEFAULT_DOMAIN = 'https://nierobie.pl';
const META_TITLE_PREFIX = 'NieRobie.pl';
const META_DESCRIPTION_PREFIX = 'Sprawdź kalendarz';

export const EFFICIENCY_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export type SocialMetaPayload = {
  year: number;
  efficiencyClass: string;
  origin?: string;
};

const sanitizeOrigin = (origin?: string) => {
  if (!origin) return '';
  try {
    const url = new URL(origin);
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
};

export const buildSocialMeta = ({ year, efficiencyClass, origin }: SocialMetaPayload) => {
  const base = sanitizeOrigin(origin) || DEFAULT_DOMAIN;
  const normalizedClass = efficiencyClass?.trim().toUpperCase() || 'DEFAULT';
  const isKnownClass = EFFICIENCY_CLASSES.some(cls => cls === normalizedClass);
  const visibleClass = isKnownClass ? normalizedClass : 'DEFAULT';
  const classSlug = isKnownClass ? normalizedClass.toLowerCase() : 'default';

  const title = `${META_TITLE_PREFIX} ${year} – klasa efektywności ${visibleClass}`;
  const description = `${META_DESCRIPTION_PREFIX} ${year} i zaplanuj długie weekendy. Klasa efektywności: ${visibleClass}.`;
  const url = `${base}/?year=${year}`;
  const image = `${base}/social/card-${classSlug}.png`;
  const imageAlt = `Kalendarz ${year} – klasa efektywności ${visibleClass}`;

  return {
    title,
    description,
    url,
    image,
    imageAlt,
  };
};
