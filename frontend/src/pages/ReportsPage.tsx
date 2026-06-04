import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import { Button, Input, Modal } , PageHeader } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { useForm } from 'react-hook-form';
import type { Report } from '../types/report';

export default function ReportsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: reportService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowCreateModal(false);
      reset();
      toast.success('Отчёт успешно создан');
    },
    onError: () => {
      toast.error('Ошибка создания отчёта');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reportService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Отчёт удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления отчёта');
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <>
<header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Отчёты</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              + Новый отчёт
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">Отчётов пока нет</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Создать первый отчёт
              </Button>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Создан</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Автор</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report: Report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdBy?.fullName || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (confirm('Вы уверены, что хотите удалить отчёт?')) {
                              deleteMutation.mutate(report.id);
                            }
                          }}
                          isLoading={deleteMutation.isPending}
                        >
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Новый отчёт"
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
            label="Название отчёта"
            placeholder="Введите название"
            {...register('title', { required: 'Название обязательно' })}
            error={errors.title?.message as string}
          />
          <Input
            label="Тип отчёта"
            placeholder="Например: Ежемесячный, Квартальный"
            {...register('type', { required: 'Тип обязателен' })}
            error={errors.type?.message as string}
          />
        </form>
      </Modal>
    </>
  );
}
