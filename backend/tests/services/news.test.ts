jest.mock('../../src/core/config/database', () => ({
  __esModule: true,
  default: {
    employee: {
      findFirst: jest.fn(),
    },
    news: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import prisma from '../../src/core/config/database';
import { NewsService } from '../../src/modules/news/news.service';

const MockPrisma = jest.mocked(prisma);

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    service = new NewsService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('calls prisma.news.create with correct data', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (MockPrisma.news.create as jest.Mock).mockResolvedValue({
        id: 'news-1',
        title: 'Test News',
        body: 'Body',
        category: null,
        authorId: 'emp-1',
        organizationId: 'org-1',
        attachments: [],
        publishedAt: new Date(),
        author: { id: 'emp-1', fullName: 'Alice', avatarUrl: null, position: null },
      });

      const result = await service.create({
        title: 'Test News',
        body: 'Body',
        authorId: 'emp-1',
        organizationId: 'org-1',
      });

      expect(MockPrisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', organizationId: 'org-1' },
      });
      expect(MockPrisma.news.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test News',
            body: 'Body',
            authorId: 'emp-1',
            organizationId: 'org-1',
          }),
        }),
      );
      expect(result.title).toBe('Test News');
    });

    it('throws AppError when author is not found', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Test News',
          body: 'Body',
          authorId: 'emp-1',
          organizationId: 'org-1',
        }),
      ).rejects.toThrow('Автор не найден');
    });
  });

  describe('findAll', () => {
    it('calls prisma.news.findMany with pagination', async () => {
      const mockNews = [
        { id: 'n1', title: 'A', author: { id: 'e1', fullName: 'Alice', avatarUrl: null, position: null } },
        { id: 'n2', title: 'B', author: { id: 'e1', fullName: 'Alice', avatarUrl: null, position: null } },
      ];
      (MockPrisma.news.count as jest.Mock).mockResolvedValue(2);
      (MockPrisma.news.findMany as jest.Mock).mockResolvedValue(mockNews);

      const result = await service.findAll('org-1', { page: 1, limit: 10 });

      expect(MockPrisma.news.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1' } });
      expect(MockPrisma.news.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
          skip: 0,
          take: 10,
          orderBy: { publishedAt: 'desc' },
        }),
      );
      expect(result.data).toEqual(mockNews);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findById', () => {
    it('throws AppError when news not found', async () => {
      (MockPrisma.news.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nope', 'org-1')).rejects.toThrow('Новость не найдена');
    });

    it('returns news when found', async () => {
      const mockNews = {
        id: 'n1',
        title: 'Test',
        body: 'Body',
        author: { id: 'e1', fullName: 'Alice', avatarUrl: null, position: null },
      };
      (MockPrisma.news.findFirst as jest.Mock).mockResolvedValue(mockNews);

      const result = await service.findById('n1', 'org-1');
      expect(result).toEqual(mockNews);
    });
  });

  describe('delete', () => {
    it('throws AppError when news not found', async () => {
      (MockPrisma.news.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('nope', 'org-1')).rejects.toThrow('Новость не найдена');
    });

    it('calls prisma.news.delete when found', async () => {
      (MockPrisma.news.findFirst as jest.Mock).mockResolvedValue({ id: 'n1' });
      (MockPrisma.news.delete as jest.Mock).mockResolvedValue({ id: 'n1' });

      const result = await service.delete('n1', 'org-1');
      expect(MockPrisma.news.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
      expect(result.success).toBe(true);
    });
  });
});
