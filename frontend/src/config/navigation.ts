import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  ScaleIcon,
  SunIcon,
  TruckIcon,
  HeartIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  VideoCameraIcon,
  TicketIcon,
  ChartBarSquareIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    name: 'Основное',
    items: [
      { name: 'Рабочий стол', href: '/', icon: HomeIcon },
    ],
  },
  {
    name: 'Сотрудники',
    items: [
      { name: 'Сотрудники', href: '/employees', icon: UsersIcon },
      { name: 'Отделы', href: '/departments', icon: BuildingOfficeIcon },
    ],
  },
  {
    name: 'Задачи и проекты',
    items: [
      { name: 'Задачи', href: '/tasks', icon: ClipboardDocumentListIcon },
      { name: 'Проекты', href: '/projects', icon: FolderIcon },
      { name: 'Согласования', href: '/workflow', icon: ArrowPathIcon },
    ],
  },
  {
    name: 'Коммуникации',
    items: [
      { name: 'Чат', href: '/chat', icon: ChatBubbleLeftRightIcon },
      { name: 'Новости', href: '/news', icon: NewspaperIcon },
      { name: 'Объявления', href: '/announcements', icon: MegaphoneIcon },
    ],
  },
  {
    name: 'Документы',
    items: [
      { name: 'Документы', href: '/documents', icon: DocumentTextIcon },
      { name: 'Файлы', href: '/files', icon: FolderOpenIcon },
      { name: 'Резолюции', href: '/resolutions', icon: ScaleIcon },
    ],
  },
  {
    name: 'Кадры',
    items: [
      { name: 'Отпуска', href: '/vacations', icon: SunIcon },
      { name: 'Командировки', href: '/trips', icon: TruckIcon },
      { name: 'Больничные', href: '/sickleaves', icon: HeartIcon },
      { name: 'KPI', href: '/kpi', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Учёт времени',
    items: [
      { name: 'Посещаемость', href: '/attendance', icon: CheckCircleIcon },
      { name: 'Табель', href: '/timesheet', icon: ClockIcon },
    ],
  },
  {
    name: 'Планирование',
    items: [
      { name: 'Календарь', href: '/calendar', icon: CalendarDaysIcon },
      { name: 'Встречи', href: '/meetings', icon: VideoCameraIcon },
    ],
  },
  {
    name: 'Сервис',
    items: [
      { name: 'Service Desk', href: '/service-desk', icon: TicketIcon },
      { name: 'Отчёты', href: '/reports', icon: ChartBarSquareIcon },
      { name: 'Делегирование', href: '/delegation', icon: UserGroupIcon },
      { name: 'Синхронизация', href: '/sync', icon: ArrowPathIcon },
      { name: 'Audit Log', href: '/audit-logs', icon: ShieldCheckIcon },
    ],
  },
];

export function getPageTitle(pathname: string): string {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.href === pathname) return item.name;
    }
  }
  return 'HR Platform';
}

export function getPageIcon(pathname: string): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.href === pathname) return item.icon;
    }
  }
  return null;
}
