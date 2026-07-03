import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HeartIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { sickLeaveService } from '../services/sickLeave.service';
import type { SickLeave } from '../types/sickLeave';
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
  pending: 'На рассмотрении',
  approved: 'Подтверждён',
  rejected: 'Отклонён',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const calcDays = (s: string, e: string) =>
  Math.max(1, Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function SickLeavePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ startDate: '', endDate: '', reason: '' });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['sickleaves'],
    queryFn: () => sickLeaveService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: sickLeaveService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sickleaves'] });
      setShowCreateModal(false);
      setFormData({ startDate: '', endDate: '', reason: '' });
      toast.success('Больничный лист создан');
    },
    onError: () => toast.error('Не удалось создать больничный лист'),
  });

  const metrics = useMemo(() => {
    const pending = records.filter((r: SickLeave) => r.status === 'pending').length;
    const approved = records.filter((r: SickLeave) => r.status === 'approved');
    const totalDays = approved.reduce(
      (sum: number, r: SickLeave) => sum + calcDays(r.startDate, r.endDate),
      0
    );
    return [
      {
        label: 'Всего листов',
        value: records.length,
        icon: <HeartIcon />,
        accent: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30',
      },
      {
        label: 'На рассмотрении',
        value: pending,
        icon: <ClockIcon />,
        accent: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
      },
      {
        label: 'Дней подтверждено',
        value: totalDays,
        icon: <CheckCircleIcon />,
        accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
      },
    ];
  }, [records]);

  const canSubmit = Boolean(formData.startDate && formData.endDate);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Больничные листы"
        subtitle="Листы нетрудоспособности и их статусы"
        icon={<HeartIcon />}
        action={
          <Button
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Создать
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
                    <div className="text-sm text-ink-500 mt-1 truncate">{m.label}</div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Список больничных */}
            <Card padding="none" className="overflow-hidden">
              {records.length === 0 ? (
                <EmptyState
                  icon={<HeartIcon />}
                  title="Больничных нет"
                  description="Создайте больничный лист, чтобы он появился в списке."
                  action={
                    <Button
                      leftIcon={<PlusIcon className="w-4 h-4" />}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Создать
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
                          Период
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Дней
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Диагноз / причина
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r: SickLeave) => (
                        <tr
                          key={r.id}
                          className="row-hover border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={r.employee?.fullName} size="sm" />
                              <span className="font-medium text-ink-900 dark:text-ink-50">
                                {r.employee?.fullName || 'Неизвестно'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDaysIcon className="w-4 h-4 text-ink-400" />
                              {fmtDate(r.startDate)} — {fmtDate(r.endDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-ink-900 dark:text-ink-50">
                            {calcDays(r.startDate, r.endDate)}
                          </td>
                          <td className="px-4 py-3 text-ink-500 max-w-[260px] truncate">
                            {r.reason || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant[r.status] || 'default'} dot>
                              {statusLabels[r.status] || r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
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
          setFormData({ startDate: '', endDate: '', reason: '' });
        }}
        title="Новый больничный лист"
        description="Заполните период и причину нетрудоспособности"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Дата начала"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Дата окончания"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Диагноз / причина
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Причина (диагноз)"
              className="field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ startDate: '', endDate: '', reason: '' });
              }}
            >
              Отмена
            </Button>
            <Button
              type="button"
              isLoading={createMutation.isPending}
              disabled={!canSubmit}
              onClick={() => createMutation.mutate(formData as any)}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
