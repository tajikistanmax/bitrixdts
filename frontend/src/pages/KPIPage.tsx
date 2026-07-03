import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { kpiService } from '../services/kpi.service';
import type { KPIMetric } from '../types/kpi';
import {
  Button,
  Modal,
  Badge,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';
import {
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'cards' | 'table';

type MetricForm = {
  name: string;
  description?: string;
  target?: number;
  unit?: string;
};

type ValueForm = {
  value: number;
  period: string;
};

function latestValue(metric: KPIMetric): number | null {
  if (!metric.values || metric.values.length === 0) return null;
  const sorted = [...metric.values].sort(
    (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()
  );
  return sorted[0].value;
}

function progressPct(metric: KPIMetric): number | null {
  const val = latestValue(metric);
  if (val == null || metric.target == null || metric.target === 0) return null;
  return Math.round((val / metric.target) * 100);
}

function scoreBadge(pct: number | null): { label: string; variant: 'success' | 'primary' | 'warning' | 'danger' | 'default' } {
  if (pct == null) return { label: 'Нет данных', variant: 'default' };
  if (pct >= 100) return { label: 'Отлично', variant: 'success' };
  if (pct >= 75) return { label: 'Хорошо', variant: 'primary' };
  if (pct >= 50) return { label: 'Средне', variant: 'warning' };
  return { label: 'Низко', variant: 'danger' };
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const color =
    pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-primary-500' : 'bg-amber-500';
  return (
    <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function KPIPage() {
  const [view, setView] = useState<ViewMode>('cards');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<KPIMetric | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    register: regMetric,
    handleSubmit: handleMetricSubmit,
    reset: resetMetric,
  } = useForm<MetricForm>();
  const {
    register: regValue,
    handleSubmit: handleValueSubmit,
    reset: resetValue,
  } = useForm<ValueForm>();

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['kpi'],
    queryFn: () => kpiService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: kpiService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      setShowCreateModal(false);
      resetMetric();
      toast.success('Метрика создана');
    },
    onError: () => toast.error('Ошибка создания метрики'),
  });

  const addValueMutation = useMutation({
    mutationFn: (data: { metricId: string; value: ValueForm }) =>
      kpiService.addValue(data.metricId, data.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      setShowValueModal(false);
      setSelectedMetric(null);
      resetValue();
      toast.success('Значение добавлено');
    },
    onError: () => toast.error('Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: kpiService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      toast.success('Метрика удалена');
    },
  });

  const onMetricSubmit = (data: MetricForm) => createMutation.mutate(data);
  const onValueSubmit = (data: ValueForm) => {
    if (selectedMetric)
      addValueMutation.mutate({ metricId: selectedMetric.id, value: data });
  };

  const openValueModal = (metric: KPIMetric) => {
    setSelectedMetric(metric);
    resetValue({ period: new Date().toISOString().slice(0, 10) } as ValueForm);
    setShowValueModal(true);
  };

  // Сводные показатели
  const summary = useMemo(() => {
    const withProgress = metrics
      .map((m) => progressPct(m))
      .filter((p): p is number => p != null);
    const avg =
      withProgress.length > 0
        ? Math.round(withProgress.reduce((a, b) => a + b, 0) / withProgress.length)
        : null;
    const achieved = withProgress.filter((p) => p >= 100).length;
    return {
      total: metrics.length,
      tracked: withProgress.length,
      avg,
      achieved,
    };
  }, [metrics]);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="KPI метрики"
        subtitle={`Всего метрик: ${metrics.length}`}
        icon={<ChartBarIcon />}
        action={
          <>
            <div className="hidden sm:flex items-center rounded-lg border border-[var(--border)] p-0.5">
              <button
                onClick={() => setView('cards')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors ${
                  view === 'cards'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                    : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" /> Карточки
              </button>
              <button
                onClick={() => setView('table')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors ${
                  view === 'table'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                    : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
              >
                <TableCellsIcon className="w-4 h-4" /> Таблица
              </button>
            </div>
            <Button
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Новая метрика
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <LoadingState />
        ) : metrics.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<ChartBarIcon />}
              title="Метрик пока нет"
              description="Создайте первую KPI-метрику, чтобы отслеживать результаты."
              action={
                <Button
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Новая метрика
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Сводные карточки-метрики */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Всего метрик
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ChartBarIcon className="w-6 h-6 text-primary-500" />
                  <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                    {summary.total}
                  </span>
                </div>
              </Card>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Средн. выполнение
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-500" />
                  <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                    {summary.avg != null ? `${summary.avg}%` : '—'}
                  </span>
                </div>
              </Card>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Цель достигнута
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <TrophyIcon className="w-6 h-6 text-amber-500" />
                  <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                    {summary.achieved}
                  </span>
                </div>
              </Card>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  С целями
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <TableCellsIcon className="w-6 h-6 text-violet-500" />
                  <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                    {summary.tracked}
                  </span>
                </div>
              </Card>
            </div>

            {view === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric: KPIMetric) => {
                  const val = latestValue(metric);
                  const pct = progressPct(metric);
                  const score = scoreBadge(pct);
                  return (
                    <Card key={metric.id} hover className="flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">
                            {metric.name}
                          </h3>
                          {metric.description && (
                            <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">
                              {metric.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Удалить метрику?'))
                              deleteMutation.mutate(metric.id);
                          }}
                          className="text-ink-400 hover:text-red-500 transition-colors shrink-0"
                          aria-label="Удалить"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                          {val ?? '—'}
                        </span>
                        {metric.unit && (
                          <span className="text-sm text-ink-500">{metric.unit}</span>
                        )}
                      </div>

                      {metric.target != null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                            <span>Цель: {metric.target}</span>
                            <span className="font-medium text-ink-700 dark:text-ink-200">
                              {pct != null ? `${pct}%` : '—'}
                            </span>
                          </div>
                          <ProgressBar pct={pct ?? 0} />
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant={score.variant}>{score.label}</Badge>
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<PlusIcon className="w-3.5 h-3.5" />}
                          onClick={() => openValueModal(metric)}
                        >
                          Значение
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-500">
                        <th className="px-4 py-3 font-medium">Метрика</th>
                        <th className="px-4 py-3 font-medium">Факт</th>
                        <th className="px-4 py-3 font-medium">Цель</th>
                        <th className="px-4 py-3 font-medium w-56">Выполнение</th>
                        <th className="px-4 py-3 font-medium">Оценка</th>
                        <th className="px-4 py-3 font-medium text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {metrics.map((metric: KPIMetric) => {
                        const val = latestValue(metric);
                        const pct = progressPct(metric);
                        const score = scoreBadge(pct);
                        return (
                          <tr key={metric.id} className="row-hover">
                            <td className="px-4 py-3">
                              <div className="font-medium text-ink-900 dark:text-ink-100">
                                {metric.name}
                              </div>
                              {metric.unit && (
                                <div className="text-xs text-ink-500">
                                  ед.: {metric.unit}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-primary-600 dark:text-primary-300">
                              {val ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-ink-600 dark:text-ink-300">
                              {metric.target ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              {pct != null ? (
                                <div className="flex items-center gap-2">
                                  <ProgressBar pct={pct} />
                                  <span className="text-xs text-ink-500 w-10 text-right shrink-0">
                                    {pct}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-ink-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={score.variant}>{score.label}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => openValueModal(metric)}
                                >
                                  + Значение
                                </Button>
                                <button
                                  onClick={() => {
                                    if (confirm('Удалить метрику?'))
                                      deleteMutation.mutate(metric.id);
                                  }}
                                  className="text-ink-400 hover:text-red-500 transition-colors p-1"
                                  aria-label="Удалить"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Создание метрики */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetMetric();
        }}
        title="Новая KPI-метрика"
        size="lg"
      >
        <form
          id="kpi-create-form"
          onSubmit={handleMetricSubmit(onMetricSubmit)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Название
            </label>
            <input
              {...regMetric('name', { required: true })}
              placeholder="Название метрики"
              className="field"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Описание
            </label>
            <textarea
              {...regMetric('description')}
              placeholder="Описание (необязательно)"
              className="field"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                Цель
              </label>
              <input
                {...regMetric('target', { valueAsNumber: true })}
                type="number"
                placeholder="0"
                className="field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                Единица
              </label>
              <input
                {...regMetric('unit')}
                placeholder="шт., %, ₽…"
                className="field"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                resetMetric();
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

      {/* Добавление значения */}
      <Modal
        isOpen={showValueModal && !!selectedMetric}
        onClose={() => {
          setShowValueModal(false);
          setSelectedMetric(null);
          resetValue();
        }}
        title={selectedMetric ? `Добавить значение — ${selectedMetric.name}` : 'Добавить значение'}
        size="md"
      >
        <form onSubmit={handleValueSubmit(onValueSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                Значение
              </label>
              <input
                {...regValue('value', { required: true, valueAsNumber: true })}
                type="number"
                className="field"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                Период
              </label>
              <input
                {...regValue('period', { required: true })}
                type="date"
                className="field"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowValueModal(false);
                setSelectedMetric(null);
                resetValue();
              }}
            >
              Отмена
            </Button>
            <Button type="submit" isLoading={addValueMutation.isPending}>
              Добавить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
