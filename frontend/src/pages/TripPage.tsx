import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  BriefcaseIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { tripService } from '../services/trip.service';
import type { BusinessTrip } from '../types/trip';
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
  approved: 'Одобрена',
  rejected: 'Отклонена',
  completed: 'Завершена',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'default',
};

type FormValues = {
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
};

const calcDays = (s: string, e: string) =>
  Math.max(1, Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function TripPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<FormValues>();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: tripService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setShowCreateModal(false);
      reset();
      toast.success('Командировка создана');
    },
    onError: () => toast.error('Не удалось создать командировку'),
  });

  const onSubmit = (data: FormValues) => createMutation.mutate(data as any);

  const metrics = useMemo(() => {
    const active = trips.filter(
      (t: BusinessTrip) => t.status === 'approved' || t.status === 'pending'
    ).length;
    const pending = trips.filter((t: BusinessTrip) => t.status === 'pending').length;
    const completed = trips.filter((t: BusinessTrip) => t.status === 'completed').length;
    return [
      {
        label: 'Всего командировок',
        value: trips.length,
        icon: <BriefcaseIcon />,
        accent: 'text-primary-500 bg-primary-50 dark:bg-primary-900/30',
      },
      {
        label: 'На согласовании',
        value: pending,
        icon: <ClockIcon />,
        accent: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
      },
      {
        label: 'Активных',
        value: active,
        icon: <MapPinIcon />,
        accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
      },
      {
        label: 'Завершено',
        value: completed,
        icon: <CheckCircleIcon />,
        accent: 'text-ink-500 bg-ink-100 dark:bg-ink-800',
      },
    ];
  }, [trips]);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Командировки"
        subtitle="Служебные поездки и их статусы"
        icon={<BriefcaseIcon />}
        action={
          <Button
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Создать командировку
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* Метрики */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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

            {/* Список командировок */}
            <Card padding="none" className="overflow-hidden">
              {trips.length === 0 ? (
                <EmptyState
                  icon={<BriefcaseIcon />}
                  title="Командировок нет"
                  description="Создайте командировку, чтобы она появилась в списке."
                  action={
                    <Button
                      leftIcon={<PlusIcon className="w-4 h-4" />}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Создать командировку
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
                          Направление
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Цель
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-ink-500 text-xs uppercase tracking-wide">
                          Период
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
                      {trips.map((trip: BusinessTrip) => (
                        <tr
                          key={trip.id}
                          className="row-hover border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={trip.employee?.fullName} size="sm" />
                              <span className="font-medium text-ink-900 dark:text-ink-50">
                                {trip.employee?.fullName || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-ink-900 dark:text-ink-50 font-medium">
                              <MapPinIcon className="w-4 h-4 text-ink-400" />
                              {trip.destination}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ink-500 max-w-[240px] truncate">
                            {trip.purpose || '—'}
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDaysIcon className="w-4 h-4 text-ink-400" />
                              {fmtDate(trip.startDate)} — {fmtDate(trip.endDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-ink-900 dark:text-ink-50">
                            {calcDays(trip.startDate, trip.endDate)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant[trip.status] || 'default'} dot>
                              {statusLabels[trip.status] || trip.status}
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
          reset();
        }}
        title="Новая командировка"
        description="Заполните данные служебной поездки"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Направление"
            placeholder="Город назначения"
            autoFocus
            {...register('destination', { required: true })}
          />
          <Input
            label="Цель командировки"
            placeholder="Цель поездки"
            {...register('purpose', { required: true })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Начало" type="date" {...register('startDate', { required: true })} />
            <Input label="Конец" type="date" {...register('endDate', { required: true })} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                reset();
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
