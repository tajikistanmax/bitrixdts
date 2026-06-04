import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/project.service';
import { employeeService } from '../services/employee.service';
import { Button, Input, Modal, Badge } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { useForm } from 'react-hook-form';
import type { Project, CreateProjectDTO } from '../types/project';

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProjectDTO>();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: projectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreateModal(false);
      reset();
      toast.success('Проект успешно создан');
    },
    onError: () => {
      toast.error('Ошибка создания проекта');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Проект удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления проекта');
    },
  });

  const onSubmit = (data: CreateProjectDTO) => {
    createMutation.mutate(data);
  };

  const statusColors = {
    active: 'success',
    completed: 'default',
    on_hold: 'warning',
    cancelled: 'danger',
  } as const;

  const statusLabels = {
    active: 'Активен',
    completed: 'Завершён',
    on_hold: 'На паузе',
    cancelled: 'Отменён',
  } as const;

  return (
    <div className="">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Проекты</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              + Новый проект
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">Проектов пока нет</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Создать первый проект
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {projects.map((project: Project) => (
                <div
                  key={project.id}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusColors[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Прогресс</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>
                      Начало: {new Date(project.startDate).toLocaleDateString('ru-RU')}
                    </span>
                    {project.endDate && (
                      <span>
                        Окончание: {new Date(project.endDate).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedProject(project)}
                    >
                      Просмотр
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm('Вы уверены?')) {
                          deleteMutation.mutate(project.id);
                        }
                      }}
                      isLoading={deleteMutation.isPending}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Новый проект"
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
            label="Название проекта"
            placeholder="Введите название"
            {...register('name', { required: 'Название обязательно' })}
            error={errors.name?.message}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Описание проекта"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Дата начала"
              type="date"
              {...register('startDate')}
            />
            <Input
              label="Дата окончания"
              type="date"
              {...register('endDate')}
            />
          </div>
          <Input
            label="Бюджет (₽)"
            type="number"
            placeholder="0"
            {...register('budget', { valueAsNumber: true })}
          />
        </form>
      </Modal>

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject.name}
          size="xl"
          footer={
            <Button variant="secondary" onClick={() => setSelectedProject(null)}>
              Закрыть
            </Button>
          }
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Описание</h4>
              <p className="mt-1 text-gray-600">
                {selectedProject.description || 'Нет описания'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Статус</h4>
                <Badge variant={statusColors[selectedProject.status]}>
                  {statusLabels[selectedProject.status]}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Прогресс</h4>
                <p className="mt-1 text-gray-900">{selectedProject.progress}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Дата начала</h4>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedProject.startDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
              {selectedProject.endDate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Дата окончания</h4>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedProject.endDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
            {selectedProject.budget && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Бюджет</h4>
                <p className="mt-1 text-gray-900">
                  {selectedProject.budget.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
