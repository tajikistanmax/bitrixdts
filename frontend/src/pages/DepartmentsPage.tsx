import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/department.service';
import { employeeService } from '../services/employee.service';
import { Button, Input, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { useForm } from 'react-hook-form';
import type { Department, CreateDepartmentDTO } from '../types/department';
import type { Employee } from '../types/employee';

export default function DepartmentsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

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
      toast.success('Отдел успешно создан');
    },
    onError: () => {
      toast.error('Ошибка создания отдела');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Отдел удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления отдела');
    },
  });

  const onSubmit = (data: CreateDepartmentDTO) => {
    createMutation.mutate(data);
  };

  // Build department tree
  const buildTree = (parent_id?: string): Department[] => {
    return departments
      .filter((d: Department) => d.parentId === parent_id)
      .map((dept: Department) => ({
        ...dept,
        children: buildTree(dept.id),
      }));
  };

  const tree = buildTree();

  const DepartmentNode = ({ dept, level = 0 }: { dept: Department; level?: number }) => (
    <div style={{ marginLeft: level * 20 }} className="mb-4">
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{dept.name}</h3>
            {dept.headName && (
              <p className="text-sm text-gray-600 mt-1">
                Руководитель: {dept.headName}
              </p>
            )}
            {dept.employeeCount !== undefined && (
              <p className="text-sm text-gray-600">
                Сотрудников: {dept.employeeCount}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDepartment(dept)}
            >
              Подробнее
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('Удалить отдел?')) {
                  deleteMutation.mutate(dept.id);
                }
              }}
            >
              Удалить
            </Button>
          </div>
        </div>
      </div>
      {dept.children && dept.children.length > 0 && (
        <div className="mt-2">
          {(dept.children as Department[]).map((child: Department) => (
            <DepartmentNode key={child.id} dept={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Подразделения</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              + Новый отдел
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : tree.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">Отделов пока нет</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Создать первый отдел
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tree.map((dept: Department) => (
                <DepartmentNode key={dept.id} dept={dept} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Новый отдел"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending}
            >
              Создать
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Название отдела"
            placeholder="Введите название"
            {...register('name', { required: 'Название обязательно' })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Родительский отдел (необязательно)
            </label>
            <select
              {...register('parentId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Нет</option>
              {departments
                .filter((d: Department) => !d.parentId)
                .map((d: Department) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Руководитель (необязательно)
            </label>
            <select
              {...register('headId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Не назначен</option>
              {employees.map((emp: Employee) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Department Details Modal */}
      {selectedDepartment && (
        <Modal
          isOpen={!!selectedDepartment}
          onClose={() => setSelectedDepartment(null)}
          title={selectedDepartment.name}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setSelectedDepartment(null)}>
              Закрыть
            </Button>
          }
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">ID</h4>
              <p className="mt-1 text-gray-900 font-mono text-sm">
                {selectedDepartment.id}
              </p>
            </div>
            {selectedDepartment.headName && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Руководитель</h4>
                <p className="mt-1 text-gray-900">{selectedDepartment.headName}</p>
              </div>
            )}
            {selectedDepartment.employeeCount !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Сотрудников</h4>
                <p className="mt-1 text-gray-900">{selectedDepartment.employeeCount}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-700">Дата создания</h4>
              <p className="mt-1 text-gray-900">
                {new Date(selectedDepartment.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
