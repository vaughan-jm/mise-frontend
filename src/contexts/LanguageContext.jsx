import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations, languages, getTranslations, getLoadingMessages, getLanguageName } from '../i18n/index.js';

const STORAGE_KEY = 'mise_language';
const DEFAULT_LANGUAGE = 'en';

const LanguageContext = createContext(null);

/**
 * Get initial language from localStorage or default
 */
const getInitialLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  // Memoize translations to prevent unnecessary re-renders
  const t = useMemo(() => getTranslations(language), [language]);
  const loadingMessages = useMemo(() => getLoadingMessages(language), [language]);

  const setLanguage = useCallback((code) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // localStorage disabled
    }
  }, []);

  const value = {
    language,
    setLanguage,
    t,
    loadingMessages,
    languages,
    getLanguageName,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
