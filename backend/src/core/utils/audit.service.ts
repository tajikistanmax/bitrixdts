import prisma from '../../core/config/database';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'VIEW';

export class AuditService {
  async log(params: {
    organizationId?: string;
    actorId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    payload?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          payload: params.payload || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async findByEntity(entityType: string, entityId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByOrganization(organizationId: string, filters?: {
    action?: string;
    entityType?: string;
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { action, entityType, actorId, dateFrom, dateTo, page = 1, limit = 50 } = filters || {};
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
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new AuditService();
