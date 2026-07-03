import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { MemoType, MemoStatus } from '@prisma/client';
import notificationService from '../notifications/notifications.service';

export interface CreateMemoData {
  organizationId: string;
  type: MemoType;
  subject: string;
  body: string;
  authorId: string;
  recipientId?: string;
  departmentId?: string;
  priority?: string;
  dueDate?: string;
  attachments?: any[];
}

export interface UpdateMemoData {
  subject?: string;
  body?: string;
  recipientId?: string;
  departmentId?: string;
  priority?: string;
  dueDate?: string;
  status?: MemoStatus;
  resolution?: string;
}

export interface MemoFilters {
  type?: MemoType;
  status?: MemoStatus;
  authorId?: string;
  recipientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class MemosService {
  // ─── Создать записку ──────────────────────────────────────────────────

  async create(data: CreateMemoData) {
    // Генерируем регистрационный номер
    const count = await prisma.memo.count({
      where: { organizationId: data.organizationId },
    });
    const regNumber = `${data.type.toUpperCase()}-${String(count + 1).padStart(5, '0')}`;

    const memo = await prisma.memo.create({
      data: {
        organizationId: data.organizationId,
        type: data.type,
        registrationNumber: regNumber,
        subject: data.subject,
        body: data.body,
        authorId: data.authorId,
        recipientId: data.recipientId,
        departmentId: data.departmentId,
        priority: data.priority || 'normal',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        attachments: data.attachments || [],
        status: 'draft',
      },
    });

    return memo;
  }

  // ─── Получить список ──────────────────────────────────────────────────

  async findAll(organizationId: string, filters: MemoFilters) {
    const { type, status, authorId, recipientId, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;
    if (recipientId) where.recipientId = recipientId;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [memos, total] = await Promise.all([
      prisma.memo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.memo.count({ where }),
    ]);

    return { data: memos, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ─── Получить по ID ───────────────────────────────────────────────────

  async getById(id: string, organizationId: string) {
    const memo = await prisma.memo.findFirst({
      where: { id, organizationId },
    });
    if (!memo) throw new AppError('Записка не найдена', 404);
    return memo;
  }

  // ─── Обновить ─────────────────────────────────────────────────────────

  async update(id: string, organizationId: string, data: UpdateMemoData) {
    const existing = await prisma.memo.findFirst({ where: { id, organizationId } });
    if (!existing) throw new AppError('Записка не найдена', 404);

    return prisma.memo.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  // ─── Отправить (сменить статус draft → sent) ──────────────────────────

  async send(id: string, organizationId: string) {
    const memo = await prisma.memo.findFirst({ where: { id, organizationId } });
    if (!memo) throw new AppError('Записка не найдена', 404);
    if (memo.status !== 'draft') throw new AppError('Можно отправить только черновик', 400);

    const updated = await prisma.memo.update({
      where: { id },
      data: { status: 'sent' },
    });

    // Уведомить получателя
    if (memo.recipientId) {
      notificationService.sendNotification({
        type: 'general',
        title: `Новая ${this.typeLabel(memo.type)}`,
        message: `${memo.subject} (№ ${memo.registrationNumber})`,
        recipientId: memo.recipientId,
        organizationId,
        link: `/memos`,
        data: { memoId: id },
      }).catch(() => {});
    }

    // Если это поручение (order) — создать задачу
    if (memo.type === 'order' && memo.recipientId) {
      const task = await prisma.task.create({
        data: {
          organizationId,
          title: memo.subject,
          description: memo.body,
          creatorId: memo.authorId,
          assigneeId: memo.recipientId,
          priority: memo.priority === 'high' ? 'high' : 'normal',
          status: 'new',
          dueDate: memo.dueDate,
        },
      });

      notificationService.sendNotification({
        type: 'task_assigned',
        title: 'Задача по поручению',
        message: `Создана задача по поручению: ${memo.subject}`,
        recipientId: memo.recipientId,
        organizationId,
        link: `/tasks/${task.id}`,
        data: { taskId: task.id, memoId: id },
      }).catch(() => {});
    }

    return updated;
  }

  private typeLabel(type: MemoType): string {
    const labels: Record<string, string> = {
      memo: 'служебная записка',
      report: 'докладная',
      request: 'обращение',
      complaint: 'жалоба',
      order: 'поручение',
    };
    return labels[type] || 'записка';
  }

  // ─── Наложить резолюцию ───────────────────────────────────────────────

  async resolve(id: string, organizationId: string, resolvedById: string, resolution: string) {
    const memo = await prisma.memo.findFirst({ where: { id, organizationId } });
    if (!memo) throw new AppError('Записка не найдена', 404);

    const updated = await prisma.memo.update({
      where: { id },
      data: {
        status: 'resolved',
        resolution,
        resolvedById,
        resolvedAt: new Date(),
      },
    });

    // Уведомить автора о наложенной резолюции
    notificationService.sendNotification({
      type: 'general',
      title: 'Резолюция по обращению',
      message: `На вашу записку "${memo.subject}" наложена резолюция`,
      recipientId: memo.authorId,
      organizationId,
      link: '/memos',
      data: { memoId: id },
    }).catch(() => {});

    return updated;
  }

  // ─── Удалить ──────────────────────────────────────────────────────────

  async delete(id: string, organizationId: string) {
    const memo = await prisma.memo.findFirst({ where: { id, organizationId } });
    if (!memo) throw new AppError('Записка не найдена', 404);
    if (memo.status !== 'draft') throw new AppError('Можно удалить только черновик', 400);

    await prisma.memo.delete({ where: { id } });
    return { success: true };
  }

  // ─── Статистика ───────────────────────────────────────────────────────

  async getStatistics(organizationId: string) {
    const [total, byStatus, byType] = await Promise.all([
      prisma.memo.count({ where: { organizationId } }),
      prisma.memo.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { status: true },
      }),
      prisma.memo.groupBy({
        by: ['type'],
        where: { organizationId },
        _count: { type: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, i) => { acc[i.status] = i._count.status; return acc; }, {} as any),
      byType: byType.reduce((acc, i) => { acc[i.type] = i._count.type; return acc; }, {} as any),
    };
  }
}

export default new MemosService();
