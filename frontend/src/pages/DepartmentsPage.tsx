import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { departmentService } from '../services/department.service';
import { employeeService } from '../services/employee.service';
import type { Department, CreateDepartmentDTO } from '../types/department';
import type { Employee } from '../types/employee';
import {
  UserGroupIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  PageHeader,
  Card,
  Avatar,
  Badge,
  EmptyState,
  Modal,
  Button,
  Input,
  LoadingState,
  useToast,
} from '../components/ui';

type ViewMode = 'tree' | 'list';

export default function DepartmentsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('tree');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset } = useForm<CreateDepartmentDTO>();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: departmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowCreateModal(false);
      reset();
      toast.success('Отдел создан');
    },
    onError: () => toast.error('Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: departmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Отдел удалён');
    },
  });

  const onSubmit = (data: CreateDepartmentDTO) => createMutation.mutate(data);

  const buildTree = (parentId?: string): (Department & { children: any[] })[] =>
    departments
      .filter((d: Department) => d.parentId === parentId)
      .map((dept: Department) => ({ ...dept, children: buildTree(dept.id) }));

  const tree = buildTree();

  const toggleExpand = (id: string) =>
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filteredDepts = departments.filter((d: Department) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');

  const remove = (id: string) => {
    if (confirm('Удалить отдел?')) deleteMutation.mutate(id);
  };

  const DeptRow = ({ dept, level = 0 }: { dept: any; level?: number }) => {
    const isExpanded = expandedDepts.has(dept.id);
    const hasChildren = dept.children && dept.children.length > 0;
    return (
      <>
        <tr className="row-hover border-b border-[var(--border)]">
          <td className="px-4 py-3" style={{ paddingLeft: `${16 + level * 24}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button onClick={() => toggleExpand(dept.id)} className="text-ink-400 hover:text-ink-600">
                  {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-4" />
              )}
              <UserGroupIcon className="w-4 h-4 text-primary-500 shrink-0" />
              <span className="font-medium text-ink-900 dark:text-ink-100">{dept.name}</span>
            </div>
          </td>
          <td className="px-4 py-3">
            {dept.headName ? (
              <div className="flex items-center gap-2">
                <Avatar name={dept.headName} size="xs" />
                <span className="text-ink-600 dark:text-ink-300">{dept.headName}</span>
              </div>
            ) : (
              <span className="text-ink-400">—</span>
            )}
          </td>
          <td className="px-4 py-3 text-center">
            <Badge variant="default" size="sm">{dept.employeeCount ?? 0}</Badge>
          </td>
          <td className="px-4 py-3 text-ink-500">{formatDate(dept.createdAt)}</td>
          <td className="px-4 py-3 text-right">
            <Button variant="ghost" size="xs" onClick={() => remove(dept.id)} leftIcon={<TrashIcon className="w-4 h-4" />}>
              Удалить
            </Button>
          </td>
        </tr>
        {isExpanded && hasChildren && dept.children.map((child: any) => (
          <DeptRow key={child.id} dept={child} level={level + 1} />
        ))}
      </>
    );
  };

  const rootDepartments = departments.filter((d: Department) => !d.parentId);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Структура компании"
        subtitle={`Отделов: ${departments.length}`}
        icon={<UserGroupIcon />}
        action={
          <>
            <div className="hidden sm:block w-56">
              <Input
                leftIcon={<MagnifyingGlassIcon />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск отдела…"
              />
            </div>
            <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Создать отдел
            </Button>
          </>
        }
        tabs={
          <div className="flex items-center gap-1.5 text-sm">
            {([
              { id: 'tree', label: 'Дерево' },
              { id: 'list', label: 'Список' },
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
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <LoadingState />
          ) : (view === 'tree' ? tree.length === 0 : filteredDepts.length === 0) ? (
            <EmptyState
              icon={<UserGroupIcon />}
              title="Отделов пока нет"
              description="Создайте первый отдел, чтобы выстроить структуру компании."
              action={
                <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                  Создать отдел
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3 font-medium">Подразделение</th>
                    <th className="px-4 py-3 font-medium">Руководитель</th>
                    <th className="px-4 py-3 font-medium text-center">Сотрудников</th>
                    <th className="px-4 py-3 font-medium">Создан</th>
                    <th className="px-4 py-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {view === 'tree'
                    ? tree.map((dept: any) => <DeptRow key={dept.id} dept={dept} />)
                    : filteredDepts.map((dept: Department) => (
                        <tr key={dept.id} className="row-hover">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <UserGroupIcon className="w-4 h-4 text-primary-500 shrink-0" />
                              <span className="font-medium text-ink-900 dark:text-ink-100">{dept.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {dept.headName ? (
                              <div className="flex items-center gap-2">
                                <Avatar name={dept.headName} size="xs" />
                                <span className="text-ink-600 dark:text-ink-300">{dept.headName}</span>
                              </div>
                            ) : (
                              <span className="text-ink-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="default" size="sm">{dept.employeeCount ?? 0}</Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-500">{formatDate(dept.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="xs" onClick={() => remove(dept.id)} leftIcon={<TrashIcon className="w-4 h-4" />}>
                              Удалить
                            </Button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-[var(--border)] text-xs text-ink-500">
                Всего: {view === 'list' ? filteredDepts.length : departments.length}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Новый отдел"
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
            <Button type="submit" form="create-dept-form" isLoading={createMutation.isPending}>
              Сохранить
            </Button>
          </>
        }
      >
        <form id="create-dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Название отдела" placeholder="Например, Отдел разработки" autoFocus {...register('name', { required: true })} />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Родительский отдел</label>
            <select {...register('parentId')} className="field">
              <option value="">Нет (корневой)</option>
              {rootDepartments.map((d: Department) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Руководитель</label>
            <select {...register('headId')} className="field">
              <option value="">Не назначен</option>
              {employees.map((emp: Employee) => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
