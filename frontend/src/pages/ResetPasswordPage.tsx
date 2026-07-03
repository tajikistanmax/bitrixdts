import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

type FormData = { password: string; confirm: string };

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      setLoading(true);
      await authService.resetPassword(token, data.password);
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white bg-[#0a1020] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[34rem] h-[34rem] rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-primary-600/25 blur-[120px]" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-2xl shadow-black/40 p-8 animate-scale-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/40">
          <ShieldCheckIcon className="w-6 h-6" />
        </div>

        <h1 className="mt-5 text-2xl font-bold">{t('auth.resetTitle')}</h1>
        <p className="mt-1.5 text-sm text-white/55">{t('auth.resetSubtitle')}</p>

        {!token ? (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
            {t('auth.resetNoToken')}
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
                <LockClosedIcon className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  {...register('password', {
                    required: t('auth.newPasswordRequired'),
                    minLength: { value: 8, message: t('auth.minLength') },
                  })}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-11 pr-11 py-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-primary-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-primary-500/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                  aria-label={showPass ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPass ? <EyeSlashIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <div className="relative">
                <LockClosedIcon className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  {...register('confirm', {
                    required: t('auth.repeatRequired'),
                    validate: (v) => v === watch('password') || t('auth.mismatch'),
                  })}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('auth.repeatPasswordPlaceholder')}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-primary-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-primary-500/25"
                />
              </div>
              {errors.confirm && <p className="text-red-400 text-xs mt-1.5">{errors.confirm.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-primary-500 hover:from-violet-500 hover:to-primary-400 shadow-lg shadow-primary-600/40 transition-all disabled:opacity-60"
            >
              {loading ? t('auth.resetSubmitting') : t('auth.resetSubmit')}
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
