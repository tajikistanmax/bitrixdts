import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { employeeService } from '../services/employee.service';
import { projectService } from '../services/project.service';
import { Modal, Button, Badge, Input } from './ui';
import { CommentsSection } from './CommentsSection';
import { useToast } from './ui/Toast';
import type { UpdateTaskDTO } from '../types/task';

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateTaskDTO>({});
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskId ? taskService.getById(taskId) : Promise.resolve(null),
    enabled: !!taskId && isOpen,
  });

  useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDTO }) =>
      taskService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      }
      setIsEditing(false);
      toast.success('Задача обновлена');
    },
    onError: () => {
      toast.error('Ошибка обновления задачи');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Задача удалена');
      onClose();
    },
    onError: () => {
      toast.error('Ошибка удаления задачи');
    },
  });

  const handleSave = () => {
    if (taskId) {
      updateMutation.mutate({ id: taskId, data: editData });
    }
  };

  const statusColors = {
    todo: 'default',
    in_progress: 'info',
    review: 'warning',
    done: 'success',
    cancelled: 'danger',
  } as const;

  const priorityColors = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'danger',
  } as const;

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Задача #${task.id.slice(0, 8)}`}
      size="xl"
      footer={
        <>
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                Сохранить
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm('Удалить задачу?')) {
                    deleteMutation.mutate(task.id);
                  }
                }}
              >
                Удалить
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Закрыть
              </Button>
            </>
          )}
        </>
      }
    >
      {isLoading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <div className="space-y-6">
          {/* Title & Status */}
          <div>
            {isEditing ? (
              <Input
                value={editData.title || task.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                className="text-xl font-semibold"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            )}
            <div className="mt-2 flex gap-2">
              <Badge variant={statusColors[task.status as keyof typeof statusColors]}>
                {task.status === 'todo' && 'Нужно сделать'}
                {task.status === 'in_progress' && 'В работе'}
                {task.status === 'review' && 'На проверке'}
                {task.status === 'done' && 'Готово'}
                {task.status === 'cancelled' && 'Отменено'}
              </Badge>
              <Badge variant={priorityColors[task.priority as keyof typeof priorityColors]}>
                {task.priority === 'low' && 'Низкий'}
                {task.priority === 'medium' && 'Средний'}
                {task.priority === 'high' && 'Высокий'}
                {task.priority === 'urgent' && 'Срочно'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Описание</h4>
            {isEditing ? (
              <textarea
                value={editData.description || task.description || ''}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-600">
                {task.description || 'Нет описания'}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <h4 className="text-sm font-medium text-gray-700">Исполнитель</h4>
              <p className="mt-1 text-gray-900">
                {task.assignee?.fullName || 'Не назначен'}
              </p>
            </div>

            {/* Controller */}
            <div>
              <h4 className="text-sm font-medium text-gray-700">Контролёр</h4>
              <p className="mt-1 text-gray-900">
                {task.controller?.fullName || 'Не назначен'}
              </p>
            </div>

            {/* Due Date */}
            <div>
              <h4 className="text-sm font-medium text-gray-700">Срок</h4>
              <p className="mt-1 text-gray-900">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('ru-RU')
                  : 'Не установлен'}
              </p>
            </div>

            {/* Project */}
            <div>
              <h4 className="text-sm font-medium text-gray-700">Проект</h4>
              <p className="mt-1 text-gray-900">
                {task.project?.name || 'Нет проекта'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="text-sm text-gray-500">
            <p>Создано: {new Date(task.createdAt).toLocaleDateString('ru-RU')}</p>
            <p>Обновлено: {new Date(task.updatedAt).toLocaleDateString('ru-RU')}</p>
          </div>

          {/* Comments */}
          {task.comments && (
            <CommentsSection taskId={task.id} comments={task.comments} />
          )}
        </div>
      )}
    </Modal>
  );
};
