import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreateAnnouncementData {
  title: string;
  body: string;
  authorId: string;
  organizationId: string;
  attachments?: any[];
  targetDepartments?: string[];
}

export interface AnnouncementFilters {
  authorId?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export class AnnouncementsService {
  async create(data: CreateAnnouncementData) {
    const { organizationId, authorId } = data;

    const author = await prisma.employee.findFirst({
      where: { id: authorId, organizationId },
    });
    if (!author) throw new AppError('Автор не найден', 404);

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        authorId,
        organizationId,
        attachments: data.attachments || [],
        targetDepartments: data.targetDepartments || [],
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, position: true },
        },
      },
    });

    return announcement;
  }

  async findAll(organizationId: string, filters: AnnouncementFilters) {
    const { authorId, departmentId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (authorId) where.authorId = authorId;
    if (departmentId) {
      where.OR = [
        { targetDepartments: { equals: '[]' } },
        { targetDepartments: { array_contains: departmentId } },
      ];
    }

    const total = await prisma.announcement.count({ where });

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, position: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: announcements,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, organizationId },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, position: true },
        },
      },
    });

    if (!announcement) throw new AppError('Объявление не найдено', 404);
    return announcement;
  }

  async update(id: string, organizationId: string, data: Partial<CreateAnnouncementData>) {
    const existing = await prisma.announcement.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new AppError('Объявление не найдено', 404);

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        attachments: data.attachments,
        targetDepartments: data.targetDepartments,
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, position: true },
        },
      },
    });

    return updated;
  }

  async delete(id: string, organizationId: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, organizationId },
    });
    if (!announcement) throw new AppError('Объявление не найдено', 404);

    await prisma.announcement.delete({ where: { id } });
    return { success: true, message: 'Объявление удалено' };
  }
}

export default new AnnouncementsService();
