import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncService } from '../services/sync.service';
import {
  Button,
  Badge,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import type { SyncItem } from '../types/sync';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const statusMeta: Record<string, { label: string; variant: BadgeVariant }> = {
  completed: { label: 'Завершено', variant: 'success' },
  failed: { label: 'Ошибка', variant: 'danger' },
  processing: { label: 'В обработке', variant: 'warning' },
  pending: { label: 'Ожидает', variant: 'default' },
};

function statusFor(status: string) {
  return statusMeta[status] ?? { label: status, variant: 'default' as BadgeVariant };
}

export default function SyncPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['sync-queue'],
    queryFn: () => syncService.getQueue(),
  });

  const { data: stats } = useQuery({
    queryKey: ['sync-stats'],
    queryFn: () => syncService.getStats(),
  });

  const processAllMutation = useMutation({
    mutationFn: () => syncService.processAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
      toast.success('Синхронизация запущена');
    },
    onError: () => toast.error('Не удалось запустить синхронизацию'),
  });

  const statCards: Array<{
    label: string;
    value: number;
    variant: BadgeVariant;
    icon: React.ReactNode;
  }> = [
    { label: 'Всего', value: stats?.total ?? 0, variant: 'info', icon: <QueueListIcon /> },
    {
      label: 'В обработке',
      value: stats?.processing ?? 0,
      variant: 'warning',
      icon: <ArrowPathIcon />,
    },
    {
      label: 'Ошибок',
      value: stats?.failed ?? 0,
      variant: 'danger',
      icon: <ExclamationTriangleIcon />,
    },
    {
      label: 'Завершено',
      value: stats?.completed ?? 0,
      variant: 'success',
      icon: <CheckCircleIcon />,
    },
  ];

  const iconTone: Record<BadgeVariant, string> = {
    default: 'bg-ink-100 text-ink-500 dark:bg-ink-800',
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300',
    purple: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Синхронизация"
        icon={<ArrowsRightLeftIcon />}
        action={
          <Button
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            isLoading={processAllMutation.isPending}
            onClick={() => processAllMutation.mutate()}
          >
            {processAllMutation.isPending ? 'Синхронизация…' : 'Синхронизировать всё'}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          {statCards.map((card) => (
            <Card key={card.label} className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 shrink-0 ${iconTone[card.variant]}`}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-50 leading-tight">
                  {card.value}
                </p>
                <p className="text-sm text-ink-500 truncate">{card.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Queue */}
        {isLoading ? (
          <LoadingState />
        ) : queue.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<ArrowsRightLeftIcon />}
              title="Очередь пуста"
              description="Нет элементов, ожидающих синхронизации."
            />
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {queue.map((item: SyncItem) => {
              const s = statusFor(item.status);
              return (
                <Card key={item.id} hover className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">
                        {item.entityType}
                      </h3>
                      <p className="text-xs text-ink-500 truncate">{item.action}</p>
                    </div>
                    <Badge variant={s.variant} dot size="sm">
                      {s.label}
                    </Badge>
                  </div>
                  <div className="pt-3 border-t border-[var(--border)] flex items-center gap-1.5 text-xs text-ink-500">
                    <ClockIcon className="w-4 h-4" />
                    Обновлено: {new Date(item.createdAt).toLocaleString('ru-RU')}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
