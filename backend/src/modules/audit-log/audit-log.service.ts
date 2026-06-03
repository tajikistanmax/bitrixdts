import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface AuditLogFilters {
  organizationId: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class AuditLogService {
  async findAll(filters: AuditLogFilters) {
    const { organizationId, action, entityType, actorId, dateFrom, dateTo, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const total = await prisma.auditLog.count({ where });
    const data = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string) {
    const log = await prisma.auditLog.findFirst({
      where: { id, organizationId },
    });
    if (!log) throw new AppError('Запись аудита не найдена', 404);
    return log;
  }
}

export default new AuditLogService();
