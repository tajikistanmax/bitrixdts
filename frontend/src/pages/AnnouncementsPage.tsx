import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  MegaphoneIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { announcementService } from '../services/announcement.service';
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
import type { Announcement } from '../types/announcement';

const priorityVariants: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

const priorityLabels: Record<string, string> = {
  low: 'Обычное',
  medium: 'Информация',
  high: 'Важное',
  critical: 'Срочное',
};

interface AnnouncementForm {
  title: string;
  body: string;
  priority: string;
}

export default function AnnouncementsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<AnnouncementForm>({
    defaultValues: { priority: 'medium' },
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: AnnouncementForm) => announcementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowCreateModal(false);
      reset({ title: '', body: '', priority: 'medium' });
      toast.success('Объявление опубликовано');
    },
    onError: () => toast.error('Ошибка публикации объявления'),
  });

  const onSubmit = (data: AnnouncementForm) => createMutation.mutate(data);

  const filtered = announcements.filter((item: Announcement) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const createButton = (
    <Button leftIcon={<PlusIcon />} onClick={() => setShowCreateModal(true)}>
      Создать объявление
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Объявления" icon={<MegaphoneIcon />} action={createButton} />

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-md mb-5">
          <Input
            leftIcon={<MagnifyingGlassIcon />}
            placeholder="Поиск объявлений…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MegaphoneIcon />}
            title={search ? 'Ничего не найдено' : 'Объявлений нет'}
            description={
              search
                ? 'Попробуйте изменить поисковый запрос.'
                : 'Создайте первое объявление для сотрудников.'
            }
            action={!search ? createButton : undefined}
          />
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.map((item: Announcement) => {
              const variant = priorityVariants[item.priority] || 'default';
              return (
                <Card key={item.id} hover className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 flex items-center justify-center shrink-0">
                    <MegaphoneIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">
                        {item.title}
                      </h3>
                      <Badge variant={variant} size="sm" dot>
                        {priorityLabels[item.priority] || item.priority}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-600 dark:text-ink-300 line-clamp-3 whitespace-pre-line">
                      {item.body}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                      <Avatar name={item.author?.fullName} size="xs" />
                      <span>{item.author?.fullName || 'Автор'}</span>
                      <span className="text-ink-300 dark:text-ink-600">•</span>
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset({ title: '', body: '', priority: 'medium' });
        }}
        title="Новое объявление"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                reset({ title: '', body: '', priority: 'medium' });
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleSubmit(onSubmit)} isLoading={createMutation.isPending}>
              Опубликовать
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Заголовок"
            placeholder="Заголовок объявления"
            {...register('title', { required: true })}
          />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Текст объявления
            </label>
            <textarea
              {...register('body', { required: true })}
              rows={5}
              className="field"
              placeholder="Текст объявления…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Важность
            </label>
            <select {...register('priority', { required: true })} className="field">
              <option value="low">Обычное</option>
              <option value="medium">Информация</option>
              <option value="high">Важное</option>
              <option value="critical">Срочное</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
