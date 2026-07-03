import logger from '../config/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email Service
 * В development — логирует в консоль.
 * В production — отправляет через SMTP (nodemailer).
 */
export class EmailService {
  private transporter: any = null;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || smtpHost === 'smtp.example.com') {
      logger.info('[Email] SMTP not configured — emails will be logged to console');
      return;
    }

    try {
      // Динамический импорт nodemailer (если установлен)
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      logger.info('[Email] SMTP transporter configured');
    } catch (err) {
      logger.warn('[Email] nodemailer not installed — emails will be logged to console');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    if (!this.transporter) {
      // Fallback: log to console in development
      logger.info(`[Email] (DEV) To: ${to}, Subject: ${subject}`);
      logger.debug(`[Email] (DEV) Body: ${text || html.substring(0, 200)}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@hr-platform.com',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
      logger.info(`[Email] Sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      logger.error('[Email] Failed to send:', error);
      return false;
    }
  }

  // Шаблон: сброс пароля
  async sendPasswordReset(to: string, resetUrl: string, fullName: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Сброс пароля — HR Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Сброс пароля</h2>
          <p>Здравствуйте, ${fullName}!</p>
          <p>Вы запросили сброс пароля. Нажмите на кнопку ниже для установки нового пароля:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Сбросить пароль
            </a>
          </p>
          <p style="color: #6B7280; font-size: 14px;">
            Ссылка действительна 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          <p style="color: #9CA3AF; font-size: 12px;">HR Platform</p>
        </div>
      `,
    });
  }

  // Шаблон: уведомление о назначении задачи
  async sendTaskAssigned(to: string, taskTitle: string, assignerName: string): Promise<boolean> {
    return this.send({
      to,
      subject: `Новая задача: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Вам назначена задача</h2>
          <p><strong>${assignerName}</strong> назначил вам задачу:</p>
          <p style="font-size: 18px; font-weight: bold;">${taskTitle}</p>
          <p style="color: #6B7280;">Войдите в систему для просмотра деталей.</p>
        </div>
      `,
    });
  }
}

export default new EmailService();
