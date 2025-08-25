// Утилиты для работы с переводами

/**
 * Проверяет, есть ли перевод для указанного ключа
 */
export const hasTranslation = (key: string, namespace: string = 'translation'): boolean => {
  try {
    const i18n = require('i18next');
    return i18n.exists(key, { ns: namespace });
  } catch {
    return false;
  }
};

/**
 * Получает все ключи переводов для указанного языка
 */
export const getTranslationKeys = (language: string, namespace: string = 'translation'): string[] => {
  try {
    const i18n = require('i18next');
    const resources = i18n.getResourceBundle(language, namespace);
    return Object.keys(resources || {});
  } catch {
    return [];
  }
};

/**
 * Добавляет новый перевод в runtime (для разработки)
 */
export const addTranslation = (
  language: string, 
  key: string, 
  value: string, 
  namespace: string = 'translation'
): void => {
  try {
    const i18n = require('i18next');
    i18n.addResource(language, namespace, key, value);
  } catch (error) {
    console.warn('Failed to add translation:', error);
  }
};

/**
 * Получает перевод с fallback
 */
export const getTranslationWithFallback = (
  key: string, 
  fallback: string, 
  namespace: string = 'translation'
): string => {
  try {
    const i18n = require('i18next');
    const translation = i18n.t(key, { ns: namespace });
    return translation === key ? fallback : translation;
  } catch {
    return fallback;
  }
};

/**
 * Создает функцию для перевода с параметрами
 */
export const createTranslationFunction = (baseKey: string) => {
  return (params?: Record<string, any>) => {
    try {
      const i18n = require('i18next');
      return i18n.t(baseKey, params);
    } catch {
      return baseKey;
    }
  };
};

/**
 * Утилита для создания типизированных ключей переводов
 */
export const createTranslationKey = <T extends string>(key: T): T => key;

/**
 * Проверяет, поддерживается ли язык
 */
export const isLanguageSupported = (language: string): boolean => {
  const supportedLanguages = ['ru', 'zh'];
  return supportedLanguages.includes(language);
};

/**
 * Получает название языка для отображения
 */
export const getLanguageDisplayName = (language: string): string => {
  const languageNames: Record<string, string> = {
    ru: 'Русский',
    zh: '中文',
    en: 'English',
  };
  return languageNames[language] || language;
};

/**
 * Утилита для создания структуры переводов
 */
export const createTranslationStructure = <T extends Record<string, any>>(structure: T): T => {
  return structure;
};

/**
 * Валидатор переводов - проверяет, что все ключи присутствуют
 */
export const validateTranslations = (
  translations: Record<string, any>, 
  requiredKeys: string[]
): { missing: string[]; valid: boolean } => {
  const missing: string[] = [];
  
  for (const key of requiredKeys) {
    if (!translations[key]) {
      missing.push(key);
    }
  }
  
  return {
    missing,
    valid: missing.length === 0
  };
};

/**
 * Утилита для глубокого слияния переводов
 */
export const mergeTranslations = (
  target: Record<string, any>, 
  source: Record<string, any>
): Record<string, any> => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = mergeTranslations(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
};
