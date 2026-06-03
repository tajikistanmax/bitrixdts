import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employee.service';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { departmentService } from '../services/department.service';
import { useAuthStore } from '../store/auth.store';
import { NotificationsDropdown } from '../components/NotificationsDropdown';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Загрузка статистики
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
    { name: 'Сотрудников', value: employees.length.toString(), href: '/employees', color: 'bg-blue-500' },
    { name: 'Проектов', value: projects.length.toString(), href: '/projects', color: 'bg-green-500' },
    { name: 'Задач', value: tasks.length.toString(), href: '/tasks', color: 'bg-purple-500' },
    { name: 'Отделов', value: departments.length.toString(), href: '/departments', color: 'bg-orange-500' },
  ];

  const quickLinks = [
    { name: 'Посещаемость', href: '/attendance', color: 'text-green-600' },
    { name: 'Табель', href: '/timesheet', color: 'text-blue-600' },
    { name: 'Отпуска', href: '/vacations', color: 'text-teal-600' },
    { name: 'Командировки', href: '/trips', color: 'text-indigo-600' },
    { name: 'Больничные', href: '/sickleaves', color: 'text-red-600' },
    { name: 'Чат', href: '/chat', color: 'text-purple-600' },
    { name: 'Встречи', href: '/meetings', color: 'text-pink-600' },
    { name: 'Документы', href: '/documents', color: 'text-yellow-600' },
    { name: 'KPI', href: '/kpi', color: 'text-orange-600' },
    { name: 'Отчёты', href: '/reports', color: 'text-gray-600' },
    { name: 'Календарь', href: '/calendar', color: 'text-blue-600' },
    { name: 'Делегирование', href: '/delegation', color: 'text-cyan-600' },
    { name: 'Поручения', href: '/resolutions', color: 'text-violet-600' },
    { name: 'Service Desk', href: '/service-desk', color: 'text-amber-600' },
    { name: 'Файлы', href: '/files', color: 'text-lime-600' },
    { name: 'Новости', href: '/news', color: 'text-sky-600' },
    { name: 'Объявления', href: '/announcements', color: 'text-rose-600' },
    { name: 'Синхронизация', href: '/sync', color: 'text-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationsDropdown />
              
              {/* User info */}
              <span className="text-sm text-gray-600">
                {user?.fullName}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {user?.position || 'Сотрудник'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <Link
                key={stat.name}
                to={stat.href}
                className={`${stat.color} rounded-lg shadow p-5 text-white hover:opacity-90 transition-opacity`}
              >
                <dt className="text-sm font-medium opacity-80">{stat.name}</dt>
                <dd className="mt-2 text-3xl font-semibold">{stat.value}</dd>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Быстрые действия
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className={`font-medium ${link.color}`}>{link.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Последние задачи
            </h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500">Задач пока нет</p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        {task.status === 'todo' && 'Нужно сделать'}
                        {task.status === 'in_progress' && 'В работе'}
                        {task.status === 'review' && 'На проверке'}
                        {task.status === 'done' && 'Готово'}
                        {task.status === 'cancelled' && 'Отменено'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.priority === 'low' && 'Низкий'}
                      {task.priority === 'medium' && 'Средний'}
                      {task.priority === 'high' && 'Высокий'}
                      {task.priority === 'urgent' && 'Срочно'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
