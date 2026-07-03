import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-9 h-9' };

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', label }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
    <svg className={`animate-spin text-primary-500 ${sizeMap[size]}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    {label && <span className="text-sm text-ink-500">{label}</span>}
  </div>
);

/** Полноэкранная (по контейнеру) загрузка */
export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Загрузка…' }) => (
  <div className="flex items-center justify-center py-20">
    <Spinner size="lg" label={label} />
  </div>
);

export default Spinner;
