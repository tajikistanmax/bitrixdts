import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflow.service';
import { Button, Badge, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import type { WorkflowInstance } from '../types/workflow';

export default function WorkflowPage() {
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
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

  const statusColors = {
    pending: 'default',
    in_progress: 'info',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'default',
  } as const;

  const statusLabels = {
    pending: 'Ожидает',
    in_progress: 'В процессе',
    approved: 'Согласовано',
    rejected: 'Отклонено',
    cancelled: 'Отменено',
  } as const;

  return (
    <div className="">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Согласования</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : instances.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">Нет активных согласований</p>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance: WorkflowInstance) => (
                <div
                  key={instance.id}
                  className="bg-white shadow rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {instance.route.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Сущность: {instance.entityType} #{instance.entityId.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Шаг {instance.currentStep} из {instance.route.steps.length}
                      </p>
                    </div>
                    <Badge variant={statusColors[instance.status]}>
                      {statusLabels[instance.status]}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Прогресс</span>
                      <span className="font-medium">
                        {Math.round((instance.currentStep / instance.route.steps.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(instance.currentStep / instance.route.steps.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Started info */}
                  <div className="text-sm text-gray-500 mb-4">
                    Начато: {new Date(instance.startedAt).toLocaleDateString('ru-RU')}
                  </div>

                  {/* Actions */}
                  {instance.status === 'in_progress' && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(instance)}
                        isLoading={approveMutation.isPending}
                      >
                        ✓ Согласовать
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleReject(instance)}
                      >
                        ✗ Отклонить
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectComment('');
        }}
        title="Отклонить согласование"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectComment('');
              }}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={submitReject}
              isLoading={rejectMutation.isPending}
              disabled={!rejectComment.trim()}
            >
              Отклонить
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Причина отклонения *
          </label>
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Укажите причину отклонения..."
          />
        </div>
      </Modal>
    </div>
  );
}
