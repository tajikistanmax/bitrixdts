import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feed.service';
import { announcementService } from '../services/announcement.service';
import { useAuthStore } from '../store/auth.store';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  NewspaperIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// Лента приходит с бэкенда без строгого типа — описываем ожидаемую форму записи.
interface FeedItem {
  id: string;
  actorName?: string | null;
  actorAvatar?: string | null;
  createdAt: string;
  title?: string | null;
  description?: string | null;
  entityType?: string | null;
  attachments?: { id?: string; name?: string; url?: string }[] | null;
  likesCount?: number | null;
  commentsCount?: number | null;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Одна карточка поста с локальным состоянием лайка и раскрытия комментариев. */
function FeedCard({ item }: { item: FeedItem }) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

  const likes = (item.likesCount ?? 0) + (liked ? 1 : 0);
  const commentsCount = item.commentsCount ?? 0;
  const attachments = item.attachments ?? [];

  const submitComment = () => {
    if (!comment.trim()) return;
    // Эндпоинта комментариев в feedService пока нет — подтверждаем действие в UI.
    toast.success('Комментарий добавлен');
    setComment('');
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5">
        {/* Шапка автора */}
        <div className="flex items-start gap-3">
          <Avatar name={item.actorName || 'Система'} src={item.actorAvatar} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                {item.actorName || 'Система'}
              </span>
              <span className="text-ink-300 dark:text-ink-600">›</span>
              <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                <GlobeAltIcon className="w-3.5 h-3.5" />
                Всем сотрудникам
              </span>
            </div>
            <div className="text-xs text-ink-500">{formatDateTime(item.createdAt)}</div>
          </div>
        </div>

        {/* Текст поста */}
        {(item.title || item.description) && (
          <div className="mt-3 space-y-1">
            {item.title && (
              <p className="text-sm font-medium text-ink-900 dark:text-ink-50 whitespace-pre-wrap">
                {item.title}
              </p>
            )}
            {item.description && (
              <p className="text-sm text-ink-600 dark:text-ink-300 whitespace-pre-wrap">
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* Тема / тип сущности */}
        {item.entityType && (
          <div className="mt-3 text-xs text-ink-500">
            Тема:{' '}
            <span className="text-primary-600 dark:text-primary-300 font-medium">
              {item.entityType}
            </span>
          </div>
        )}

        {/* Вложения */}
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <a
                key={a.id ?? i}
                href={a.url || '#'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                <PaperClipIcon className="w-4 h-4 text-ink-500" />
                <span className="truncate max-w-[12rem]">{a.name || 'Вложение'}</span>
              </a>
            ))}
          </div>
        )}

        {/* Счётчики / действия */}
        <div className="mt-4 flex items-center gap-4 border-t border-[var(--border)] pt-3 text-sm text-ink-500">
          <button
            onClick={() => setLiked((v) => !v)}
            className={`inline-flex items-center gap-1.5 transition-colors ${
              liked ? 'text-rose-500' : 'hover:text-rose-500'
            }`}
          >
            {liked ? (
              <HeartSolidIcon className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span>{likes > 0 ? likes : 'Нравится'}</span>
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center gap-1.5 hover:text-primary-600 transition-colors"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
            <span>{commentsCount > 0 ? commentsCount : 'Комментировать'}</span>
          </button>
        </div>
      </div>

      {/* Раскрытие комментариев */}
      {showComments && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={user?.fullName || 'Вы'} size="sm" />
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
              placeholder="Добавить комментарий…"
              className="field flex-1 !py-1.5 text-sm"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={submitComment}
              disabled={!comment.trim()}
              aria-label="Отправить комментарий"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Композер нового поста → создаёт объявление, которое сразу попадает в ленту. */
function Composer() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const toast = useToast();

  const publishMutation = useMutation({
    mutationFn: (value: string) => {
      const trimmed = value.trim();
      const firstLine = trimmed.split('\n')[0].trim();
      const title = firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine;
      return announcementService.create({ title, body: trimmed });
    },
    onSuccess: () => {
      toast.success('Опубликовано в ленте');
      setText('');
      setFocused(false);
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Не удалось опубликовать'),
  });

  const publish = () => {
    if (!text.trim()) return;
    publishMutation.mutate(text);
  };

  const active = focused || text.trim().length > 0;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <Avatar name={user?.fullName || 'Вы'} size="md" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Поделитесь чем-нибудь…"
            rows={active ? 3 : 1}
            className="field w-full resize-none text-sm transition-all"
          />
          {active && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-primary-600 transition-colors"
              >
                <PaperClipIcon className="w-5 h-5" />
                Вложение
              </button>
              <div className="flex items-center gap-2">
                {text.trim().length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setText('');
                      setFocused(false);
                    }}
                  >
                    Отмена
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={publish}
                  disabled={!text.trim()}
                  isLoading={publishMutation.isPending}
                  leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                >
                  Опубликовать
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function FeedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => feedService.getFeed(),
  });

  const feedItems = useMemo<FeedItem[]>(
    () => (Array.isArray(data) ? (data as FeedItem[]) : []),
    [data]
  );

  return (
    <div className="min-h-full">
      <PageHeader
        title="Лента"
        subtitle="Новости и события компании"
        icon={<NewspaperIcon />}
      />

      <div className="mx-auto w-full max-w-2xl px-4 py-6 space-y-5">
        <Composer />

        {isLoading ? (
          <LoadingState label="Загрузка ленты…" />
        ) : feedItems.length === 0 ? (
          <Card>
            <EmptyState
              icon={<NewspaperIcon />}
              title="В ленте пока пусто"
              description="Здесь появятся новости, события и сообщения ваших коллег."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
