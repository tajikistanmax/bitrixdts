import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { memoService } from '../services/memo.service';
import {
  Button,
  Input,
  Modal,
  Badge,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';

const typeLabels: Record<string, string> = {
  memo: 'Служебная записка',
  report: 'Докладная',
  request: 'Обращение',
  complaint: 'Жалоба',
  order: 'Поручение',
};

const statusMeta: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  draft: { label: 'Черновик', variant: 'default' },
  sent: { label: 'Отправлено', variant: 'info' },
  in_review: { label: 'На рассмотрении', variant: 'warning' },
  resolved: { label: 'Рассмотрено', variant: 'success' },
  rejected: { label: 'Отклонено', variant: 'danger' },
};

const emptyForm = { type: 'memo', subject: '', body: '', recipient: '' };

export default function MemosPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['memos'],
    queryFn: () => memoService.getAll(),
  });
  const memos: any[] = Array.isArray(data) ? data : data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => memoService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      setShowCreate(false);
      setForm(emptyForm);
      toast.success('Записка создана');
    },
    onError: () => toast.error('Не удалось создать записку'),
  });

  const filteredMemos = memos.filter((m) =>
    (m.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

  const canSubmit = form.subject.trim() && form.body.trim();

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Служебные записки"
        subtitle="Внутренний документооборот"
        icon={<DocumentTextIcon />}
        action={<Button onClick={() => setShowCreate(true)}>Создать записку</Button>}
      />

      <div className="flex-1 overflow-auto p-5">
        <div className="mb-4 sm:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по теме…"
            leftIcon={<MagnifyingGlassIcon />}
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filteredMemos.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<DocumentTextIcon />}
              title="Записок пока нет"
              description="Создайте первую служебную записку."
              action={<Button onClick={() => setShowCreate(true)}>Создать записку</Button>}
            />
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left text-xs uppercase text-ink-500">
                    <th className="px-4 py-3 font-medium">№</th>
                    <th className="px-4 py-3 font-medium">Тип</th>
                    <th className="px-4 py-3 font-medium">Тема</th>
                    <th className="px-4 py-3 font-medium">От кого</th>
                    <th className="px-4 py-3 font-medium">Кому</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemos.map((m) => {
                    const status = statusMeta[m.status] ?? { label: m.status, variant: 'default' as const };
                    const author = m.author?.fullName || m.from?.fullName || m.createdBy?.fullName;
                    const recipient = m.recipient?.fullName || m.to?.fullName || m.recipient;
                    return (
                      <tr
                        key={m.id}
                        className="row-hover border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-ink-400">
                          {m.registrationNumber || `#${String(m.id).slice(0, 6)}`}
                        </td>
                        <td className="px-4 py-3 text-ink-600 dark:text-ink-300">
                          {typeLabels[m.type] || m.type}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-50">
                          {m.subject}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={author} size="xs" />
                            <span className="truncate text-ink-600 dark:text-ink-300">
                              {author || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-600 dark:text-ink-300">
                          {typeof recipient === 'string' ? recipient || '—' : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status.variant} dot>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-500">
                          {m.createdAt ? formatDate(m.createdAt) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs text-ink-500">
              Всего: {filteredMemos.length}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setForm(emptyForm); }}
        title="Новая записка"
        description="Заполните тему и текст служебной записки"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreate(false); setForm(emptyForm); }}>
              Отмена
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!canSubmit}
              isLoading={createMutation.isPending}
            >
              Создать
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
              Тип
            </label>
            <select
              className="field"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <Input
            label="Кому"
            placeholder="ФИО или должность получателя"
            value={form.recipient}
            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
          />
          <Input
            label="Тема"
            placeholder="Тема записки"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
              Текст
            </label>
            <textarea
              className="field"
              rows={5}
              placeholder="Текст записки…"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
