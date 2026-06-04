import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { employeeService } from '../services/employee.service';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { departmentService } from '../services/department.service';
import { useAuthStore } from '../store/auth.store';
import {
  UsersIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const statusLabels: Record<string, string> = {
  todo: 'Нужно сделать',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Готово',
  cancelled: 'Отменено',
};

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочно',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll(),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  });

  const stats = [
    { name: 'Сотрудников', value: employees.length, href: '/employees', icon: UsersIcon, color: 'bg-blue-500' },
    { name: 'Проектов', value: projects.length, href: '/projects', icon: FolderIcon, color: 'bg-emerald-500' },
    { name: 'Задач', value: tasks.length, href: '/tasks', icon: ClipboardDocumentListIcon, color: 'bg-violet-500' },
    { name: 'Отделов', value: departments.length, href: '/departments', icon: BuildingOfficeIcon, color: 'bg-amber-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          С возвращением, {user?.fullName?.split(' ')[0] || 'Пользователь'}
        </h1>
        <p className="text-gray-500 mt-1">Ваша рабочая панель</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Последние задачи</h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Все задачи
            </Link>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Задач пока нет</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 6).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {statusLabels[task.status] || task.status}
                    </p>
                  </div>
                  <span className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${priorityColors[task.priority] || 'bg-gray-100 text-gray-700'}`}>
                    {priorityLabels[task.priority] || task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрый доступ</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Посещаемость', href: '/attendance', emoji: '✅' },
              { name: 'Чат', href: '/chat', emoji: '💬' },
              { name: 'Календарь', href: '/calendar', emoji: '📅' },
              { name: 'Отпуска', href: '/vacations', emoji: '🏖️' },
              { name: 'Service Desk', href: '/service-desk', emoji: '🎫' },
              { name: 'Отчёты', href: '/reports', emoji: '📊' },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
              >
                <span className="text-lg">{link.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{link.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
