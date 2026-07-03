import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '../services/audit-log.service';
import type { AuditLog } from '../types/audit-log';
import {
  Button,
  Input,
  Badge,
  Card,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
} from '../components/ui';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

function actionVariant(action: string): BadgeVariant {
  const a = action.toLowerCase();
  if (/(create|add|insert)/.test(a)) return 'success';
  if (/(delete|remove|destroy)/.test(a)) return 'danger';
  if (/(update|edit|change|patch)/.test(a)) return 'warning';
  if (/(login|logout|auth)/.test(a)) return 'info';
  return 'default';
}

export default function AuditLogPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', { action, entityType, dateFrom, dateTo }],
    queryFn: () => auditLogService.getAll({ action, entityType, dateFrom, dateTo }),
  });

  const handleReset = () => {
    setAction('');
    setEntityType('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = !!(action || entityType || dateFrom || dateTo);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Журнал аудита"
        icon={<ClipboardDocumentListIcon />}
        action={
          <Button
            variant="secondary"
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={handleReset}
            disabled={!hasFilters}
          >
            Сбросить
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {/* Filters */}
        <Card className="mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Действие"
              leftIcon={<MagnifyingGlassIcon />}
              placeholder="Фильтр по действию"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <Input
              label="Тип объекта"
              placeholder="Фильтр по типу"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                С даты
              </label>
              <input
                type="date"
                className="field"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                По дату
              </label>
              <input
                type="date"
                className="field"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {isLoading ? (
          <LoadingState />
        ) : logs.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<ClipboardDocumentListIcon />}
              title="Записи не найдены"
              description={
                hasFilters
                  ? 'Попробуйте изменить условия фильтрации.'
                  : 'Журнал аудита пока пуст.'
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left">
                    <th className="px-4 py-2.5 font-medium text-ink-500">Время</th>
                    <th className="px-4 py-2.5 font-medium text-ink-500">Пользователь</th>
                    <th className="px-4 py-2.5 font-medium text-ink-500">Действие</th>
                    <th className="px-4 py-2.5 font-medium text-ink-500">Объект</th>
                    <th className="px-4 py-2.5 font-medium text-ink-500">ID объекта</th>
                    <th className="px-4 py-2.5 font-medium text-ink-500">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: AuditLog) => (
                    <tr
                      key={log.id}
                      className="row-hover border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-500">
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={log.actor} size="xs" />
                          <span className="text-ink-900 dark:text-ink-50 font-medium">
                            {log.actor}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge variant={actionVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-500">
                        {log.entityType}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-500 font-mono text-xs">
                        {log.entityId}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-500 font-mono text-xs">
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
