'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'TRY' | 'USD' | 'EUR';
export type Language = 'tr' | 'en';

interface SettingsContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  locale: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getLocaleFromLanguage = (lang: Language): string => {
    switch (lang) {
        case 'en': return 'en-US';
        case 'tr': return 'tr-TR';
        default: return 'tr-TR';
    }
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>('TRY');
  const [language, setLanguageState] = useState<Language>('tr');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedCurrency = localStorage.getItem('app-currency') as Currency;
    const storedLanguage = localStorage.getItem('app-language') as Language;

    if (storedCurrency) {
      setCurrencyState(storedCurrency);
    }
    if (storedLanguage) {
      setLanguageState(storedLanguage);
    }
    setIsMounted(true);
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-currency', newCurrency);
    }
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', newLanguage);
    }
  };

  if (!isMounted) {
    return null; // or a loading spinner
  }

  const locale = getLocaleFromLanguage(language);

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, language, setLanguage, locale }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
