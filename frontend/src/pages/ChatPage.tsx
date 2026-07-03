import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import { useAuthStore } from '../store/auth.store';
import { websocketService } from '../lib/websocket';
import type { ChatChannel, ChatMessage } from '../types/chat';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Skeleton,
  useToast,
} from '../components/ui';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PhoneIcon,
  VideoCameraIcon,
  UsersIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, yesterday)) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}

function channelInitials(name?: string) {
  return name || 'Чат';
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---- Data: список каналов ----
  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['chat-channels'],
    queryFn: () => chatService.getChannels(),
  });

  const chatList: ChatChannel[] = Array.isArray(channels) ? channels : [];

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chatList;
    return chatList.filter((c) => c.name?.toLowerCase().includes(q));
  }, [chatList, search]);

  const selectedChat = useMemo(
    () => chatList.find((c) => c.id === selectedChatId) || null,
    [chatList, selectedChatId]
  );

  // ---- Data: сообщения выбранного канала ----
  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['chat-messages', selectedChatId],
    queryFn: () => chatService.getMessages(selectedChatId as string),
    enabled: !!selectedChatId,
  });

  const messageList: ChatMessage[] = Array.isArray(messages) ? messages : [];

  // ---- WebSocket: живые сообщения ----
  useEffect(() => {
    if (!selectedChatId) return;
    const handler = (payload: any) => {
      const channelId = payload?.channelId ?? payload?.message?.channelId;
      if (channelId && channelId !== selectedChatId) return;
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    };
    websocketService.on('chat_message', handler);
    websocketService.on('new_message', handler);
    return () => {
      websocketService.off('chat_message', handler);
      websocketService.off('new_message', handler);
    };
  }, [selectedChatId, queryClient]);

  // ---- Автопрокрутка к последнему сообщению ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList.length, selectedChatId]);

  // ---- Отправка сообщения ----
  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      chatService.sendMessage(selectedChatId as string, { content }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
    onError: () => {
      showToast('Не удалось отправить сообщение', 'error');
    },
  });

  const handleSend = () => {
    const text = message.trim();
    if (!text || !selectedChatId) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOwnMessage = (msg: ChatMessage) =>
    !!user && (msg.employeeId === user.id || msg.employee?.id === user.id);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Чат"
        subtitle="Общение с коллегами в реальном времени"
        icon={<ChatBubbleLeftRightIcon />}
        action={
          <Button size="sm" variant="outline" leftIcon={<PencilSquareIcon className="w-4 h-4" />}>
            Новый чат
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* ---------- Левая панель: список диалогов ---------- */}
        <aside className="w-80 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col">
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Найти чат"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {channelsLoading ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <EmptyState
                icon={<ChatBubbleLeftRightIcon />}
                title="Нет диалогов"
                description={
                  search ? 'Ничего не найдено по запросу' : 'Начните новый чат с коллегами'
                }
              />
            ) : (
              <ul className="py-1">
                {filteredChats.map((chat) => {
                  const active = chat.id === selectedChatId;
                  const membersCount = chat.members?.length ?? 0;
                  return (
                    <li key={chat.id}>
                      <button
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : 'hover:bg-[var(--surface-muted)]'
                        }`}
                      >
                        <Avatar name={channelInitials(chat.name)} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-medium truncate ${
                                active
                                  ? 'text-primary-700 dark:text-primary-200'
                                  : 'text-ink-900 dark:text-ink-50'
                              }`}
                            >
                              {chat.name}
                            </span>
                            <span className="text-[10px] text-ink-400 shrink-0">
                              {formatTime(chat.lastMessage?.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-ink-500 truncate">
                            {chat.lastMessage?.content ||
                              (membersCount ? `Участников: ${membersCount}` : chat.type)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ---------- Правая панель: окно переписки ---------- */}
        <section className="flex-1 flex flex-col bg-[var(--surface-muted)] min-w-0">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<ChatBubbleLeftRightIcon />}
                title="Выберите чат"
                description="Выберите диалог слева, чтобы начать общение с коллегами"
              />
            </div>
          ) : (
            <>
              {/* Заголовок чата */}
              <header className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={channelInitials(selectedChat.name)} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">
                        {selectedChat.name}
                      </p>
                      <Badge variant="success" dot>
                        онлайн
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-500 truncate">
                      Участников: {selectedChat.members?.length ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-[var(--surface-muted)] transition-colors"
                    title="Позвонить"
                  >
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-[var(--surface-muted)] transition-colors"
                    title="Видеозвонок"
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-[var(--surface-muted)] transition-colors"
                    title="Участники"
                  >
                    <UsersIcon className="w-5 h-5" />
                  </button>
                </div>
              </header>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messagesLoading ? (
                  <LoadingState label="Загрузка сообщений..." />
                ) : messageList.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      icon={<ChatBubbleLeftRightIcon />}
                      title="Пока пусто"
                      description="Напишите первое сообщение, чтобы начать разговор"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 max-w-3xl mx-auto">
                    {messageList.map((msg, idx) => {
                      const own = isOwnMessage(msg);
                      const prev = messageList[idx - 1];
                      const showDay =
                        !prev || formatDay(prev.createdAt) !== formatDay(msg.createdAt);
                      const showAvatar =
                        !own && (!prev || prev.employeeId !== msg.employeeId || showDay);

                      return (
                        <div key={msg.id}>
                          {showDay && (
                            <div className="flex justify-center my-3">
                              <span className="chip text-xs">{formatDay(msg.createdAt)}</span>
                            </div>
                          )}
                          <div
                            className={`flex items-end gap-2 animate-slide-up ${
                              own ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {!own && (
                              <div className="w-8 shrink-0">
                                {showAvatar && (
                                  <Avatar
                                    name={msg.employee?.fullName}
                                    src={msg.employee?.avatarUrl}
                                    size="sm"
                                  />
                                )}
                              </div>
                            )}
                            <div
                              className={`max-w-[72%] rounded-2xl px-3.5 py-2 shadow-sm ${
                                own
                                  ? 'bg-primary-600 text-white rounded-br-md'
                                  : 'bg-[var(--surface)] text-ink-900 dark:text-ink-50 border border-[var(--border)] rounded-bl-md'
                              }`}
                            >
                              {!own && showAvatar && (
                                <p className="text-xs font-semibold text-primary-600 dark:text-primary-300 mb-0.5">
                                  {msg.employee?.fullName}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                              <p
                                className={`text-[10px] mt-1 text-right ${
                                  own ? 'text-white/70' : 'text-ink-400'
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Поле ввода */}
              <footer className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-end gap-2 max-w-3xl mx-auto">
                  <button
                    className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-[var(--surface-muted)] transition-colors shrink-0"
                    title="Прикрепить файл"
                  >
                    <PaperClipIcon className="w-5 h-5" />
                  </button>
                  <div className="relative flex-1">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Введите сообщение..."
                      className="pr-10"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-ink-400 hover:text-ink-700 transition-colors"
                      title="Эмодзи"
                    >
                      <FaceSmileIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <Button
                    onClick={handleSend}
                    isLoading={sendMutation.isPending}
                    disabled={!message.trim()}
                    className="shrink-0"
                    leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                  >
                    Отправить
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
