import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  NewspaperIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { newsService } from '../services/news.service';
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
import type { NewsItem } from '../types/news';

interface NewsForm {
  title: string;
  body: string;
  category: string;
}

export default function NewsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<NewsForm>();

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => newsService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: NewsForm) => newsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setShowCreateModal(false);
      reset();
      toast.success('Новость опубликована');
    },
    onError: () => toast.error('Ошибка публикации новости'),
  });

  const onSubmit = (data: NewsForm) => createMutation.mutate(data);

  const filtered = news.filter((item: NewsItem) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const createButton = (
    <Button leftIcon={<PlusIcon />} onClick={() => setShowCreateModal(true)}>
      Добавить новость
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Новости компании" icon={<NewspaperIcon />} action={createButton} />

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-md mb-5">
          <Input
            leftIcon={<MagnifyingGlassIcon />}
            placeholder="Поиск новостей…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<NewspaperIcon />}
            title={search ? 'Ничего не найдено' : 'Новостей пока нет'}
            description={
              search
                ? 'Попробуйте изменить поисковый запрос.'
                : 'Опубликуйте первую новость компании.'
            }
            action={!search ? createButton : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item: NewsItem) => (
              <Card
                key={item.id}
                hover
                padding="none"
                className="flex flex-col overflow-hidden cursor-pointer"
                onClick={() => setSelected(item)}
              >
                <div className="h-28 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center relative">
                  <NewspaperIcon className="w-10 h-10 text-white/80" />
                  {item.category && (
                    <span className="absolute top-3 right-3">
                      <Badge variant="primary" size="sm">
                        {item.category}
                      </Badge>
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3 p-5 flex-1">
                  <h3 className="font-semibold text-ink-900 dark:text-ink-50 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink-500 line-clamp-3 flex-1">{item.body}</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                    <Avatar
                      name={item.author?.fullName}
                      src={item.author?.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-100 truncate">
                        {item.author?.fullName || 'Автор'}
                      </p>
                      <p className="text-xs text-ink-500">{formatDate(item.publishedAt)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Детали новости */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        size="2xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={selected.author?.fullName}
                src={selected.author?.avatarUrl}
                size="md"
              />
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                  {selected.author?.fullName || 'Автор'}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-ink-500">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  {formatDate(selected.publishedAt)}
                </p>
              </div>
              {selected.category && (
                <span className="ml-auto">
                  <Badge variant="primary" size="sm">
                    {selected.category}
                  </Badge>
                </span>
              )}
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-200 whitespace-pre-line leading-relaxed">
              {selected.body}
            </p>
          </div>
        )}
      </Modal>

      {/* Создание новости */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Новая новость"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                reset();
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending}
            >
              Опубликовать
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Заголовок" placeholder="Заголовок новости" {...register('title', { required: true })} />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Текст новости
            </label>
            <textarea
              {...register('body', { required: true })}
              rows={6}
              className="field"
              placeholder="Текст новости…"
            />
          </div>
          <Input
            label="Категория"
            placeholder="Необязательно"
            {...register('category')}
          />
        </form>
      </Modal>
    </div>
  );
}
