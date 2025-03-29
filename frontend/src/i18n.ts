import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import translationEN from './locales/en/translation.json';
import translationTR from './locales/tr/translation.json';
import translationDE from './locales/de/translation.json';
import translationES from './locales/es/translation.json';

// Resources for all languages
const resources = {
  en: {
    translation: translationEN
  },
  tr: {
    translation: translationTR
  },
  de: {
    translation: translationDE
  },
  es: {
    translation: translationES
  }
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.MODE === 'development',
    
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },

    // Default namespace used
    defaultNS: 'translation',
    
    // Save user's language preference in localStorage
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n; 