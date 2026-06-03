import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { WorkflowInstanceStatus, WorkflowApprovalStatus, EmployeeStatus, DocumentStatus, VacationStatus } from '@prisma/client';

export interface WorkflowStep {
  id?: string;
  order: number;
  type: 'employee' | 'position' | 'department' | 'role' | 'condition';
  employeeId?: string;
  position?: string;
  departmentId?: string;
  roleId?: string;
  condition?: string; // JSON условие
  required: boolean;
  autoApprove?: boolean;
}

export interface WorkflowRoute {
  id?: string;
  name: string;
  description?: string;
  entityType: string; // 'document', 'vacation', 'task', 'custom'
  entityTypeId?: string;
  steps: WorkflowStep[];
  organizationId: string;
  isActive: boolean;
}

export interface WorkflowInstance {
  id?: string;
  routeId: string;
  entityId: string;
  entityType: string;
  organizationId: string;
  currentStep: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  startedById: string;
  completedAt?: Date;
}

export interface WorkflowApproval {
  id?: string;
  instanceId: string;
  stepOrder: number;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: Date;
}

export class WorkflowService {
  // Создать новый маршрут согласования
  async createRoute(data: WorkflowRoute) {
    const { organizationId, steps } = data;

    // Проверить организацию
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError('Организация не найдена', 404);

    // Создать маршрут
    const route = await prisma.workflowRoute.create({
      data: {
        name: data.name,
        description: data.description,
        entityType: data.entityType,
        entityTypeId: data.entityTypeId,
        organizationId,
        isActive: data.isActive !== false,
        steps: JSON.stringify(steps),
      },
    });

    return route;
  }

  // Получить все маршруты
  async getRoutes(organizationId: string, filters?: {
    entityType?: string;
    isActive?: boolean;
  }) {
    const where: any = { organizationId };

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const routes = await prisma.workflowRoute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return routes.map(r => ({
      ...r,
      steps: JSON.parse(r.steps as string),
    }));
  }

  // Получить маршрут по ID
  async getRouteById(id: string, organizationId: string) {
    const route = await prisma.workflowRoute.findFirst({
      where: { id, organizationId },
    });

    if (!route) throw new AppError('Маршрут не найден', 404);

    return {
      ...route,
      steps: JSON.parse(route.steps as string),
    };
  }

  // Обновить маршрут
  async updateRoute(id: string, organizationId: string, data: Partial<WorkflowRoute>) {
    const route = await prisma.workflowRoute.findFirst({
      where: { id, organizationId },
    });

    if (!route) throw new AppError('Маршрут не найден', 404);

    const updated = await prisma.workflowRoute.update({
      where: { id },
      data: {
        ...data,
        steps: data.steps ? JSON.stringify(data.steps) : undefined,
      },
    });

    return {
      ...updated,
      steps: JSON.parse(updated.steps as string),
    };
  }

  // Удалить маршрут
  async deleteRoute(id: string, organizationId: string) {
    // Проверить активные инстансы
    const activeInstances = await prisma.workflowInstance.count({
      where: { routeId: id, status: WorkflowInstanceStatus.active },
    });

    if (activeInstances > 0) {
      throw new AppError('Нельзя удалить маршрут с активными инстансами', 400);
    }

    await prisma.workflowRoute.delete({ where: { id } });
    return { success: true };
  }

  // Запустить workflow для сущности
  async startWorkflow(routeId: string, entityId: string, entityType: string, organizationId: string, startedById: string) {
    const route = await this.getRouteById(routeId, organizationId);

    if (!route.isActive) {
      throw new AppError('Маршрут не активен', 400);
    }

    const steps = route.steps as WorkflowStep[];

    if (steps.length === 0) {
      throw new AppError('Маршрут не содержит шагов', 400);
    }

    // Создать инстанс
    const instance = await prisma.workflowInstance.create({
      data: {
        routeId,
        entityId,
        entityType,
        organizationId,
        currentStep: 1,
        status: WorkflowInstanceStatus.active,
        startedById,
      },
    });

    // Создать первый шаг согласования
    const firstStep = steps[0];
    const approverId = await this.resolveApprover(firstStep, organizationId, entityId);

    await prisma.workflowApproval.create({
      data: {
        instanceId: instance.id,
        stepOrder: 1,
        approverId,
        status: WorkflowApprovalStatus.pending,
      },
    });

    return {
      ...instance,
      steps: steps,
    };
  }

