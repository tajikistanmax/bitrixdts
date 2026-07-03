import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { staffService } from '../services/staff.service';
import {
  IdentificationIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
  Modal,
  Button,
  Input,
  LoadingState,
  useToast,
} from '../components/ui';

type ViewMode = 'table' | 'cards';

export default function StaffPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { register, handleSubmit, reset } = useForm<{
    title: string;
    grade: string;
    headcount: number;
    minSalary: number;
    maxSalary: number;
  }>();

  const { data: stats } = useQuery({ queryKey: ['staff-stats'], queryFn: () => staffService.getStatistics() });
  const { data: positions, isLoading } = useQuery({ queryKey: ['staff-positions'], queryFn: () => staffService.getPositions() });
  const positionsList = Array.isArray(positions) ? positions : positions?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => staffService.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-positions', 'staff-stats'] });
      setShowCreateModal(false);
      reset();
      toast.success('Позиция добавлена');
    },
    onError: () => toast.error('Не удалось добавить позицию'),
  });

  const onSubmit = (data: any) =>
    createMutation.mutate({
      ...data,
      headcount: Number(data.headcount),
      minSalary: Number(data.minSalary),
      maxSalary: Number(data.maxSalary),
    });

  const filtered = positionsList.filter(
    (pos: any) =>
      pos.title?.toLowerCase().includes(search.toLowerCase()) ||
      pos.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const salaryText = (pos: any) =>
    pos.minSalary || pos.maxSalary
      ? `${Number(pos.minSalary || 0).toLocaleString('ru-RU')} – ${Number(pos.maxSalary || 0).toLocaleString('ru-RU')} ₽`
      : '—';

  const occupancy = (pos: any) => {
    const filledFull = pos.filledCount >= pos.headcount;
    return (
      <Badge variant={filledFull ? 'success' : 'warning'} size="sm">
        {pos.filledCount}/{pos.headcount}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Штатное расписание"
        subtitle={stats ? `Позиций: ${stats.totalPositions} · Занято: ${stats.totalFilled} · Вакансий: ${stats.vacancies}` : undefined}
        icon={<IdentificationIcon />}
        action={
          <>
            <div className="hidden sm:block w-56">
              <Input
                leftIcon={<MagnifyingGlassIcon />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск позиции…"
              />
            </div>
            <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Добавить позицию
            </Button>
          </>
        }
        tabs={
          <div className="flex items-center gap-1.5 text-sm">
            {([
              { id: 'table', label: 'Таблица' },
              { id: 'cards', label: 'Карточки' },
            ] as { id: ViewMode; label: string }[]).map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  view === v.id
                    ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/40 dark:text-primary-200'
                    : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <Card padding="none">
            <LoadingState />
          </Card>
        ) : filtered.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<IdentificationIcon />}
              title="Позиций нет"
              description="Добавьте штатную позицию, чтобы вести учёт ставок и вакансий."
              action={
                <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                  Добавить позицию
                </Button>
              }
            />
          </Card>
        ) : view === 'table' ? (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3 font-medium">Позиция</th>
                    <th className="px-4 py-3 font-medium">Отдел</th>
                    <th className="px-4 py-3 font-medium">Грейд</th>
                    <th className="px-4 py-3 font-medium text-center">Ставки</th>
                    <th className="px-4 py-3 font-medium text-center">Занято</th>
                    <th className="px-4 py-3 font-medium text-right">Оклад (от–до)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map((pos: any) => (
                    <tr key={pos.id} className="row-hover">
                      <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{pos.title}</td>
                      <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{pos.department?.name || '—'}</td>
                      <td className="px-4 py-3">
                        {pos.grade ? (
                          <Badge variant="purple" size="sm">{pos.grade}</Badge>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-300">{pos.headcount}</td>
                      <td className="px-4 py-3 text-center">{occupancy(pos)}</td>
                      <td className="px-4 py-3 text-right text-ink-500">{salaryText(pos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-[var(--border)] text-xs text-ink-500">
                Всего: {filtered.length}
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((pos: any) => (
              <Card key={pos.id} hover className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink-900 dark:text-ink-50">{pos.title}</h3>
                  {pos.grade && <Badge variant="purple" size="sm">{pos.grade}</Badge>}
                </div>
                <p className="text-sm text-ink-500">{pos.department?.name || 'Без отдела'}</p>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div className="flex items-center gap-2 text-sm text-ink-500">
                    <span>Ставки:</span>
                    {occupancy(pos)}
                  </div>
                  <span className="text-xs text-ink-400">{salaryText(pos)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Новая позиция"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                reset();
              }}
            >
              Отмена
            </Button>
            <Button type="submit" form="create-position-form" isLoading={createMutation.isPending}>
              Сохранить
            </Button>
          </>
        }
      >
        <form id="create-position-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Название позиции" placeholder="Например, Backend-разработчик" autoFocus {...register('title', { required: true })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Грейд" placeholder="Junior, Middle…" {...register('grade')} />
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Ставок</label>
              <input type="number" defaultValue={1} min={1} className="field" {...register('headcount')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Мин. оклад</label>
              <input type="number" placeholder="0" className="field" {...register('minSalary')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Макс. оклад</label>
              <input type="number" placeholder="0" className="field" {...register('maxSalary')} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
