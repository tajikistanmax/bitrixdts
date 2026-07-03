import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import {
  EnvelopeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

type FormData = { email: string };

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      setLoading(true);
      const result = await authService.forgotPassword(data.email);
      setSent(true);
      if (result?.resetUrl) setDevResetUrl(result.resetUrl); // только в dev-режиме backend возвращает ссылку
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.forgotError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white bg-[#0a1020] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[34rem] h-[34rem] rounded-full bg-primary-600/25 blur-[120px]" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-2xl shadow-black/40 p-8 animate-scale-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/40">
          <KeyIcon className="w-6 h-6" />
        </div>

        <h1 className="mt-5 text-2xl font-bold">{t('auth.forgotTitle')}</h1>
        <p className="mt-1.5 text-sm text-white/55">{t('auth.forgotSubtitle')}</p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
              {t('auth.forgotSent')}
            </div>
            {devResetUrl && (
              <a
                href={devResetUrl}
                className="block truncate rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-primary-300 hover:bg-white/[0.08]"
              >
                Dev-ссылка: {devResetUrl}
              </a>
            )}
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2.5 rounded-xl text-sm animate-slide-up">
                <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            <div>
              <div className="relative">
                <EnvelopeIcon className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  {...register('email', { required: t('auth.emailRequired') })}
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-primary-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-primary-500/25"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-primary-500 hover:from-violet-500 hover:to-primary-400 shadow-lg shadow-primary-600/40 transition-all disabled:opacity-60"
            >
              {loading ? t('auth.forgotSubmitting') : t('auth.forgotSubmit')}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