  // Получить текущий шаг согласования
  async getCurrentApproval(instanceId: string) {
    const approval = await prisma.workflowApproval.findFirst({
      where: {
        instanceId,
        status: WorkflowApprovalStatus.pending,
      },
      orderBy: { stepOrder: 'asc' },
      include: {
        approver: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return approval;
  }

  // Получить все согласования инстанса
  async getInstanceApprovals(instanceId: string) {
    const approvals = await prisma.workflowApproval.findMany({
      where: { instanceId },
      include: {
        approver: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { stepOrder: 'asc' },
    });

    return approvals;
  }

  // Получить инстанс workflow
  async getInstance(instanceId: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        route: true,
      },
    });

    if (!instance) throw new AppError('Инстанс не найден', 404);

    const route = await this.getRouteById(instance.routeId, instance.organizationId);
    const approvals = await this.getInstanceApprovals(instanceId);

    return {
      ...instance,
      route: {
        ...route,
        steps: route.steps as WorkflowStep[],
      },
      approvals,
    };
  }

  // Одобрить текущий шаг
  async approveStep(instanceId: string, stepOrder: number, approverId: string, comment?: string) {
    const instance = await this.getInstance(instanceId);

    if (instance.status !== WorkflowInstanceStatus.active) {
      throw new AppError('Workflow завершён', 400);
    }

    const approval = await prisma.workflowApproval.findFirst({
      where: {
        instanceId,
        stepOrder,
        approverId,
        status: 'pending',
      },
    });

    if (!approval) {
      throw new AppError('Согласование не найдено или уже обработано', 404);
    }

    const route = await this.getRouteById(instance.routeId, instance.organizationId);
    const steps = route.steps as WorkflowStep[];

    // Обновить статус согласования
    await prisma.workflowApproval.update({
      where: { id: approval.id },
      data: {
        status: WorkflowApprovalStatus.approved,
        comment,
        approvedAt: new Date(),
      },
    });

    // Проверить следующий шаг
    const nextStepOrder = stepOrder + 1;
    const nextStep = steps.find(s => s.order === nextStepOrder);

    if (nextStep) {
      // Есть следующий шаг
      const nextApproverId = await this.resolveApprover(nextStep, instance.organizationId, instance.entityId);

      await prisma.workflowApproval.create({
        data: {
          instanceId,
          stepOrder: nextStepOrder,
          approverId: nextApproverId,
          status: WorkflowApprovalStatus.pending,
        },
      });

      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { currentStep: nextStepOrder },
      });
    } else {
      // Workflow завершён успешно
      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: WorkflowInstanceStatus.completed,
          completedAt: new Date(),
        },
      });

      // Обновить статус сущности (если нужно)
      await this.updateEntityStatus(instance.entityType, instance.entityId, 'approved');
    }

    return this.getInstance(instanceId);
  }

  // Отклонить согласование
  async rejectStep(instanceId: string, stepOrder: number, approverId: string, comment: string) {
    const instance = await this.getInstance(instanceId);

    if (instance.status !== WorkflowInstanceStatus.active) {
      throw new AppError('Workflow завершён', 400);
    }

    const approval = await prisma.workflowApproval.findFirst({
      where: {
        instanceId,
        stepOrder,
        approverId,
        status: WorkflowApprovalStatus.pending,
      },
    });

    if (!approval) {
      throw new AppError('Согласование не найдено', 404);
    }

    // Обновить статус согласования
    await prisma.workflowApproval.update({
      where: { id: approval.id },
      data: {
        status: WorkflowApprovalStatus.rejected,
        comment,
        approvedAt: new Date(),
      },
    });

    // Обновить статус инстанса
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: WorkflowInstanceStatus.rejected, completedAt: new Date() },
    });

    // Обновить статус сущности
    await this.updateEntityStatus(instance.entityType, instance.entityId, 'rejected' as DocumentStatus | VacationStatus);

    return this.getInstance(instanceId);
  }

  // Отменить workflow
  async cancelWorkflow(instanceId: string, organizationId: string) {
    const instance = await this.getInstance(instanceId);

    if (instance.organizationId !== organizationId) {
      throw new AppError('Доступ запрещён', 403);
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: WorkflowInstanceStatus.cancelled, completedAt: new Date() },
    });

    return this.getInstance(instanceId);
  }

  // Решить кто будет согласовывать
  private async resolveApprover(step: WorkflowStep, organizationId: string, entityId: string): Promise<string> {
    switch (step.type) {
      case 'employee':
        if (!step.employeeId) throw new AppError('Не указан сотрудник', 400);
        return step.employeeId;

      case 'position':
        // Найти сотрудника с такой позицией в организации
        const employeeByPosition = await prisma.employee.findFirst({
          where: { organizationId, position: step.position, status: EmployeeStatus.active },
        });
        if (!employeeByPosition) throw new AppError(`Сотрудник с позицией "${step.position}" не найден`, 404);
        return employeeByPosition.id;

      case 'department':
        // Найти руководителя отдела
        if (!step.departmentId) throw new AppError('Не указан отдел', 400);
        const department = await prisma.department.findFirst({
          where: { id: step.departmentId, organizationId },
          include: { head: true },
        });
        if (!department?.head) throw new AppError(`Руководитель отдела не найден`, 404);
        return department.head.id;

      case 'role':
        // Найти сотрудника с такой ролью
        if (!step.roleId) throw new AppError('Не указана роль', 400);
        const employeeWithRole = await prisma.employeeRole.findFirst({
          where: { roleId: step.roleId, employee: { organizationId, status: EmployeeStatus.active } },
          include: { employee: true },
        });
        if (!employeeWithRole) throw new AppError(`Сотрудник с ролью не найден`, 404);
        return employeeWithRole.employeeId;

      case 'condition':
        // Условие на основе entity (например, сумма документа)
        // Реализуется кастомной логикой
        throw new AppError('Условный шаг требует кастомной реализации', 501);

      default:
        throw new AppError(`Неизвестный тип шага: ${step.type}`, 400);
    }
  }

  // Обновить статус сущности после workflow
  private async updateEntityStatus(entityType: string, entityId: string, status: DocumentStatus | VacationStatus) {
    // Интеграция с другими модулями
    switch (entityType.toLowerCase()) {
      case 'document':
        await prisma.document.update({
          where: { id: entityId },
          data: { status: status as DocumentStatus },
        });
        break;
      case 'vacation':
        await prisma.vacationRequest.update({
          where: { id: entityId },
          data: { status: status as VacationStatus },
        });
        break;
      case 'task':
        // Можно обновить статус задачи
        break;
      // Добавить другие сущности по мере необходимости
    }
  }

  // Получить активные workflow для сотрудника
  async getActiveWorkflowsForEmployee(employeeId: string, organizationId: string) {
    const instances = await prisma.workflowInstance.findMany({
      where: {
        organizationId,
        status: WorkflowInstanceStatus.active,
      },
      include: {
        route: true,
        approvals: {
          where: {
            approverId: employeeId,
          status: WorkflowApprovalStatus.pending,
          },
        },
      },
    });

    return instances.filter(i => i.approvals.length > 0).map(i => ({
      ...i,
      route: {
        ...i.route,
        steps: JSON.parse(i.route.steps as string),
      },
      pendingApprovals: i.approvals.length,
    }));
  }
}

export default new WorkflowService();
