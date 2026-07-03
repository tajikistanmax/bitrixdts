import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpenIcon,
  FolderIcon,
  FolderPlusIcon,
  ArrowUpTrayIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  TableCellsIcon,
  HomeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { fileService } from '../services/file.service';
import { folderService } from '../services/folder.service';
import type { FileRecord, FolderRecord } from '../types/file';
import { PageHeader, Card, EmptyState, Modal, Button, Input, LoadingState, useToast } from '../components/ui';

function fileGlyph(mime = '', name = '') {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (mime.startsWith('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return { Icon: PhotoIcon, tone: 'text-emerald-500' };
  if (mime.startsWith('video') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { Icon: FilmIcon, tone: 'text-rose-500' };
  if (mime.startsWith('audio') || ['mp3', 'wav', 'ogg'].includes(ext)) return { Icon: MusicalNoteIcon, tone: 'text-violet-500' };
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return { Icon: ArchiveBoxIcon, tone: 'text-amber-500' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: TableCellsIcon, tone: 'text-green-600' };
  return { Icon: DocumentIcon, tone: 'text-primary-500' };
}

function formatSize(bytes = 0) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function FileManagerPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [path, setPath] = useState<{ id: string; name: string }[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentFolderId = path.length ? path[path.length - 1].id : null;

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', currentFolderId],
    queryFn: () => folderService.getAll(currentFolderId),
  });
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['drive-files', currentFolderId],
    queryFn: () => fileService.getAll({ folderId: currentFolderId ?? 'root' }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['folders', currentFolderId] });
    qc.invalidateQueries({ queryKey: ['drive-files', currentFolderId] });
  };

  const createFolder = useMutation({
    mutationFn: () => folderService.create({ name: folderName.trim(), parentId: currentFolderId }),
    onSuccess: () => {
      toast.success('Папка создана');
      setShowNewFolder(false);
      setFolderName('');
      qc.invalidateQueries({ queryKey: ['folders', currentFolderId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Не удалось создать папку'),
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) => folderService.delete(id),
    onSuccess: () => { toast.success('Папка удалена'); qc.invalidateQueries({ queryKey: ['folders', currentFolderId] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Не удалось удалить папку'),
  });

  const deleteFile = useMutation({
    mutationFn: (id: string) => fileService.delete(id),
    onSuccess: () => { toast.success('Файл удалён'); qc.invalidateQueries({ queryKey: ['drive-files', currentFolderId] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Не удалось удалить файл'),
  });

  const handleUpload = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(list)) {
        await fileService.upload(f, { folderId: currentFolderId });
      }
      toast.success(list.length > 1 ? `Загружено файлов: ${list.length}` : 'Файл загружен');
      invalidate();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const download = (f: FileRecord) => {
    if (!f.fileUrl) return toast.error('Файл недоступен для скачивания');
    const a = document.createElement('a');
    a.href = f.fileUrl;
    a.download = f.fileName;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const enterFolder = (f: FolderRecord) => setPath((p) => [...p, { id: f.id, name: f.name }]);
  const goToCrumb = (idx: number) => setPath((p) => p.slice(0, idx));

  const isLoading = foldersLoading || filesLoading;
  const isEmpty = !folders.length && !files.length;

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
    >
      <PageHeader
        title="Диск"
        subtitle="Файлы и папки компании"
        icon={<FolderOpenIcon />}
        action={
          <>
            <Button variant="secondary" leftIcon={<FolderPlusIcon className="w-4 h-4" />} onClick={() => setShowNewFolder(true)}>
              Новая папка
            </Button>
            <Button leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />} isLoading={uploading} onClick={() => fileInputRef.current?.click()}>
              Загрузить
            </Button>
          </>
        }
      />

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

      <div className="flex-1 overflow-auto p-5">
        {/* Breadcrumbs + view toggle */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <nav className="flex items-center gap-1 text-sm min-w-0">
            <button onClick={() => setPath([])} className="flex items-center gap-1 px-2 py-1 rounded-lg text-ink-600 dark:text-ink-300 hover:bg-[var(--surface-muted)]">
              <HomeIcon className="w-4 h-4" /> Диск
            </button>
            {path.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1 min-w-0">
                <ChevronRightIcon className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                <button onClick={() => goToCrumb(i + 1)} className="px-2 py-1 rounded-lg text-ink-700 dark:text-ink-200 hover:bg-[var(--surface-muted)] truncate max-w-[160px]">
                  {c.name}
                </button>
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-lg">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-[var(--surface)] text-primary-600 shadow-sm' : 'text-ink-500'}`}><Squares2X2Icon className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-[var(--surface)] text-primary-600 shadow-sm' : 'text-ink-500'}`}><ListBulletIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isEmpty ? (
          <Card>
            <EmptyState
              icon={<FolderOpenIcon />}
              title="Здесь пока пусто"
              description="Перетащите файлы сюда или создайте папку, чтобы начать."
              action={<Button leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>Загрузить файл</Button>}
            />
          </Card>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {folders.map((f) => (
              <Card key={f.id} hover padding="none" className="p-3 group cursor-pointer" onClick={() => enterFolder(f)}>
                <div className="flex items-start justify-between">
                  <FolderIcon className="w-9 h-9 text-amber-500" />
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFolder.mutate(f.id); }}
                    className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-500 transition-opacity"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm font-medium text-ink-800 dark:text-ink-100 truncate">{f.name}</p>
                <p className="text-xs text-ink-400">{f._count?.children ? `${f._count.children} вложенных` : 'Папка'}</p>
              </Card>
            ))}
            {files.map((f) => {
              const { Icon, tone } = fileGlyph(f.fileType, f.fileName);
              return (
                <Card key={f.id} hover padding="none" className="p-3 group">
                  <div className="flex items-start justify-between">
                    <Icon className={`w-9 h-9 ${tone}`} />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => download(f)} className="text-ink-400 hover:text-primary-600"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                      <button onClick={() => deleteFile.mutate(f.id)} className="text-ink-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink-800 dark:text-ink-100 truncate" title={f.fileName}>{f.fileName}</p>
                  <p className="text-xs text-ink-400">{formatSize(f.fileSize)}</p>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Размер</th>
                  <th className="px-4 py-3 font-medium">Изменён</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {folders.map((f) => (
                  <tr key={f.id} className="row-hover cursor-pointer" onClick={() => enterFolder(f)}>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><FolderIcon className="w-5 h-5 text-amber-500" /><span className="font-medium text-ink-800 dark:text-ink-100">{f.name}</span></div></td>
                    <td className="px-4 py-2.5 text-ink-400">—</td>
                    <td className="px-4 py-2.5 text-ink-400">—</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={(e) => { e.stopPropagation(); deleteFolder.mutate(f.id); }} className="text-ink-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {files.map((f) => {
                  const { Icon, tone } = fileGlyph(f.fileType, f.fileName);
                  return (
                    <tr key={f.id} className="row-hover">
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Icon className={`w-5 h-5 ${tone}`} /><span className="font-medium text-ink-800 dark:text-ink-100 truncate">{f.fileName}</span></div></td>
                      <td className="px-4 py-2.5 text-ink-500">{formatSize(f.fileSize)}</td>
                      <td className="px-4 py-2.5 text-ink-400">{f.createdAt ? new Date(f.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => download(f)} className="text-ink-400 hover:text-primary-600"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                          <button onClick={() => deleteFile.mutate(f.id)} className="text-ink-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-40 bg-primary-600/10 border-4 border-dashed border-primary-400 flex items-center justify-center pointer-events-none">
          <div className="bg-[var(--surface)] rounded-xl px-6 py-4 shadow-lg text-primary-600 font-medium flex items-center gap-2">
            <ArrowUpTrayIcon className="w-5 h-5" /> Отпустите, чтобы загрузить
          </div>
        </div>
      )}

      {/* New folder modal */}
      <Modal
        isOpen={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        title="Новая папка"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewFolder(false)}>Отмена</Button>
            <Button isLoading={createFolder.isPending} disabled={!folderName.trim()} onClick={() => createFolder.mutate()}>Создать</Button>
          </>
        }
      >
        <Input label="Название папки" autoFocus value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Например: Договоры" onKeyDown={(e) => e.key === 'Enter' && folderName.trim() && createFolder.mutate()} />
      </Modal>
    </div>
  );
}
