import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { TicketStatus } from '@prisma/client';

export interface Ticket {
  id?: string;
  title: string;
  description: string;
  type: 'it' | 'hardware' | 'household' | 'repair' | 'other';
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  requesterId: string;
  assigneeId?: string;
  departmentId?: string;
  organizationId: string;
}

export interface TicketComment {
  id?: string;
  ticketId: string;
  authorId: string;
  body: string;
  attachments?: any[];
}

export class TicketService {
  // Создать заявку
  async createTicket(data: Ticket) {
    const { organizationId, requesterId } = data;

    // Проверить организацию
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError('Организация не найдена', 404);

    // Проверить заявителя
    const requester = await prisma.employee.findFirst({
      where: { id: requesterId, organizationId },
    });
    if (!requester) throw new AppError('Заявитель не найден', 404);

    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: 'open',
        requesterId,
        assigneeId: data.assigneeId,
        departmentId: data.departmentId,
        organizationId,
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return ticket;
  }

  // Получить все заявки
  async getTickets(organizationId: string, filters?: {
    requesterId?: string;
    assigneeId?: string;
    type?: string;
    priority?: string;
    status?: string;
    departmentId?: string;
    my?: boolean;
    userId?: string;
  }, page = 1, limit = 20) {
    const where: any = { organizationId };

    if (filters?.requesterId && !filters.my) {
      where.requesterId = filters.requesterId;
    }

    if (filters?.assigneeId && !filters.my) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.my && filters.userId) {
      where.OR = [
        { requesterId: filters.userId },
        { assigneeId: filters.userId },
      ];
    }

    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              position: true,
            },
          },
          assignee: {
            select: {
              id: true,
              fullName: true,
              position: true,
            },
          },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Получить заявку по ID
  async getTicketById(id: string, organizationId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id, organizationId },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) throw new AppError('Заявка не найдена', 404);

    return ticket;
  }

  // Обновить заявку
  async updateTicket(id: string, organizationId: string, data: Partial<Ticket>) {
    const ticket = await this.getTicketById(id, organizationId);

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        requester: true,
        assignee: true,
      },
    });

    return updated;
  }

  // Обновить статус
  async updateStatus(id: string, organizationId: string, status: TicketStatus, userId: string) {
    const ticket = await this.getTicketById(id, organizationId);

    const updated = await prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        requester: true,
        assignee: true,
      },
    });

    // Добавить комментарий о смене статуса
    await prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: userId,
        body: `Статус изменён на: ${status}`,
        systemComment: true,
      },
    });

    return updated;
  }

  // Назначить исполнителя
  async assign(id: string, organizationId: string, assigneeId: string, userId: string) {
    const ticket = await this.getTicketById(id, organizationId);

    const updated = await prisma.ticket.update({
      where: { id },
      data: { assigneeId },
      include: {
        requester: true,
        assignee: true,
      },
    });

    // Добавить комментарий
    await prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: userId,
        body: `Заявка назначена исполнителю: ${assigneeId}`,
        systemComment: true,
      },
    });

    return updated;
  }

  // Добавить комментарий
  async addComment(ticketId: string, organizationId: string, authorId: string, body: string, attachments?: any[]) {
    const ticket = await this.getTicketById(ticketId, organizationId);

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId,
        body,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return comment;
  }

  // Получить статистику
  async getStatistics(organizationId: string, departmentId?: string) {
    const where: any = { organizationId };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const total = await prisma.ticket.count({ where });

    const byStatus = await prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const byType = await prisma.ticket.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
    });

    const byPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    const open = await prisma.ticket.count({
      where: { ...where, status: { in: ['open', 'in_progress'] } },
    });

    const overdue = await prisma.ticket.count({
      where: { ...where, status: { in: ['open', 'in_progress'] }, updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });

    return {
      total,
      open,
      overdue,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default new TicketService();
