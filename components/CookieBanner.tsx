import React, { useState, useEffect } from 'react';

const CONSENT_STORAGE_KEY = 'cookie_consent';
const CONSENT_TIME_KEY = 'cookie_consent_time';
const EXPIRATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const updateGtagConsent = (granted: boolean) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const status = granted ? 'granted' : 'denied';
  
  // Note: We only update to 'granted' here. Ideally for 'denied' we might want to also send an update,
  // but since default is denied, it's redundant unless we want to explicitly revoke.
  // For simplicity and matching previous logic, we primarily use this to grant.
  if (granted) {
    window.gtag('consent', 'update', {
      'ad_storage': 'granted',
      'analytics_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
  }
};

export const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    const consentTime = localStorage.getItem(CONSENT_TIME_KEY);

    if (consent === null) {
      // First visit
      setShowBanner(true);
    } else {
      const now = Date.now();
      const timeElapsed = consentTime ? now - parseInt(consentTime, 10) : 0;
      
      // Expire denial after 14 days
      if (consent === 'denied' && (!consentTime || timeElapsed > EXPIRATION_MS)) {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        localStorage.removeItem(CONSENT_TIME_KEY);
        setShowBanner(true);
        return;
      }
      
      // Restore previous grant
      if (consent === 'granted') {
        updateGtagConsent(true);
      }
    }
  }, []);

  const handleDecision = (granted: boolean) => {
    const status = granted ? 'granted' : 'denied';
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
    localStorage.setItem(CONSENT_TIME_KEY, Date.now().toString());
    
    if (granted) {
      updateGtagConsent(true);
    }
    
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <div className="text-sm text-neutral-600 text-center sm:text-left">
          <p>
            Zgoda na analitykę pozwala nam lepiej rozumieć Twoje potrzeby i dalej rozwijać kalendarz. 
            Czy zgadzasz się na anonimowe statystyki?
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleDecision(false)}
            className="px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 bg-transparent hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Nie, dziękuję
          </button>
          <button
            onClick={() => handleDecision(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm hover:shadow-md rounded-lg transition-all"
          >
            Jasne, działajmy
          </button>
        </div>
      </div>
    </div>
  );
};
