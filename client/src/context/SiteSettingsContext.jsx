import { createContext, useContext, useEffect, useState } from 'react';
import { getSiteSettings } from '../services/api';

const defaults = {
  siteName: 'UrbanCart',
  logoUrl: '',
  tagline: "Premium men's accessories curated for the modern gentleman.",
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
          });
          document.title = `${s.siteName || defaults.siteName} — Premium Men's Accessories`;
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
