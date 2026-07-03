import prisma from '../../core/config/database';

/**
 * Activity Feed (Лента)
 * Агрегирует последние события организации:
 * - Задачи (создание, завершение, назначение)
 * - Документы (загрузка, согласование)
 * - Сотрудники (новые, дни рождения)
 * - Объявления и новости
 * - Комментарии
 */

export interface FeedItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_assigned' | 'document_uploaded' | 'employee_joined' | 'announcement' | 'news' | 'comment' | 'birthday';
  title: string;
  description?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  createdAt: Date;
}

export class FeedService {
  async getFeed(organizationId: string, page = 1, limit = 30): Promise<{ data: FeedItem[]; total: number }> {
    const skip = (page - 1) * limit;
    const items: FeedItem[] = [];

    // Параллельно собираем последние события
    const [tasks, announcements, news, newEmployees] = await Promise.all([
      // Последние задачи (созданные/завершённые)
      prisma.task.findMany({
        where: { organizationId, isDeleted: false },
        select: { id: true, title: true, status: true, creatorId: true, assigneeId: true, createdAt: true, updatedAt: true,
          creator: { select: { id: true, fullName: true, avatarUrl: true } },
          assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      // Объявления
      prisma.announcement.findMany({
        where: { organizationId },
        select: { id: true, title: true, body: true, authorId: true, createdAt: true,
          author: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Новости
      prisma.news.findMany({
        where: { organizationId },
        select: { id: true, title: true, body: true, authorId: true, createdAt: true,
          author: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Новые сотрудники (за последние 30 дней)
      prisma.employee.findMany({
        where: { organizationId, status: 'active', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { id: true, fullName: true, position: true, avatarUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Маппинг задач
    for (const t of tasks) {
      if (t.status === 'done') {
        items.push({ id: `task-done-${t.id}`, type: 'task_completed', title: `Задача завершена: ${t.title}`, actorId: t.assignee?.id, actorName: t.assignee?.fullName, actorAvatar: t.assignee?.avatarUrl || undefined, entityType: 'task', entityId: t.id, link: `/tasks/${t.id}`, createdAt: t.updatedAt });
      } else {
        items.push({ id: `task-created-${t.id}`, type: 'task_created', title: `Создана задача: ${t.title}`, actorId: t.creator?.id, actorName: t.creator?.fullName, actorAvatar: t.creator?.avatarUrl || undefined, entityType: 'task', entityId: t.id, link: `/tasks/${t.id}`, createdAt: t.createdAt });
      }
    }

    // Объявления
    for (const a of announcements) {
      items.push({ id: `ann-${a.id}`, type: 'announcement', title: a.title, description: a.body.substring(0, 200), actorId: a.author?.id, actorName: a.author?.fullName, actorAvatar: a.author?.avatarUrl || undefined, entityType: 'announcement', entityId: a.id, link: '/announcements', createdAt: a.createdAt });
    }

    // Новости
    for (const n of news) {
      items.push({ id: `news-${n.id}`, type: 'news', title: n.title, description: n.body.substring(0, 200), actorId: n.author?.id, actorName: n.author?.fullName, actorAvatar: n.author?.avatarUrl || undefined, entityType: 'news', entityId: n.id, link: '/news', createdAt: n.createdAt });
    }

    // Новые сотрудники
    for (const e of newEmployees) {
      items.push({ id: `emp-${e.id}`, type: 'employee_joined', title: `${e.fullName} присоединился к команде`, description: e.position || undefined, actorId: e.id, actorName: e.fullName, actorAvatar: e.avatarUrl || undefined, entityType: 'employee', entityId: e.id, link: `/employees`, createdAt: e.createdAt });
    }

    // Дни рождения сегодня (если бы было поле birthday)
    // TODO: Добавить поле birthday в Employee

    // Сортировка по дате
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const paged = items.slice(skip, skip + limit);

    return { data: paged, total };
  }
}

export default new FeedService();
