'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import enDict from '@/lib/i18n/en.json';
import arDict from '@/lib/i18n/ar.json';

type Locale = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface I18nContextType {
  locale: Locale;
  direction: Direction;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
}

const dictionaries: Record<Locale, Record<string, string>> = {
  en: enDict,
  ar: arDict,
};

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  direction: 'ltr',
  t: (key) => key,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = (localStorage.getItem('notion_locale') as Locale) || 'en';
    setLocale(saved);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('notion_locale', newLocale);
    const dir: Direction = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', newLocale);
  };

  const t = (key: string): string => {
    const dict = dictionaries[locale];
    return dict[key] ?? key;
  };

  const direction: Direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, direction, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
