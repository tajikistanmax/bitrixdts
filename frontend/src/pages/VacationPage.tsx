import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  SunIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { vacationService } from '../services/vacation.service';
import type { VacationRequest } from '../types/vacation';
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
  pending: 'Ожидает',
  approved: 'Одобрен',
  rejected: 'Отклонён',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const typeLabels: Record<string, string> = {
  annual: 'Ежегодный',
  sick: 'Больничный',
  unpaid: 'Без содержания',
  other: 'Другой',
};

const ANNUAL_QUOTA = 28;

type FormValues = {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

const calcDays = (start: string, end: string) =>
  Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function VacationPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { type: 'annual' },
  });

  const { data: vacations = [], isLoading } = useQuery({
    queryKey: ['vacations'],
    queryFn: () => vacationService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => vacationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      setShowCreateModal(false);
      reset({ type: 'annual', startDate: '', endDate: '', reason: '' });
      toast.success('Заявка на отпуск создана');
    },
    onError: () => toast.error('Не удалось создать заявку'),
  });

  const onSubmit = (data: FormValues) => createMutation.mutate(data);

  // Метрики
  const usedDays = vacations
    .filter((v) => v.status === 'approved')
    .reduce((sum, v) => sum + calcDays(v.startDate, v.endDate), 0);
  const plannedDays = vacations
    .filter((v) => v.status === 'pending')
    .reduce((sum, v) => sum + calcDays(v.startDate, v.endDate), 0);
  const availableDays = Math.max(0, ANNUAL_QUOTA - usedDays);

  const metrics = [
    {
      label: 'Доступно дней',
      value: availableDays,
      icon: <SunIcon />,
      accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      label: 'Запланировано',
      value: plannedDays,
      icon: <ClockIcon />,
      accent: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
    },
    {
      label: 'Использовано',
      value: usedDays,
      icon: <CheckCircleIcon />,
      accent: 'text-primary-500 bg-primary-50 dark:bg-primary-900/30',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Отпуска"
        subtitle="Заявки на отпуск и их статусы"
        icon={<SunIcon />}
        action={
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Оформить отпуск
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

            {/* Список заявок */}
            <Card padding="none" className="overflow-hidden">
              {vacations.length === 0 ? (
                <EmptyState
                  icon={<SunIcon />}
                  title="Заявок нет"
                  description="Оформите заявку на отпуск, чтобы она появилась здесь."
                  action={
                    <Button
                      leftIcon={<PlusIcon className="w-4 h-4" />}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Оформить отпуск
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
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Тип
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Дней
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacations.map((v: VacationRequest) => (
                        <tr
                          key={v.id}
                          className="row-hover border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={v.employee?.fullName}
                                src={v.employee?.avatarUrl}
                                size="sm"
                              />
                              <span className="font-medium text-ink-900 dark:text-ink-50">
                                {v.employee?.fullName || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDaysIcon className="w-4 h-4 text-ink-400" />
                              {fmtDate(v.startDate)} — {fmtDate(v.endDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="info">{typeLabels[v.type] || v.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-ink-900 dark:text-ink-50">
                            {calcDays(v.startDate, v.endDate)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant[v.status] || 'default'} dot>
                              {statusLabels[v.status] || v.status}
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
          reset({ type: 'annual', startDate: '', endDate: '', reason: '' });
        }}
        title="Оформить отпуск"
        description="Заполните данные заявки на отпуск"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Тип
            </label>
            <select {...register('type', { required: true })} className="field">
              <option value="annual">Ежегодный</option>
              <option value="unpaid">Без содержания</option>
              <option value="other">Другой</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Начало"
              type="date"
              {...register('startDate', { required: true })}
            />
            <Input
              label="Конец"
              type="date"
              {...register('endDate', { required: true })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Комментарий
            </label>
            <textarea
              {...register('reason')}
              rows={3}
              placeholder="Причина (необязательно)"
              className="field"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                reset({ type: 'annual', startDate: '', endDate: '', reason: '' });
              }}
            >
              Отмена
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
