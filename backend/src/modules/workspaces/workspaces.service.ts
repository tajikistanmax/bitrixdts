import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { WorkspaceType, WorkspaceMemberRole } from '@prisma/client';

export interface CreateWorkspaceData {
  organizationId: string;
  name: string;
  description?: string;
  type?: WorkspaceType;
  icon?: string;
  color?: string;
  memberIds?: string[];
  createdById: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isArchived?: boolean;
}

export interface WorkspaceFilters {
  type?: WorkspaceType;
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export class WorkspacesService {
  // ─── CRUD ─────────────────────────────────────────────────────────────

  async create(data: CreateWorkspaceData) {
    const workspace = await prisma.workspace.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        type: data.type || 'team',
        icon: data.icon,
        color: data.color || '#6366f1',
        createdById: data.createdById,
      },
    });

    // Добавить создателя как owner
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        employeeId: data.createdById,
        role: 'owner',
      },
    });

    // Добавить дополнительных участников
    if (data.memberIds && data.memberIds.length > 0) {
      const members = data.memberIds
        .filter(id => id !== data.createdById)
        .map(employeeId => ({
          workspaceId: workspace.id,
          employeeId,
          role: 'member' as WorkspaceMemberRole,
        }));

      if (members.length > 0) {
        await prisma.workspaceMember.createMany({ data: members });
      }
    }

    return this.getById(workspace.id, data.organizationId);
  }

  async findAll(organizationId: string, employeeId: string, filters: WorkspaceFilters) {
    const { type, search, isArchived = false, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      isArchived,
      members: { some: { employeeId } },
    };

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        include: {
          members: { select: { employeeId: true, role: true, joinedAt: true } },
          _count: { select: { members: true, discussions: true, wikiPages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workspace.count({ where }),
    ]);

    return { data: workspaces, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string, organizationId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: { id, organizationId },
      include: {
        members: {
          select: { employeeId: true, role: true, joinedAt: true },
        },
        _count: { select: { members: true, discussions: true, wikiPages: true } },
      },
    });

    if (!workspace) throw new AppError('Рабочее пространство не найдено', 404);
    return workspace;
  }

  async update(id: string, organizationId: string, data: UpdateWorkspaceData) {
    const existing = await prisma.workspace.findFirst({ where: { id, organizationId } });
    if (!existing) throw new AppError('Рабочее пространство не найдено', 404);

    return prisma.workspace.update({
      where: { id },
      data,
      include: { _count: { select: { members: true, discussions: true, wikiPages: true } } },
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await prisma.workspace.findFirst({ where: { id, organizationId } });
    if (!existing) throw new AppError('Рабочее пространство не найдено', 404);

    await prisma.workspace.delete({ where: { id } });
    return { success: true };
  }

  // ─── Участники ────────────────────────────────────────────────────────

  async addMember(workspaceId: string, employeeId: string, role: WorkspaceMemberRole = 'member') {
    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_employeeId: { workspaceId, employeeId } },
    });
    if (existing) throw new AppError('Сотрудник уже в пространстве', 400);

    return prisma.workspaceMember.create({
      data: { workspaceId, employeeId, role },
    });
  }

  async removeMember(workspaceId: string, employeeId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_employeeId: { workspaceId, employeeId } },
    });
    if (!member) throw new AppError('Участник не найден', 404);
    if (member.role === 'owner') throw new AppError('Нельзя удалить владельца', 400);

    await prisma.workspaceMember.delete({
      where: { workspaceId_employeeId: { workspaceId, employeeId } },
    });
    return { success: true };
  }

  async updateMemberRole(workspaceId: string, employeeId: string, role: WorkspaceMemberRole) {
    return prisma.workspaceMember.update({
      where: { workspaceId_employeeId: { workspaceId, employeeId } },
      data: { role },
    });
  }

  async getMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ─── Обсуждения ──────────────────────────────────────────────────────

  async createDiscussion(workspaceId: string, authorId: string, title: string, body?: string) {
    return prisma.workspaceDiscussion.create({
      data: { workspaceId, authorId, title, body },
    });
  }

  async getDiscussions(workspaceId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [discussions, total] = await Promise.all([
      prisma.workspaceDiscussion.findMany({
        where: { workspaceId },
        include: { _count: { select: { replies: true } } },
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.workspaceDiscussion.count({ where: { workspaceId } }),
    ]);
    return { data: discussions, total, page, totalPages: Math.ceil(total / limit) };
  }

  async addReply(discussionId: string, authorId: string, body: string) {
    const discussion = await prisma.workspaceDiscussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new AppError('Обсуждение не найдено', 404);
    if (discussion.isClosed) throw new AppError('Обсуждение закрыто', 400);

    const reply = await prisma.discussionReply.create({
      data: { discussionId, authorId, body },
    });

    // Обновить updatedAt обсуждения
    await prisma.workspaceDiscussion.update({
      where: { id: discussionId },
      data: { updatedAt: new Date() },
    });

    return reply;
  }

  async getReplies(discussionId: string) {
    return prisma.discussionReply.findMany({
      where: { discussionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Wiki ─────────────────────────────────────────────────────────────

  async createWikiPage(data: { workspaceId?: string; organizationId: string; title: string; content: string; parentId?: string; authorId: string }) {
    return prisma.wikiPage.create({
      data: {
        workspaceId: data.workspaceId,
        organizationId: data.organizationId,
        title: data.title,
        content: data.content,
        parentId: data.parentId,
        authorId: data.authorId,
      },
    });
  }

  async getWikiPages(workspaceId: string) {
    const pages = await prisma.wikiPage.findMany({
      where: { workspaceId },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    // Построить дерево
    const map: Record<string, any> = {};
    const tree: any[] = [];
    pages.forEach(p => { map[p.id] = { ...p, children: [] }; });
    pages.forEach(p => {
      if (p.parentId && map[p.parentId]) {
        map[p.parentId].children.push(map[p.id]);
      } else {
        tree.push(map[p.id]);
      }
    });
    return tree;
  }

  async getWikiPage(pageId: string) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: pageId },
      include: { children: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!page) throw new AppError('Страница не найдена', 404);
    return page;
  }

  async updateWikiPage(pageId: string, data: { title?: string; content?: string; sortOrder?: number }) {
    return prisma.wikiPage.update({ where: { id: pageId }, data });
  }

  async deleteWikiPage(pageId: string) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: pageId },
      include: { _count: { select: { children: true } } },
    });
    if (!page) throw new AppError('Страница не найдена', 404);
    if (page._count.children > 0) throw new AppError('Удалите сначала дочерние страницы', 400);

    await prisma.wikiPage.delete({ where: { id: pageId } });
    return { success: true };
  }
}

export default new WorkspacesService();
