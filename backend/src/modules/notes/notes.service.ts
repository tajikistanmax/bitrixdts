import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

// Заметки хранятся как личный чат-канал типа "notes", но лучше отдельная таблица
// Используем простую модель через JSON в отдельной таблице (или можно ChatChannel type=notes)
// Для простоты используем ChatMessage в канале с type='notes' для данного пользователя

export class NotesService {
  // Получить/создать персональный канал заметок
  private async getNotesChannel(employeeId: string, organizationId: string): Promise<string> {
    // Ищем существующий канал заметок этого сотрудника
    const existing = await prisma.chatChannel.findFirst({
      where: {
        organizationId,
        type: 'notes',
        members: { some: { employeeId } },
      },
    });

    if (existing) return existing.id;

    // Создаём новый
    const channel = await prisma.chatChannel.create({
      data: {
        organizationId,
        name: 'Заметки',
        type: 'notes',
        members: { create: { employeeId, role: 'owner' } },
      },
    });

    return channel.id;
  }

  async getNotes(employeeId: string, organizationId: string, page = 1, limit = 50) {
    const channelId = await this.getNotesChannel(employeeId, organizationId);
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { channelId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chatMessage.count({ where: { channelId } }),
    ]);

    return { data: notes, total, page, channelId };
  }

  async createNote(employeeId: string, organizationId: string, body: string) {
    if (!body || !body.trim()) throw new AppError('Текст заметки обязателен', 400);

    const channelId = await this.getNotesChannel(employeeId, organizationId);

    const note = await prisma.chatMessage.create({
      data: {
        channelId,
        authorId: employeeId,
        body,
      },
    });

    return note;
  }

  async deleteNote(noteId: string, employeeId: string) {
    const note = await prisma.chatMessage.findFirst({
      where: { id: noteId, authorId: employeeId },
    });
    if (!note) throw new AppError('Заметка не найдена', 404);

    await prisma.chatMessage.delete({ where: { id: noteId } });
    return { success: true };
  }

  async updateNote(noteId: string, employeeId: string, body: string) {
    const note = await prisma.chatMessage.findFirst({
      where: { id: noteId, authorId: employeeId },
    });
    if (!note) throw new AppError('Заметка не найдена', 404);

    // ChatMessage не имеет updatedAt, но body можно обновить через Prisma
    // Prisma schema ChatMessage: body String? — можно обновить
    const updated = await prisma.chatMessage.update({
      where: { id: noteId },
      data: { body },
    });

    return updated;
  }
}

export default new NotesService();
