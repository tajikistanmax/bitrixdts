import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService } from '../services/meeting.service';
import { Button, Input, Modal, Badge } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import type { Meeting } from '../types/meeting';

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  planned: 'info',
  active: 'warning',
  completed: 'success',
  cancelled: 'default',
};

const statusLabels: Record<string, string> = {
  planned: 'Запланировано',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

export default function MeetingsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    room: '',
  });

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: () => meetingService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setShowCreateModal(false);
      setForm({ title: '', description: '', startTime: '', endTime: '', room: '' });
      toast.success('Встреча создана');
    },
    onError: () => toast.error('Ошибка создания встречи'),
  });

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Встречи</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              + Новая встреча
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">Встреч нет</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Создать первую встречу
              </Button>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата/Время
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Комната
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Организатор
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meetings.map((meeting: Meeting) => (
                    <tr key={meeting.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {meeting.title}
                        </div>
                        {meeting.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {meeting.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDateTime(meeting.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {meeting.room || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={statusColors[meeting.status] || 'default'}
                          size="sm"
                        >
                          {statusLabels[meeting.status] || meeting.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {meeting.creator?.fullName || '—'}
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
        title="Новая встреча"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              disabled={!form.title || !form.startTime || !form.endTime}
            >
              Создать
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Название"
            placeholder="Введите название встречи"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Описание встречи"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Начало"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
            />
            <Input
              label="Окончание"
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
            />
          </div>
          <Input
            label="Комната"
            placeholder="Номер или название комнаты"
            value={form.room}
            onChange={(e) => handleChange('room', e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
