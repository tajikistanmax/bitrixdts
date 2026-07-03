import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import notificationService from '../notifications/notifications.service';

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId?: string;
  sprintId?: string;
  assigneeId?: string;
  controllerId?: string;
  coAssigneeIds?: string[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
  status?: 'new' | 'in_progress' | 'approved' | 'done' | 'rejected' | 'overdue';
  startDate?: string;
  dueDate?: string;
  parentTaskId?: string;
  tags?: string[];
  checklist?: { id: string; text: string; completed: boolean }[];
  storyPoints?: number;
  organizationId: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  projectId?: string;
  assigneeId?: string;
  controllerId?: string;
  coAssigneeIds?: string[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
  status?: 'new' | 'in_progress' | 'approved' | 'done' | 'rejected' | 'overdue';
  startDate?: string;
  dueDate?: string;
  parentTaskId?: string;
  tags?: string[];
  checklist?: { id: string; text: string; completed: boolean }[];
  timeSpent?: number;
}

export interface TaskFilters {
  search?: string;
  projectId?: string;
  assigneeId?: string;
  controllerId?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  assigneeId: string | null;
  controllerId: string | null;
  status: string;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  parentTaskId: string | null;
  tags: any;
  checklist: any;
  timeSpent: number;
  storyPoints?: number | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: any;
  assignee?: any;
  controller?: any;
  coAssignees?: any[];
  parentTask?: any;
  subtasks?: any[];
  comments?: any[];
  watchers?: any[];
  attachments?: any[];
}

export class TasksService {
  async create(data: CreateTaskData, userId: string) {
    const { organizationId, coAssigneeIds, ...taskData } = data;

    // Проверить проект
    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, organizationId },
      });

      if (!project) {
        throw new AppError('Проект не найден', 400);
      }
    }

    // Проверить исполнителя
    if (data.assigneeId) {
      const assignee = await prisma.employee.findFirst({
        where: { id: data.assigneeId, organizationId },
      });

      if (!assignee) {
        throw new AppError('Исполнитель не найден', 400);
      }
    }

    // Проверить контролёра
    if (data.controllerId) {
      const controller = await prisma.employee.findFirst({
        where: { id: data.controllerId, organizationId },
      });

      if (!controller) {
        throw new AppError('Контролёр не найден', 400);
      }
    }

    // Проверить соисполнителей
    if (coAssigneeIds && coAssigneeIds.length > 0) {
      const coAssignees = await prisma.employee.findMany({
        where: {
          id: { in: coAssigneeIds },
          organizationId,
        },
      });

      if (coAssignees.length !== coAssigneeIds.length) {
        throw new AppError('Один или несколько соисполнителей не найдены', 400);
      }
    }

    // Проверить родительскую задачу
    if (data.parentTaskId) {
      const parent = await prisma.task.findFirst({
        where: { id: data.parentTaskId, organizationId },
      });

      if (!parent) {
        throw new AppError('Родительская задача не найдена', 400);
      }
    }

    // Создать задачу
    const task = await prisma.task.create({
      data: {
        ...taskData,
        organizationId,
        creatorId: userId,
        status: data.status || 'new',
        priority: data.priority || 'normal',
        tags: data.tags || [],
        checklist: data.checklist || [],
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        project: true,
        assignee: true,
        controller: true,
      },
    });

    // Назначить соисполнителей
    if (coAssigneeIds && coAssigneeIds.length > 0) {
      await prisma.taskCoAssignee.createMany({
        data: coAssigneeIds.map(employeeId => ({
          taskId: task.id,
          employeeId,
        })),
      });
    }

    // Добавить создателя как наблюдателя
    await prisma.taskWatcher.create({
      data: {
        taskId: task.id,
        employeeId: userId,
      },
    });

    // Уведомить исполнителя о назначении (если назначен и это не сам создатель)
    if (task.assigneeId && task.assigneeId !== userId) {
      notificationService.sendNotification({
        type: 'task_assigned',
        title: 'Новая задача',
        message: `Вам назначена задача: ${task.title}`,
        recipientId: task.assigneeId,
        organizationId,
        link: `/tasks/${task.id}`,
        data: { taskId: task.id, taskTitle: task.title },
      }).catch(() => {});
    }

    // Уведомить контролёра
    if (task.controllerId && task.controllerId !== userId && task.controllerId !== task.assigneeId) {
      notificationService.sendNotification({
        type: 'task_assigned',
        title: 'Задача на контроль',
        message: `Вы назначены контролёром задачи: ${task.title}`,
        recipientId: task.controllerId,
        organizationId,
        link: `/tasks/${task.id}`,
        data: { taskId: task.id, taskTitle: task.title },
      }).catch(() => {});
    }

    return this.mapTask(task);
  }

  async findAll(
    organizationId: string,
    filters: TaskFilters
  ): Promise<{ data: TaskWithRelations[]; total: number; page: number; totalPages: number }> {
    const {
      search,
      projectId,
      assigneeId,
      controllerId,
      status,
      priority,
      departmentId,
      startDateFrom,
      startDateTo,
      dueDateFrom,
      dueDateTo,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Построить условия фильтрации
    const where: any = {
      organizationId,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (controllerId) {
      where.controllerId = controllerId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (departmentId) {
      // Найти всех сотрудников отдела и отфильтровать задачи
      const departmentEmployees = await prisma.employee.findMany({
        where: { departmentId, organizationId },
        select: { id: true },
      });

      const employeeIds = departmentEmployees.map(e => e.id);
      where.OR = [
        { assigneeId: { in: employeeIds } },
        { controllerId: { in: employeeIds } },
      ];
    }

    if (startDateFrom) {
      where.startDate = { ...where.startDate, gte: new Date(startDateFrom) };
    }

    if (startDateTo) {
      where.startDate = { ...where.startDate, lte: new Date(startDateTo) };
    }

    if (dueDateFrom) {
      where.dueDate = { ...where.dueDate, gte: new Date(dueDateFrom) };
    }

    if (dueDateTo) {
      where.dueDate = { ...where.dueDate, lte: new Date(dueDateTo) };
    }

    if (tags && tags.length > 0) {
      // Фильтр по тегам через JSONB
      where.tags = { hasSome: tags };
    }

    // Получить общее количество
    const total = await prisma.task.count({ where });

    // Получить данные
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        assignee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
          },
        },
        controller: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        coAssignees: {
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
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          where: {  },
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 5,
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
        watchers: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: tasks.map(t => this.mapTask(t)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<TaskWithRelations> {
    const task = await prisma.task.findFirst({
      where: { id, organizationId, isDeleted: false },
      include: {
        project: true,
        assignee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
          },
        },
        controller: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        coAssignees: {
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
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          where: {  },
          include: {
            assignee: {
              select: {
                id: true,
                fullName: true,
              },
            },
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
        watchers: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new AppError('Задача не найдена', 404);
    }

    return this.mapTask(task);
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateTaskData,
    _userId: string
  ): Promise<TaskWithRelations> {
    // Проверить существование
    const existing = await prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Задача не найдена', 404);
    }

    // Проверить проект (если меняется)
    if (data.projectId && data.projectId !== existing.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, organizationId },
      });

      if (!project) {
        throw new AppError('Проект не найден', 400);
      }
    }

    // Проверить исполнителя
    if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
      const assignee = await prisma.employee.findFirst({
        where: { id: data.assigneeId, organizationId },
      });

      if (!assignee) {
        throw new AppError('Исполнитель не найден', 400);
      }
    }

    // Проверить контролёра
    if (data.controllerId && data.controllerId !== existing.controllerId) {
      const controller = await prisma.employee.findFirst({
        where: { id: data.controllerId, organizationId },
      });

      if (!controller) {
        throw new AppError('Контролёр не найден', 400);
      }
    }

    // Обновить задачу
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        project: true,
        assignee: true,
        controller: true,
      },
    });

    // Обновить соисполнителей (если переданы)
    if (data.coAssigneeIds !== undefined) {
      // Удалить старых
      await prisma.taskCoAssignee.deleteMany({
        where: { taskId: id },
      });

      // Добавить новых
      if (data.coAssigneeIds.length > 0) {
        await prisma.taskCoAssignee.createMany({
          data: data.coAssigneeIds.map(employeeId => ({
            taskId: id,
            employeeId,
          })),
        });
      }
    }

    // Уведомить контролёра при смене статуса
    if (data.status && data.status !== existing.status) {
      const notifyTargets = new Set<string>();
      if (existing.controllerId && existing.controllerId !== _userId) notifyTargets.add(existing.controllerId);
      if (existing.creatorId && existing.creatorId !== _userId) notifyTargets.add(existing.creatorId);

      for (const recipientId of notifyTargets) {
        notificationService.sendNotification({
          type: 'task_status_changed',
          title: 'Изменён статус задачи',
          message: `Статус задачи "${existing.title}" изменён на "${data.status}"`,
          recipientId,
          organizationId,
          link: `/tasks/${id}`,
          data: { taskId: id, status: data.status },
        }).catch(() => {});
      }
    }

    // Уведомить нового исполнителя при переназначении
    if (data.assigneeId && data.assigneeId !== existing.assigneeId && data.assigneeId !== _userId) {
      notificationService.sendNotification({
        type: 'task_assigned',
        title: 'Новая задача',
        message: `Вам назначена задача: ${existing.title}`,
        recipientId: data.assigneeId,
        organizationId,
        link: `/tasks/${id}`,
        data: { taskId: id },
      }).catch(() => {});
    }

    return this.mapTask(updated);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const existing = await prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Задача не найдена', 404);
    }

    // Проверить, есть ли подзадачи
    const subtasksCount = await prisma.task.count({
      where: { parentTaskId: id, organizationId },
    });

    if (subtasksCount > 0) {
      throw new AppError('Нельзя удалить задачу с подзадачами. Сначала удалите или переназначьте подзадачи', 400);
    }

    // Мягкое удаление
    await prisma.task.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string, organizationId: string): Promise<TaskWithRelations> {
    const restored = await prisma.task.update({
      where: { id, organizationId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      include: {
        project: true,
        assignee: true,
        controller: true,
      },
    });

    return this.mapTask(restored);
  }

  // Комментарии
  async addComment(taskId: string, organizationId: string, body: string, authorId: string) {
    if (!body.trim()) {
      throw new AppError('Комментарий не может быть пустым', 400);
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
    });

    if (!task) {
      throw new AppError('Задача не найдена', 404);
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        body,
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

    // Уведомить исполнителя и контролёра о новом комментарии
    const notifyTargets = new Set<string>();
    if (task.assigneeId && task.assigneeId !== authorId) notifyTargets.add(task.assigneeId);
    if (task.controllerId && task.controllerId !== authorId) notifyTargets.add(task.controllerId);
    if (task.creatorId && task.creatorId !== authorId) notifyTargets.add(task.creatorId);

    for (const recipientId of notifyTargets) {
      notificationService.sendNotification({
        type: 'task_comment',
        title: 'Новый комментарий',
        message: `${comment.author.fullName} прокомментировал задачу "${task.title}"`,
        recipientId,
        organizationId,
        link: `/tasks/${taskId}`,
        data: { taskId },
      }).catch(() => {});
    }

    return comment;
  }

  async getComments(taskId: string, _organizationId: string) {
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  // Канбан-доска (группировка по статусам)
  async getKanbanBoard(organizationId: string, projectId?: string) {
    const where: any = {
      organizationId,
      isDeleted: false,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Группировка по статусам
    const columns: Record<string, any[]> = {
      new: [],
      in_progress: [],
      approved: [],
      done: [],
      rejected: [],
      overdue: [],
    };

    const now = new Date();

    tasks.forEach(task => {
      const taskData = {
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee,
        project: task.project,
        isOverdue: task.dueDate ? new Date(task.dueDate) < now && task.status !== 'done' : false,
      };

      if (columns[task.status]) {
        columns[task.status].push(taskData);
      }
    });

    return columns;
  }

  // Статистика
  async getStatistics(organizationId: string, departmentId?: string) {
    const where: any = {
      organizationId,
    };

    if (departmentId) {
      const departmentEmployees = await prisma.employee.findMany({
        where: { departmentId, organizationId },
        select: { id: true },
      });

      const employeeIds = departmentEmployees.map(e => e.id);
      where.assigneeId = { in: employeeIds };
    }

    const total = await prisma.task.count({ where });
    const byStatus = await prisma.task.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const byPriority = await prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    const overdue = await prisma.task.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { not: 'done' },
      },
    });

    const totalStoryPoints = await prisma.task.aggregate({
      where,
      _sum: { storyPoints: true },
    });

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
      overdue,
      totalStoryPoints: totalStoryPoints._sum.storyPoints || 0,
    };
  }

  // Вложения к задаче
  async uploadAttachment(
    taskId: string,
    organizationId: string,
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number,
    uploadedBy: string
  ) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
    });

    if (!task) {
      throw new AppError('Задача не найдена', 404);
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        fileName,
        fileUrl,
        fileType,
        fileSize,
        uploadedBy,
      },
    });

    return attachment;
  }

  async getAttachments(taskId: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
    });

    if (!task) {
      throw new AppError('Задача не найдена', 404);
    }

    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  }

  async deleteAttachment(
    attachmentId: string,
    taskId: string,
    organizationId: string
  ) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
    });

    if (!task) {
      throw new AppError('Задача не найдена', 404);
    }

    const attachment = await prisma.taskAttachment.findFirst({
      where: { id: attachmentId, taskId },
    });

    if (!attachment) {
      throw new AppError('Вложение не найдено', 404);
    }

    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  }

  // Спринты (Scrum)
  async createSprint(
    projectId: string,
    organizationId: string,
    name: string,
    startDate: string,
    endDate: string,
    goal?: string
  ) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new AppError('Проект не найден', 404);
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name,
        description: null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'planning',
        goal,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sprint;
  }

  async getSprints(projectId: string, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new AppError('Проект не найден', 404);
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return sprints;
  }

  async getSprintById(sprintId: string, organizationId: string) {
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project: {
          organizationId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          where: {  },
          include: {
            assignee: {
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

    if (!sprint) {
      throw new AppError('Спринт не найден', 404);
    }

    return sprint;
  }

  async updateSprintStatus(sprintId: string, status: string) {
    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sprint;
  }

  // Учёт времени
  async logTime(
    taskId: string,
    organizationId: string,
    minutes: number,
    _comment?: string
  ) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
    });

    if (!task) {
      throw new AppError('Задача не найдена', 404);
    }

    // Обновить затраченное время
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        timeSpent: {
          increment: minutes,
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      taskId: updated.id,
      totalMinutes: updated.timeSpent,
      addedMinutes: minutes,
    };
  }

  async getTaskTimeReport(taskId: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError('Задача не найдена', 404);
    }

    return {
      taskId: task.id,
      title: task.title,
      assignee: task.assignee,
      totalMinutes: task.timeSpent,
      totalHours: Math.round((task.timeSpent / 60) * 100) / 100,
      dueDate: task.dueDate,
    };
  }

  private mapTask(task: any): TaskWithRelations {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      controllerId: task.controllerId,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      parentTaskId: task.parentTaskId,
      tags: task.tags,
      checklist: task.checklist,
      timeSpent: task.timeSpent,
      storyPoints: task.storyPoints,
      organizationId: task.organizationId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project,
      assignee: task.assignee,
      controller: task.controller,
      coAssignees: task.coAssignees?.map((ca: any) => ca.employee) || [],
      parentTask: task.parentTask,
      subtasks: task.subtasks,
      comments: task.comments,
      watchers: task.watchers?.map((w: any) => w.employee) || [],
      attachments: task.attachments,
    };
  }
}

export default new TasksService();
