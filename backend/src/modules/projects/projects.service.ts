import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreateProjectData {
  name: string;
  description?: string;
  ownerId: string;
  startDate?: string;
  dueDate?: string;
  budget?: number;
  organizationId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  ownerId?: string;
  startDate?: string;
  dueDate?: string;
  budget?: number;
  status?: 'active' | 'completed' | 'archived';
}

export interface ProjectMemberData {
  employeeId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface ProjectFilters {
  search?: string;
  ownerId?: string;
  status?: string;
  participantId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectWithRelations {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  status: string;
  startDate: Date | null;
  dueDate: Date | null;
  budget: any;
  progress: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: any;
  members?: any[];
  tasks?: any[];
}

export class ProjectsService {
  async create(data: CreateProjectData, userId: string) {
    const { organizationId } = data;

    // Проверить, что владелец существует
    const owner = await prisma.employee.findFirst({
      where: { id: data.ownerId, organizationId },
    });

    if (!owner) {
      throw new AppError('Владелец проекта не найден', 400);
    }

    // Создать проект
    const project = await prisma.project.create({
      data: {
        ...data,
        organizationId,
        status: 'active',
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        owner: true,
      },
    });

    // Добавить владельца как участника с ролью owner
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        employeeId: data.ownerId,
        role: 'owner',
      },
    });

