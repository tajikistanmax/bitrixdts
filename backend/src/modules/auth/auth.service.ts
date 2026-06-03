import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  organizationId: string;
  departmentId?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string[];
}

export class AuthService {
  // ─── Login ────────────────────────────────────────────────────────────────

  async login(credentials: LoginCredentials) {
    const { email, password } = credentials;

    const employee = await prisma.employee.findFirst({
      where: { email },
      include: {
        organization: true,
        employeeRoles: { include: { role: true } },
      },
    });

    if (!employee || !employee.passwordHash) {
      throw new AppError('Неверный email или пароль', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Неверный email или пароль', 401);
    }

    if (employee.status === 'fired') {
      throw new AppError('Аккаунт заблокирован', 403);
    }

    const tokenPayload: TokenPayload = {
      userId: employee.id,
      email: employee.email!,
      organizationId: employee.organizationId,
      role: employee.employeeRoles.map(er => er.role.name),
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = await this.createRefreshToken(employee.id, tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: employee.id,
        fullName: employee.fullName,
        email: employee.email,
        position: employee.position,
        organization: employee.organization.name,
        organizationId: employee.organizationId,
        avatarUrl: employee.avatarUrl,
        roles: employee.employeeRoles.map(er => er.role.name),
      },
    };
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(data: RegisterData) {
    const { fullName, email, password, organizationId, departmentId } = data;

    const existing = await prisma.employee.findFirst({
      where: { email, organizationId },
    });

    if (existing) {
      throw new AppError('Пользователь с таким email уже существует', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await prisma.employee.create({
      data: {
        fullName,
        email,
        passwordHash,
        organizationId,
        departmentId,
        status: 'active',
        hireDate: new Date(),
      },
      include: { organization: true },
    });

    const defaultRole = await prisma.role.findFirst({
      where: { organizationId, name: 'employee' },
    });

    if (defaultRole) {
      await prisma.employeeRole.create({
        data: { employeeId: employee.id, roleId: defaultRole.id },
      });
    }

    const tokenPayload: TokenPayload = {
      userId: employee.id,
      email: employee.email!,
      organizationId: employee.organizationId,
      role: defaultRole ? [defaultRole.name] : ['employee'],
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = await this.createRefreshToken(employee.id, tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: employee.id,
        fullName: employee.fullName,
        email: employee.email,
        position: employee.position,
        organization: employee.organization.name,
        organizationId: employee.organizationId,
        roles: defaultRole ? [defaultRole.name] : ['employee'],
      },
    };
  }

  // ─── Refresh tokens ───────────────────────────────────────────────────────

  async refreshTokens(rawRefreshToken: string) {
    // Верифицируем подпись JWT
    let payload: TokenPayload;
    try {
      payload = jwt.verify(rawRefreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
    } catch {
      throw new AppError('Неверный или истёкший refresh token', 401);
    }

    // Хешируем входящий токен для поиска в БД
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token недействителен или отозван', 401);
    }

    // Ротация: отзываем старый, выдаём новый
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const employee = await prisma.employee.findUnique({
      where: { id: payload.userId },
      include: { employeeRoles: { include: { role: true } } },
    });

    if (!employee || employee.status === 'fired') {
      throw new AppError('Пользователь не найден или заблокирован', 401);
    }

    const newPayload: TokenPayload = {
      userId: employee.id,
      email: employee.email!,
      organizationId: employee.organizationId,
      role: employee.employeeRoles.map(er => er.role.name),
    };

    const newAccessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = await this.createRefreshToken(employee.id, newPayload);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        employeeRoles: { include: { role: true } },
      },
    });

    if (!employee) {
      throw new AppError('Пользователь не найден', 404);
    }

    return {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      inn: employee.inn,
      position: employee.position,
      departmentId: employee.departmentId,
      organization: employee.organization,
      avatarUrl: employee.avatarUrl,
      status: employee.status,
      hireDate: employee.hireDate,
      roles: employee.employeeRoles.map(er => er.role.name),
    };
  }

  // ─── Change password ──────────────────────────────────────────────────────

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const employee = await prisma.employee.findUnique({ where: { id: userId } });

    if (!employee || !employee.passwordHash) {
      throw new AppError('Пользователь не найден', 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, employee.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Неверный текущий пароль', 400);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.employee.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Отзываем все refresh-токены пользователя при смене пароля
    await prisma.refreshToken.updateMany({
      where: { employeeId: userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true, message: 'Пароль успешно изменён' };
  }

  // ─── Password reset ───────────────────────────────────────────────────────

  async requestPasswordReset(email: string) {
    const employee = await prisma.employee.findFirst({ where: { email } });

    // Не раскрываем, существует ли email
    if (!employee) {
      return { success: true, message: 'Если email зарегистрирован, письмо будет отправлено' };
    }

    // Удаляем старые токены сброса для этого пользователя
    await prisma.passwordResetToken.deleteMany({
      where: { employeeId: employee.id },
    });

    // Создаём новый безопасный токен
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 час

    await prisma.passwordResetToken.create({
      data: {
        employeeId: employee.id,
        tokenHash,
        expiresAt,
      },
    });

    // В production: отправить email с ссылкой
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${rawToken}`;

    // В production убрать resetUrl из ответа
    return {
      success: true,
      message: 'Если email зарегистрирован, письмо будет отправлено',
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = this.hashToken(rawToken);

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
      include: { employee: true },
    });

    if (!resetRecord) {
      throw new AppError('Неверный или истёкший токен сброса', 400);
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      throw new AppError('Токен сброса истёк. Запросите новый', 400);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Обновляем пароль и помечаем токен использованным в транзакции
    await prisma.$transaction([
      prisma.employee.update({
        where: { id: resetRecord.employeeId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Отзываем все refresh-токены
      prisma.refreshToken.updateMany({
        where: { employeeId: resetRecord.employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true, message: 'Пароль успешно сброшен' };
  }

  // ─── Role management ──────────────────────────────────────────────────────

  async assignRole(employeeId: string, roleId: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    if (!employee) throw new AppError('Сотрудник не найден', 404);
    if (!role) throw new AppError('Роль не найдена', 404);

    await prisma.employeeRole.deleteMany({ where: { employeeId } });

    await prisma.employeeRole.create({
      data: { employeeId, roleId },
    });

    return { success: true, message: `Роль "${role.name}" назначена` };
  }

  async getEmployeeRoles(employeeId: string) {
    const employeeRoles = await prisma.employeeRole.findMany({
      where: { employeeId },
      include: { role: true },
    });

    return employeeRoles.map(er => er.role);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as string,
    } as jwt.SignOptions);
  }

  private async createRefreshToken(employeeId: string, payload: TokenPayload): Promise<string> {
    const rawToken = uuidv4();
    const tokenHash = this.hashToken(rawToken);

    // Срок жизни из env (default 7d → в миллисекундах)
    const expiresInMs = this.parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    const expiresAt = new Date(Date.now() + expiresInMs);

    await prisma.refreshToken.create({
      data: { employeeId, tokenHash, expiresAt },
    });

    // Возвращаем сырой токен (в БД хранится только хеш)
    return rawToken;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(duration: string): number {
    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7d
    return parseInt(match[1]) * units[match[2]];
  }
}

export default new AuthService();
