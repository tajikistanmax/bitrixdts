import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface Delegation {
  id?: string;
  delegatorId: string;
  delegateeId: string;
  type: 'task' | 'approval' | 'position' | 'all';
  startDate: string;
  endDate: string;
  autoApply: boolean;
  organizationId: string;
  isActive?: boolean;
}

export class DelegationService {
  // Создать делегирование
  async createDelegation(data: Delegation) {
    const { organizationId, delegatorId, delegateeId } = data;

    // Проверить организацию
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError('Организация не найдена', 404);

    // Проверить делегатора
    const delegator = await prisma.employee.findFirst({
      where: { id: delegatorId, organizationId },
    });
    if (!delegator) throw new AppError('Делегатор не найден', 404);

    // Проверить делегируемого
    const delegatee = await prisma.employee.findFirst({
      where: { id: delegateeId, organizationId },
    });
    if (!delegatee) throw new AppError('Делегируемый не найден', 404);

    // Проверить даты
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      throw new AppError('Дата окончания должна быть позже даты начала', 400);
    }

    const delegation = await prisma.delegation.create({
      data: {
        delegatorId,
        delegateeId,
        type: data.type,
        startDate: start,
        endDate: end,
        autoApply: data.autoApply !== false,
        organizationId,
        isActive: true,
      },
    });

    // Если делегирование активное сейчас, применить автоматически
    const now = new Date();
    if (data.autoApply && now >= start && now <= end) {
      await this.applyDelegation(delegation.id);
    }

    return delegation;
  }

  // Получить все делегирования
  async getDelegations(organizationId: string, filters?: {
    employeeId?: string;
    type?: string;
    isActive?: boolean;
    activeNow?: boolean;
  }) {
    const where: any = { organizationId };

    if (filters?.employeeId) {
      where.OR = [
        { delegatorId: filters.employeeId },
        { delegateeId: filters.employeeId },
      ];
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.activeNow) {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
      where.isActive = true;
    }

    const delegations = await prisma.delegation.findMany({
      where,
      include: {
        delegator: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true,
          },
        },
        delegatee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return delegations;
  }

  // Получить активные делегирования для сотрудника
  async getActiveDelegations(employeeId: string) {
    const now = new Date();

    const delegations = await prisma.delegation.findMany({
      where: {
        delegateeId: employeeId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        delegator: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return delegations;
  }

  // Обновить делегирование
  async updateDelegation(id: string, organizationId: string, data: Partial<Delegation>) {
    const delegation = await prisma.delegation.findFirst({
      where: { id, organizationId },
    });

    if (!delegation) throw new AppError('Делегирование не найдено', 404);

    const updated = await prisma.delegation.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Деактивировать делегирование
  async deactivateDelegation(id: string, organizationId: string) {
    const delegation = await prisma.delegation.findFirst({
      where: { id, organizationId },
    });

    if (!delegation) throw new AppError('Делегирование не найдено', 404);

    await prisma.delegation.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }

  // Удалить делегирование
  async deleteDelegation(id: string, organizationId: string) {
    await prisma.delegation.delete({ where: { id, organizationId } });
    return { success: true };
  }

  // Применить делегирование (перенести задачи)
  private async applyDelegation(delegationId: string) {
    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) return;

    // Перенести задачи
    if (delegation.type === 'task' || delegation.type === 'all') {
      await prisma.task.updateMany({
        where: { assigneeId: delegation.delegatorId },
        data: { assigneeId: delegation.delegateeId },
      });
    }

    // Перенести задачи на согласовании (если есть такая сущность)
    // TODO: Интеграция с workflow
  }

  // Установить заместителя для позиции
  async setDeputyForPosition(
    organizationId: string,
    position: string,
    deputyId: string,
    startDate: string,
    endDate: string
  ) {
    const deputy = await prisma.employee.findFirst({
      where: { id: deputyId, organizationId },
    });
    if (!deputy) throw new AppError('Заместитель не найден', 404);

    // Найти всех сотрудников с данной позицией
    const employees = await prisma.employee.findMany({
      where: { organizationId, position },
    });

    // Создать делегирование для каждого
    for (const emp of employees) {
      await this.createDelegation({
        delegatorId: emp.id,
        delegateeId: deputyId,
        type: 'position',
        startDate,
        endDate,
        autoApply: true,
        organizationId,
      });
    }

    return { success: true, count: employees.length };
  }

  // Получить заместителей сотрудника
  async getDeputiesForEmployee(employeeId: string, organizationId: string) {
    const now = new Date();

    const delegations = await prisma.delegation.findMany({
      where: {
        delegatorId: employeeId,
        organizationId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        delegatee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return delegations;
  }

  // Проверить есть ли активное делегирование
  async hasActiveDelegation(delegatorId: string, delegateeId: string): Promise<boolean> {
    const now = new Date();

    const count = await prisma.delegation.count({
      where: {
        delegatorId,
        delegateeId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    return count > 0;
  }

  // Получить всех сотрудников с делегированием на согласование
  async getDelegatedApprovers(employeeId: string, organizationId: string) {
    const now = new Date();

    const delegations = await prisma.delegation.findMany({
      where: {
        delegateeId: employeeId,
        organizationId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        type: { in: ['approval', 'all'] },
      },
      include: {
        delegator: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return delegations.map(d => d.delegatorId);
  }
}

export default new DelegationService();
