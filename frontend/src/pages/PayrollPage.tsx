import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BanknotesIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../services/payroll.service';
import {
  Button,
  Modal,
  Badge,
  Card,
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui';

// ─── Типы данных (форма ответа payrollService) ────────────────────────────
interface PayrollEntry {
  id: string;
  type: string;
  description?: string | null;
  amount: number | string;
  hoursWorked?: number | string | null;
  rate?: number | string | null;
  employee?: { id: string; fullName: string; position?: string | null } | null;
}

interface Payroll {
  id: string;
  period: string;
  status: string;
  totalGross: number | string;
  totalDeductions: number | string;
  totalNet: number | string;
  createdAt: string;
  approvedAt?: string | null;
  paidAt?: string | null;
  entries?: PayrollEntry[];
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  calculated: 'Рассчитана',
  approved: 'Утверждена',
  paid: 'Выплачена',
};

const statusVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  draft: 'default',
  calculated: 'info',
  approved: 'warning',
  paid: 'success',
};

// Типы записей, считающиеся удержаниями
const DEDUCTION_TYPES = ['deduction', 'tax', 'pension'];

function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
}

function periodLabel(period: string): string {
  return new Date(period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

// ─── Карточка-метрика ─────────────────────────────────────────────────────
function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'danger';
}) {
  const toneStyles: Record<string, string> = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300',
  };
  return (
    <Card padding="md" className="flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6 shrink-0 ${toneStyles[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-500 truncate">{label}</p>
        <p className="text-xl font-bold text-ink-900 dark:text-ink-50 truncate">{value}</p>
      </div>
    </Card>
  );
}

