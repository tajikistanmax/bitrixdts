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
  RectangleGroupIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

export interface NavItem {
  /** Ключ перевода: nav.items.<key>. `name` — русский фолбэк. */
  key: string;
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  /** Ключ перевода: nav.groups.<key>. `name` — русский фолбэк. */
  key: string;
  name: string;
  defaultOpen?: boolean;
  items: NavItem[];
}

/** Единственный источник правды для навигации. Покрывает все маршруты App.tsx. */
export const navigationGroups: NavGroup[] = [
  {
    key: 'main',
    name: 'Главное',
    defaultOpen: true,
    items: [
      { key: 'dashboard', name: 'Дашборд', href: '/', icon: HomeIcon },
      { key: 'chat', name: 'Мессенджер', href: '/chat', icon: ChatBubbleLeftRightIcon },
      { key: 'feed', name: 'Лента', href: '/feed', icon: NewspaperIcon },
      { key: 'calendar', name: 'Календарь', href: '/calendar', icon: CalendarDaysIcon },
    ],
  },
  {
    key: 'tasksProjects',
    name: 'Задачи и проекты',
    defaultOpen: true,
    items: [
      { key: 'tasks', name: 'Задачи', href: '/tasks', icon: ClipboardDocumentListIcon },
      { key: 'projects', name: 'Проекты', href: '/projects', icon: FolderIcon },
      { key: 'workflow', name: 'Согласования', href: '/workflow', icon: ArrowPathIcon },
      { key: 'resolutions', name: 'Резолюции', href: '/resolutions', icon: ScaleIcon },
      { key: 'serviceDesk', name: 'Service Desk', href: '/service-desk', icon: TicketIcon },
    ],
  },
  {
    key: 'documents',
    name: 'Документы',
    defaultOpen: true,
    items: [
      { key: 'documents', name: 'Документы', href: '/documents', icon: DocumentTextIcon },
      { key: 'files', name: 'Диск', href: '/files', icon: FolderOpenIcon },
      { key: 'memos', name: 'Служебные записки', href: '/memos', icon: DocumentTextIcon },
    ],
  },
  {
    key: 'company',
    name: 'Компания',
    defaultOpen: true,
    items: [
      { key: 'employees', name: 'Сотрудники', href: '/employees', icon: UsersIcon },
      { key: 'departments', name: 'Отделы', href: '/departments', icon: BuildingOfficeIcon },
      { key: 'staff', name: 'Штатное расписание', href: '/staff', icon: RectangleGroupIcon },
      { key: 'workspaces', name: 'Группы', href: '/workspaces', icon: UserGroupIcon },
    ],
  },
  {
    key: 'hr',
    name: 'Кадры и учёт времени',
    items: [
      { key: 'vacations', name: 'Отпуска', href: '/vacations', icon: SunIcon },
      { key: 'sickleaves', name: 'Больничные', href: '/sickleaves', icon: HeartIcon },
      { key: 'trips', name: 'Командировки', href: '/trips', icon: TruckIcon },
      { key: 'attendance', name: 'Посещаемость', href: '/attendance', icon: CheckCircleIcon },
      { key: 'timesheet', name: 'Табель', href: '/timesheet', icon: ClockIcon },
      { key: 'payroll', name: 'Зарплата', href: '/payroll', icon: BanknotesIcon },
    ],
  },
  {
    key: 'info',
    name: 'Информирование',
    items: [
      { key: 'news', name: 'Новости', href: '/news', icon: NewspaperIcon },
      { key: 'announcements', name: 'Объявления', href: '/announcements', icon: MegaphoneIcon },
      { key: 'meetings', name: 'Встречи', href: '/meetings', icon: VideoCameraIcon },
    ],
  },
  {
    key: 'admin',
    name: 'Аналитика и администрирование',
    items: [
      { key: 'reports', name: 'Отчёты', href: '/reports', icon: ChartBarSquareIcon },
      { key: 'kpi', name: 'KPI', href: '/kpi', icon: ChartBarIcon },
      { key: 'delegation', name: 'Делегирование', href: '/delegation', icon: UserGroupIcon },
      { key: 'sync', name: 'Синхронизация', href: '/sync', icon: ArrowsRightLeftIcon },
      { key: 'auditLogs', name: 'Журнал аудита', href: '/audit-logs', icon: ShieldCheckIcon },
    ],
  },
];

/** Плоский список для поиска/командной палитры. */
export const allNavItems: NavItem[] = navigationGroups.flatMap((g) => g.items);

export function getNavItem(pathname: string): NavItem | undefined {
  return allNavItems.find((i) => i.href === pathname);
}

export function getPageTitle(pathname: string): string {
  return getNavItem(pathname)?.name ?? 'CMR-DTS';
}

export function getPageIcon(
  pathname: string
): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
  const item = allNavItems.find((i) => i.href === pathname);
  return item?.icon ?? null;
}
