import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import { employeeService } from '../services/employee.service';
import { Button, Input, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import type { ChatChannel, ChatMessage, ChatMember } from '../types/chat';
import type { Employee } from '../types/employee';

export default function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: channels = [] } = useQuery({
    queryKey: ['chat-channels'],
    queryFn: () => chatService.getChannels(),
  });

  const { data: directMessages = [] } = useQuery({
    queryKey: ['chat-dm'],
    queryFn: () => chatService.getDirectMessageChannels(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', selectedChannel?.id],
    queryFn: () => chatService.getMessages(selectedChannel!.id),
    enabled: !!selectedChannel,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      chatService.createChannel({ name: channelName, members: selectedMembers.map(id => ({ employeeId: id })) as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      setShowCreateModal(false);
      setChannelName('');
      setSelectedMembers([]);
      toast.success('Канал создан');
    },
    onError: () => toast.error('Ошибка создания канала'),
  });

  const sendMutation = useMutation({
    mutationFn: () => chatService.sendMessage(selectedChannel!.id, { content: newMessage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChannel?.id] });
      setNewMessage('');
    },
    onError: () => toast.error('Ошибка отправки сообщения'),
  });

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id],
    );
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Чаты</h2>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              + Канал
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Каналы */}
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Каналы
            </h3>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                  selectedChannel?.id === ch.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-medium"># {ch.name}</span>
                {ch.lastMessage && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {ch.lastMessage.employee.fullName}: {ch.lastMessage.content}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Личные сообщения */}
          <div className="px-4 py-2 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Личные сообщения
            </h3>
            {directMessages.map((dm) => (
              <button
                key={dm.id}
                onClick={() => setSelectedChannel(dm)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                  selectedChannel?.id === dm.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-medium">
                  {dm.members.map((m: ChatMember) => m.employee.fullName).join(', ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                # {selectedChannel.name}
              </h2>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Сообщений пока нет
                </p>
              ) : (
                messages.map((msg: ChatMessage) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {msg.employee.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {msg.employee.fullName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t bg-white px-6 py-4">
              <div className="flex gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      sendMutation.mutate();
                    }
                  }}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Button
                  onClick={() => sendMutation.mutate()}
                  isLoading={sendMutation.isPending}
                  disabled={!newMessage.trim()}
                >
                  Отправить
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Выберите чат для начала общения</p>
          </div>
        )}
      </main>

      {/* Create Channel Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать канал"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              disabled={!channelName.trim()}
            >
              Создать
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Название канала"
            placeholder="Введите название"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Участники
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
              {employees.map((emp: Employee) => (
                <label
                  key={emp.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(emp.id)}
                    onChange={() => toggleMember(emp.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{emp.fullName}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
