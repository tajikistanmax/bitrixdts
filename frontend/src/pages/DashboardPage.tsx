import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service';
import { useAuthStore } from '../store/auth.store';
import { Card, CardHeader, Avatar, Badge, EmptyState } from '../components/ui';
import {
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BellIcon,
  CheckBadgeIcon,
  SunIcon,
  ArrowRightIcon,
  FolderOpenIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface DashTask { id: string; title: string; status: string; priority: string; dueDate?: string }
interface DashMeeting { id: string; title: string; startTime: string; endTime: string; location?: string }
interface DashVacation { id: string; type: string; startDate: string; endDate: string; status: string }

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  normal: 'bg-primary-400',
  low: 'bg-ink-300',
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '';
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

function StatCard({
  label, value, icon, tone, to,
}: { label: string; value: number | string; icon: React.ReactNode; tone: string; to: string }) {
  return (
    <Link to={to}>
      <Card hover padding="none" className="p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tone} [&>svg]:w-6 [&>svg]:h-6`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-ink-900 dark:text-ink-50 leading-none">{value}</div>
          <div className="text-xs text-ink-500 mt-1">{label}</div>
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-employee'],
    queryFn: () => dashboardService.getEmployeeDashboard(),
  });

  const tasks: DashTask[] = data?.tasks?.active ?? [];
  const overdue: number = data?.tasks?.overdue ?? 0;
  const meetings: DashMeeting[] = data?.meetings ?? [];
  const vacations: DashVacation[] = data?.vacations ?? [];
  const unread: number = data?.notifications?.unread ?? 0;
  const approvals: number = data?.documentsForApproval ?? 0;
  const firstName = user?.fullName?.split(' ')[1] || user?.fullName?.split(' ')[0] || 'коллега';

  const quickActions = [
    { name: 'Задачи', href: '/tasks', icon: <ClipboardDocumentListIcon />, tone: 'bg-primary-500' },
    { name: 'Мессенджер', href: '/chat', icon: <ChatBubbleLeftRightIcon />, tone: 'bg-emerald-500' },
    { name: 'Календарь', href: '/calendar', icon: <CalendarDaysIcon />, tone: 'bg-violet-500' },
    { name: 'Документы', href: '/documents', icon: <DocumentTextIcon />, tone: 'bg-orange-500' },
    { name: 'Диск', href: '/files', icon: <FolderOpenIcon />, tone: 'bg-sky-500' },
    { name: 'Сотрудники', href: '/employees', icon: <UsersIcon />, tone: 'bg-rose-500' },
  ];

  return (
    <div className="h-full overflow-auto">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-7">
          <h1 className="text-2xl font-bold">Здравствуйте, {firstName}! 👋</h1>
          <p className="text-primary-100 text-sm mt-1">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })} · Рабочее пространство CMR-DTS
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 -mt-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Активные задачи" value={isLoading ? '…' : tasks.length} to="/tasks" icon={<ClipboardDocumentListIcon />} tone="bg-primary-50 text-primary-600 dark:bg-primary-900/30" />
          <StatCard label="Просрочено" value={isLoading ? '…' : overdue} to="/tasks" icon={<ExclamationTriangleIcon />} tone="bg-red-50 text-red-600 dark:bg-red-900/30" />
          <StatCard label="На согласовании" value={isLoading ? '…' : approvals} to="/workflow" icon={<CheckBadgeIcon />} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/30" />
          <StatCard label="Уведомления" value={isLoading ? '…' : unread} to="/feed" icon={<BellIcon />} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick actions */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {quickActions.map((a) => (
                <Link key={a.name} to={a.href}>
                  <Card hover padding="none" className="p-3 flex flex-col items-center gap-2 text-center">
                    <div className={`w-11 h-11 rounded-xl ${a.tone} text-white flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5`}>
                      {a.icon}
                    </div>
                    <span className="text-xs font-medium text-ink-600 dark:text-ink-300">{a.name}</span>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Tasks */}
            <Card>
              <CardHeader
                title="Мои задачи"
                icon={<ClipboardDocumentListIcon />}
                action={<Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">Все <ArrowRightIcon className="w-3.5 h-3.5" /></Link>}
              />
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-ink-100 dark:bg-ink-800 animate-pulse" />)}</div>
              ) : tasks.length ? (
                <div className="space-y-1">
                  {tasks.slice(0, 6).map((t) => {
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
                    return (
                      <Link key={t.id} to="/tasks" className="flex items-center gap-3 p-2.5 rounded-lg row-hover">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[t.priority] || 'bg-ink-300'}`} />
                        <span className="text-sm text-ink-800 dark:text-ink-100 flex-1 truncate">{t.title}</span>
                        {t.dueDate && (
                          <Badge variant={isOverdue ? 'danger' : 'default'} size="sm">{fmtDate(t.dueDate)}</Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<ClipboardDocumentListIcon />} title="Нет активных задач" description="Все задачи выполнены — отличная работа!" />
              )}
            </Card>

            {/* Meetings */}
            <Card>
              <CardHeader
                title="Встречи сегодня"
                icon={<CalendarDaysIcon />}
                action={<Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">Календарь <ArrowRightIcon className="w-3.5 h-3.5" /></Link>}
              />
              {meetings.length ? (
                <div className="space-y-2">
                  {meetings.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                      <div className="w-9 h-9 rounded-lg bg-violet-500 text-white flex items-center justify-center">
                        <ClockIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-100 truncate">{m.title}</p>
                        {m.location && <p className="text-xs text-ink-500 truncate">{m.location}</p>}
                      </div>
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-300">{fmtTime(m.startTime)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<CalendarDaysIcon />} title="Встреч на сегодня нет" />
              )}
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Profile */}
            <Card className="text-center">
              <Avatar name={user?.fullName} size="xl" className="mx-auto mb-3" />
              <p className="font-semibold text-ink-900 dark:text-ink-50">{user?.fullName}</p>
              <p className="text-sm text-ink-500">{user?.position || 'Сотрудник'}</p>
              <Link to="/settings" className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-700">
                Профиль и настройки
              </Link>
            </Card>

            {/* Vacations */}
            <Card>
              <CardHeader title="Мои отпуска" icon={<SunIcon />} />
              {vacations.length ? (
                <div className="space-y-2">
                  {vacations.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <SunIcon className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-sm text-ink-700 dark:text-ink-200 flex-1">
                        {fmtDate(v.startDate)} — {fmtDate(v.endDate)}
                      </span>
                      <Badge variant={v.status === 'approved' ? 'success' : 'warning'} size="sm">
                        {v.status === 'approved' ? 'Одобрен' : 'План'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-400 py-3 text-center">Запланированных отпусков нет</p>
              )}
              <Link to="/vacations" className="mt-3 block text-center text-sm text-primary-600 hover:text-primary-700">
                Оформить отпуск
              </Link>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader title="Быстрый доступ" />
              <div className="space-y-1">
                {[
                  { name: 'Группы', href: '/workspaces', icon: <UsersIcon /> },
                  { name: 'Лента новостей', href: '/feed', icon: <ChatBubbleLeftRightIcon /> },
                  { name: 'Отчёты', href: '/reports', icon: <DocumentTextIcon /> },
                  { name: 'Служебные записки', href: '/memos', icon: <DocumentTextIcon /> },
                ].map((l) => (
                  <Link key={l.href} to={l.href} className="flex items-center gap-3 px-2.5 py-2 rounded-lg row-hover text-sm text-ink-600 dark:text-ink-300">
                    <span className="text-ink-400 [&>svg]:w-4 [&>svg]:h-4">{l.icon}</span>
                    {l.name}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
