import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendance.service';
import { employeeService } from '../services/employee.service';
import { PageHeader } from '../components/ui';
import type { Attendance, AttendanceStats } from '../types/attendance';

export default function AttendancePage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAll(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });

  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ['attendanceStats'],
    queryFn: () => attendanceService.getStats(),
  });

  const checkMutation = useMutation({
    mutationFn: () => attendanceService.create({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
    },
  });

  const filteredAttendance = attendance.filter((record: Attendance) => {
    const employee = employees.find((emp: any) => emp.id === record.employeeId);
    const name = employee?.fullName || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp: any) => emp.id === employeeId);
    return employee?.fullName || employeeId;
  };

  const statusLabels: Record<string, string> = {
    present: 'Присутствует',
    absent: 'Отсутствует',
    late: 'Опоздал',
  };

  const statusColors: Record<string, string> = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <>
{/* Header */}
      <PageHeader title="Учёт посещаемости" action={<button
              onClick={() => checkMutation.mutate()}
              disabled={checkMutation.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {checkMutation.isPending ? 'Отметка...' : 'Отметить вход/выход'}
            </button>} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-6">
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-gray-500">Всего</p>
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-green-600">Присутствует</p>
              <p className="text-2xl font-bold text-green-700">{stats?.present ?? 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-red-600">Отсутствует</p>
              <p className="text-2xl font-bold text-red-700">{stats?.absent ?? 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-yellow-600">Опоздал</p>
              <p className="text-2xl font-bold text-yellow-700">{stats?.late ?? 0}</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Поиск по сотрудникам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сотрудник</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Вход</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Выход</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Источник</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">Загрузка...</td>
                  </tr>
                ) : filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Записи не найдены
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((record: Attendance) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {getEmployeeName(record.employeeId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {record.checkIn || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {record.checkOut || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[record.status || ''] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[record.status || ''] || record.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {record.source}
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