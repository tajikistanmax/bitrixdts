import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import type { LoginRequest } from '../types/auth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Статические данные витрины (переводимые строки — через t())        */
/* ------------------------------------------------------------------ */

const donutSegments = [
  { labelKey: 'legendInProgress', value: 28, color: '#3366ff' },
  { labelKey: 'legendPlanning', value: 14, color: '#8b5cf6' },
  { labelKey: 'legendPaused', value: 8, color: '#f59e0b' },
  { labelKey: 'legendDone', value: 8, color: '#10b981' },
];
const donutTotal = donutSegments.reduce((s, x) => s + x.value, 0);

/* Июль 2026, недели с понедельника: 1 июля — среда */
const calendarWeeks: (number | null)[][] = [
  [null, null, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30, 31, null, null],
];
const today = new Date().getDate();

/* ------------------------------------------------------------------ */
/*  Вспомогательные элементы                                           */
/* ------------------------------------------------------------------ */

function GlassCard({ title, action, children, className = '' }: {
  title: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0e1729]/80 backdrop-blur-xl shadow-2xl shadow-black/40 ${className}`}>
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <span className="text-sm font-semibold text-white/90">{title}</span>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function Donut() {
  const { t } = useTranslation();
  const size = 120, stroke = 16, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let offset = 0;
  const totalLines = t('auth.showcase.totalProjects').split('<br/>');
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          {donutSegments.map((s) => {
            const len = (s.value / donutTotal) * c;
            const el = (
              <circle
                key={s.labelKey}
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={s.color} strokeWidth={stroke}
                strokeDasharray={`${len - 2} ${c - len + 2}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{donutTotal}</span>
          <span className="text-[10px] text-white/50 leading-tight text-center">
            {totalLines[0]}<br />{totalLines[1] ?? ''}
          </span>
        </div>
      </div>
      <ul className="space-y-1.5 min-w-0">
        {donutSegments.map((s) => (
          <li key={s.labelKey} className="flex items-center gap-2 text-xs text-white/70">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="truncate">{t(`auth.showcase.${s.labelKey}`)}</span>
            <span className="ml-auto pl-2 font-semibold text-white/90">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Страница входа                                                     */
/* ------------------------------------------------------------------ */

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [ssoHint, setSsoHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const demoTasks = [
    { title: t('auth.showcase.task1'), chip: t('auth.showcase.chipToday'), chipClass: 'bg-amber-500/20 text-amber-300' },
    { title: t('auth.showcase.task2'), chip: t('auth.showcase.chipToday'), chipClass: 'bg-amber-500/20 text-amber-300' },
    { title: t('auth.showcase.task3'), chip: t('auth.showcase.chipTomorrow'), chipClass: 'bg-sky-500/20 text-sky-300' },
    { title: t('auth.showcase.task4'), chip: t('auth.showcase.chipInProgress'), chipClass: 'bg-blue-500/20 text-blue-300' },
    { title: t('auth.showcase.task5'), chip: t('auth.showcase.chipInProgress'), chipClass: 'bg-blue-500/20 text-blue-300' },
  ];

  const chatMessages = [
    { name: t('auth.showcase.chatName1'), text: t('auth.showcase.chatMsg1'), time: '11:34', badge: 2 },
    { name: t('auth.showcase.chatName2'), text: t('auth.showcase.chatMsg2'), time: '11:30' },
    { name: t('auth.showcase.chatName3'), text: t('auth.showcase.chatMsg3'), time: '11:28' },
  ];

  const stats = [
    { value: '1 245', label: t('auth.showcase.statEmployees'), delta: t('auth.showcase.perWeek', { value: '+12' }), icon: UsersIcon, color: 'text-violet-500 bg-violet-500/10' },
    { value: '342', label: t('auth.showcase.statTasks'), delta: t('auth.showcase.perWeek', { value: '+28' }), icon: ClipboardDocumentCheckIcon, color: 'text-blue-500 bg-blue-500/10' },
    { value: '58', label: t('auth.showcase.statProjects'), delta: t('auth.showcase.perWeek', { value: '+5' }), icon: PresentationChartLineIcon, color: 'text-amber-500 bg-amber-500/10' },
    { value: '96%', label: t('auth.showcase.statKpi'), delta: t('auth.showcase.perWeek', { value: '+8%' }), icon: ChartBarIcon, color: 'text-emerald-500 bg-emerald-500/10' },
    { value: '24 500', label: t('auth.showcase.statDocs'), delta: t('auth.showcase.perWeek', { value: '+320' }), icon: DocumentTextIcon, color: 'text-sky-500 bg-sky-500/10' },
  ];

  const features = [
    { label: t('auth.showcase.featTasks'), icon: ClipboardDocumentCheckIcon, color: 'text-violet-500 bg-violet-500/10' },
    { label: t('auth.showcase.featHr'), icon: UsersIcon, color: 'text-blue-500 bg-blue-500/10' },
    { label: t('auth.showcase.featDocs'), icon: DocumentTextIcon, color: 'text-amber-500 bg-amber-500/10' },
    { label: t('auth.showcase.featCalendar'), icon: CalendarDaysIcon, color: 'text-rose-500 bg-rose-500/10' },
    { label: t('auth.showcase.featChats'), icon: ChatBubbleLeftRightIcon, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: t('auth.showcase.featReports'), icon: ChartBarIcon, color: 'text-sky-500 bg-sky-500/10' },
    { label: t('auth.showcase.featKpi'), icon: PresentationChartLineIcon, color: 'text-fuchsia-500 bg-fuchsia-500/10' },
    { label: t('auth.showcase.featAi'), icon: SparklesIcon, color: 'text-teal-500 bg-teal-500/10' },
  ];

  const weekdays = t('auth.showcase.weekdays').split(' ');

  const onSubmit = async (data: LoginRequest) => {
    try {
      setError('');
      setLoading(true);
      const response = await authService.login(data);
      setAuth(response.user, response.tokens);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const onSso = (provider: string) => {
    setSsoHint(t('auth.ssoHint', { provider }));
  };

  return (
    <div className="min-h-screen flex text-white bg-[#0a1020] relative overflow-hidden">
      {/* Фоновые свечения */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-primary-600/25 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-48 left-1/3 w-[30rem] h-[30rem] rounded-full bg-teal-500/15 blur-[120px]" />
      {/* Сетка */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* ===================== Левая панель — форма ===================== */}
      <div className="relative z-10 w-full lg:w-[440px] xl:w-[480px] shrink-0 flex flex-col justify-between px-8 sm:px-12 py-8 min-h-screen">
        {/* Логотип */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-primary-600 flex items-center justify-center font-extrabold text-lg shadow-lg shadow-primary-600/40">
            D
          </div>
          <div className="text-xl font-bold tracking-tight">
            CMR<span className="text-primary-400">-DTS</span>
          </div>
        </div>

        {/* Форма */}
        <div className="py-10">
          <h1 className="text-[28px] xl:text-[32px] font-bold leading-tight">
            {t('auth.headingStart')}
            <span className="bg-gradient-to-r from-violet-400 to-primary-400 bg-clip-text text-transparent">
              {t('auth.headingAccent')}
            </span>
            {t('auth.headingEnd')}
          </h1>
          <p className="mt-3 text-sm text-white/55 max-w-sm">{t('auth.subtitle')}</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2.5 rounded-xl text-sm animate-slide-up">
                <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <div className="relative">
                <UserIcon className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  {...register('email', { required: t('auth.loginRequired') })}
                  type="email"
                  placeholder={t('auth.loginPlaceholder')}
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-primary-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-primary-500/25"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <div className="relative">
                <LockClosedIcon className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  {...register('password', { required: t('auth.passwordRequired') })}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-white/60 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-primary-500 bg-transparent" />
                {t('auth.remember')}
              </label>
              <Link to="/forgot-password" className="text-white/60 hover:text-primary-300 transition-colors">
                {t('auth.forgot')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-primary-600 to-primary-500 hover:from-violet-500 hover:to-primary-400 shadow-lg shadow-primary-600/40 transition-all disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? t('auth.submitting') : t('auth.submit')}
              {!loading && <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* SSO */}
          <div className="mt-7">
            <div className="flex items-center gap-4 text-xs text-white/40">
              <div className="h-px flex-1 bg-white/10" />
              {t('auth.orVia')}
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onSso('Google')}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-sm text-white/80 hover:bg-white/[0.1] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => onSso('Microsoft')}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-sm text-white/80 hover:bg-white/[0.1] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
                  <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
                  <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
                  <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
                </svg>
                Microsoft
              </button>
              <button
                type="button"
                onClick={() => onSso('SSO')}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-sm text-white/80 hover:bg-white/[0.1] transition-colors"
              >
                <ShieldCheckIcon className="w-4 h-4 text-primary-400" />
                SSO
              </button>
            </div>
            {ssoHint && <p className="mt-3 text-xs text-primary-300/80 animate-fade-in">{ssoHint}</p>}
          </div>

          {import.meta.env.DEV && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-xs text-white/40">
              {t('auth.testAccount')} <span className="font-mono text-white/65">admin@example.com / admin123</span>
            </div>
          )}
        </div>

        {/* Низ панели */}
        <div className="flex items-center justify-between text-xs text-white/40">
          <LanguageSwitcher variant="dark" />
          <span>{t('brand.copyright', { year: new Date().getFullYear() })}</span>
        </div>
      </div>

      {/* ===================== Правая панель — витрина на фото офиса ===================== */}
      <div className="relative z-10 hidden lg:flex flex-1 flex-col justify-between gap-5 p-8 xl:p-12 overflow-hidden">
        {/* Фото офиса + тонирование под бренд */}
        <img
          src="/login-office.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover brightness-110 saturate-110"
        />
        <div className="absolute inset-0 bg-[#16305e]/25" />
        <div className="absolute inset-y-0 left-0 w-56 bg-gradient-to-r from-[#0a1020] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0a1020]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a1020]/60 to-transparent" />

        {/* Виджеты */}
        <div className="relative grid grid-cols-3 gap-5 animate-slide-up">
          <GlassCard
            title={t('auth.showcase.myTasks')}
            action={<PlusIcon className="w-4 h-4 text-white/50" />}
          >
            <ul className="space-y-2.5">
              {demoTasks.map((task) => (
                <li key={task.title} className="flex items-center gap-2.5 text-[13px]">
                  <CheckCircleIcon className="w-4 h-4 text-white/30 shrink-0" />
                  <span className="text-white/80 truncate">{task.title}</span>
                  <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium ${task.chipClass}`}>{task.chip}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard title={t('auth.showcase.projects')}>
            <Donut />
          </GlassCard>

          <GlassCard title={t('auth.showcase.calendar')} action={<span className="text-xs text-white/50">{t('auth.showcase.month')}</span>}>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-white/40 mb-1">
              {weekdays.map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="space-y-1">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1 text-center text-[12px]">
                  {week.map((d, di) => (
                    <span
                      key={di}
                      className={`py-1 rounded-lg ${
                        d === null
                          ? ''
                          : d === today
                            ? 'bg-primary-500 text-white font-semibold shadow-md shadow-primary-500/50'
                            : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {d ?? ''}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Командный чат — плавает справа на фото, как в референсе */}
        <div className="relative flex justify-end animate-slide-up" style={{ animationDelay: '80ms' }}>
          <div className="w-[340px]">
            <GlassCard title={t('auth.showcase.teamChat')}>
              <ul className="space-y-3">
                {chatMessages.map((m) => (
                  <li key={m.name} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-primary-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {m.name.split(' ').map((w) => w[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white/85 truncate">{m.name}</span>
                        <span className="text-[10px] text-white/40 shrink-0">{m.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/55 truncate">{m.text}</span>
                        {m.badge && (
                          <span className="ml-auto shrink-0 w-[18px] h-[18px] rounded-full bg-primary-500 text-[10px] font-bold flex items-center justify-center">
                            {m.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>

        {/* Светлая полоса: статистика + модули + безопасность */}
        <div className="relative rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/40 px-6 py-5 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="grid grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="w-[22px] h-[22px]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold leading-tight text-ink-900">{s.value}</div>
                  <div className="text-[11px] text-ink-500 truncate">{s.label}</div>
                  <div className="text-[11px] text-emerald-600">{s.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="my-4 h-px bg-ink-200" />

          <div className="grid grid-cols-8 gap-3">
            {features.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 text-center">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.color}`}>
                  <f.icon className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[11px] text-ink-600 leading-tight">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
            {t('auth.security')}
          </div>
        </div>
      </div>
    </div>
  );
}
