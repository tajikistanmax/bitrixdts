import Anthropic from '@anthropic-ai/sdk';
import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
const MAX_HISTORY = 30;
const MAX_MESSAGE_LENGTH = 8000;

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AppError(
      'ИИ-ассистент не настроен. Администратор должен задать ANTHROPIC_API_KEY в переменных окружения.',
      503
    );
  }
  if (!client) {
    client = new Anthropic(); // ключ берётся из ANTHROPIC_API_KEY
  }
  return client;
}

export class AiService {
  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  /**
   * Собирает рабочий контекст сотрудника (профиль, активные задачи, уведомления),
   * чтобы ассистент отвечал по существу, а не абстрактно.
   */
  private async buildUserContext(userId: string, organizationId: string): Promise<string> {
    const [employee, tasks, unreadCount] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: userId },
        include: {
          employeeRoles: { include: { role: { select: { name: true } } } },
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          assigneeId: userId,
          isDeleted: false,
          status: { notIn: ['completed', 'cancelled'] as any },
        },
        orderBy: [{ dueDate: 'asc' }],
        take: 10,
        select: { title: true, status: true, priority: true, dueDate: true },
      }),
      prisma.notification.count({ where: { employeeId: userId, isRead: false } }),
    ]);

    const department = employee?.departmentId
      ? await prisma.department.findUnique({ where: { id: employee.departmentId }, select: { name: true } })
      : null;

    const lines: string[] = [];
    if (employee) {
      lines.push(`Сотрудник: ${employee.fullName}`);
      if (employee.position) lines.push(`Должность: ${employee.position}`);
      if (department?.name) lines.push(`Отдел: ${department.name}`);
      const roles = employee.employeeRoles.map((r) => r.role.name).join(', ');
      if (roles) lines.push(`Роли в системе: ${roles}`);
    }
    lines.push(`Непрочитанных уведомлений: ${unreadCount}`);
    if (tasks.length > 0) {
      lines.push('Активные задачи сотрудника:');
      for (const t of tasks) {
        const due = t.dueDate ? `, срок ${t.dueDate.toISOString().slice(0, 10)}` : '';
        lines.push(`- «${t.title}» (статус: ${t.status}, приоритет: ${t.priority}${due})`);
      }
    } else {
      lines.push('Активных задач у сотрудника нет.');
    }
    return lines.join('\n');
  }

  private buildSystemPrompt(userContext: string): string {
    return [
      'Ты — встроенный ИИ-ассистент корпоративной платформы CMR-DTS (управление компанией: задачи, проекты, HR, документооборот, календарь, отчёты, KPI, чаты).',
      'Отвечай на языке пользователя (по умолчанию — русский). Будь кратким, конкретным и дружелюбным.',
      'Ты помогаешь: разобраться в модулях платформы, спланировать день, сформулировать задачи и письма, подсказать по кадровым процессам (отпуск, командировка, больничный — заявки подаются в соответствующих разделах платформы).',
      'Ты не выполняешь действия в системе сам — только советуешь. Если вопрос требует данных, которых нет в контексте, честно скажи об этом и подскажи, в каком разделе платформы их найти.',
      '',
      'Контекст текущего пользователя:',
      userContext,
    ].join('\n');
  }

  async chat(userId: string, organizationId: string, messages: AiChatMessage[]): Promise<{ reply: string; model: string }> {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new AppError('Сообщения обязательны', 400);
    }
    for (const m of messages) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim()) {
        throw new AppError('Некорректный формат сообщений', 400);
      }
      if (m.content.length > MAX_MESSAGE_LENGTH) {
        throw new AppError(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_LENGTH} символов)`, 400);
      }
    }
    if (messages[messages.length - 1].role !== 'user') {
      throw new AppError('Последнее сообщение должно быть от пользователя', 400);
    }

    const history = messages.slice(-MAX_HISTORY);
    const userContext = await this.buildUserContext(userId, organizationId);
    const anthropic = getClient();

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        thinking: { type: 'adaptive' },
        system: [
          {
            type: 'text',
            text: this.buildSystemPrompt(userContext),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      });

      const reply = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();

      if (!reply) {
        throw new AppError('ИИ-ассистент не смог сформировать ответ. Попробуйте переформулировать вопрос.', 502);
      }
      return { reply, model: response.model };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Anthropic.AuthenticationError) {
        throw new AppError('Неверный API-ключ ИИ-ассистента. Обратитесь к администратору.', 503);
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new AppError('ИИ-ассистент перегружен. Повторите запрос через минуту.', 429);
      }
      if (error instanceof Anthropic.APIConnectionError) {
        throw new AppError('Нет соединения с сервисом ИИ. Проверьте доступ к сети.', 503);
      }
      if (error instanceof Anthropic.APIError) {
        throw new AppError(`Ошибка сервиса ИИ: ${error.message}`, 502);
      }
      throw error;
    }
  }
}

export default new AiService();
