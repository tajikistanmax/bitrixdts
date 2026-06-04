import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resolutionService } from '../services/resolution.service';
import { PageHeader } from '../components/ui';
import type { Resolution } from '../types/resolution';
import { useForm } from 'react-hook-form';

export default function ResolutionsPage() {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<{
    title: string;
    description: string;
    dueDate: string;
    executorId: string;
    controllerId: string;
  }>();

  const { data: resolutions = [], isLoading } = useQuery({
    queryKey: ['resolutions'],
    queryFn: () => resolutionService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: resolutionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolutions'] });
      setShowCreateModal(false);
      reset();
    },
  });

  const filteredResolutions = resolutions.filter((r: Resolution) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <PageHeader title="Резолюции" action={<button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              + Добавить
            </button>} />

      <main className="max-w-7xl mx-auto py-6 px-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Поиск резолюций..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Срок</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Исполнитель</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Контролёр</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">Загрузка...</td>
                  </tr>
                ) : filteredResolutions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Резолюции не найдены</td>
                  </tr>
                ) : (
                  filteredResolutions.map((res: Resolution) => (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{res.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{res.dueDate ? new Date(res.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{res.executor?.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{res.controller?.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          res.status === 'completed' ? 'bg-green-100 text-green-800' :
                          res.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {res.status === 'completed' ? 'Завершено' :
                           res.status === 'in_progress' ? 'В работе' : 'Новая'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Новая резолюция</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Название</label>
                <input {...register('title', { required: true })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Описание</label>
                <textarea {...register('description')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Срок</label>
                <input {...register('dueDate')} type="date" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ID исполнителя</label>
                <input {...register('executorId')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ID контролёра</label>
                <input {...register('controllerId')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">Отмена</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}