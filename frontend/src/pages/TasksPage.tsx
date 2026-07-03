import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { useAuthStore } from '../store/auth.store';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  ViewColumnsIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, Card, Avatar, Badge, EmptyState, Modal, Button, Input, LoadingState } from '../components/ui';

type ViewMode = 'list' | 'kanban' | 'deadlines';
type RoleFilter = 'all' | 'assignee' | 'creator';

const roleLabels: Record<RoleFilter, string> = {
  all: 'Все роли',
  assignee: 'Я исполнитель',
  creator: 'Я поставил',
};

const priorityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-400',
  normal: 'border-l-primary-400',
  low: 'border-l-ink-300',
};

const kanbanColumns = [
  { id: 'new', label: 'Новые', color: 'bg-ink-400' },
  { id: 'in_progress', label: 'В работе', color: 'bg-primary-500' },
  { id: 'review', label: 'На проверке', color: 'bg-amber-400' },
  { id: 'done', label: 'Готово', color: 'bg-emerald-500' },
];

const deadlineColumns = [
  { id: 'overdue', label: 'Просрочено', color: 'bg-red-500' },
  { id: 'today', label: 'Сегодня', color: 'bg-orange-400' },
  { id: 'week', label: 'На неделе', color: 'bg-primary-500' },
  { id: 'later', label: 'Позже', color: 'bg-ink-400' },
  { id: 'noterm', label: 'Без срока', color: 'bg-ink-300' },
  { id: 'completed', label: 'Завершено', color: 'bg-emerald-500' },
];

