import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendance.service';
import type { Attendance } from '../types/attendance';
import {
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';

// Порог опоздания — начало рабочего дня
const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 0;

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function hoursWorked(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return '—';
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (ms <= 0) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return `${h} ч ${m.toString().padStart(2, '0')} мин`;
}

// Опоздание: приход позже начала рабочего дня
function isLate(checkIn: string | null): boolean {
  if (!checkIn) return false;
  const d = new Date(checkIn);
  const threshold = d.getHours() * 60 + d.getMinutes();
  return threshold > WORK_START_HOUR * 60 + WORK_START_MINUTE;
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [today] = useState(() => new Date());

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAll(),
  });

  const attList: Attendance[] = Array.isArray(records) ? records : [];

  // Отметка за сегодня (первая найденная запись с датой=сегодня)
  const todayRecord = useMemo(
    () => attList.find((a) => a.date && sameDay(new Date(a.date), today)) || null,
    [attList, today]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['attendance'] });

  // Приход — создаём запись за сегодня
  const checkInMutation = useMutation({
    mutationFn: () =>
      attendanceService.create({
        date: today.toISOString(),
        checkIn: new Date().toISOString(),
        source: 'manual',
      }),
    onSuccess: () => {
      invalidate();
      toast.success('Приход отмечен');
    },
    onError: () => toast.error('Не удалось отметить приход'),
  });

  // Уход — обновляем сегодняшнюю запись
  const checkOutMutation = useMutation({
    mutationFn: (id: string) =>
      attendanceService.update(id, { checkOut: new Date().toISOString() }),
    onSuccess: () => {
      invalidate();
      toast.success('Уход отмечен');
    },
    onError: () => toast.error('Не удалось отметить уход'),
  });

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  const headerAction = (
    <Button
      variant={hasCheckedIn ? 'success' : 'primary'}
      leftIcon={
        hasCheckedIn ? (
          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
        ) : (
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
        )
      }
      isLoading={checkInMutation.isPending || checkOutMutation.isPending}
      disabled={hasCheckedOut}
      onClick={() => {
        if (!hasCheckedIn) {
          checkInMutation.mutate();
        } else if (todayRecord && !hasCheckedOut) {
          checkOutMutation.mutate(todayRecord.id);
        }
      }}
    >
      {!hasCheckedIn ? 'Отметить приход' : hasCheckedOut ? 'День завершён' : 'Отметить уход'}
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Посещаемость" icon={<ClockIcon />} action={headerAction} />

      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Моя отметка сегодня */}
        <Card padding="lg" className="border-l-4 border-l-primary-500">
          <CardHeader
            icon={<CalendarDaysIcon />}
            title="Моя отметка сегодня"
            subtitle={today.toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            action={
              hasCheckedOut ? (
                <Badge variant="default" dot>
                  Завершён
                </Badge>
              ) : hasCheckedIn ? (
                <Badge variant="success" dot>
                  На работе
                </Badge>
              ) : (
                <Badge variant="warning" dot>
                  Не отмечен
                </Badge>
              )
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] p-4">
              <p className="text-xs text-ink-500 mb-1">Приход</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-ink-50 tabular-nums">
                {fmtTime(todayRecord?.checkIn)}
              </p>
              {hasCheckedIn && (
                <div className="mt-2">
                  {isLate(todayRecord?.checkIn ?? null) ? (
                    <Badge variant="danger" size="sm">
                      Опоздание
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      Вовремя
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] p-4">
              <p className="text-xs text-ink-500 mb-1">Уход</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-ink-50 tabular-nums">
                {fmtTime(todayRecord?.checkOut)}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] p-4">
              <p className="text-xs text-ink-500 mb-1">Отработано</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-ink-50 tabular-nums">
                {hoursWorked(todayRecord?.checkIn ?? null, todayRecord?.checkOut ?? null)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
              isLoading={checkInMutation.isPending}
              disabled={hasCheckedIn}
              onClick={() => checkInMutation.mutate()}
            >
              Отметить приход
            </Button>
            <Button
              variant="success"
              size="sm"
              leftIcon={<ArrowLeftOnRectangleIcon className="w-4 h-4" />}
              isLoading={checkOutMutation.isPending}
              disabled={!hasCheckedIn || hasCheckedOut}
              onClick={() => todayRecord && checkOutMutation.mutate(todayRecord.id)}
            >
              Отметить уход
            </Button>
          </div>
        </Card>

        {/* История посещаемости */}
        <Card padding="none">
          <CardHeader
            title="История посещаемости"
            subtitle={`Всего записей: ${attList.length}`}
            icon={<ClockIcon />}
            className="p-5 pb-0"
          />

          {isLoading ? (
            <LoadingState label="Загрузка посещаемости…" />
          ) : attList.length === 0 ? (
            <EmptyState
              icon={<ClockIcon />}
              title="Нет записей"
              description="Отметки о приходе и уходе появятся здесь"
            />
          ) : (
            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-500 border-b border-[var(--border)]">
                    <th className="px-3 py-2.5 font-medium">Сотрудник</th>
                    <th className="px-3 py-2.5 font-medium">Дата</th>
                    <th className="px-3 py-2.5 font-medium">Приход</th>
                    <th className="px-3 py-2.5 font-medium">Уход</th>
                    <th className="px-3 py-2.5 font-medium">Отработано</th>
                    <th className="px-3 py-2.5 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {attList.map((a) => {
                    const rec = a as Attendance & {
                      employee?: { fullName?: string; avatar?: string | null };
                    };
                    const name = rec.employee?.fullName || 'Сотрудник';
                    return (
                      <tr
                        key={a.id}
                        className="row-hover border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={name} src={rec.employee?.avatar ?? null} size="sm" />
                            <span className="font-medium text-ink-900 dark:text-ink-50">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-ink-500">{fmtDate(a.date)}</td>
                        <td className="px-3 py-2.5 text-ink-900 dark:text-ink-50 tabular-nums">
                          {fmtTime(a.checkIn)}
                        </td>
                        <td className="px-3 py-2.5 text-ink-900 dark:text-ink-50 tabular-nums">
                          {fmtTime(a.checkOut)}
                        </td>
                        <td className="px-3 py-2.5 text-ink-500 tabular-nums">
                          {hoursWorked(a.checkIn, a.checkOut)}
                        </td>
                        <td className="px-3 py-2.5">
                          {!a.checkIn ? (
                            <Badge variant="default" size="sm">
                              Нет отметки
                            </Badge>
                          ) : isLate(a.checkIn) ? (
                            <Badge variant="danger" size="sm">
                              Опоздание
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              Вовремя
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
