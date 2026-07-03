import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  tabs?: ReactNode;
}

export default function PageHeader({ title, subtitle, icon, action, tabs }: PageHeaderProps) {
  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-ink-900 dark:text-ink-50 truncate">{title}</h1>
              {subtitle && <p className="text-sm text-ink-500 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
        {tabs && <div className="mt-3">{tabs}</div>}
      </div>
    </header>
  );
}