const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: 'Список', icon: <ListBulletIcon className="w-4 h-4" /> },
  { id: 'kanban', label: 'Мой план', icon: <ViewColumnsIcon className="w-4 h-4" /> },
  { id: 'deadlines', label: 'Сроки', icon: <ClockIcon className="w-4 h-4" /> },
];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useState<ViewMode>('list');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', roleFilter, search],
    queryFn: () =>
      taskService.getAll({
        search,
        assigneeId: roleFilter === 'assignee' ? user?.id : undefined,
        creatorId: roleFilter === 'creator' ? user?.id : undefined,
      } as any),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreate(false);
      setNewTask({ title: '', description: '', dueDate: '' });
    },
  });

  const taskList: any[] = Array.isArray(tasks) ? tasks : [];
  const now = new Date();

  const kanbanData = useMemo(
    () =>
      kanbanColumns.map((col) => ({
        ...col,
        tasks: taskList.filter((t) => {
          const s = t.status;
          if (col.id === 'new') return s === 'new' || s === 'todo';
          if (col.id === 'in_progress') return s === 'in_progress';
          if (col.id === 'review') return s === 'review' || s === 'approved';
          if (col.id === 'done') return s === 'done';
          return false;
        }),
      })),
    [taskList]
  );

  const deadlineData = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today.getTime() + (7 - today.getDay()) * 86400000);
    return deadlineColumns.map((col) => ({
      ...col,
      tasks: taskList.filter((t) => {
        const due = t.dueDate ? new Date(t.dueDate) : null;
        const done = t.status === 'done';
        if (col.id === 'completed') return done;
        if (done) return false;
        if (col.id === 'overdue') return due && due < today;
        if (col.id === 'today') return due && due >= today && due < new Date(today.getTime() + 86400000);
        if (col.id === 'week') return due && due >= new Date(today.getTime() + 86400000) && due <= endOfWeek;
        if (col.id === 'later') return due && due > endOfWeek;
        if (col.id === 'noterm') return !due;
        return false;
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskList]);

  const TaskChip = ({ task }: { task: any }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
    return (
      <div className={`bg-[var(--surface-muted)] rounded-lg p-3 border-l-4 ${priorityBorder[task.priority] || 'border-l-ink-300'} border-y border-r border-[var(--border)] cursor-pointer hover:shadow-sm transition-shadow`}>
        <p className="text-sm font-medium text-ink-800 dark:text-ink-100 mb-2 line-clamp-2">{task.title}</p>
        <div className="flex items-center justify-between">
          <Avatar name={task.assignee?.fullName} size="xs" />
          {task.dueDate && <Badge variant={isOverdue ? 'danger' : 'default'} size="sm">{new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</Badge>}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Задачи"
        icon={<ClipboardDocumentListIcon />}
        action={<Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Создать</Button>}
        tabs={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-lg">
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === v.id ? 'bg-[var(--surface)] text-primary-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  {v.icon}
                  {v.label}
                </button>
              ))}
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="field w-auto py-1.5 text-sm"
            >
              {Object.entries(roleLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>

            <div className="ml-auto w-full sm:w-56">
              <Input leftIcon={<MagnifyingGlassIcon />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск задач…" />
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <LoadingState />
        ) : view === 'list' ? (
          <Card padding="none" className="overflow-hidden">
            {taskList.length === 0 ? (
              <EmptyState
                icon={<ClipboardDocumentListIcon />}
                title="Задач пока нет"
                description="Создайте первую задачу — она появится здесь."
                action={<Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Создать задачу</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-500">
                      <th className="px-4 py-3 font-medium">Название</th>
                      <th className="px-4 py-3 font-medium">Статус</th>
                      <th className="px-4 py-3 font-medium">Срок</th>
                      <th className="px-4 py-3 font-medium">Постановщик</th>
                      <th className="px-4 py-3 font-medium">Исполнитель</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {taskList.map((task) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                      return (
                        <tr key={task.id} className={`row-hover border-l-4 ${priorityBorder[task.priority] || 'border-l-transparent'}`}>
                          <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{task.title}</td>
                          <td className="px-4 py-3">
                            <Badge dot variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'default'} size="sm">
                              {task.status === 'done' ? 'Готово' : task.status === 'in_progress' ? 'В работе' : task.status === 'review' ? 'Проверка' : 'Новая'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {task.dueDate && <Badge variant={isOverdue ? 'danger' : 'default'} size="sm">{new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2"><Avatar name={task.creator?.fullName} size="xs" /><span className="text-xs text-ink-600 dark:text-ink-300 truncate max-w-[120px]">{task.creator?.fullName || '—'}</span></div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2"><Avatar name={task.assignee?.fullName} size="xs" /><span className="text-xs text-ink-600 dark:text-ink-300 truncate max-w-[120px]">{task.assignee?.fullName || '—'}</span></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 border-t border-[var(--border)] text-xs text-ink-500">Всего: {taskList.length}</div>
              </div>
            )}
          </Card>
        ) : view === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanData.map((col) => (
              <div key={col.id} className="shrink-0 w-72">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{col.label}</span>
                  <span className="text-xs text-ink-400">{col.tasks.length}</span>
                </div>
                <div className="space-y-2 bg-[var(--surface-muted)] rounded-xl p-2 min-h-[120px]">
                  {col.tasks.length === 0 ? (
                    <p className="text-xs text-ink-400 text-center py-6">Пусто</p>
                  ) : col.tasks.map((t: any) => <TaskChip key={t.id} task={t} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {deadlineData.map((col) => (
              <div key={col.id} className="shrink-0 w-64">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{col.label}</span>
                  <span className="text-xs text-ink-400">{col.tasks.length}</span>
                </div>
                <div className="space-y-2 bg-[var(--surface-muted)] rounded-xl p-2 min-h-[120px]">
                  {col.tasks.length === 0 ? (
                    <p className="text-xs text-ink-400 text-center py-6">Пусто</p>
                  ) : col.tasks.map((t: any) => <TaskChip key={t.id} task={t} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Новая задача"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button
              isLoading={createMutation.isPending}
              disabled={!newTask.title}
              onClick={() => createMutation.mutate({ title: newTask.title, description: newTask.description, dueDate: newTask.dueDate || undefined, organizationId: user?.organizationId })}
            >
              Создать
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Название" autoFocus value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Что нужно сделать?" />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Описание</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
              className="field resize-none"
              placeholder="Подробности задачи…"
            />
          </div>
          <Input label="Крайний срок" type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
