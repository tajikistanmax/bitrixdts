import React from 'react';
import type { TaskWithDetails } from '../types/task-extended';
import { Badge } from './ui/Badge';

interface TaskCardProps {
  task: TaskWithDetails;
  onClick?: () => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, compact = false }) => {
  const statusColors = {
    todo: 'default',
    in_progress: 'info',
    review: 'warning',
    done: 'success',
    cancelled: 'danger',
  } as const;

  const statusLabels = {
    todo: 'Нужно сделать',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Готово',
    cancelled: 'Отменено',
  } as const;

  const priorityColors = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'danger',
  } as const;

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочно',
  } as const;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="bg-white border rounded p-3 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900 line-clamp-2">{task.title}</h4>
          <Badge variant={priorityColors[task.priority]} size="sm">
            {priorityLabels[task.priority]}
          </Badge>
        </div>
        {task.assignee && (
          <p className="text-sm text-gray-600">{task.assignee.fullName}</p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{task.title}</h3>
        <Badge variant={statusColors[task.status]}>
          {statusLabels[task.status]}
        </Badge>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta info */}
      <div className="space-y-2 text-sm">
        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">👤</span>
            <span>{task.assignee.fullName}</span>
          </div>
        )}

        {/* Controller */}
        {task.controller && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">👁️</span>
            <span>Контроль: {task.controller.fullName}</span>
          </div>
        )}

        {/* Due date */}
        {task.dueDate && (
          <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            <span className="mr-2">📅</span>
            <span>
              {new Date(task.dueDate).toLocaleDateString('ru-RU')}
              {isOverdue && ' (Просрочено)'}
            </span>
          </div>
        )}

        {/* Project */}
        {task.project && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">📁</span>
            <span>{task.project.name}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <Badge variant={priorityColors[task.priority]} size="sm">
          {priorityLabels[task.priority]}
        </Badge>
        {task.comments && task.comments.length > 0 && (
          <span className="text-xs text-gray-500">
            💬 {task.comments.length}
          </span>
        )}
      </div>
    </div>
  );
};
