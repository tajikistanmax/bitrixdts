import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cog6ToothIcon, MoonIcon, SunIcon, UserIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/auth.store';
import { employeeService } from '../services/employee.service';
import { authService } from '../services/auth.service';
import { PageHeader, Card, CardHeader, Avatar, Input, Button, useToast } from '../components/ui';
import { LANGUAGES, setLanguage, type LanguageCode } from '../i18n';

function useThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, setDark };
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { dark, setDark } = useThemeToggle();
  const toast = useToast();

  // — Профиль —
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState((user as any)?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const saveProfile = async () => {
    if (!user?.id) return;
    if (!fullName.trim()) {
      toast.error(t('settings.fullNameRequired'));
      return;
    }
    try {
      setSavingProfile(true);
      await employeeService.update(user.id, { fullName: fullName.trim(), phone: phone.trim() || undefined } as any);
      updateUser({ fullName: fullName.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) } as any);
      toast.success(t('settings.saved'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.saveError'));
    } finally {
      setSavingProfile(false);
    }
  };

  // — Смена пароля —
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const changePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error(t('settings.fillBoth'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('settings.minLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.mismatch'));
      return;
    }
    try {
      setSavingPassword(true);
      await authService.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings.changed'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.changeError'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} icon={<Cog6ToothIcon />} />

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Профиль */}
        <Card>
          <CardHeader title={t('settings.profile')} icon={<UserIcon />} />
          <div className="flex items-center gap-4 mb-5">
            <Avatar name={user?.fullName} size="xl" />
            <div>
              <p className="font-semibold text-ink-900 dark:text-ink-50">{user?.fullName}</p>
              <p className="text-sm text-ink-500">{user?.position || t('common.employee')}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={t('settings.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label={t('settings.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992 ..." />
            <Input label={t('settings.email')} value={user?.email ?? ''} disabled title={t('settings.emailHint')} />
            <Input label={t('settings.position')} value={user?.position ?? ''} disabled title={t('settings.positionHint')} />
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </Card>

        {/* Безопасность */}
        <Card>
          <CardHeader title={t('settings.passwordTitle')} icon={<LockClosedIcon />} />
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label={t('settings.currentPassword')} type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" />
            <Input label={t('settings.newPassword')} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            <Input label={t('settings.repeatPassword')} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={changePassword} disabled={savingPassword}>
              {savingPassword ? t('common.saving') : t('settings.change')}
            </Button>
          </div>
        </Card>

        {/* Язык */}
        <Card>
          <CardHeader title={t('settings.language')} icon={<GlobeAltIcon />} />
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-ink-500">{t('settings.languageHint')}</p>
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as LanguageCode)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-[var(--border)] text-ink-700 dark:text-ink-200 hover:border-primary-400'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Оформление */}
        <Card>
          <CardHeader title={t('settings.appearance')} icon={dark ? <MoonIcon /> : <SunIcon />} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{t('settings.darkTheme')}</p>
              <p className="text-xs text-ink-500">{t('settings.darkThemeHint')}</p>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className={`relative w-12 h-6 rounded-full transition-colors ${dark ? 'bg-primary-600' : 'bg-ink-300'}`}
              aria-label={t('settings.toggleTheme')}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
