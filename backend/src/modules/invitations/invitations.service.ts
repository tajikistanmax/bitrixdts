import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { randomUUID } from 'crypto';
import emailService from '../../core/utils/email.service';

export interface InviteData {
  email: string;
  organizationId: string;
  departmentId?: string;
  position?: string;
  invitedById: string;
}

export class InvitationsService {
  async invite(data: InviteData) {
    const { email, organizationId, departmentId, position, invitedById } = data;

    // Проверить что email не занят
    const existing = await prisma.employee.findFirst({
      where: { email, organizationId },
    });
    if (existing) throw new AppError('Сотрудник с таким email уже существует', 400);

    // Создать сотрудника со статусом "pending" (без пароля)
    const employee = await prisma.employee.create({
      data: {
        organizationId,
        fullName: email.split('@')[0], // Временное имя
        email,
        departmentId,
        position,
        status: 'active',
        hireDate: new Date(),
      },
    });

    // Назначить роль employee
    const defaultRole = await prisma.role.findFirst({
      where: { organizationId, name: 'employee' },
    });
    if (defaultRole) {
      await prisma.employeeRole.create({
        data: { employeeId: employee.id, roleId: defaultRole.id },
      });
    }

    // Генерация ссылки-приглашения (через password reset flow)
    const crypto = await import('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.passwordResetToken.create({
      data: {
        employeeId: employee.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/invite?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Отправить email
    const inviter = await prisma.employee.findUnique({ where: { id: invitedById }, select: { fullName: true } });
    await emailService.send({
      to: email,
      subject: 'Приглашение в CMR-DTS Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Приглашение</h2>
          <p>${inviter?.fullName || 'Администратор'} приглашает вас в рабочее пространство.</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Принять приглашение
            </a>
          </p>
          <p style="color: #6B7280; font-size: 14px;">Ссылка действительна 7 дней.</p>
        </div>
      `,
    });

    return {
      employeeId: employee.id,
      email,
      inviteUrl: process.env.NODE_ENV === 'development' ? inviteUrl : undefined,
      message: 'Приглашение отправлено',
    };
  }

  async inviteMultiple(emails: string[], organizationId: string, invitedById: string, departmentId?: string) {
    const results = [];
    for (const email of emails) {
      try {
        const result = await this.invite({ email, organizationId, departmentId, invitedById });
        results.push({ email, status: 'sent', ...result });
      } catch (err: any) {
        results.push({ email, status: 'error', error: err.message });
      }
    }
    return results;
  }
}

export default new InvitationsService();
