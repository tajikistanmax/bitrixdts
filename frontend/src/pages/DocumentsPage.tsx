import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { documentService } from '../services/document.service';
import type { Document } from '../types/document';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  useToast,
} from '../components/ui';

type StatusMeta = {
  label: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
};

const STATUS_META: Record<string, StatusMeta> = {
  draft: { label: 'Черновик', variant: 'default' },
  review: { label: 'На согласовании', variant: 'warning' },
  approval: { label: 'На согласовании', variant: 'warning' },
  signed: { label: 'Подписан', variant: 'success' },
  approved: { label: 'Подписан', variant: 'success' },
  archived: { label: 'Архив', variant: 'purple' },
  archive: { label: 'Архив', variant: 'purple' },
};

function statusMeta(status?: string): StatusMeta {
  if (!status) return { label: 'Черновик', variant: 'default' };
  return STATUS_META[status.toLowerCase()] ?? { label: status, variant: 'info' };
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Все статусы' },
  { value: 'draft', label: 'Черновик' },
  { value: 'review', label: 'На согласовании' },
  { value: 'signed', label: 'Подписан' },
  { value: 'archived', label: 'Архив' },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Все типы' },
  { value: 'doc', label: 'Документ' },
  { value: 'xls', label: 'Таблица' },
  { value: 'ppt', label: 'Презентация' },
  { value: 'pdf', label: 'PDF' },
  { value: 'img', label: 'Изображение' },
];

type TypeMeta = {
  key: string;
  label: string;
  Icon: typeof DocumentTextIcon;
  tint: string;
};

