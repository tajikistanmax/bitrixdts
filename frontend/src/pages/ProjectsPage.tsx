import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { projectService } from '../services/project.service';
import type { CreateProjectDTO } from '../types/project';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  RectangleGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  PageHeader,
  Card,
  Avatar,
  Badge,
  EmptyState,
  Modal,
  Button,
  Input,
  LoadingState,
  useToast,
} from '../components/ui';

type Filter = 'all' | 'my';

const statusMeta: Record<string, { label: string; variant: 'success' | 'primary' | 'warning' | 'default' | 'danger' }> = {
  active: { label: 'Активный', variant: 'success' },
  completed: { label: 'Завершён', variant: 'primary' },
  on_hold: { label: 'На паузе', variant: 'warning' },
  cancelled: { label: 'Отменён', variant: 'danger' },
};

export default function ProjectsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset } = useForm<CreateProjectDTO>();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDTO) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      reset();
      toast.success('Проект создан');
    },
    onError: () => toast.error('Не удалось создать проект'),
  });

  const onSubmit = (data: CreateProjectDTO) => createMutation.mutate(data);

  const projectList: any[] = Array.isArray(projects) ? projects : [];
  const filtered = projectList.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Проекты"
        subtitle={`${projectList.length} проектов в работе`}
        icon={<RectangleGroupIcon />}
        action={
          <>
            <div className="hidden sm:block w-56">
              <Input
                leftIcon={<MagnifyingGlassIcon />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск проекта…"
              />
            </div>
            <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
              Создать
            </Button>
          </>
        }
        tabs={
          <div className="flex items-center gap-1.5 text-sm">
            {([
              { id: 'all', label: 'Все проекты' },
              { id: 'my', label: 'Мои' },
            ] as { id: Filter; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filter === t.id
                    ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/40 dark:text-primary-200'
                    : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <Card padding="none">
            <LoadingState />
          </Card>
        ) : filtered.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<RectangleGroupIcon />}
              title="Создайте проект"
              description="Здесь будут проекты и группы, в которых вы работаете вместе с коллегами."
              action={
                <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                  Создать проект
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p: any) => {
              const meta = statusMeta[p.status] ?? { label: p.status, variant: 'default' as const };
              const members: any[] = Array.isArray(p.members) ? p.members : [];
              const progress = Math.max(0, Math.min(100, Number(p.progress) || 0));
              return (
                <Card key={p.id} hover className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 flex items-center justify-center font-semibold shrink-0">
                      {p.name?.charAt(0)?.toUpperCase() || 'П'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">{p.name}</h3>
                      {p.description && (
                        <p className="text-xs text-ink-500 line-clamp-2 mt-0.5">{p.description}</p>
                      )}
                    </div>
                    <Badge variant={meta.variant} size="sm" dot>
                      {meta.label}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                      <span>Прогресс</span>
                      <span className="font-medium text-ink-700 dark:text-ink-200">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center">
                      {members.length === 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-ink-400">
                          <UsersIcon className="w-4 h-4" /> Нет участников
                        </span>
                      ) : (
                        <div className="flex items-center">
                          {members.slice(0, 4).map((m: any, i: number) => (
                            <div key={i} className="-ml-2 first:ml-0 ring-2 ring-[var(--surface)] rounded-full">
                              <Avatar
                                name={m.employee?.fullName}
                                src={m.employee?.avatarUrl}
                                size="xs"
                              />
                            </div>
                          ))}
                          {members.length > 4 && (
                            <span className="-ml-2 w-6 h-6 rounded-full bg-[var(--surface-muted)] ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] font-medium text-ink-500">
                              +{members.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-ink-500">
                      <CalendarDaysIcon className="w-4 h-4" />
                      {formatDate(p.endDate || p.startDate)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          reset();
        }}
        title="Новый проект"
        description="Объедините коллег для совместной работы"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                reset();
              }}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              form="create-project-form"
              isLoading={createMutation.isPending}
            >
              Создать
            </Button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Название проекта" placeholder="Например, Редизайн портала" autoFocus {...register('name', { required: true })} />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Описание</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Кратко о целях проекта…"
              className="field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Дата начала</label>
              <input type="date" {...register('startDate')} className="field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Дата окончания</label>
              <input type="date" {...register('endDate')} className="field" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
