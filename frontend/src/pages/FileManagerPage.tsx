import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '../services/file.service';
import { PageHeader } from '../components/ui';
import type { FileRecord } from '../types/file';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileManagerPage() {
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => fileService.getAll(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => fileService.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fileService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const filteredFiles = files.filter((f: FileRecord) =>
    f.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <PageHeader title="Файлы" action={<button
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              + Загрузить
            </button>} />

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleUpload}
        className="hidden"
      />

      <main className="max-w-7xl mx-auto py-6 px-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Поиск файлов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя файла</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Размер</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата загрузки</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">Загрузка...</td>
                  </tr>
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Файлы не найдены</td>
                  </tr>
                ) : (
                  filteredFiles.map((file: FileRecord) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{file.originalName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatFileSize(file.size)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{file.mimeType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => deleteMutation.mutate(file.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      
  );
}