function typeMeta(fileType?: string): TypeMeta {
  const t = (fileType || '').toLowerCase();
  if (/(xls|sheet|csv|table)/.test(t))
    return { key: 'xls', label: 'Таблица', Icon: TableCellsIcon, tint: 'text-emerald-500' };
  if (/(ppt|present|slide)/.test(t))
    return { key: 'ppt', label: 'Презентация', Icon: PresentationChartBarIcon, tint: 'text-amber-500' };
  if (/(png|jpe?g|gif|webp|svg|image|img)/.test(t))
    return { key: 'img', label: 'Изображение', Icon: PhotoIcon, tint: 'text-rose-500' };
  if (/pdf/.test(t))
    return { key: 'pdf', label: 'PDF', Icon: DocumentTextIcon, tint: 'text-red-500' };
  return { key: 'doc', label: 'Документ', Icon: DocumentTextIcon, tint: 'text-primary-500' };
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

interface CreateForm {
  title: string;
  description: string;
  fileType: string;
  fileUrl: string;
  status: string;
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Document | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<CreateForm>({
    defaultValues: { title: '', description: '', fileType: '', fileUrl: '', status: 'draft' },
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => documentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowCreate(false);
      reset();
      toast.success('Документ создан');
    },
    onError: () => toast.error('Не удалось создать документ'),
  });

  const docList = useMemo<Document[]>(
    () => (Array.isArray(documents) ? documents : []),
    [documents]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docList.filter((doc) => {
      const matchesSearch =
        !q ||
        doc.title?.toLowerCase().includes(q) ||
        doc.description?.toLowerCase().includes(q) ||
        doc.owner?.fullName?.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || typeMeta(doc.fileType).key === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || statusMeta(doc.status).label === statusMeta(statusFilter).label;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [docList, search, typeFilter, statusFilter]);

  const onSubmit = handleSubmit((data) => createMutation.mutate(data));

  const selectField =
    'field w-auto min-w-[10rem] cursor-pointer';

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Документы"
        subtitle="Документооборот компании"
        icon={<DocumentTextIcon />}
        action={
          <Button leftIcon={<DocumentTextIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Создать документ
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[16rem]">
            <Input
              leftIcon={<MagnifyingGlassIcon />}
              placeholder="Поиск по названию, автору…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectField}
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectField}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState label="Загрузка документов…" />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<DocumentTextIcon />}
              title={docList.length === 0 ? 'Пока нет документов' : 'Ничего не найдено'}
              description={
                docList.length === 0
                  ? 'Создавайте документы, таблицы и презентации и работайте над ними совместно с коллегами.'
                  : 'Попробуйте изменить условия поиска или фильтры.'
              }
              action={
                docList.length === 0 ? (
                  <Button
                    leftIcon={<DocumentTextIcon className="w-4 h-4" />}
                    onClick={() => setShowCreate(true)}
                  >
                    Создать документ
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                    <th className="text-left font-medium text-ink-500 px-4 py-3">Название</th>
                    <th className="text-left font-medium text-ink-500 px-4 py-3 hidden md:table-cell">Автор</th>
                    <th className="text-left font-medium text-ink-500 px-4 py-3 hidden lg:table-cell">Дата</th>
                    <th className="text-left font-medium text-ink-500 px-4 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => {
                    const meta = typeMeta(doc.fileType);
                    const status = statusMeta(doc.status);
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelected(doc)}
                        className="row-hover border-b border-[var(--border)] last:border-0 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`shrink-0 ${meta.tint}`}>
                              <meta.Icon className="w-6 h-6" />
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium text-ink-900 dark:text-ink-50 truncate">
                                {doc.title}
                              </div>
                              <div className="text-xs text-ink-500 truncate">
                                {meta.label}
                                {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={doc.owner?.fullName} size="xs" />
                            <span className="text-ink-700 dark:text-ink-200 truncate">
                              {doc.owner?.fullName || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-500 hidden lg:table-cell">
                          {formatDate(doc.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status.variant} dot>
                            {status.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Details modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        description={selected ? typeMeta(selected.fileType).label : undefined}
        size="lg"
        footer={
          selected && (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Закрыть
              </Button>
              {selected.fileUrl && (
                <Button
                  leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  onClick={() => window.open(selected.fileUrl, '_blank', 'noopener')}
                >
                  Открыть файл
                </Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={statusMeta(selected.status).variant} dot>
                {statusMeta(selected.status).label}
              </Badge>
              {selected.fileSize ? (
                <span className="text-xs text-ink-500">{formatSize(selected.fileSize)}</span>
              ) : null}
            </div>

            {selected.description ? (
              <p className="text-sm text-ink-700 dark:text-ink-200 whitespace-pre-wrap">
                {selected.description}
              </p>
            ) : (
              <p className="text-sm text-ink-500">Описание отсутствует.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <div className="text-xs text-ink-500 mb-1.5">Автор</div>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.owner?.fullName} size="sm" />
                  <span className="text-sm text-ink-900 dark:text-ink-50">
                    {selected.owner?.fullName || '—'}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <div className="text-xs text-ink-500 mb-1.5">Дата создания</div>
                <div className="flex items-center gap-2 text-sm text-ink-900 dark:text-ink-50">
                  <CalendarDaysIcon className="w-4 h-4 text-ink-400" />
                  {formatDate(selected.createdAt)}
                </div>
              </div>
            </div>

            {selected.fileUrl && (
              <a
                href={selected.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                {selected.fileUrl}
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          reset();
        }}
        title="Создать документ"
        description="Заполните основные сведения о документе."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                reset();
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={onSubmit}
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Создать
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Название"
            placeholder="Например: Договор поставки №12"
            error={formState.errors.title ? 'Укажите название' : undefined}
            {...register('title', { required: true })}
          />

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Описание
            </label>
            <textarea
              rows={3}
              placeholder="Краткое описание документа"
              className="field"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                Тип
              </label>
              <select className="field cursor-pointer" {...register('fileType')}>
                <option value="doc">Документ</option>
                <option value="xls">Таблица</option>
                <option value="ppt">Презентация</option>
                <option value="pdf">PDF</option>
                <option value="img">Изображение</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                Статус
              </label>
              <select className="field cursor-pointer" {...register('status')}>
                <option value="draft">Черновик</option>
                <option value="review">На согласовании</option>
                <option value="signed">Подписан</option>
                <option value="archived">Архив</option>
              </select>
            </div>
          </div>

          <Input label="Ссылка на файл" placeholder="https://…" {...register('fileUrl')} />
        </form>
      </Modal>
    </div>
  );
}
