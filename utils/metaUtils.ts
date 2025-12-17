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
  const base = sanitizeOrigin(origin) || 'https://nierobie.pl';
  const normalizedClass = efficiencyClass?.trim().toUpperCase() || 'DEFAULT';
  const safeClass = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(normalizedClass) ? normalizedClass : 'default';

  const title = `NieRobie.pl ${year} – klasa efektywności ${normalizedClass}`;
  const description = `Sprawdź kalendarz ${year} i zaplanuj długie weekendy. Klasa efektywności: ${normalizedClass}.`;
  const url = `${base}/?year=${year}`;
  const image = `${base}/social/card-${safeClass}.png`;
  const imageAlt = `Kalendarz ${year} – klasa efektywności ${normalizedClass}`;

  return {
    title,
    description,
    url,
    image,
    imageAlt,
  };
};
