import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { Button, Input } from './ui';
import { useToast } from './ui/Toast';
import type { TaskComment } from '../types/task';
import type { Employee } from '../types/employee';

interface CommentsSectionProps {
  taskId: string;
  comments: TaskComment[];
  employees?: Employee[];
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  taskId,
  comments,
  employees = [],
}) => {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: string }) =>
      taskService.addComment(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setNewComment('');
      toast.success('Комментарий добавлен');
    },
    onError: () => {
      toast.error('Ошибка добавления комментария');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ taskId, body: newComment });
  };

  const getAuthorName = (authorId: string) => {
    const employee = employees.find((e) => e.id === authorId);
    return employee?.fullName || 'Неизвестный';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">
        Комментарии ({comments.length})
      </h3>

      {/* Comments list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Комментариев пока нет
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg ${
                comment.systemComment
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-sm text-gray-900">
                    {getAuthorName(comment.authorId)}
                  </span>
                  {comment.systemComment && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Система
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.body}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="pt-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Напишите комментарий..."
            className="flex-1"
          />
          <Button
            type="submit"
            isLoading={addCommentMutation.isPending}
            disabled={!newComment.trim()}
          >
            Отправить
          </Button>
        </div>
      </form>
    </div>
  );
};
