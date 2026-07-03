import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { aiService, type AiMessage } from '../services/ai.service';
import { useAuthStore } from '../store/auth.store';

export default function AIAssistant() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const suggestions = [t('ai.s1'), t('ai.s2'), t('ai.s3'), t('ai.s4')];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError('');
    setInput('');
    const next: AiMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setLoading(true);
    try {
      const { reply } = await aiService.chat(next);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || t('ai.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Плавающая кнопка */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-13 h-13 p-3.5 rounded-2xl bg-gradient-to-br from-violet-600 to-primary-500 text-white shadow-lg shadow-primary-600/40 hover:scale-105 active:scale-95 transition-transform"
          aria-label={t('ai.open')}
          title={t('ai.open')}
        >
          <SparklesIcon className="w-6 h-6" />
        </button>
      )}

      {/* Панель чата */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-[400px] h-[560px] max-h-[calc(100vh-5rem)] flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl animate-scale-in overflow-hidden">
          {/* Шапка */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-primary-600 text-white shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">{t('ai.title')}</div>
              <div className="text-[11px] text-white/70">{t('ai.subtitle')}</div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(''); }}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                aria-label={t('ai.clear')}
                title={t('ai.clear')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              aria-label={t('common.close')}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-ink-600 dark:text-ink-300">
                  {t('ai.greeting', { name: user?.fullName ? `, ${user.fullName.split(' ')[0]}` : '' })}
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[13px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-ink-700 dark:text-ink-200 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-[var(--surface-muted)] border border-[var(--border)] text-ink-800 dark:text-ink-100 rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--surface-muted)] border border-[var(--border)] flex gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce"
                      style={{ animationDelay: `${d * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Ввод */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 p-3 border-t border-[var(--border)] shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              className="field flex-1"
              maxLength={8000}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-primary-500 text-white disabled:opacity-40 transition-opacity shrink-0"
              aria-label={t('common.send')}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
