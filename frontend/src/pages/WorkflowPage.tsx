import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflow.service';
import type { WorkflowInstance } from '../types/workflow';
import {
  Button,
  Badge,
  Card,
  Modal,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';
import {
  ArrowsRightLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type TabFilter = 'all' | 'in_progress' | 'approved' | 'rejected';

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  pending: 'warning',
  in_progress: 'info',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'default',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В процессе',
  approved: 'Согласовано',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
};

export default function WorkflowPage() {
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['workflow-instances'],
    queryFn: () => workflowService.getMyActive(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ instanceId, stepOrder }: { instanceId: string; stepOrder: number }) =>
      workflowService.approve(instanceId, stepOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      toast.success('Согласовано');
    },
    onError: () => {
      toast.error('Ошибка согласования');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ instanceId, stepOrder, comment }: { instanceId: string; stepOrder: number; comment: string }) =>
      workflowService.reject(instanceId, stepOrder, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      setShowRejectModal(false);
      setRejectComment('');
      setSelectedInstance(null);
      toast.success('Отклонено');
    },
    onError: () => {
      toast.error('Ошибка отклонения');
    },
  });

  const handleApprove = (instance: WorkflowInstance) => {
    approveMutation.mutate({
      instanceId: instance.id,
      stepOrder: instance.currentStep,
    });
  };

  const handleReject = (instance: WorkflowInstance) => {
    setSelectedInstance(instance);
    setShowRejectModal(true);
  };

  const submitReject = () => {
    if (selectedInstance && rejectComment.trim()) {
      rejectMutation.mutate({
        instanceId: selectedInstance.id,
        stepOrder: selectedInstance.currentStep,
        comment: rejectComment,
      });
    }
  };

  const closeReject = () => {
    setShowRejectModal(false);
    setRejectComment('');
    setSelectedInstance(null);
  };

  const filtered = instances.filter((i: WorkflowInstance) => {
    const matchesTab = tabFilter === 'all' || i.status === tabFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      i.route.name.toLowerCase().includes(q) ||
      i.entityType.toLowerCase().includes(q) ||
      i.entityId.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Все', count: instances.length },
    {
      id: 'in_progress',
      label: 'В процессе',
      count: instances.filter((i: WorkflowInstance) => i.status === 'in_progress').length,
    },
    {
      id: 'approved',
      label: 'Согласовано',
      count: instances.filter((i: WorkflowInstance) => i.status === 'approved').length,
    },
    {
      id: 'rejected',
      label: 'Отклонено',
      count: instances.filter((i: WorkflowInstance) => i.status === 'rejected').length,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Согласования"
        subtitle="Маршруты и заявки на согласование"
        icon={<ClipboardDocumentCheckIcon />}
        tabs={
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tabFilter === tab.id
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'text-ink-500 hover:bg-[var(--surface-muted)]'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-ink-400">{tab.count}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        <div className="mb-4 max-w-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по маршруту или сущности..."
              className="field pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<ArrowsRightLeftIcon />}
              title="Нет согласований"
              description="Активные заявки на согласование будут отображаться здесь"
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((instance: WorkflowInstance) => {
              const totalSteps = instance.route.steps.length || 1;
              const progress = Math.min(
                100,
                Math.round((instance.currentStep / totalSteps) * 100)
              );
              return (
                <Card key={instance.id} padding="md" className="card-hover">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">
                          {instance.route.name}
                        </h3>
                        <Badge variant={statusVariant[instance.status] || 'default'} dot>
                          {statusLabels[instance.status] || instance.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-500">
                        {instance.entityType} #{instance.entityId.slice(0, 8)}
                        <span className="mx-2 text-ink-300">•</span>
                        Начато{' '}
                        {new Date(instance.startedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>

                      {/* Маршрут / этапы */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {instance.route.steps.map((step) => {
                          const done = step.order < instance.currentStep;
                          const current =
                            step.order === instance.currentStep && instance.status === 'in_progress';
                          return (
                            <div key={step.order} className="flex items-center gap-1.5">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  done
                                    ? 'bg-emerald-500 text-white'
                                    : current
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-[var(--surface-muted)] text-ink-500 border border-[var(--border)]'
                                }`}
                                title={step.type}
                              >
                                {done ? <CheckIcon className="w-3.5 h-3.5" /> : step.order}
                              </span>
                              {step.order < totalSteps && (
                                <span className="w-4 h-px bg-[var(--border)]" />
                              )}
                            </div>
                          );
                        })}
                        <span className="ml-2 text-xs text-ink-500">
                          Шаг {instance.currentStep}/{totalSteps} · {progress}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-muted)] max-w-xs">
                        <div
                          className="h-1.5 rounded-full bg-primary-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {instance.status === 'in_progress' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="success"
                          size="sm"
                          leftIcon={<CheckIcon className="w-4 h-4" />}
                          isLoading={approveMutation.isPending}
                          onClick={() => handleApprove(instance)}
                        >
                          Одобрить
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<XMarkIcon className="w-4 h-4" />}
                          onClick={() => handleReject(instance)}
                        >
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            <p className="text-xs text-ink-500 px-1">Всего: {filtered.length}</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={closeReject}
        title="Отклонить согласование"
        description={selectedInstance?.route.name}
        footer={
          <>
            <Button variant="outline" onClick={closeReject}>
              Отмена
            </Button>
            <Button
              variant="danger"
              isLoading={rejectMutation.isPending}
              disabled={!rejectComment.trim()}
              onClick={submitReject}
            >
              Отклонить
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
          Причина отклонения
        </label>
        <textarea
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          placeholder="Укажите причину отклонения..."
          className="field"
          rows={4}
          autoFocus
        />
      </Modal>
    </div>
  );
}
