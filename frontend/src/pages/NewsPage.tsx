import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService } from '../services/news.service';
import { PageHeader } from '../components/ui';
import type { NewsItem } from '../types/news';
import { useForm } from 'react-hook-form';

export default function NewsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<{
    title: string;
    body: string;
    category: string;
  }>();

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => newsService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: newsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setShowCreateModal(false);
      reset();
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <PageHeader title="Новости" action={<button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              + Добавить
            </button>} />

      <main className="max-w-7xl mx-auto py-6 px-6">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : news.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Новости не найдены</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {news.map((item: NewsItem) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.body}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{item.author?.fullName || '-'}</span>
                    <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Новая новость</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Заголовок</label>
                <input {...register('title', { required: true })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Текст</label>
                <textarea {...register('body', { required: true })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" rows={5} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Категория</label>
                <input {...register('category')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">Отмена</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}