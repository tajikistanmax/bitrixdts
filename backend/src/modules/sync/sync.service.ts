import { prisma } from '../../core/config/database';

interface SyncQueueItem {
  organizationId?: string;
  nodeId?: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
}

class SyncService {
  async findEmployee(id: string, organizationId?: string) {
    return prisma.employee.findFirst({
      where: organizationId ? { id, organizationId } : { id },
      select: { organizationId: true }
    });
  }

  // Добавить элемент в очередь синхронизации
  async addToQueue(data: SyncQueueItem) {
    const { organizationId, nodeId, entityType, entityId, operation, payload } = data;

    const item = await prisma.syncQueue.create({
      data: {
        organizationId,
        nodeId,
        entityType,
        entityId,
        operation,
        payload: JSON.stringify(payload),
        status: 'pending'
      }
    });

    return item;
  }

  // Получить элементы очереди
  async getQueueItems(organizationId?: string, status?: string, limit = 100) {
    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (status) {
      where.status = status;
    }

    return prisma.syncQueue.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }

  // Получить элемент по ID
  async getQueueItem(itemId: string) {
    return prisma.syncQueue.findUnique({
      where: { id: itemId }
    });
  }

  // Обновить статус элемента
  async updateItemStatus(itemId: string, status: string, retryCount = 0) {
    return prisma.syncQueue.update({
      where: { id: itemId },
      data: { status, retryCount }
    });
  }

  // Обработать элемент очереди
  async processQueueItem(itemId: string) {
    const item = await this.getQueueItem(itemId);

    if (!item) {
      throw new Error('Queue item not found');
    }

    if (item.status !== 'pending') {
      return { success: false, message: 'Item already processed' };
    }

    try {
      // Эмуляция синхронизации с облаком
      const payload = JSON.parse(item.payload as string);

      // Здесь должна быть логика синхронизации с внешним сервисом
      // Например, отправка данных в облачный сервис

      await this.updateItemStatus(itemId, 'completed');

      return { success: true, message: 'Item processed successfully' };
    } catch (error: any) {
      const retryCount = (item.retryCount as number) + 1;

      if (retryCount < 3) {
        await this.updateItemStatus(itemId, 'failed', retryCount);
        return { success: false, message: `Processing failed: ${error.message}`, retryCount };
      } else {
        await this.updateItemStatus(itemId, 'failed', retryCount);
        return { success: false, message: 'Max retries reached' };
      }
    }
  }

  // Обработать всю очередь
  async processQueue(organizationId?: string) {
    const items = await this.getQueueItems(organizationId, 'pending', 50);

    const results = await Promise.all(
      items.map((item) => this.processQueueItem(item.id))
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return {
      total: items.length,
      success: successCount,
      failed: failCount
    };
  }

  // Получить статистику синхронизации
  async getSyncStats(organizationId?: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      createdAt: { gte: since }
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [total, completed, failed, pending] = await Promise.all([
      prisma.syncQueue.count({ where }),
      prisma.syncQueue.count({ where: { ...where, status: 'completed' } }),
      prisma.syncQueue.count({ where: { ...where, status: 'failed' } }),
      prisma.syncQueue.count({ where: { ...where, status: 'pending' } })
    ]);

    return {
      period: { days, since, until: new Date() },
      total,
      completed,
      failed,
      pending,
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  // Принудительная синхронизация всех данных
  async forceSync(organizationId: string) {
    // Получить все сущности организации
    const employees = await prisma.employee.findMany({
      where: { organizationId, isDeleted: false }
    });

    const tasks = await prisma.task.findMany({
      where: { organizationId, isDeleted: false }
    });

    const projects = await prisma.project.findMany({
      where: { organizationId, isDeleted: false }
    });

    // Добавить в очередь
    const items = [
      ...employees.map((e) => ({
        organizationId,
        entityType: 'Employee',
        entityId: e.id,
        operation: 'update' as const,
        payload: e
      })),
      ...tasks.map((t) => ({
        organizationId,
        entityType: 'Task',
        entityId: t.id,
        operation: 'update' as const,
        payload: t
      })),
      ...projects.map((p) => ({
        organizationId,
        entityType: 'Project',
        entityId: p.id,
        operation: 'update' as const,
        payload: p
      }))
    ];

    await Promise.all(
      items.map((item) => this.addToQueue(item))
    );

    return { message: `Added ${items.length} items to sync queue` };
  }
}

export default new SyncService();
