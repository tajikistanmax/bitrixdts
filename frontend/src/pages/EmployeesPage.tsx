import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employee.service';
import type { Employee } from '../types/employee';
import { useForm } from 'react-hook-form';
import { PageHeader, Button } from '../components/ui';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { email: '', fullName: '', position: '', phone: '' },
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowCreateModal(false);
      reset();
    },
  });

  const filteredEmployees = employees.filter((emp: Employee) =>
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Сотрудники"
        action={<Button onClick={() => setShowCreateModal(true)}>+ Добавить</Button>}
      />

      <div className="max-w-7xl mx-auto py-6 px-6">
        <input
          type="text"
          placeholder="Поиск сотрудников..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-6"
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['ФИО', 'Email', 'Должность', 'Телефон', 'Статус'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Загрузка...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Сотрудники не найдены</td></tr>
              ) : (
                filteredEmployees.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{emp.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{emp.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{emp.position || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{emp.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {emp.status === 'active' ? 'Активен' : 'Не активен'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Новый сотрудник</h2>
            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              {[
                { label: 'ФИО', name: 'fullName', required: true },
                { label: 'Email', name: 'email', type: 'email', required: true },
                { label: 'Должность', name: 'position' },
                { label: 'Телефон', name: 'phone' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    {...register(field.name as any, { required: field.required })}
                    type={field.type || 'text'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <Button type="submit" isLoading={createMutation.isPending}>
                  Создать
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
