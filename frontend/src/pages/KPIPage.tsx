import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kpiService } from '../services/kpi.service';
import { Button, Input, Modal } , PageHeader } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { useForm } from 'react-hook-form';
import type { KPIMetric } from '../types/kpi';

export default function KPIPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<KPIMetric | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register: regMetric, handleSubmit: handleMetricSubmit, reset: resetMetric, formState: { errors: errMetric } } = useForm<any>();
  const { register: regValue, handleSubmit: handleValueSubmit, reset: resetValue, formState: { errors: errValue } } = useForm<any>();

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['kpi'],
    queryFn: () => kpiService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: kpiService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      setShowCreateModal(false);
      resetMetric();
      toast.success('Метрика успешно создана');
    },
    onError: () => {
      toast.error('Ошибка создания метрики');
    },
  });

  const addValueMutation = useMutation({
    mutationFn: (data: { metricId: string; value: any }) =>
      kpiService.addValue(data.metricId, data.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      setShowValueModal(false);
      setSelectedMetric(null);
      resetValue();
      toast.success('Значение добавлено');
    },
    onError: () => {
      toast.error('Ошибка добавления значения');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: kpiService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      toast.success('Метрика удалена');
    },
    onError: () => {
      toast.error('Ошибка удаления метрики');
    },
  });

  const onMetricSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const onValueSubmit = (data: any) => {
    if (selectedMetric) {
      addValueMutation.mutate({ metricId: selectedMetric.id, value: data });
    }
  };

  const latestValue = (metric: KPIMetric) => {
    if (!metric.values || metric.values.length === 0) return '—';
    const sorted = [...metric.values].sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()
    );
    return sorted[0].value;
  };

  return (
    <>
<header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">KPI</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              + Новая метрика
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">Метрик пока нет</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Создать первую метрику
              </Button>
            </div>
          ) : (
            <>
              {/* Dashboard cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {metrics.map((metric: KPIMetric) => {
                  const val = latestValue(metric);
                  return (
                    <div key={metric.id} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{metric.name}</h3>
                      {metric.description && (
                        <p className="text-sm text-gray-500 mb-4">{metric.description}</p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-600">
                          {typeof val === 'number' ? val : val}
                        </span>
                        <span className="text-sm text-gray-500">{metric.unit || ''}</span>
                      </div>
                      {metric.target != null && (
                        <div className="mt-2 text-sm text-gray-500">
                          Цель: {metric.target} {metric.unit || ''}
                        </div>
                      )}
                      <div className="mt-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedMetric(metric);
                            setShowValueModal(true);
                          }}
                        >
                          + Добавить значение
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Метрика</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Значение</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цель</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Единица</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.map((metric: KPIMetric) => (
                      <tr key={metric.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{metric.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {latestValue(metric)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {metric.target != null ? metric.target : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.unit || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (confirm('Вы уверены, что хотите удалить метрику?')) {
                                deleteMutation.mutate(metric.id);
                              }
                            }}
                            isLoading={deleteMutation.isPending}
                          >
                            Удалить
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Create Metric Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Новая метрика KPI"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleMetricSubmit(onMetricSubmit)}
              isLoading={createMutation.isPending}
            >
              Создать
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Название метрики"
            placeholder="Введите название"
            {...regMetric('name', { required: 'Название обязательно' })}
            error={errMetric.name?.message as string}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              {...regMetric('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Описание метрики"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Цель"
              type="number"
              placeholder="0"
              {...regMetric('target', { valueAsNumber: true })}
            />
            <Input
              label="Единица измерения"
              placeholder="шт., %, ₽..."
              {...regMetric('unit')}
            />
          </div>
        </form>
      </Modal>

      {/* Add Value Modal */}
      <Modal
        isOpen={showValueModal}
        onClose={() => {
          setShowValueModal(false);
          setSelectedMetric(null);
        }}
        title={selectedMetric ? `Добавить значение — ${selectedMetric.name}` : 'Добавить значение'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowValueModal(false);
                setSelectedMetric(null);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleValueSubmit(onValueSubmit)}
              isLoading={addValueMutation.isPending}
            >
              Добавить
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Значение"
            type="number"
            placeholder="0"
            {...regValue('value', { required: 'Значение обязательно', valueAsNumber: true })}
            error={errValue.value?.message as string}
          />
          <Input
            label="Период"
            type="date"
            {...regValue('period', { required: 'Период обязателен' })}
            error={errValue.period?.message as string}
          />
        </form>
      </Modal>
    </>
  );
}
