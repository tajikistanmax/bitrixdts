import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { timesheetService } from '../services/timesheet.service';
import { employeeService } from '../services/employee.service';
import type { Timesheet, TimesheetStats } from '../types/timesheet';
import {
  Button,
  Input,
  Modal,
  Badge,
  Card,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';

const statusLabels: Record<string, string> = {
  approved: 'Утверждён',
  pending: 'На рассмотрении',
  rejected: 'Отклонён',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

const monthKey = (d: string) => d.slice(0, 7); // YYYY-MM

export default function TimesheetPage() {
  const [period, setPeriod] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    hours: 0,
    description: '',
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => timesheetService.getAll(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  const { data: stats } = useQuery<TimesheetStats>({
    queryKey: ['timesheetStats'],
    queryFn: () => timesheetService.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: () => timesheetService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheetStats'] });
      setShowCreateModal(false);
      setFormData({ employeeId: '', date: '', hours: 0, description: '' });
      toast.success('Запись добавлена в табель');
    },
    onError: () => toast.error('Не удалось добавить запись'),
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp: any) => emp.id === employeeId);
    return employee?.fullName || employeeId;
  };

  // Доступные периоды (месяцы) из данных
  const periods = useMemo(() => {
    const keys = Array.from(new Set(timesheets.map((t: Timesheet) => monthKey(t.date))));
    keys.sort((a, b) => (a < b ? 1 : -1));
    return keys;
  }, [timesheets]);

  const filtered = useMemo(
    () =>
      timesheets.filter(
        (r: Timesheet) => period === 'all' || monthKey(r.date) === period
      ),
    [timesheets, period]
  );

  const periodHours = filtered.reduce((sum: number, r: Timesheet) => sum + r.hours, 0);

  const metrics = [
    {
      label: 'Всего часов',
      value: stats?.totalHours ?? periodHours,
      icon: <ClockIcon />,
      accent: 'text-primary-500 bg-primary-50 dark:bg-primary-900/30',
    },
    {
      label: 'Переработок',
      value: stats?.totalOvertime ?? 0,
      icon: <ChartBarIcon />,
      accent: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
    },
    {
      label: 'Записей',
      value: stats?.records ?? timesheets.length,
      icon: <DocumentTextIcon />,
      accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
    },
  ];

  const fmtPeriod = (key: string) => {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Табель учёта времени"
        subtitle="Учёт отработанных часов по сотрудникам"
        icon={<ClockIcon />}
        action={
          <Button
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Новая запись
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* Метрики */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {metrics.map((m) => (
                <Card key={m.label} className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 shrink-0 ${m.accent}`}
                  >
                    {m.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-bold text-ink-900 dark:text-ink-50 leading-none">
                      {m.value}
                    </div>
                    <div className="text-sm text-ink-500 mt-1">{m.label}</div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Панель периода */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-ink-400" />
                <label className="text-sm text-ink-500">Период:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="field w-auto min-w-[180px]"
                >
                  <option value="all">Все периоды</option>
                  {periods.map((key) => (
                    <option key={key} value={key}>
                      {fmtPeriod(key)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-ink-500">
                Итого за период:{' '}
                <span className="font-semibold text-ink-900 dark:text-ink-50">
                  {periodHours} ч
                </span>
              </div>
            </div>

            {/* Таблица */}
            <Card padding="none" className="overflow-hidden">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={<ClockIcon />}
                  title="Записей нет"
                  description="Добавьте запись о рабочем времени, чтобы она появилась здесь."
                  action={
                    <Button
                      leftIcon={<PlusIcon className="w-4 h-4" />}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Новая запись
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Сотрудник
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Дата
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Часы
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Описание
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((record: Timesheet) => (
                        <tr
                          key={record.id}
                          className="row-hover border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={getEmployeeName(record.employeeId)} size="sm" />
                              <span className="font-medium text-ink-900 dark:text-ink-50">
                                {getEmployeeName(record.employeeId)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDaysIcon className="w-4 h-4 text-ink-400" />
                              {fmtDate(record.date)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-ink-900 dark:text-ink-50">
                            {record.hours} ч
                          </td>
                          <td className="px-4 py-3 text-ink-500 max-w-[280px] truncate">
                            {record.description || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant[record.status] || 'default'} dot>
                              {statusLabels[record.status] || record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[var(--border)] bg-[var(--surface-muted)]">
                        <td
                          className="px-4 py-3 text-xs uppercase tracking-wide text-ink-500 font-medium"
                          colSpan={2}
                        >
                          Всего записей: {filtered.length}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-ink-900 dark:text-ink-50">
                          {periodHours} ч
                        </td>
                        <td className="px-4 py-3" colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ employeeId: '', date: '', hours: 0, description: '' });
        }}
        title="Новая запись в табель"
        description="Учёт отработанного времени сотрудника"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Сотрудник
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
              className="field"
            >
              <option value="">Выберите сотрудника</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Дата"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Часы"
              type="number"
              step="0.5"
              min="0"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Описание работ (необязательно)"
              className="field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ employeeId: '', date: '', hours: 0, description: '' });
              }}
            >
              Отмена
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Создать
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
