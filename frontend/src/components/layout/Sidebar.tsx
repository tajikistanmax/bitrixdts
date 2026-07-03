import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { navigationGroups } from '../../config/navigation';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navigationGroups.map((g) => [g.name, g.defaultOpen ?? false]))
  );

  return (
    <aside className="h-full w-[264px] bg-nav-900 text-white flex flex-col select-none">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-nav-border shrink-0">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/40">
            <span className="text-[11px] font-extrabold tracking-tight">DTS</span>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-[15px] text-white">CMR-DTS</div>
            <div className="text-[10px] text-ink-400 -mt-0.5">{t('brand.tagline')}</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        {navigationGroups.map((group) => {
          const isOpen = open[group.name];
          return (
            <div key={group.name}>
              <button
                onClick={() => setOpen((s) => ({ ...s, [group.name]: !s[group.name] }))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-200 transition-colors"
              >
                <span>{t(`nav.groups.${group.key}`, group.name)}</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-0.5 pb-1">
                  {group.items.map((item) => {
                    const active = isActive(location.pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onNavigate}
                        className={`group flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13.5px] transition-all duration-150 ${
                          active
                            ? 'bg-primary-600 text-white font-medium shadow-sm shadow-primary-950/50'
                            : 'text-ink-300 hover:bg-nav-hover hover:text-white'
                        }`}
                      >
                        <item.icon
                          className={`w-[18px] h-[18px] shrink-0 ${
                            active ? 'text-white' : 'text-ink-400 group-hover:text-ink-200'
                          }`}
                        />
                        <span className="truncate">{t(`nav.items.${item.key}`, item.name)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-nav-border p-2.5 shrink-0">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13.5px] transition-colors ${
            isActive(location.pathname, '/settings')
              ? 'bg-nav-hover text-white'
              : 'text-ink-300 hover:bg-nav-hover hover:text-white'
          }`}
        >
          <Cog6ToothIcon className="w-[18px] h-[18px]" />
          <span>{t('nav.items.settings')}</span>
        </Link>
      </div>
    </aside>
  );
}
