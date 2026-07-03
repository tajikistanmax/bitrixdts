import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ScaleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { resolutionService } from '../services/resolution.service';
import type { Resolution } from '../types/resolution';
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

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'overdue';

interface ResolutionFormValues {
  title: string;
  description: string;
  dueDate: string;
  executorId: string;
  controllerId: string;
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'in_progress', label: 'На исполнении' },
  { key: 'completed', label: 'Исполнено' },
  { key: 'overdue', label: 'Просрочено' },
];

function isOverdue(res: Resolution): boolean {
  if (res.status === 'completed' || !res.dueDate) return false;
  return new Date(res.dueDate).getTime() < Date.now();
}

function statusOf(res: Resolution): Exclude<StatusFilter, 'all'> {
  if (res.status === 'completed') return 'completed';
  if (isOverdue(res)) return 'overdue';
  return 'in_progress';
}

const STATUS_META: Record<
  Exclude<StatusFilter, 'all'>,
  { label: string; variant: 'info' | 'success' | 'danger' }
> = {
  in_progress: { label: 'На исполнении', variant: 'info' },
  completed: { label: 'Исполнено', variant: 'success' },
  overdue: { label: 'Просрочено', variant: 'danger' },
};

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ResolutionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detail, setDetail] = useState<Resolution | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<ResolutionFormValues>();

  const { data: resolutions = [], isLoading } = useQuery({
    queryKey: ['resolutions'],
    queryFn: () => resolutionService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ResolutionFormValues) => resolutionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolutions'] });
      setShowCreateModal(false);
      reset();
      toast.success('Резолюция создана');
    },
    onError: () => toast.error('Не удалось создать резолюцию'),
  });

  const counts = useMemo(() => {
    const acc: Record<StatusFilter, number> = {
      all: resolutions.length,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    };
    for (const r of resolutions) acc[statusOf(r)] += 1;
    return acc;
  }, [resolutions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resolutions.filter((r) => {
      if (statusFilter !== 'all' && statusOf(r) !== statusFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.executor?.fullName ?? '').toLowerCase().includes(q)
      );
    });
  }, [resolutions, search, statusFilter]);

  const onSubmit = handleSubmit((data) => createMutation.mutate(data));

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Резолюции"
        subtitle="Поручения руководителя по документам"
        icon={<ScaleIcon />}
        action={
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Новая резолюция
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Панель фильтров */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="sm:max-w-xs w-full">
              <Input
                placeholder="Поиск по тексту или исполнителю…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<MagnifyingGlassIcon />}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-[var(--surface-muted)] text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
                    }`}
                  >
                    {f.label}
                    <span
                      className={`text-xs ${
                        active ? 'text-white/80' : 'text-ink-400'
                      }`}
                    >
                      {counts[f.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Содержимое */}
          {isLoading ? (
            <LoadingState label="Загрузка резолюций…" />
          ) : filtered.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={<ScaleIcon />}
                title="Резолюции не найдены"
                description={
                  search || statusFilter !== 'all'
                    ? 'Попробуйте изменить условия фильтра.'
                    : 'Создайте первую резолюцию по документу или поручению.'
                }
                action={
                  <Button
                    leftIcon={<PlusIcon className="w-4 h-4" />}
                    onClick={() => setShowCreateModal(true)}
                  >
                    Новая резолюция
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((res) => {
                const st = statusOf(res);
                const meta = STATUS_META[st];
                return (
                  <Card
                    key={res.id}
                    hover
                    padding="md"
                    className="cursor-pointer"
                    onClick={() => setDetail(res)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">
                            {res.title}
                          </h3>
                          <Badge variant={meta.variant} dot>
                            {meta.label}
                          </Badge>
                        </div>
                        {res.description && (
                          <p className="text-sm text-ink-500 line-clamp-2">{res.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-ink-500">
                          <span className="inline-flex items-center gap-2">
                            <Avatar name={res.executor?.fullName} size="xs" />
                            <span className="text-ink-700 dark:text-ink-200">
                              {res.executor?.fullName || 'Исполнитель не назначен'}
                            </span>
                          </span>
                          {res.controller?.fullName && (
                            <span className="inline-flex items-center gap-1.5">
                              <ShieldCheckIcon className="w-4 h-4 text-ink-400" />
                              {res.controller.fullName}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDaysIcon className="w-4 h-4 text-ink-400" />
                            {formatDate(res.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Модалка создания */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Новая резолюция"
        description="Поручение по документу с исполнителем и контролёром"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button type="submit" form="resolution-form" isLoading={createMutation.isPending}>
              Создать
            </Button>
          </>
        }
      >
        <form id="resolution-form" onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Название"
            placeholder="Кратко о поручении"
            error={formState.errors.title ? 'Укажите название' : undefined}
            {...register('title', { required: true })}
          />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Описание
            </label>
            <textarea
              rows={3}
              placeholder="Текст резолюции…"
              className="field resize-none"
              {...register('description')}
            />
          </div>
          <Input label="Срок исполнения" type="date" {...register('dueDate')} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="ID исполнителя" placeholder="executorId" {...register('executorId')} />
            <Input label="ID контролёра" placeholder="controllerId" {...register('controllerId')} />
          </div>
        </form>
      </Modal>

      {/* Модалка деталей */}
      <Modal
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.title}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setDetail(null)}>
            Закрыть
          </Button>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div>
              <Badge variant={STATUS_META[statusOf(detail)].variant} dot>
                {STATUS_META[statusOf(detail)].label}
              </Badge>
            </div>

            {detail.description && (
              <p className="text-sm text-ink-700 dark:text-ink-200 whitespace-pre-wrap">
                {detail.description}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] p-3">
                <p className="text-xs text-ink-500 mb-1.5 inline-flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4" /> Исполнитель
                </p>
                <div className="flex items-center gap-2">
                  <Avatar name={detail.executor?.fullName} size="sm" />
                  <span className="text-sm text-ink-900 dark:text-ink-50">
                    {detail.executor?.fullName || '—'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] p-3">
                <p className="text-xs text-ink-500 mb-1.5 inline-flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4" /> Контролёр
                </p>
                <div className="flex items-center gap-2">
                  <Avatar name={detail.controller?.fullName} size="sm" />
                  <span className="text-sm text-ink-900 dark:text-ink-50">
                    {detail.controller?.fullName || '—'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] p-3">
                <p className="text-xs text-ink-500 mb-1.5 inline-flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-4 h-4" /> Срок исполнения
                </p>
                <p className="text-sm text-ink-900 dark:text-ink-50">{formatDate(detail.dueDate)}</p>
              </div>

              <div className="rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] p-3">
                <p className="text-xs text-ink-500 mb-1.5 inline-flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4" /> Создано
                </p>
                <p className="text-sm text-ink-900 dark:text-ink-50">{formatDate(detail.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
