import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт файлов переводов
import ruTranslations from './locales/ru.json';
import zhTranslations from './locales/zh.json';

const resources = {
  ru: {
    translation: ruTranslations
  },
  zh: {
    translation: zhTranslations
  }
};

i18n
  // Определение языка браузера
  .use(LanguageDetector)
  // Интеграция с React
  .use(initReactI18next)
  // Инициализация i18next
  .init({
    resources,
    fallbackLng: 'ru', // Язык по умолчанию
    debug: process.env.NODE_ENV === 'development',

    // Настройки определения языка
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Настройки интерполяции
    interpolation: {
      escapeValue: false, // React уже экранирует значения
    },

    // Настройки загрузки
    load: 'languageOnly',

    // Поддерживаемые языки
    supportedLngs: ['ru', 'zh'],

    // Настройки для китайского языка
    nonExplicitSupportedLngs: true,
  });

export default i18n;
