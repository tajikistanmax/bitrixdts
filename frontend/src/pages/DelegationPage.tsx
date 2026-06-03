import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { delegationService } from '../services/delegation.service';
import type { Delegation } from '../types/delegation';
import { useForm } from 'react-hook-form';

export default function DelegationPage() {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<{
    delegateeId: string;
    startDate: string;
    endDate: string;
  }>();

  const { data: delegations = [], isLoading } = useQuery({
    queryKey: ['delegations'],
    queryFn: () => delegationService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: delegationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
      setShowCreateModal(false);
      reset();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      delegationService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });

  const filteredDelegations = delegations.filter((d: Delegation) =>
    d.delegatee?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.delegator?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Делегирование</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              + Добавить
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Поиск делегирований..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Делегатор</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Исполнитель</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Начало</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Конец</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">Загрузка...</td>
                  </tr>
                ) : filteredDelegations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Делегирования не найдены</td>
                  </tr>
                ) : (
                  filteredDelegations.map((del: Delegation) => (
                    <tr key={del.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{del.delegator?.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{del.delegatee?.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(del.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{del.endDate ? new Date(del.endDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleMutation.mutate({ id: del.id, isActive: !del.isActive })}
                          className={`px-2 py-1 text-xs rounded-full border ${
                            del.isActive
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          {del.isActive ? 'Активен' : 'Не активен'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Новое делегирование</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID исполнителя</label>
                <input {...register('delegateeId', { required: true })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата начала</label>
                <input {...register('startDate', { required: true })} type="date" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата конца</label>
                <input {...register('endDate')} type="date" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
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
    </div>
  );
}
