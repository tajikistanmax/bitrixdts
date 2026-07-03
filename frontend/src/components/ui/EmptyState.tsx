import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
    <div className="w-14 h-14 rounded-2xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center text-ink-400 mb-4 [&>svg]:w-7 [&>svg]:h-7">
      {icon || <InboxIcon />}
    </div>
    <h3 className="text-base font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
    {description && <p className="mt-1 text-sm text-ink-500 max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
