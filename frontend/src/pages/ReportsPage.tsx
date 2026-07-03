import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { reportService } from '../services/report.service';
import type { Report } from '../types/report';
import {
  Button,
  Modal,
  Badge,
  Card,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';
import {
  DocumentChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ChartPieIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

type ReportForm = {
  title: string;
  type: string;
};

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
  all: 'Всё время',
};

function periodStart(period: Period): number | null {
  const now = new Date();
  switch (period) {
    case 'week':
      return now.getTime() - 7 * 24 * 3600 * 1000;
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    case 'quarter':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).getTime();
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
    case 'all':
      return null;
  }
}

function typeVariant(type: string): 'primary' | 'success' | 'warning' | 'info' | 'purple' {
  const t = type.toLowerCase();
  if (t.includes('кварт')) return 'purple';
  if (t.includes('год')) return 'warning';
  if (t.includes('месяц') || t.includes('ежемес')) return 'info';
  if (t.includes('недел')) return 'success';
  return 'primary';
}

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<ReportForm>();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: reportService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowCreateModal(false);
      reset();
      toast.success('Отчёт создан');
    },
    onError: () => toast.error('Ошибка создания отчёта'),
  });

  const deleteMutation = useMutation({
    mutationFn: reportService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Отчёт удалён');
    },
  });

  const onSubmit = (data: ReportForm) => createMutation.mutate(data);

  const filtered = useMemo(() => {
    const start = periodStart(period);
    return reports.filter((r: Report) => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchesPeriod =
        start == null || new Date(r.createdAt).getTime() >= start;
      return matchesSearch && matchesPeriod;
    });
  }, [reports, search, period]);

  // Аналитика по типам отчётов для визуализации бар-диаграммой
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => map.set(r.type, (map.get(r.type) ?? 0) + 1));
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const max = entries.reduce((m, [, c]) => Math.max(m, c), 0);
    return { entries, max };
  }, [filtered]);

  const uniqueAuthors = useMemo(
    () => new Set(filtered.map((r) => r.createdBy?.id).filter(Boolean)).size,
    [filtered]
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Отчёты и аналитика"
        subtitle={`Отчётов: ${reports.length}`}
        icon={<DocumentChartBarIcon />}
        action={
          <Button
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Новый отчёт
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Панель фильтров */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию…"
              className="field pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-ink-500 whitespace-nowrap">Период:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="field w-40"
            >
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* Сводные карточки-метрики */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Отчётов за период
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <DocumentChartBarIcon className="w-6 h-6 text-primary-500" />
                  <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                    {filtered.length}
                  </span>
                </div>
              </Card>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Типов отчётов
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ChartPieIcon className="w-6 h-6 text-violet-500" />
                  <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                    {byType.entries.length}
                  </span>
                </div>
              </Card>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Авторов
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-500" />
                  <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                    {uniqueAuthors}
                  </span>
                </div>
              </Card>
            </div>

            {/* Распределение по типам — горизонтальные бары */}
            {byType.entries.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <ChartPieIcon className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold text-ink-900 dark:text-ink-50">
                    Распределение по типам
                  </h3>
                </div>
                <div className="space-y-3">
                  {byType.entries.map(([type, count]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-ink-700 dark:text-ink-200">{type}</span>
                        <span className="text-ink-500">{count}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all"
                          style={{
                            width: `${byType.max ? (count / byType.max) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Список отчётов карточками */}
            {filtered.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  icon={<DocumentChartBarIcon />}
                  title="Отчётов пока нет"
                  description="Создайте первый отчёт или измените фильтры поиска."
                  action={
                    <Button
                      leftIcon={<PlusIcon className="w-4 h-4" />}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Новый отчёт
                    </Button>
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((report: Report) => (
                  <Card key={report.id} hover className="flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 flex items-center justify-center shrink-0">
                        <DocumentChartBarIcon className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Удалить отчёт?'))
                            deleteMutation.mutate(report.id);
                        }}
                        className="text-ink-400 hover:text-red-500 transition-colors"
                        aria-label="Удалить"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="mt-3 font-semibold text-ink-900 dark:text-ink-50 line-clamp-2">
                      {report.title}
                    </h3>
                    <div className="mt-2">
                      <Badge variant={typeVariant(report.type)}>{report.type}</Badge>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={report.createdBy?.fullName} size="xs" />
                        <span className="text-xs text-ink-500 truncate">
                          {report.createdBy?.fullName || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-ink-400 shrink-0">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Создание отчёта */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Новый отчёт"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Название
            </label>
            <input
              {...register('title', { required: true })}
              placeholder="Название отчёта"
              className="field"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Тип
            </label>
            <input
              {...register('type', { required: true })}
              placeholder="Ежемесячный, Квартальный…"
              className="field"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
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
              Создать
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
