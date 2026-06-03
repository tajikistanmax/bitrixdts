import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreateNewsData {
  title: string;
  body: string;
  category?: string;
  authorId: string;
  organizationId: string;
  attachments?: any[];
}

export interface NewsFilters {
  category?: string;
  authorId?: string;
  page?: number;
  limit?: number;
}

export class NewsService {
  async create(data: CreateNewsData) {
    const { organizationId, authorId } = data;

    const author = await prisma.employee.findFirst({
      where: { id: authorId, organizationId },
    });
    if (!author) throw new AppError('Автор не найден', 404);

    const news = await prisma.news.create({
      data: {
        title: data.title,
        body: data.body,
        category: data.category,
        authorId,
        organizationId,
        attachments: data.attachments || [],
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, position: true },
        },
      },
    });

    return news;
  }

  async findAll(organizationId: string, filters: NewsFilters) {
    const { category, authorId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (category) where.category = category;
    if (authorId) where.authorId = authorId;

    const total = await prisma.news.count({ where });

    const news = await prisma.news.findMany({
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
      data: news,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string) {
    const news = await prisma.news.findFirst({
      where: { id, organizationId },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, position: true },
        },
      },
    });

    if (!news) throw new AppError('Новость не найдена', 404);
    return news;
  }

  async update(id: string, organizationId: string, data: Partial<CreateNewsData>) {
    const existing = await prisma.news.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new AppError('Новость не найдена', 404);

    const updated = await prisma.news.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        category: data.category,
        attachments: data.attachments,
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
    const news = await prisma.news.findFirst({
      where: { id, organizationId },
    });
    if (!news) throw new AppError('Новость не найдена', 404);

    await prisma.news.delete({ where: { id } });
    return { success: true, message: 'Новость удалена' };
  }
}

export default new NewsService();
