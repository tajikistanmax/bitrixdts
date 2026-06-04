import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { employeeService } from '../services/employee.service';
import { projectService } from '../services/project.service';
import { Button, Input, Modal, Badge } from '../components/ui';
import { TaskCard } from '../components/TaskCard';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { useToast } from '../components/ui/Toast';
import { useForm } from 'react-hook-form';
import type { Task, CreateTaskDTO } from '../types/task';
import type { Employee } from '../types/employee';

export default function TasksPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my' | 'todo' | 'done'>('all');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<CreateTaskDTO>();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreateModal(false);
      reset();
      toast.success('Задача успешно создана');
    },
    onError: () => {
      toast.error('Ошибка создания задачи');
    },
  });

  const filteredTasks = tasks.filter((task: Task) => {
    if (filter === 'my') return true; // TODO: filter by current user
    if (filter === 'todo') return task.status === 'todo';
    if (filter === 'done') return task.status === 'done';
    return true;
  });

  const kanbanColumns = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
  const columnTitles = {
    todo: 'Нужно сделать',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Готово',
    cancelled: 'Отменено',
  };

  const onSubmit = (data: CreateTaskDTO) => {
    createMutation.mutate(data);
  };

  return (
    <div className="">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Задачи</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              + Новая задача
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Все
            </Button>
            <Button
              variant={filter === 'my' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('my')}
            >
              Мои
            </Button>
            <Button
              variant={filter === 'todo' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('todo')}
            >
              Новые
            </Button>
            <Button
              variant={filter === 'done' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('done')}
            >
              Готовые
            </Button>
          </div>

          {/* Kanban Board */}
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">Задач нет</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Создать первую задачу
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {kanbanColumns.map((status) => {
                const columnTasks = filteredTasks.filter(
                  (task: Task) => task.status === status
                );
                return (
                  <div key={status} className="bg-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-700">
                        {columnTitles[status as keyof typeof columnTitles]}
                      </h3>
                      <Badge variant="default" size="sm">
                        {columnTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {columnTasks.map((task: Task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => setSelectedTaskId(task.id)}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Новая задача"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending}
            >
              Создать
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Название"
            placeholder="Введите название задачи"
            {...register('title', { required: 'Название обязательно' })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Описание задачи"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Исполнитель
              </label>
              <select
                {...register('assigneeId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Не назначен</option>
                {employees.map((emp: Employee) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select
                {...register('priority')}
                defaultValue="medium"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочно</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Срок выполнения
            </label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Проект
            </label>
            <select
              {...register('projectId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Нет проекта</option>
              {projects.map((proj: any) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
