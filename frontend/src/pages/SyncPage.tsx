import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncService } from '../services/sync.service';
import type { SyncItem } from '../types/sync';

export default function SyncPage() {
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['sync-queue'],
    queryFn: () => syncService.getQueue(),
  });

  const { data: stats } = useQuery({
    queryKey: ['sync-stats'],
    queryFn: () => syncService.getStats(),
  });

  const processAllMutation = useMutation({
    mutationFn: () => syncService.processAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
    },
  });

  const forceSyncMutation = useMutation({
    mutationFn: () => syncService.forceSync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
    },
  });

  const statCards = [
    { label: 'Всего', value: stats?.total ?? 0, color: 'bg-blue-500' },
    { label: 'В обработке', value: stats?.processing ?? 0, color: 'bg-yellow-500' },
    { label: 'Ошибок', value: stats?.failed ?? 0, color: 'bg-red-500' },
    { label: 'Завершено', value: stats?.completed ?? 0, color: 'bg-green-500' },
  ];

  return (
    <>
<header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Синхронизация</h1>
            <div className="flex gap-3">
              <button
                onClick={() => processAllMutation.mutate()}
                disabled={processAllMutation.isPending}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {processAllMutation.isPending ? 'Синхронизация...' : 'Синхронизировать всё'}
              </button>
              <button
                onClick={() => forceSyncMutation.mutate()}
                disabled={forceSyncMutation.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Принудительная синхронизация
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${card.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-sm text-gray-500">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center">Загрузка...</td>
                  </tr>
                ) : queue.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Нет элементов в очереди</td>
                  </tr>
                ) : (
                  queue.map((item: SyncItem) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{item.entityType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'failed' ? 'bg-red-100 text-red-800' :
                          item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'completed' ? 'Завершено' :
                           item.status === 'failed' ? 'Ошибка' :
                           item.status === 'processing' ? 'В обработке' : 'Ожидает'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      
  );
}
