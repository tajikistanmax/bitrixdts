import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  LifebuoyIcon,
  MagnifyingGlassIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { serviceDeskService } from '../services/serviceDesk.service';
import type { Ticket } from '../types/serviceDesk';
import {
  Button,
  Input,
  Modal,
  Badge,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

const priorityMeta: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'danger' }> = {
  low: { label: 'Низкий', variant: 'default' },
  medium: { label: 'Средний', variant: 'info' },
  high: { label: 'Высокий', variant: 'warning' },
  critical: { label: 'Критический', variant: 'danger' },
};

const statusMeta: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'default' }> = {
  open: { label: 'Новый', variant: 'info' },
  in_progress: { label: 'В работе', variant: 'warning' },
  resolved: { label: 'Решён', variant: 'success' },
  closed: { label: 'Закрыт', variant: 'default' },
};

interface CreateForm {
  title: string;
  description: string;
  priority: string;
}

export default function ServiceDeskPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    defaultValues: { title: '', description: '', priority: 'medium' },
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => serviceDeskService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => serviceDeskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowCreateModal(false);
      reset();
      toast.success('Заявка создана');
    },
    onError: () => toast.error('Не удалось создать заявку'),
  });

  const onSubmit = handleSubmit((data) => createMutation.mutate(data));

  const filteredTickets = tickets
    .filter((t: Ticket) => statusFilter === 'all' || t.status === statusFilter)
    .filter((t: Ticket) => t.title.toLowerCase().includes(search.toLowerCase()));

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Все', count: tickets.length },
    { id: 'open', label: 'Новые', count: tickets.filter((t: Ticket) => t.status === 'open').length },
    { id: 'in_progress', label: 'В работе', count: tickets.filter((t: Ticket) => t.status === 'in_progress').length },
    { id: 'resolved', label: 'Решённые', count: tickets.filter((t: Ticket) => t.status === 'resolved').length },
    { id: 'closed', label: 'Закрытые', count: tickets.filter((t: Ticket) => t.status === 'closed').length },
  ];

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Service Desk"
        subtitle="Заявки в техническую поддержку"
        icon={<LifebuoyIcon />}
        action={
          <Button onClick={() => setShowCreateModal(true)}>Создать заявку</Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === f.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-[var(--surface-muted)] text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    statusFilter === f.id ? 'bg-white/20' : 'bg-[var(--surface)] text-ink-500'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
          <div className="w-full sm:w-64">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск заявок…"
              leftIcon={<MagnifyingGlassIcon />}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filteredTickets.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<TicketIcon />}
              title="Заявок пока нет"
              description="Создайте первую заявку в техническую поддержку."
              action={<Button onClick={() => setShowCreateModal(true)}>Создать заявку</Button>}
            />
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left text-xs uppercase text-ink-500">
                    <th className="px-4 py-3 font-medium">№</th>
                    <th className="px-4 py-3 font-medium">Тема</th>
                    <th className="px-4 py-3 font-medium">Приоритет</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium">Автор</th>
                    <th className="px-4 py-3 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket: Ticket) => {
                    const priority = priorityMeta[ticket.priority] ?? { label: ticket.priority, variant: 'default' as const };
                    const status = statusMeta[ticket.status] ?? { label: ticket.status, variant: 'default' as const };
                    return (
                      <tr
                        key={ticket.id}
                        className="row-hover border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-ink-400">
                          #{ticket.id.slice(0, 6)}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-50">
                          {ticket.title}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={priority.variant} dot>{priority.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status.variant} dot>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={ticket.requester?.fullName} size="xs" />
                            <span className="truncate text-ink-600 dark:text-ink-300">
                              {ticket.requester?.fullName || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-500">
                          {formatDate(ticket.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs text-ink-500">
              Всего: {filteredTickets.length}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); reset(); }}
        title="Новая заявка"
        description="Опишите проблему, и мы возьмём её в работу"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); reset(); }}>
              Отмена
            </Button>
            <Button onClick={onSubmit} isLoading={createMutation.isPending}>
              Создать
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Тема заявки"
            placeholder="Кратко опишите проблему"
            error={errors.title ? 'Укажите тему заявки' : undefined}
            autoFocus
            {...register('title', { required: true })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
              Описание
            </label>
            <textarea
              className="field"
              rows={4}
              placeholder="Подробное описание проблемы…"
              {...register('description')}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
              Приоритет
            </label>
            <select className="field" {...register('priority', { required: true })}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="critical">Критический</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
