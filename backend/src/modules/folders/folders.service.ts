import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreateFolderData {
  organizationId: string;
  name: string;
  parentId?: string;
  createdById: string;
  color?: string;
  isShared?: boolean;
}

export interface UpdateFolderData {
  name?: string;
  parentId?: string;
  color?: string;
  isShared?: boolean;
}

export interface FolderFilters {
  parentId?: string | null;
  search?: string;
}

export class FoldersService {
  // ─── Создать папку ────────────────────────────────────────────────────

  async create(data: CreateFolderData) {
    const { organizationId, parentId, createdById } = data;

    // Проверить родительскую папку
    if (parentId) {
      const parent = await prisma.documentFolder.findFirst({
        where: { id: parentId, organizationId },
      });
      if (!parent) throw new AppError('Родительская папка не найдена', 404);
    }

    // Проверить уникальность имени в рамках родителя
    const duplicate = await prisma.documentFolder.findFirst({
      where: {
        organizationId,
        name: data.name,
        parentId: parentId || null,
      },
    });
    if (duplicate) throw new AppError('Папка с таким именем уже существует', 400);

    const folder = await prisma.documentFolder.create({
      data: {
        organizationId,
        name: data.name,
        parentId: parentId || null,
        createdById,
        color: data.color || '#6B7280',
        isShared: data.isShared || false,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    return folder;
  }

  // ─── Получить папки (по родителю) ─────────────────────────────────────

  async findAll(organizationId: string, filters: FolderFilters) {
    const { parentId, search } = filters;

    const where: any = { organizationId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    } else {
      // Если нет поиска — показываем папки конкретного уровня
      where.parentId = parentId || null;
    }

    const folders = await prisma.documentFolder.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true } },
      },
      orderBy: { name: 'asc' },
    });

    return folders;
  }

  // ─── Получить папку по ID ─────────────────────────────────────────────

  async findById(id: string, organizationId: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        parent: { select: { id: true, name: true } },
        children: {
          include: {
            createdBy: { select: { id: true, fullName: true } },
            _count: { select: { children: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!folder) throw new AppError('Папка не найдена', 404);
    return folder;
  }

  // ─── Обновить папку ───────────────────────────────────────────────────

  async update(id: string, organizationId: string, data: UpdateFolderData) {
    const existing = await prisma.documentFolder.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new AppError('Папка не найдена', 404);

    // Проверить циклическую зависимость при смене родителя
    if (data.parentId) {
      if (data.parentId === id) throw new AppError('Папка не может быть своим родителем', 400);
      const isChild = await this.isDescendant(data.parentId, id, organizationId);
      if (isChild) throw new AppError('Нельзя переместить папку в свою дочернюю', 400);
    }

    // Проверить уникальность имени
    if (data.name) {
      const duplicate = await prisma.documentFolder.findFirst({
        where: {
          organizationId,
          name: data.name,
          parentId: data.parentId !== undefined ? data.parentId : existing.parentId,
          id: { not: id },
        },
      });
      if (duplicate) throw new AppError('Папка с таким именем уже существует', 400);
    }

    const folder = await prisma.documentFolder.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    return folder;
  }

  // ─── Удалить папку ────────────────────────────────────────────────────

  async delete(id: string, organizationId: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { children: true } } },
    });

    if (!folder) throw new AppError('Папка не найдена', 404);
    if (folder._count.children > 0) {
      throw new AppError('Нельзя удалить папку с подпапками. Сначала удалите вложенные', 400);
    }

    // Проверить наличие документов в папке
    const docsCount = await prisma.document.count({
      where: { folderId: id },
    });
    if (docsCount > 0) {
      throw new AppError('Нельзя удалить папку с документами. Сначала переместите документы', 400);
    }

    await prisma.documentFolder.delete({ where: { id } });
    return { success: true, message: 'Папка удалена' };
  }

  // ─── Дерево папок ─────────────────────────────────────────────────────

  async getTree(organizationId: string) {
    const allFolders = await prisma.documentFolder.findMany({
      where: { organizationId },
      include: {
        _count: { select: { children: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Построить дерево
    const map: Record<string, any> = {};
    const tree: any[] = [];

    allFolders.forEach(f => {
      map[f.id] = { ...f, children: [] };
    });

    allFolders.forEach(f => {
      if (f.parentId && map[f.parentId]) {
        map[f.parentId].children.push(map[f.id]);
      } else {
        tree.push(map[f.id]);
      }
    });

    return tree;
  }

  // ─── Хлебные крошки (path) ────────────────────────────────────────────

  async getBreadcrumbs(folderId: string, organizationId: string) {
    const breadcrumbs: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await prisma.documentFolder.findFirst({
        where: { id: currentId, organizationId },
        select: { id: true, name: true, parentId: true },
      });

      if (!folder) break;
      breadcrumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return breadcrumbs;
  }

  // ─── Вспомогательные методы ───────────────────────────────────────────

  private async isDescendant(targetId: string, ancestorId: string, organizationId: string): Promise<boolean> {
    const children = await prisma.documentFolder.findMany({
      where: { parentId: ancestorId, organizationId },
      select: { id: true },
    });

    for (const child of children) {
      if (child.id === targetId) return true;
      const found = await this.isDescendant(targetId, child.id, organizationId);
      if (found) return true;
    }

    return false;
  }
}

export default new FoldersService();
