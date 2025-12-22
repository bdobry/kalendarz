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
    const currentUrl = `${origin}/${year}`;
    updateMeta('og:url', currentUrl, 'property');

    // 3. Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 4. Structured Data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "NieRobie.pl",
      "applicationCategory": "ProductivityApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "PLN"
      },
      "description": `Interaktywny kalendarz dni wolnych i planer urlopowy na rok ${year}. Optymalizacja urlopu i długich weekendów.`,
      "url": currentUrl,
      "image": imageUrl,
      "featureList": "Planer urlopu, Kalendarz dni wolnych, Kalkulator dni roboczych"
    };

    let script = document.querySelector('#seo-json-ld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-json-ld';
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

  }, [year, efficiencyClass]);

  return null;
};
