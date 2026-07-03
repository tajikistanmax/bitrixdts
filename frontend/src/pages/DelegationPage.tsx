import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { delegationService } from '../services/delegation.service';
import type { Delegation } from '../types/delegation';
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
  UserPlusIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface DelegationForm {
  delegateeId: string;
  startDate: string;
  endDate: string;
}

export default function DelegationPage() {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm<DelegationForm>();

  const { data: delegations = [], isLoading } = useQuery({
    queryKey: ['delegations'],
    queryFn: () => delegationService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: delegationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
      setShowCreateModal(false);
      reset();
      toast.success('Делегирование создано');
    },
    onError: () => {
      toast.error('Не удалось создать делегирование');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      delegationService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
    onError: () => {
      toast.error('Не удалось изменить статус');
    },
  });

  const filteredDelegations = delegations.filter(
    (d: Delegation) =>
      d.delegatee?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.delegator?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: DelegationForm) => {
    createMutation.mutate(data);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    reset();
  };

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Делегирование"
        subtitle="Передача полномочий сотрудникам"
        icon={<ArrowsRightLeftIcon />}
        action={
          <Button
            variant="primary"
            leftIcon={<UserPlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Добавить
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        <div className="mb-4 max-w-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск делегирований..."
              className="field pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filteredDelegations.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<ArrowsRightLeftIcon />}
              title="Делегирования не найдены"
              description="Создайте делегирование, чтобы передать полномочия другому сотруднику"
              action={
                <Button
                  variant="primary"
                  leftIcon={<UserPlusIcon className="w-4 h-4" />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Добавить делегирование
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDelegations.map((del: Delegation) => (
              <Card key={del.id} padding="md" className="card-hover flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-ink-500">Делегирование</span>
                  <Badge variant={del.isActive ? 'success' : 'default'} dot>
                    {del.isActive ? 'Активно' : 'Не активно'}
                  </Badge>
                </div>

                {/* Кто → кому */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar name={del.delegator?.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-ink-400">От кого</p>
                      <p className="text-sm font-medium text-ink-900 dark:text-ink-50 truncate">
                        {del.delegator?.fullName || '—'}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-ink-400 shrink-0" />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar name={del.delegatee?.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-ink-400">Кому</p>
                      <p className="text-sm font-medium text-ink-900 dark:text-ink-50 truncate">
                        {del.delegatee?.fullName || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Период */}
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <CalendarDaysIcon className="w-4 h-4 text-ink-400 shrink-0" />
                  <span>
                    {formatDate(del.startDate)} — {formatDate(del.endDate)}
                  </span>
                </div>

                <div className="pt-1 mt-auto border-t border-[var(--border)]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    isLoading={toggleMutation.isPending && toggleMutation.variables?.id === del.id}
                    onClick={() =>
                      toggleMutation.mutate({ id: del.id, isActive: !del.isActive })
                    }
                  >
                    {del.isActive ? 'Деактивировать' : 'Активировать'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={closeModal}
        title="Новое делегирование"
        description="Передача полномочий на период отсутствия"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Отмена
            </Button>
            <Button
              type="submit"
              form="delegation-form"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Создать
            </Button>
          </>
        }
      >
        <form id="delegation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="ID исполнителя"
            placeholder="Введите ID сотрудника"
            {...register('delegateeId', { required: true })}
          />
          <Input label="Дата начала" type="date" {...register('startDate', { required: true })} />
          <Input label="Дата окончания" type="date" {...register('endDate')} />
        </form>
      </Modal>
    </div>
  );
}