export default function PayrollPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPeriod, setNewPeriod] = useState('');

  // ─── Список ведомостей ──────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => payrollService.getAll(),
  });
  const payrolls: Payroll[] = Array.isArray(data) ? data : data?.data || [];

  // Выбранная ведомость (по умолчанию — первая/самая свежая)
  const activePeriodId = selectedPeriodId || payrolls[0]?.id || '';
  const activePayroll = payrolls.find((p) => p.id === activePeriodId);

  // ─── Детали ведомости (расчётные листы по сотрудникам) ──────────────────
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['payroll', detailId],
    queryFn: () => payrollService.getById(detailId as string),
    enabled: !!detailId,
  });
  const detail: Payroll | undefined = detailData?.data ?? detailData;

  // ─── Создание ведомости ─────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (period: string) => payrollService.create(period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      setShowCreateModal(false);
      setNewPeriod('');
      toast.success('Ведомость создана');
    },
    onError: () => toast.error('Не удалось создать ведомость'),
  });

  // Метрики выбранного периода
  const metrics = useMemo(
    () => ({
      gross: Number(activePayroll?.totalGross ?? 0),
      deductions: Number(activePayroll?.totalDeductions ?? 0),
      net: Number(activePayroll?.totalNet ?? 0),
    }),
    [activePayroll],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Зарплата"
        subtitle="Расчётные ведомости и выплаты сотрудникам"
        icon={<BanknotesIcon />}
        action={
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Создать ведомость
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <LoadingState label="Загрузка ведомостей…" />
        ) : payrolls.length === 0 ? (
          <EmptyState
            icon={<BanknotesIcon />}
            title="Ведомостей пока нет"
            description="Создайте зарплатную ведомость за нужный период, чтобы начать расчёт."
            action={
              <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                Создать ведомость
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            {/* Выбор периода */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-ink-500">Период:</label>
              <select
                className="field w-auto min-w-[200px]"
                value={activePeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                {payrolls.map((p) => (
                  <option key={p.id} value={p.id}>
                    {periodLabel(p.period)} — {statusLabels[p.status] || p.status}
                  </option>
                ))}
              </select>
              {activePayroll && (
                <Badge variant={statusVariant[activePayroll.status] || 'default'} dot>
                  {statusLabels[activePayroll.status] || activePayroll.status}
                </Badge>
              )}
            </div>

            {/* Метрики */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                icon={<ArrowTrendingUpIcon />}
                label="Начислено за период"
                value={money(metrics.gross)}
                tone="primary"
              />
              <MetricCard
                icon={<ArrowTrendingDownIcon />}
                label="Удержано за период"
                value={money(metrics.deductions)}
                tone="danger"
              />
              <MetricCard
                icon={<WalletIcon />}
                label="К выплате за период"
                value={money(metrics.net)}
                tone="success"
              />
            </div>

            {/* Таблица ведомостей */}
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                      <th className="text-left px-4 py-3 font-medium text-ink-500">Период</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-500">Статус</th>
                      <th className="text-right px-4 py-3 font-medium text-ink-500">Начислено</th>
                      <th className="text-right px-4 py-3 font-medium text-ink-500">Удержано</th>
                      <th className="text-right px-4 py-3 font-medium text-ink-500">К выплате</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-500">Создана</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setDetailId(p.id)}
                        className="row-hover border-b border-[var(--border)] last:border-0 cursor-pointer"
                      >
                        <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-50 capitalize">
                          {periodLabel(p.period)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[p.status] || 'default'} size="sm">
                            {statusLabels[p.status] || p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-ink-900 dark:text-ink-50">
                          {money(p.totalGross)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                          {money(p.totalDeductions)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {money(p.totalNet)}
                        </td>
                        <td className="px-4 py-3 text-ink-500">
                          {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--border)] bg-[var(--surface-muted)]">
                      <td className="px-4 py-3 text-xs text-ink-500" colSpan={4}>
                        Всего ведомостей: {payrolls.length}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {money(payrolls.reduce((s, p) => s + Number(p.totalNet || 0), 0))}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ─── Модалка: детали расчётного листа ──────────────────────────── */}
      <Modal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail ? `Ведомость — ${periodLabel(detail.period)}` : 'Ведомость'}
        description={detail ? statusLabels[detail.status] || detail.status : undefined}
        size="2xl"
      >
        {detailLoading || !detail ? (
          <LoadingState label="Загрузка расчётного листа…" />
        ) : (
          <div className="space-y-5">
            {/* Итоги ведомости */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                <p className="text-xs text-ink-500">Начислено</p>
                <p className="font-semibold text-ink-900 dark:text-ink-50">{money(detail.totalGross)}</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                <p className="text-xs text-ink-500">Удержано</p>
                <p className="font-semibold text-red-600 dark:text-red-400">{money(detail.totalDeductions)}</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                <p className="text-xs text-ink-500">К выплате</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">{money(detail.totalNet)}</p>
              </div>
            </div>

            {/* Расчётные листы по сотрудникам */}
            {!detail.entries || detail.entries.length === 0 ? (
              <EmptyState
                icon={<UserGroupIcon />}
                title="Записей нет"
                description="В этой ведомости пока нет начислений и удержаний."
              />
            ) : (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
                  <DocumentTextIcon className="w-4 h-4" />
                  Начисления и удержания
                </p>
                <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
                  {detail.entries.map((entry) => {
                    const isDeduction = DEDUCTION_TYPES.includes(entry.type);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5">
                        <Avatar name={entry.employee?.fullName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink-900 dark:text-ink-50 truncate">
                            {entry.employee?.fullName || '—'}
                          </p>
                          <p className="text-xs text-ink-500 truncate">
                            {entry.description || entry.employee?.position || entry.type}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-semibold shrink-0 ${
                            isDeduction
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isDeduction ? '−' : '+'}
                          {money(entry.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Модалка: создание ведомости ───────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewPeriod('');
        }}
        title="Новая ведомость"
        description="Выберите месяц начисления"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewPeriod('');
              }}
            >
              Отменить
            </Button>
            <Button
              isLoading={createMutation.isPending}
              disabled={!newPeriod}
              onClick={() => newPeriod && createMutation.mutate(newPeriod + '-01')}
            >
              Сохранить
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-sm text-ink-600 dark:text-ink-300 mb-1.5">Период (месяц)</label>
          <input
            type="month"
            value={newPeriod}
            onChange={(e) => setNewPeriod(e.target.value)}
            className="field"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
