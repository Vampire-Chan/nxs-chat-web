import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { en } from '../locales/en';
import { hi } from '../locales/hi';
import { ne } from '../locales/ne';
import { enSimple } from '../locales/en-simple';
import { mr } from '../locales/mr';
import { pa } from '../locales/pa';
import { bho } from '../locales/bho';
import { te } from '../locales/te';
import { kn } from '../locales/kn';
import { ur } from '../locales/ur';
import { phd } from '../locales/phd';

type Language = 'en' | 'en-simple' | 'hi' | 'ne' | 'mr' | 'pa' | 'bho' | 'te' | 'kn' | 'ur' | 'phd' | 'ks' | 'doi' | 'ghw' | 'kum';

export const VISIBLE_LANGUAGE_OPTIONS: Array<{ id: Language; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'en-simple', label: 'Simple' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'ne', label: 'नेपाली' },
  { id: 'mr', label: 'मराठी' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ' },
  { id: 'bho', label: 'भोजपुरी' },
  { id: 'te', label: 'తెలుగు' },
  { id: 'ur', label: 'اردو' }
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// PLACEHOLDERS FOR NEW DIALECTS
const ks = { ...en, "common.loading": "Loading (Kashmiri)..." };
const doi = { ...en, "common.loading": "Loading (Dogri)..." };
const ghw = { ...en, "common.loading": "Loading (Garhwali)..." };
const kum = { ...en, "common.loading": "Loading (Kumaoni)..." };

const translations: Record<string, Record<string, string>> = {
  en,
  'en-simple': enSimple,
  hi,
  ne,
  mr,
  pa,
  bho,
  te,
  kn,
  ur,
  phd,
  ks,
  doi,
  ghw,
  kum
};

const disabledLanguages = new Set<Language>(['kn', 'phd', 'ks', 'doi', 'ghw', 'kum']);
const normalizeLanguage = (lang: Language): Language => (disabledLanguages.has(lang) ? 'en' : lang);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const initLanguage = async () => {
      const saved = localStorage.getItem('Yantravani_lang') as Language;
      if (saved && translations[saved]) {
        const normalized = normalizeLanguage(saved);
        setLanguage(normalized);
        if (normalized === 'ur') document.documentElement.dir = 'rtl';
        return;
      }

      try {
        const res = await fetch('https://ipinfo.io/json');
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        
        if (data.country === 'NP') {
          setLanguage(normalizeLanguage('ne'));
        } else if (data.country === 'IN') {
          const region = data.region;
          const city = data.city;
          
          if (region === 'Jammu and Kashmir' || region === 'Ladakh') setLanguage(normalizeLanguage('ur'));
          else if (region === 'Punjab' || region === 'Chandigarh') setLanguage(normalizeLanguage('pa'));
          else if (region === 'Himachal Pradesh') setLanguage(normalizeLanguage('phd'));
          else if (region === 'Uttarakhand') {
             const kumaonDistricts = ['Nainital', 'Almora', 'Pithoragarh', 'Champawat', 'Bageshwar', 'Udham Singh Nagar'];
             if (city === 'Pithoragarh' || city === 'Champawat') setLanguage(normalizeLanguage('ne'));
             else if (kumaonDistricts.includes(city)) setLanguage(normalizeLanguage('kum'));
             else setLanguage(normalizeLanguage('ghw'));
          } else if (region === 'Maharashtra') setLanguage(normalizeLanguage('mr'));
          else if (region === 'Telangana' || region === 'Andhra Pradesh') setLanguage(normalizeLanguage('te'));
          else if (region === 'Karnataka') setLanguage(normalizeLanguage('kn'));
          else if (region === 'Bihar' || region === 'Uttar Pradesh') {
             const bhojpuriCities = ['Varanasi', 'Patna', 'Gorakhpur', 'Gaya', 'Deoria', 'Ballia'];
             if (bhojpuriCities.includes(city)) setLanguage(normalizeLanguage('bho'));
             else setLanguage(normalizeLanguage('hi'));
          } else setLanguage(normalizeLanguage('en'));
        }
      } catch (e) {
        console.warn("Auto-detect failed, using default EN", e);
      }
    };

    initLanguage();
  }, []);

  const changeLanguage = (lang: Language) => {
    const normalized = normalizeLanguage(lang);
    setLanguage(normalized);
    localStorage.setItem('Yantravani_lang', normalized);
    document.documentElement.dir = normalized === 'ur' ? 'rtl' : 'ltr';
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    try {
      const currentDict = translations[language] || translations['en'];
      let translation = currentDict[key] || translations['en'][key] || key;

      if (variables) {
        Object.entries(variables).forEach(([name, value]) => {
          translation = translation.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
        });
      }
      return translation;
    } catch (e) {
      return translations['en'][key] || key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      <div className={language === 'ur' ? 'font-urdu' : ''} dir={language === 'ur' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
