import { createContext, useContext, useEffect, useState } from 'react';
import { getSiteSettings } from '../services/api';

const defaults = {
  siteName: 'Nogor Car',
  logoUrl: '',
  tagline: 'Car accessories for every ride.',
  footerLinks: [
    { label: 'ফিটনেস এ্যাপয়েন্টমেন্টের সময়সূচি', url: '/contact' },
    { label: 'রেজিস্ট্রেশন ফি ও নবায়ন', url: '/contact' },
    { label: 'ট্যাক্স টোকেন ও রুট পারমিট ফি', url: '/contact' },
    { label: 'সার্ভিস চার্জ ও ডেলিভারি ফি', url: '/contact' },
    { label: 'নিবন্ধিত মোটরযানের ফি', url: '/contact' },
  ],
};

const SiteSettingsContext = createContext({
  ...defaults,
  loading: true,
});

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteSettings()
      .then((res) => {
        const s = res.data.settings;
        if (s) {
          setSettings({
            siteName: s.siteName || defaults.siteName,
            logoUrl: s.logoUrl || '',
            tagline: s.tagline || defaults.tagline,
            footerLinks:
              Array.isArray(s.footerLinks) && s.footerLinks.length
                ? s.footerLinks
                : defaults.footerLinks,
          });
          document.title = `${s.siteName || defaults.siteName} — Car Accessories`;
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ ...settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
