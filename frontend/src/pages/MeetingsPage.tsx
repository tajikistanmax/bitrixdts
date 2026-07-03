import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { meetingService } from '../services/meeting.service';
import {
  Button,
  Input,
  Modal,
  Badge,
  Card,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';
import type { Meeting } from '../types/meeting';

const statusVariants: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  planned: 'info',
  active: 'warning',
  completed: 'success',
  cancelled: 'default',
};

const statusLabels: Record<string, string> = {
  planned: 'Запланировано',
  active: 'Идёт сейчас',
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const createButton = (
    <Button leftIcon={<PlusIcon />} onClick={() => setShowCreateModal(true)}>
      Запланировать встречу
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Встречи" icon={<VideoCameraIcon />} action={createButton} />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <LoadingState />
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={<VideoCameraIcon />}
            title="Встреч пока нет"
            description="Запланируйте первую встречу или видеоконференцию для вашей команды."
            action={createButton}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {meetings.map((meeting: Meeting) => {
              const participants = meeting.participants ?? [];
              const variant = statusVariants[meeting.status] || 'default';
              return (
                <Card key={meeting.id} hover className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">
                        {meeting.title}
                      </h3>
                      {meeting.description && (
                        <p className="mt-1 text-sm text-ink-500 line-clamp-2">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={variant} size="sm" dot>
                      {statusLabels[meeting.status] || meeting.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                      <CalendarDaysIcon className="w-4 h-4 text-ink-400 shrink-0" />
                      <span>{formatDate(meeting.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                      <ClockIcon className="w-4 h-4 text-ink-400 shrink-0" />
                      <span>
                        {formatTime(meeting.startTime)}
                        {meeting.endTime && ` – ${formatTime(meeting.endTime)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                      <MapPinIcon className="w-4 h-4 text-ink-400 shrink-0" />
                      <span>{meeting.room || 'Место не указано'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
                    {participants.length > 0 ? (
                      <div className="flex items-center -space-x-2">
                        {participants.slice(0, 4).map((p) => (
                          <Avatar
                            key={p.id}
                            name={p.employee?.fullName}
                            size="sm"
                            className="ring-2 ring-[var(--surface)]"
                          />
                        ))}
                        {participants.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] ring-2 ring-[var(--surface)] flex items-center justify-center text-xs font-medium text-ink-500">
                            +{participants.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-ink-400">
                        <UsersIcon className="w-4 h-4" />
                        Нет участников
                      </span>
                    )}
                    {meeting.creator?.fullName && (
                      <span className="text-xs text-ink-500 truncate">
                        {meeting.creator.fullName}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Новая встреча"
        description="Заполните детали встречи или видеоконференции."
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
              Запланировать
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Тема встречи"
            placeholder="Введите тему встречи"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="field"
              placeholder="Повестка или детали встречи"
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
            label="Место / ссылка"
            placeholder="Номер комнаты или ссылка на видеоконференцию"
            value={form.room}
            onChange={(e) => handleChange('room', e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
