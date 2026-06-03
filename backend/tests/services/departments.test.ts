jest.mock('../../src/core/config/database', () => ({
  __esModule: true,
  default: {
    department: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import prisma from '../../src/core/config/database';
import { AppError } from '../../src/core/middleware/errorHandler';
import departmentsService from '../../src/modules/departments/departments.service';

const MockPrisma = jest.mocked(prisma);

describe('DepartmentsService', () => {
  let service: typeof departmentsService;

  beforeEach(() => {
    service = departmentsService;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('создаёт отдел с родителем', async () => {
      (MockPrisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: 'org-1', name: 'Org' });
      (MockPrisma.department.findFirst as jest.Mock).mockResolvedValue({ id: 'dept-0', name: 'Родитель' });
      (MockPrisma.department.create as jest.Mock).mockResolvedValue({
        id: 'dept-1',
        name: 'Новый отдел',
        organizationId: 'org-1',
        parentId: 'dept-0',
        headId: null,
        level: 1,
        createdAt: new Date(),
        parent: { id: 'dept-0', name: 'Родитель' },
        head: null,
      });

      const result = await service.create({
        name: 'Новый отдел',
        organizationId: 'org-1',
        parentId: 'dept-0',
      });

      expect(result.name).toBe('Новый отдел');
      expect(result.parentId).toBe('dept-0');
      expect(MockPrisma.department.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Новый отдел',
            parentId: 'dept-0',
            level: 1,
          }),
        }),
      );
    });

    it('выбрасывает AppError если организация не найдена', async () => {
      (MockPrisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create({ name: 'Отдел', organizationId: 'org-404' }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('findAll', () => {
    it('возвращает все отделы организации', async () => {
      (MockPrisma.department.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'dept-1',
          name: 'Отдел разработки',
          organizationId: 'org-1',
          parentId: null,
          headId: null,
          level: 0,
          createdAt: new Date(),
          parent: null,
          head: null,
          children: [],
          _count: { children: 0 },
        },
      ]);

      const result = await service.findAll('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Отдел разработки');
      expect(MockPrisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('находит отдел по ID', async () => {
      (MockPrisma.department.findFirst as jest.Mock).mockResolvedValue({
        id: 'dept-1',
        name: 'Отдел разработки',
        organizationId: 'org-1',
        parentId: null,
        headId: null,
        level: 0,
        createdAt: new Date(),
        parent: null,
        head: null,
        children: [],
        _count: { children: 0 },
      });

      const result = await service.findById('dept-1', 'org-1');
      expect(result.id).toBe('dept-1');
      expect(result.name).toBe('Отдел разработки');
    });

    it('выбрасывает AppError если отдел не найден', async () => {
      (MockPrisma.department.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('dept-404', 'org-1')).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('обновляет название отдела', async () => {
      (MockPrisma.department.findFirst as jest.Mock).mockResolvedValue({
        id: 'dept-1',
        name: 'Старое название',
        organizationId: 'org-1',
        parentId: null,
        headId: null,
        level: 0,
      });
      (MockPrisma.department.update as jest.Mock).mockResolvedValue({
        id: 'dept-1',
        name: 'Новое название',
        organizationId: 'org-1',
        parentId: null,
        headId: null,
        level: 0,
        createdAt: new Date(),
        parent: null,
        head: null,
      });

      const result = await service.update('dept-1', 'org-1', { name: 'Новое название' });

      expect(result.name).toBe('Новое название');
      expect(MockPrisma.department.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dept-1' },
          data: expect.objectContaining({ name: 'Новое название' }),
        }),
      );
    });

    it('выбрасывает AppError при циклической ссылке', async () => {
      (MockPrisma.department.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'dept-1', name: 'Отдел', organizationId: 'org-1', parentId: null })
        .mockResolvedValueOnce({ id: 'dept-child', name: 'Дочерний', organizationId: 'org-1' });
      (MockPrisma.department.findMany as jest.Mock).mockResolvedValue([{ id: 'dept-1' }]);

      await expect(
        service.update('dept-1', 'org-1', { parentId: 'dept-child' }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('remove', () => {
    it('удаляет отдел без дочерних отделов и сотрудников', async () => {
      (MockPrisma.department.findFirst as jest.Mock).mockResolvedValue({
        id: 'dept-1',
        name: 'Отдел',
        organizationId: 'org-1',
      });
      (MockPrisma.department.count as jest.Mock).mockResolvedValue(0);
      (MockPrisma.employee.count as jest.Mock).mockResolvedValue(0);
      (MockPrisma.department.delete as jest.Mock).mockResolvedValue({});

      const result = await service.delete('dept-1', 'org-1');

      expect(result.success).toBe(true);
      expect(MockPrisma.department.delete).toHaveBeenCalledWith({ where: { id: 'dept-1' } });
    });

    it('выбрасывает AppError если есть дочерние отделы', async () => {
      (MockPrisma.department.findFirst as jest.Mock).mockResolvedValue({
        id: 'dept-1',
        name: 'Отдел',
        organizationId: 'org-1',
      });
      (MockPrisma.department.count as jest.Mock).mockResolvedValue(2);

      await expect(service.delete('dept-1', 'org-1')).rejects.toThrow(AppError);
    });
  });
});
