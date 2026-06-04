import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from '../services/trip.service';
import { PageHeader } from '../components/ui';
import type { BusinessTrip } from '../types/trip';
import { useForm } from 'react-hook-form';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  approved: 'Одобрен',
  rejected: 'Отклонён',
};

export default function TripPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<{
    destination: string;
    purpose: string;
    startDate: string;
    endDate: string;
  }>();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: tripService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setShowCreateModal(false);
      reset();
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <PageHeader title="Командировки" action={<button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              + Создать командировку
            </button>} />

      <main className="max-w-7xl mx-auto py-6 px-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сотрудник</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Город</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цель</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Начало</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Конец</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">Загрузка...</td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Командировки не найдены</td>
                  </tr>
                ) : (
                  trips.map((trip: BusinessTrip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {trip.employee?.fullName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {trip.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {trip.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(trip.startDate).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(trip.endDate).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[trip.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[trip.status] || trip.status}
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
            <h2 className="text-xl font-bold mb-4">Новая командировка</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Город</label>
                <input
                  {...register('destination', { required: true })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Цель</label>
                <input
                  {...register('purpose', { required: true })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Начало</label>
                <input
                  {...register('startDate', { required: true })}
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Конец</label>
                <input
                  {...register('endDate', { required: true })}
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
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