    // Добавить создателя как участника (если отличается от владельца)
    if (userId !== data.ownerId) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          employeeId: userId,
          role: 'admin',
        },
      });
    }

    return this.mapProject(project);
  }

  async findAll(
    organizationId: string,
    filters: ProjectFilters
  ): Promise<{ data: ProjectWithRelations[]; total: number; page: number; totalPages: number }> {
    const {
      search,
      ownerId,
      status,
      participantId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Построить условия фильтрации
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (status) {
      where.status = status;
    }

    if (participantId) {
      // Найти проекты, где участник состоит
      const participantProjects = await prisma.projectMember.findMany({
        where: { employeeId: participantId },
        select: { projectId: true },
      });

      const projectIds = participantProjects.map(pm => pm.projectId);
      where.id = { in: projectIds };
    }

    // Получить общее количество
    const total = await prisma.project.count({ where });

    // Получить данные
    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
          },
        },
        projectMembers: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                position: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    // Рассчитать прогресс для каждого проекта
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const progress = await this.calculateProjectProgress(project.id);
        return {
          ...project,
          progress,
        };
      })
    );

    return {
      data: projectsWithProgress.map(p => this.mapProject(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<ProjectWithRelations> {
    const project = await prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
          },
        },
        projectMembers: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                position: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          where: {},
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Проект не найден', 404);
    }

    // Рассчитать прогресс
    const progress = await this.calculateProjectProgress(id);

    return this.mapProject({ ...project, progress });
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateProjectData
  ): Promise<ProjectWithRelations> {
    // Проверить существование
    const existing = await prisma.project.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Проект не найден', 404);
    }

    // Проверить нового владельца (если меняется)
    if (data.ownerId && data.ownerId !== existing.ownerId) {
      const newOwner = await prisma.employee.findFirst({
        where: { id: data.ownerId, organizationId },
      });

      if (!newOwner) {
        throw new AppError('Новый владелец не найден', 400);
      }

      // Добавить нового владельца как участника
      await prisma.projectMember.upsert({
        where: {
          projectId_employeeId: {
            projectId: id,
            employeeId: data.ownerId,
          },
        },
        update: { role: 'owner' },
        create: {
          projectId: id,
          employeeId: data.ownerId,
          role: 'owner',
        },
      });
    }

    // Обновить проект
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        owner: true,
      },
    });

    return this.mapProject(updated);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const existing = await prisma.project.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Проект не найден', 404);
    }

    // Проверить, есть ли активные задачи
    const activeTasksCount = await prisma.task.count({
      where: {
        projectId: id,
        organizationId,
        status: { not: 'done' },
      },
    });

    if (activeTasksCount > 0) {
      throw new AppError(`Нельзя удалить проект с ${activeTasksCount} активными задачами. Сначала завершите или переназначьте задачи`, 400);
    }

    // Мягкое удаление
    await prisma.project.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Удалить участников проекта
    await prisma.projectMember.deleteMany({
      where: { projectId: id },
    });
  }

  async restore(id: string, organizationId: string): Promise<ProjectWithRelations> {
    const restored = await prisma.project.update({
      where: { id, organizationId },
      data: {
        deletedAt: null,
      },
      include: {
        owner: true,
      },
    });

    return this.mapProject(restored);
  }

  // Участники проекта
  async addMember(projectId: string, organizationId: string, memberData: ProjectMemberData) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new AppError('Проект не найден', 404);
    }

    const employee = await prisma.employee.findFirst({
      where: { id: memberData.employeeId, organizationId },
    });

    if (!employee) {
      throw new AppError('Сотрудник не найден', 400);
    }

    // Проверить, не состоит ли уже участником
    const existing = await prisma.projectMember.findFirst({
      where: {
        projectId,
        employeeId: memberData.employeeId,
      },
    });

    if (existing) {
      throw new AppError('Сотрудник уже состоит в проекте', 400);
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        employeeId: memberData.employeeId,
        role: memberData.role,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
          },
        },
      },
    });

    return member;
  }

  async updateMemberRole(projectId: string, employeeId: string, role: string) {
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new AppError('Неверная роль участника', 400);
    }

    const updated = await prisma.projectMember.update({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
      data: { role },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return updated;
  }

  async removeMember(projectId: string, employeeId: string) {
    // Нельзя удалить единственного владельца
    const member = await prisma.projectMember.findFirst({
      where: { projectId, employeeId },
      include: { project: true },
    });

    if (!member) {
      throw new AppError('Участник не найден в проекте', 404);
    }

    if (member.role === 'owner') {
      const otherOwners = await prisma.projectMember.count({
        where: {
          projectId,
          role: 'owner',
          employeeId: { not: employeeId },
        },
      });

      if (otherOwners === 0) {
        throw new AppError('Нельзя удалить единственного владельца проекта. Назначьте другого владельца', 400);
      }
    }

    await prisma.projectMember.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
    });
  }

  async getMembers(projectId: string, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new AppError('Проект не найден', 404);
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
            },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members;
  }

  // Прогресс проекта
  async calculateProjectProgress(projectId: string): Promise<number> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: { status: true },
    });

    if (tasks.length === 0) {
      return 0;
    }

    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const progress = Math.round((doneTasks / tasks.length) * 100);

    return progress;
  }

  // Шаблоны проектов (простая реализация)
  async createTemplate(
    name: string,
    organizationId: string,
    description?: string
  ) {
    // Сохранить текущие проекты как шаблон (можно расширить)
    return {
      id: `template-${Date.now()}`,
      name,
      description,
      organizationId,
      createdAt: new Date(),
    };
  }

  // Статистика проектов
  async getStatistics(organizationId: string) {
    const total = await prisma.project.count({
      where: { organizationId },
    });

    const byStatus = await prisma.project.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { status: true },
    });

    const active = await prisma.project.count({
      where: {
        organizationId,
        status: 'active',
      },
    });

    const completed = await prisma.project.count({
      where: {
        organizationId,
        status: 'completed',
      },
    });

    const totalTasks = await prisma.task.count({
      where: {
        organizationId,
      },
    });

    const doneTasks = await prisma.task.count({
      where: {
        organizationId,
        status: 'done',
      },
    });

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      active,
      completed,
      totalTasks,
      doneTasks,
      tasksProgress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    };
  }

  private mapProject(project: any): ProjectWithRelations {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      status: project.status,
      startDate: project.startDate,
      dueDate: project.dueDate,
      budget: project.budget,
      progress: project.progress || 0,
      organizationId: project.organizationId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: project.owner,
      members: project.projectMembers?.map((m: any) => ({
        role: m.role,
        joinedAt: m.joinedAt,
        employee: m.employee,
      })) || [],
      tasks: project.tasks,
    };
  }
}

export default new ProjectsService();
