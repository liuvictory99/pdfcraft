import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from './en-US.json';
import zhCN from './zh-CN.json';

const getDefaultLanguage = (): string => {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  return nav.startsWith('zh') ? 'zh-CN' : 'en-US';
};

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: getDefaultLanguage(),
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
