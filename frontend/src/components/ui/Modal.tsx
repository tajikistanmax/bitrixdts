import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${sizeClasses[size]} animate-scale-in rounded-xl bg-[var(--surface)] shadow-xl border border-[var(--border)]`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
                {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-ink-400 hover:text-ink-700 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg p-1 transition-colors"
                aria-label="Закрыть"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="px-5 py-4">{children}</div>
          {footer && (
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)] rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
