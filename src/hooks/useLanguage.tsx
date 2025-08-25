import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language;
  const isRussian = currentLanguage === 'ru';
  const isChinese = currentLanguage === 'zh';

  const changeLanguage = useCallback((language: 'ru' | 'zh') => {
    i18n.changeLanguage(language);
  }, [i18n]);

  const toggleLanguage = useCallback(() => {
    const newLanguage = currentLanguage === 'ru' ? 'zh' : 'ru';
    changeLanguage(newLanguage);
  }, [currentLanguage, changeLanguage]);

  return {
    currentLanguage,
    isRussian,
    isChinese,
    changeLanguage,
    toggleLanguage,
    t
  };
};
