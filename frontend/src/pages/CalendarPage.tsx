import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '../services/calendar.service';
import type { CalendarEvent } from '../types/calendar';
import { useForm } from 'react-hook-form';

export default function CalendarPage() {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    type: string;
  }>();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: calendarService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowCreateModal(false);
      reset();
    },
  });

  const filteredEvents = events.filter((e: CalendarEvent) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Календарь</h1>
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
              placeholder="Поиск событий..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата начала</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата конца</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">Загрузка...</td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">События не найдены</td>
                  </tr>
                ) : (
                  filteredEvents.map((event: CalendarEvent) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{event.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(event.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(event.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{event.type}</td>
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
            <h2 className="text-xl font-bold mb-4">Новое событие</h2>
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
                <label className="block text-sm font-medium text-gray-700">Дата начала</label>
                <input {...register('startDate', { required: true })} type="datetime-local" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата конца</label>
                <input {...register('endDate', { required: true })} type="datetime-local" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Тип</label>
                <select {...register('type', { required: true })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="meeting">Встреча</option>
                  <option value="deadline">Дедлайн</option>
                  <option value="event">Мероприятие</option>
                  <option value="other">Другое</option>
                </select>
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
