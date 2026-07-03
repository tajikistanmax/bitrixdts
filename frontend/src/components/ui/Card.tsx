import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const paddingMap: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  hover = false,
  padding = 'md',
  className = '',
  children,
  ...props
}) => (
  <div className={`card ${hover ? 'card-hover' : ''} ${paddingMap[padding]} ${className}`} {...props}>
    {children}
  </div>
);

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, icon, className = '' }) => (
  <div className={`flex items-center justify-between gap-3 mb-4 ${className}`}>
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && <span className="text-primary-500 [&>svg]:w-5 [&>svg]:h-5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-ink-500 truncate">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export default Card;
