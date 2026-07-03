import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

/** Ловит ошибки рендера и показывает дружелюбный экран вместо белой страницы. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // В проде сюда можно подключить Sentry/лог-сервис.
    console.error('UI ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--app-bg)]">
        <div className="max-w-md w-full text-center card p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-50">Что-то пошло не так</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Произошла непредвиденная ошибка. Мы уже записали её. Попробуйте перезагрузить страницу.
          </p>
          {this.state.error?.message && (
            <pre className="mt-4 text-left text-xs text-ink-400 bg-[var(--surface-muted)] rounded-lg p-3 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
