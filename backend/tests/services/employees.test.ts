jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../src/core/config/database', () => ({
  __esModule: true,
  default: {
    employee: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    employeeRole: {
      create: jest.fn(),
    },
    employeeHistory: {
      create: jest.fn(),
    },
  },
}));

import bcrypt from 'bcryptjs';
import prisma from '../../src/core/config/database';
import { AppError } from '../../src/core/middleware/errorHandler';
import employeesService from '../../src/modules/employees/employees.service';

const MockBcrypt = jest.mocked(bcrypt);
const MockPrisma = jest.mocked(prisma);

describe('EmployeesService', () => {
  let service: typeof employeesService;

  beforeEach(() => {
    service = employeesService;
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('возвращает пагинированных сотрудников с фильтрами departmentId и status', async () => {
      (MockPrisma.employee.count as jest.Mock).mockResolvedValue(1);
      (MockPrisma.employee.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'emp-1',
          fullName: 'Иван Иванов',
          inn: null,
          email: 'ivan@test.com',
          phone: null,
          avatarUrl: null,
          departmentId: 'dept-1',
          position: 'Разработчик',
          managerId: null,
          hireDate: new Date(),
          status: 'active',
          organizationId: 'org-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          manager: null,
          employeeRoles: [],
        },
      ]);

      const result = await service.findAll('org-1', {
        departmentId: 'dept-1',
        status: 'active',
        page: 1,
        limit: 20,
      });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fullName).toBe('Иван Иванов');
      expect(MockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            departmentId: 'dept-1',
            status: 'active',
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('находит сотрудника по ID', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        fullName: 'Иван Иванов',
        inn: null,
        email: 'ivan@test.com',
        phone: null,
        avatarUrl: null,
        departmentId: 'dept-1',
        position: 'Разработчик',
        managerId: null,
        hireDate: new Date(),
        status: 'active',
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        manager: null,
        subordinates: [],
        employeeRoles: [],
      });

      const employee = await service.findById('emp-1', 'org-1');
      expect(employee.id).toBe('emp-1');
      expect(employee.fullName).toBe('Иван Иванов');
    });

    it('выбрасывает AppError если сотрудник не найден', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('emp-404', 'org-1')).rejects.toThrow(AppError);
    });
  });

  describe('create', () => {
    it('создаёт сотрудника с хэшированным паролем', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      (MockBcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashed');
      (MockPrisma.department.findFirst as jest.Mock).mockResolvedValue(null);
      (MockPrisma.employee.create as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        fullName: 'Пётр Петров',
        email: 'petr@test.com',
        passwordHash: '$2b$12$hashed',
        status: 'active',
        organizationId: 'org-1',
        departmentId: null,
        managerId: null,
        inn: null,
        phone: null,
        avatarUrl: null,
        position: null,
        hireDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        manager: null,
        organization: { name: 'Org' },
      });
      (MockPrisma.role.findFirst as jest.Mock).mockResolvedValue({ id: 'role-1', name: 'employee' });
      (MockPrisma.employeeRole.create as jest.Mock).mockResolvedValue({});
      (MockPrisma.employeeHistory.create as jest.Mock).mockResolvedValue({});

      await service.create(
        { fullName: 'Пётр Петров', email: 'petr@test.com', password: 'secret123', organizationId: 'org-1' },
        'user-1',
      );

      expect(MockBcrypt.hash).toHaveBeenCalledWith('secret123', 12);
      expect(MockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ fullName: 'Пётр Петров', email: 'petr@test.com' }),
        }),
      );
    });

    it('выбрасывает AppError если email уже существует', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing',
        email: 'petr@test.com',
      });

      await expect(
        service.create(
          { fullName: 'Пётр Петров', email: 'petr@test.com', password: 'secret123', organizationId: 'org-1' },
          'user-1',
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('обновляет поля сотрудника', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        fullName: 'Иван Иванов',
        email: 'ivan@test.com',
        status: 'active',
        organizationId: 'org-1',
      });
      (MockPrisma.employee.update as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        fullName: 'Иван Петров',
        email: 'ivan@test.com',
        status: 'active',
        organizationId: 'org-1',
        departmentId: null,
        managerId: null,
        inn: null,
        phone: null,
        avatarUrl: null,
        position: null,
        hireDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        manager: null,
        organization: null,
      });
      (MockPrisma.employeeHistory.create as jest.Mock).mockResolvedValue({});

      const result = await service.update(
        'emp-1',
        'org-1',
        { fullName: 'Иван Петров' },
        'user-1',
      );

      expect(result.fullName).toBe('Иван Петров');
      expect(MockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'emp-1' },
          data: expect.objectContaining({ fullName: 'Иван Петров' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('мягко удаляет сотрудника (status=fired)', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        fullName: 'Иван Иванов',
        organizationId: 'org-1',
      });
      (MockPrisma.employee.count as jest.Mock).mockResolvedValue(0);
      (MockPrisma.employee.update as jest.Mock).mockResolvedValue({});
      (MockPrisma.employeeHistory.create as jest.Mock).mockResolvedValue({});

      await service.delete('emp-1', 'org-1', 'user-1');

      expect(MockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'emp-1' },
          data: expect.objectContaining({
            isDeleted: true,
            status: 'fired',
          }),
        }),
      );
    });
  });
});
