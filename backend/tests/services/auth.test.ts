jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../src/core/config/database', () => ({
  __esModule: true,
  default: {
    employee: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    employeeRole: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import bcrypt from 'bcryptjs';
import prisma from '../../src/core/config/database';
import { AuthService } from '../../src/modules/auth/auth.service';

const MockBcrypt = jest.mocked(bcrypt);
const MockPrisma = jest.mocked(prisma);

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('hashes password with bcrypt and creates employee', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      (MockBcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      (MockPrisma.role.findFirst as jest.Mock).mockResolvedValue(null);
      (MockPrisma.employee.create as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        fullName: 'Alice',
        email: 'alice@test.com',
        passwordHash: '$2b$12$hashedpassword',
        organizationId: 'org-1',
        status: 'active',
        organization: { name: 'Org' },
      });

      await service.register({
        fullName: 'Alice',
        email: 'alice@test.com',
        password: 'plainpassword',
        organizationId: 'org-1',
      });

      expect(MockBcrypt.hash).toHaveBeenCalledWith('plainpassword', 12);
      expect(MockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullName: 'Alice',
            email: 'alice@test.com',
            passwordHash: '$2b$12$hashedpassword',
          }),
        }),
      );
    });
  });

  describe('login', () => {
    it('compares password with bcrypt.compare', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        email: 'alice@test.com',
        passwordHash: '$2b$12$storedhash',
        status: 'active',
        organizationId: 'org-1',
        organization: { name: 'Org' },
        employeeRoles: [{ role: { name: 'employee' } }],
      });
      (MockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ email: 'alice@test.com', password: 'plainpassword' });

      expect(MockBcrypt.compare).toHaveBeenCalledWith('plainpassword', '$2b$12$storedhash');
    });

    it('throws on invalid password', async () => {
      (MockPrisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        email: 'alice@test.com',
        passwordHash: '$2b$12$storedhash',
        status: 'active',
        organizationId: 'org-1',
      });
      (MockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'alice@test.com', password: 'wrong' }),
      ).rejects.toThrow('Неверный email или пароль');
    });
  });
});
