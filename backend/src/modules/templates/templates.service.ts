import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreateTaskTemplateData {
  organizationId: string;
  name: string;
  description?: string;
  title: string;
  taskDescription?: string;
  priority?: string;
  tags?: string[];
  checklist?: any[];
  estimatedDays?: number;
  subtaskTemplates?: { title: string; description?: string }[];
  createdById: string;
}

export interface CreateProjectTemplateData {
  organizationId: string;
  name: string;
  description?: string;
  taskTemplates?: any[];
  milestones?: any[];
  defaultRoles?: any[];
  createdById: string;
}

export class TemplatesService {
  // ─── Task Templates ───────────────────────────────────────────────────

  async createTaskTemplate(data: CreateTaskTemplateData) {
    return prisma.taskTemplate.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        title: data.title,
        taskDescription: data.taskDescription,
        priority: (data.priority as any) || 'normal',
        tags: data.tags || [],
        checklist: data.checklist || [],
        estimatedDays: data.estimatedDays,
        subtaskTemplates: data.subtaskTemplates || [],
        createdById: data.createdById,
      },
    });
  }

  async getTaskTemplates(organizationId: string) {
    return prisma.taskTemplate.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async getTaskTemplate(id: string, organizationId: string) {
    const template = await prisma.taskTemplate.findFirst({
      where: { id, organizationId },
    });
    if (!template) throw new AppError('Шаблон не найден', 404);
    return template;
  }

  async deleteTaskTemplate(id: string, organizationId: string) {
    const template = await prisma.taskTemplate.findFirst({ where: { id, organizationId } });
    if (!template) throw new AppError('Шаблон не найден', 404);
    await prisma.taskTemplate.delete({ where: { id } });
    return { success: true };
  }

  // Создать задачу из шаблона
  async createTaskFromTemplate(templateId: string, organizationId: string, creatorId: string, overrides?: any) {
    const template = await this.getTaskTemplate(templateId, organizationId);

    // Создать основную задачу
    const task = await prisma.task.create({
      data: {
        organizationId,
        title: overrides?.title || template.title,
        description: template.taskDescription,
        creatorId,
        assigneeId: overrides?.assigneeId,
        controllerId: overrides?.controllerId,
        projectId: overrides?.projectId,
        priority: template.priority as any,
        tags: template.tags as any,
        checklist: template.checklist as any,
        dueDate: template.estimatedDays
          ? new Date(Date.now() + template.estimatedDays * 24 * 60 * 60 * 1000)
          : overrides?.dueDate ? new Date(overrides.dueDate) : null,
      },
    });

    // Создать подзадачи из шаблона
    const subtaskTemplates = template.subtaskTemplates as any[];
    if (subtaskTemplates && subtaskTemplates.length > 0) {
      for (const st of subtaskTemplates) {
        await prisma.task.create({
          data: {
            organizationId,
            title: st.title,
            description: st.description,
            creatorId,
            parentTaskId: task.id,
            assigneeId: overrides?.assigneeId,
            priority: template.priority as any,
          },
        });
      }
    }

    return prisma.task.findUnique({
      where: { id: task.id },
      include: { subtasks: true },
    });
  }

  // ─── Project Templates ────────────────────────────────────────────────

  async createProjectTemplate(data: CreateProjectTemplateData) {
    return prisma.projectTemplate.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        taskTemplates: data.taskTemplates || [],
        milestones: data.milestones || [],
        defaultRoles: data.defaultRoles || [],
        createdById: data.createdById,
      },
    });
  }

  async getProjectTemplates(organizationId: string) {
    return prisma.projectTemplate.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async getProjectTemplate(id: string, organizationId: string) {
    const template = await prisma.projectTemplate.findFirst({ where: { id, organizationId } });
    if (!template) throw new AppError('Шаблон проекта не найден', 404);
    return template;
  }

  async deleteProjectTemplate(id: string, organizationId: string) {
    const template = await prisma.projectTemplate.findFirst({ where: { id, organizationId } });
    if (!template) throw new AppError('Шаблон не найден', 404);
    await prisma.projectTemplate.delete({ where: { id } });
    return { success: true };
  }

  // Создать проект из шаблона
  async createProjectFromTemplate(templateId: string, organizationId: string, creatorId: string, overrides: { name: string; ownerId: string; startDate?: string }) {
    const template = await this.getProjectTemplate(templateId, organizationId);

    const startDate = overrides.startDate ? new Date(overrides.startDate) : new Date();

    // Создать проект
    const project = await prisma.project.create({
      data: {
        organizationId,
        name: overrides.name,
        description: template.description,
        ownerId: overrides.ownerId,
        status: 'active',
        startDate,
      },
    });

    // Добавить владельца как участника
    await prisma.projectMember.create({
      data: { projectId: project.id, employeeId: overrides.ownerId, role: 'owner' },
    });

    // Создать задачи из шаблона
    const taskTemplates = template.taskTemplates as any[];
    if (taskTemplates && taskTemplates.length > 0) {
      for (const tt of taskTemplates) {
        const dueDate = tt.dayOffset
          ? new Date(startDate.getTime() + tt.dayOffset * 24 * 60 * 60 * 1000)
          : null;

        await prisma.task.create({
          data: {
            organizationId,
            projectId: project.id,
            title: tt.title,
            description: tt.description,
            creatorId,
            priority: tt.priority || 'normal',
            dueDate,
          },
        });
      }
    }

    return prisma.project.findUnique({
      where: { id: project.id },
      include: { tasks: true, projectMembers: true },
    });
  }
}

export default new TemplatesService();
