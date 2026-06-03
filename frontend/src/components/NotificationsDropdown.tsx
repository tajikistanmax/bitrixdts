import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { NotificationBell } from './NotificationBell';
import { useNotificationStore } from '../store/notification.store';
import { useToast } from './ui/Toast';
import type { Notification } from '../types/notification';

const typeIcons = {
  task_assigned: '📋',
  task_status_changed: '🔄',
  task_comment: '💬',
  task_overdue: '⚠️',
  workflow_approval: '✅',
  workflow_approved: '✓',
  workflow_rejected: '✗',
  mention: '👤',
  general: '📢',
};

const typeColors = {
  task_assigned: 'bg-blue-100',
  task_status_changed: 'bg-purple-100',
  task_comment: 'bg-green-100',
  task_overdue: 'bg-red-100',
  workflow_approval: 'bg-yellow-100',
  workflow_approved: 'bg-green-100',
  workflow_rejected: 'bg-red-100',
  mention: 'bg-pink-100',
  general: 'bg-gray-100',
};

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();
  const toast = useToast();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // TODO: Navigate to related page based on notification.data.url
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success('Все уведомления прочитаны');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>
        <NotificationBell onOpenNotifications={() => setIsOpen(true)} />
      </Menu.Button>

      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute right-0 mt-2 w-96 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto"
          style={{ top: '100%', right: 0 }}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Уведомления
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Прочитать все
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Нет уведомлений
                </p>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-colors
                          ${notification.isRead ? 'bg-white' : 'bg-blue-50'}
                          ${active ? 'ring-1 ring-blue-500' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                              ${typeColors[notification.type as keyof typeof typeColors] || 'bg-gray-100'}
                            `}
                          >
                            {typeIcons[notification.type as keyof typeof typeIcons] || '📢'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="mt-4 pt-4 border-t text-center">
                <button
                  onClick={() => {
                    fetchNotifications();
                    toast.info('Показаны последние уведомления');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Показать все
                </button>
              </div>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
