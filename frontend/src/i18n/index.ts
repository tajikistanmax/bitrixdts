import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru';
import tg from './locales/tg';
import en from './locales/en';

export const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'tg', label: 'Тоҷикӣ' },
  { code: 'en', label: 'English' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'lang';

function getSavedLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved as LanguageCode;
  } catch {
    // localStorage недоступен (SSR/тесты) — используем язык по умолчанию
  }
  return 'ru';
}

// Русский — язык по умолчанию; выбор сохраняется в localStorage.
i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    tg: { translation: tg },
    en: { translation: en },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export function setLanguage(code: LanguageCode): void {
  i18n.changeLanguage(code);
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
  document.documentElement.lang = code;
}

document.documentElement.lang = i18n.language;

export default i18n;
