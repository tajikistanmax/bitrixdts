import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '../services/workspace.service';
import {
  Button,
  Input,
  Modal,
  Badge,
  Card,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt?: string;
  members?: Array<{ id?: string; name?: string }>;
  _count?: { members?: number };
}

const cardTones = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function toneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % cardTones.length;
  return cardTones[h];
}

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceService.getAll(),
  });

  const wsList: Workspace[] = Array.isArray(workspaces) ? workspaces : [];

  const createMutation = useMutation({
    mutationFn: (body: { name: string; description?: string }) => workspaceService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Группа создана');
      setShowCreate(false);
      setName('');
      setDescription('');
    },
    onError: () => toast.error('Не удалось создать группу'),
  });

  const filtered = wsList.filter((ws) =>
    ws.name?.toLowerCase().includes(search.trim().toLowerCase())
  );

  const memberCount = (ws: Workspace) =>
    ws._count?.members ?? ws.members?.length ?? 0;

  const handleCreate = () => {
    if (!name.trim()) {
      toast.warning('Укажите название группы');
      return;
    }
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Группы и проекты"
        icon={<UserGroupIcon />}
        action={
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Создать группу
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {/* Search */}
        <div className="mb-5 max-w-sm">
          <Input
            leftIcon={<MagnifyingGlassIcon />}
            placeholder="Поиск группы…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<UserGroupIcon />}
              title={search ? 'Ничего не найдено' : 'Создайте группу или проект'}
              description={
                search
                  ? 'Попробуйте изменить условия поиска.'
                  : 'Здесь будет список групп и проектов, в которых вы участвуете с коллегами.'
              }
              action={
                !search && (
                  <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                    Создать группу
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((ws) => {
              const members = ws.members ?? [];
              const count = memberCount(ws);
              return (
                <Card key={ws.id} hover className="flex flex-col">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${toneFor(
                        ws.name || ws.id
                      )} flex items-center justify-center text-white text-lg font-semibold shrink-0`}
                    >
                      {ws.icon || ws.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">
                        {ws.name}
                      </h3>
                      <Badge variant={ws.isArchived ? 'default' : 'success'} size="sm">
                        {ws.isArchived ? 'Закрытая' : 'Открытая'}
                      </Badge>
                    </div>
                  </div>

                  {ws.description && (
                    <p className="mt-3 text-sm text-ink-500 line-clamp-2">{ws.description}</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center -space-x-2">
                      {members.slice(0, 4).map((m, i) => (
                        <Avatar
                          key={m.id ?? i}
                          name={m.name}
                          size="xs"
                          className="ring-2 ring-[var(--surface)]"
                        />
                      ))}
                      {count === 0 && members.length === 0 && (
                        <span className="text-xs text-ink-400">Нет участников</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                      <UsersIcon className="w-4 h-4" />
                      {count}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Новая группа"
        description="Объедините коллег в общем рабочем пространстве."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Отмена
            </Button>
            <Button isLoading={createMutation.isPending} onClick={handleCreate}>
              Создать
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Название"
            placeholder="Например, Отдел маркетинга"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
              Описание
            </label>
            <textarea
              className="field min-h-[88px] resize-y"
              placeholder="Коротко о цели группы…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
