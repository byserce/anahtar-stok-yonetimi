'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSettings } from './settings-context';
import tr from '@/locales/tr.json';
import en from '@/locales/en.json';

type Translations = typeof tr;
const translations: Record<string, Translations> = { tr, en };

interface TranslationContextType {
  t: (key: keyof Translations, replacements?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useSettings();
  const currentTranslations = translations[language] || translations.tr;

  const t = useMemo(() => (key: keyof Translations, replacements?: Record<string, string | number>): string => {
    let translation = currentTranslations[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
      });
    }
    return translation;
  }, [currentTranslations]);

  return (
    <TranslationContext.Provider value={{ t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
