/**
 * Internationalization module
 * Centralizes all translations and provides language utilities
 */

import en from './en.js';
import es from './es.js';
import fr from './fr.js';
import pt from './pt.js';
import zh from './zh.js';
import hi from './hi.js';
import ar from './ar.js';

export const translations = {
  en,
  es,
  fr,
  pt,
  zh,
  hi,
  ar,
};

export const languages = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'zh', label: '中文', name: 'Chinese' },
  { code: 'hi', label: 'हिं', name: 'Hindi' },
  { code: 'ar', label: 'عر', name: 'Arabic' },
];

/**
 * Get translations for a language, with English fallback
 * @param {string} langCode - Language code (en, es, fr, etc.)
 * @returns {Object} - Merged translations with English fallbacks
 */
export const getTranslations = (langCode) => {
  const langTranslations = translations[langCode] || {};
  // Merge with English as fallback for missing keys
  return { ...en, ...langTranslations };
};

/**
 * Get loading messages for a language
 * @param {string} langCode - Language code
 * @returns {Object} - Loading messages object with url, photo, youtube arrays
 */
export const getLoadingMessages = (langCode) => {
  const lang = translations[langCode];
  const enMessages = en.loadingMessages;

  if (!lang?.loadingMessages) {
    return enMessages;
  }

  return {
    url: lang.loadingMessages.url || enMessages.url,
    photo: lang.loadingMessages.photo || enMessages.photo,
    youtube: lang.loadingMessages.youtube || enMessages.youtube,
  };
};

/**
 * Get language name by code
 * @param {string} code - Language code
 * @returns {string} - Language name
 */
export const getLanguageName = (code) => {
  const lang = languages.find(l => l.code === code);
  return lang?.name || code;
};

export default translations;
