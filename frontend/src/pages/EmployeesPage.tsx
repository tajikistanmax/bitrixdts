import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employee.service';
import { MagnifyingGlassIcon, PlusIcon, UsersIcon, EnvelopeIcon, PhoneIcon, LinkIcon } from '@heroicons/react/24/outline';
import { PageHeader, Card, Avatar, Badge, EmptyState, Modal, Button, Input, LoadingState, useToast } from '../components/ui';

export default function EmployeesPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => employeeService.getAll({ search: search || undefined }),
  });

  const empList: any[] = Array.isArray(employees) ? employees : [];
  const inviteLink = `${window.location.origin}/invite/demo-token`;

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    toast.success('Ссылка скопирована');
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Сотрудники"
        subtitle={`${empList.length} чел. в компании`}
        icon={<UsersIcon />}
        action={
          <>
            <div className="hidden sm:block w-56">
              <Input leftIcon={<MagnifyingGlassIcon />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск сотрудника…" />
            </div>
            <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowInvite(true)}>Пригласить</Button>
          </>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <LoadingState />
          ) : empList.length === 0 ? (
            <EmptyState icon={<UsersIcon />} title="Сотрудники не найдены" description="Пригласите коллег в систему по ссылке или email." action={<Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowInvite(true)}>Пригласить</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3 font-medium">Сотрудник</th>
                    <th className="px-4 py-3 font-medium">Должность</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium">Телефон</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {empList.map((emp) => (
                    <tr key={emp.id} className="row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.fullName} src={emp.avatarUrl} size="sm" />
                          <span className="font-medium text-ink-900 dark:text-ink-100">{emp.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{emp.position || '—'}</td>
                      <td className="px-4 py-3 text-primary-600">{emp.email || '—'}</td>
                      <td className="px-4 py-3 text-ink-500">{emp.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge dot variant={emp.status === 'active' || !emp.status ? 'success' : 'default'} size="sm">
                          {emp.status === 'inactive' ? 'Неактивен' : 'Активен'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-[var(--border)] text-xs text-ink-500">Всего: {empList.length}</div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Пригласить сотрудника"
        description="Отправьте ссылку или пригласите по email"
        footer={<Button variant="ghost" onClick={() => setShowInvite(false)}>Закрыть</Button>}
      >
        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200 mb-2"><LinkIcon className="w-4 h-4" /> По ссылке</label>
            <div className="flex gap-2">
              <input readOnly value={inviteLink} className="field bg-[var(--surface-muted)]" />
              <Button onClick={copyLink}>Копировать</Button>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200 mb-2"><EnvelopeIcon className="w-4 h-4" /> По email</label>
            <div className="flex gap-2">
              <Input placeholder="colleague@company.com" leftIcon={<EnvelopeIcon />} />
              <Button variant="secondary" onClick={() => toast.info('Приглашение отправлено')}>Отправить</Button>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200 mb-2"><PhoneIcon className="w-4 h-4" /> По SMS</label>
            <div className="flex gap-2">
              <Input placeholder="+992 …" leftIcon={<PhoneIcon />} />
              <Button variant="secondary" onClick={() => toast.info('SMS отправлено')}>Отправить</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
