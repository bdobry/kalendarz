import React, { useEffect } from 'react';

interface SeoHeadProps {
  year: number;
  efficiencyClass: string; // 'A' | 'B' ...
}

export const SeoHead: React.FC<SeoHeadProps> = ({ year, efficiencyClass }) => {
  useEffect(() => {
    // 1. Update Title
    document.title = `NieRobie.pl - Kalendarz ${year} - Klasa Efektywności ${efficiencyClass}`;

    // 2. Update Meta Tags
    const updateMeta = (name: string, content: string, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', `Sprawdź kalendarz dni wolnych na rok ${year}. Twoja klasa efektywności urlopowej to ${efficiencyClass}. Zaplanuj urlop z NieRobie.pl.`);
    
    // OG Tags (property="og:...")
    updateMeta('og:title', `Kalendarz ${year} - Klasa ${efficiencyClass}`, 'property');
    updateMeta('og:description', `Sprawdź jak najlepiej zaplanować urlop w ${year} roku. Klasa efektywności: ${efficiencyClass}.`, 'property');
    
    // Dynamic Image URL
    // Assumes images are at /og/class-X.svg
    const origin = window.location.origin;
    const imageUrl = `${origin}/og/class-${efficiencyClass}.png`;
    updateMeta('og:image', imageUrl, 'property');
    
    // URL
    updateMeta('og:url', `${origin}/${year}`, 'property');

  }, [year, efficiencyClass]);

  return null;
};
