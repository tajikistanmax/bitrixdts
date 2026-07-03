import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { GlobeAltIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage, type LanguageCode } from '../i18n';

/**
 * Переключатель языка интерфейса.
 * variant="dark" — для тёмных экранов (вход), variant="surface" — для обычных страниц.
 */
export default function LanguageSwitcher({ variant = 'surface' }: { variant?: 'dark' | 'surface' }) {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const buttonClass =
    variant === 'dark'
      ? 'flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors'
      : 'flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-100 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors';

  return (
    <Menu as="div" className="relative">
      <Menu.Button className={buttonClass}>
        <GlobeAltIcon className="w-4 h-4" />
        {current.label}
        <ChevronDownIcon className="w-3 h-3" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute bottom-full mb-2 left-0 w-40 origin-bottom-left rounded-xl border shadow-lg focus:outline-none z-50 overflow-hidden py-1 ${
            variant === 'dark'
              ? 'bg-[#131c30] border-white/10 text-white'
              : 'bg-[var(--surface)] border-[var(--border)]'
          }`}
        >
          {LANGUAGES.map((lang) => (
            <Menu.Item key={lang.code}>
              {({ active }) => (
                <button
                  onClick={() => setLanguage(lang.code as LanguageCode)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${
                    variant === 'dark'
                      ? `text-white/80 ${active ? 'bg-white/10' : ''}`
                      : `text-ink-700 dark:text-ink-200 ${active ? 'bg-[var(--surface-muted)]' : ''}`
                  }`}
                >
                  {lang.label}
                  {lang.code === i18n.language && <CheckIcon className="w-4 h-4 text-primary-400" />}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
