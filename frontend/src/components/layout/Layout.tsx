import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth.store';
import { NotificationsDropdown } from '../NotificationsDropdown';
import { allNavItems, getNavItem } from '../../config/navigation';
import { Avatar } from '../ui/Avatar';
import Sidebar from './Sidebar';
import AIAssistant from '../AIAssistant';

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

function GlobalSearch() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return allNavItems
      .filter((i) => {
        const translated = t(`nav.items.${i.key}`, i.name).toLowerCase();
        return translated.includes(s) || i.name.toLowerCase().includes(s);
      })
      .slice(0, 7);
  }, [q, t]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (href: string) => {
    navigate(href);
    setQ('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0].href);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={t('layout.search')}
        className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[var(--surface-muted)] border border-transparent hover:border-[var(--border)] focus:border-primary-500 focus:bg-[var(--surface)] focus:outline-none focus:shadow-[0_0_0_3px_var(--color-primary-100)] transition-all"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg z-50 animate-scale-in">
          {results.map((r) => (
            <button
              key={r.href}
              onClick={() => go(r.href)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-[var(--surface-muted)] transition-colors"
            >
              <r.icon className="w-4 h-4 text-ink-400" />
              {t(`nav.items.${r.key}`, r.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItem = getNavItem(location.pathname);
  const pageTitle = navItem ? t(`nav.items.${navItem.key}`, navItem.name) : 'CMR-DTS';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-[var(--app-bg)] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-slide-up">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center gap-3 px-3 sm:px-5 shrink-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-ink-500 hover:bg-[var(--surface-muted)]"
            aria-label={t('layout.menu')}
          >
            {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>

          <h2 className="hidden md:block font-semibold text-ink-800 dark:text-ink-100 shrink-0 min-w-[140px]">
            {pageTitle}
          </h2>

          <div className="flex-1 flex justify-center px-2">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-ink-500 hover:bg-[var(--surface-muted)] transition-colors"
              aria-label={t('layout.theme')}
            >
              {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            <NotificationsDropdown />

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-[var(--surface-muted)] transition-colors">
                <Avatar name={user?.fullName} size="sm" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-200 hidden lg:block max-w-[140px] truncate">
                  {user?.fullName || t('common.user')}
                </span>
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
                <Menu.Items className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg focus:outline-none z-50 overflow-hidden">
                  <div className="p-3 border-b border-[var(--border)] flex items-center gap-3">
                    <Avatar name={user?.fullName} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">{user?.fullName}</p>
                      <p className="text-xs text-ink-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <Menu.Item>
                      {({ active }) => (
                        <Link to="/settings" className={`${active ? 'bg-[var(--surface-muted)]' : ''} flex items-center gap-3 px-3 py-2 text-sm text-ink-700 dark:text-ink-200 rounded-lg`}>
                          <UserIcon className="w-4 h-4 text-ink-400" /> {t('layout.profile')}
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link to="/settings" className={`${active ? 'bg-[var(--surface-muted)]' : ''} flex items-center gap-3 px-3 py-2 text-sm text-ink-700 dark:text-ink-200 rounded-lg`}>
                          <Cog6ToothIcon className="w-4 h-4 text-ink-400" /> {t('layout.settings')}
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="p-1.5 border-t border-[var(--border)]">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={handleLogout} className={`${active ? 'bg-red-50 dark:bg-red-900/20' : ''} flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 rounded-lg`}>
                          <ArrowRightOnRectangleIcon className="w-4 h-4" /> {t('layout.logout')}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      <AIAssistant />
    </div>
  );
}
