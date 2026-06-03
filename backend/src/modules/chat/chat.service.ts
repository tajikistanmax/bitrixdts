import { prisma } from '../../core/config/database';
import { io } from '../../server';

interface CreateChannelData {
  organizationId: string;
  name: string;
  type: string;
  memberIds?: string[];
  createdBy: string;
}

interface SendMessageData {
  channelId: string;
  authorId: string;
  body: string;
  attachments?: any[];
}

interface SendDirectMessageData {
  senderId: string;
  receiverId: string;
  body: string;
  attachments?: any[];
}

class ChatService {
  async findEmployee(id: string, organizationId?: string) {
    return prisma.employee.findFirst({
      where: organizationId ? { id, organizationId } : { id },
      select: { organizationId: true }
    });
  }

  // Получить все каналы организации
  async getChannels(organizationId: string) {
    return prisma.chatChannel.findMany({
      where: { organizationId },
      include: {
        members: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                position: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Создать канал
  async createChannel(data: CreateChannelData) {
    const { organizationId, name, type, memberIds, createdBy } = data;

    const channel = await prisma.chatChannel.create({
      data: {
        organizationId,
        name,
        type,
        members: memberIds
          ? {
              create: memberIds.map((employeeId) => ({
                employeeId,
                role: employeeId === createdBy ? 'admin' : 'member'
              }))
            }
          : undefined
      },
      include: {
        members: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    // Уведомить участников
    if (memberIds) {
      memberIds.forEach((memberId) => {
        io?.to(memberId).emit('channel:joined', { channel });
      });
    }

    return channel;
  }

  // Получить канал
  async getChannel(channelId: string) {
    return prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                position: true
              }
            }
          }
        }
      }
    });
  }

  // Вступить в канал
  async joinChannel(channelId: string, employeeId: string) {
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel) return null;

    await prisma.chatMember.create({
      data: {
        channelId,
        employeeId,
        role: 'member'
      }
    });

    return this.getChannel(channelId);
  }

  // Выйти из канала
  async leaveChannel(channelId: string, employeeId: string) {
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel) return null;

    await prisma.chatMember.delete({
      where: {
        channelId_employeeId: {
          channelId,
          employeeId
        }
      }
    });

    return this.getChannel(channelId);
  }

  // Получить сообщения канала
  async getChannelMessages(channelId: string, limit: number, before?: string) {
    const where: any = { channelId };
    
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    return prisma.chatMessage.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // Отправить сообщение
  async sendMessage(data: SendMessageData) {
    const { channelId, authorId, body, attachments } = data;

    const message = await prisma.chatMessage.create({
      data: {
        channelId,
        authorId,
        body,
        attachments: attachments || []
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true
          }
        }
      }
    });

    // Broadcast сообщение участникам канала
    const channelMembers = await prisma.chatMember.findMany({
      where: { channelId },
      select: { employeeId: true }
    });

    channelMembers.forEach((member) => {
      io?.to(member.employeeId).emit('message:new', message);
    });

    return message;
  }

  // Получить личные сообщения
  async getDirectMessages(
    employeeId1: string,
    employeeId2: string,
    organizationId: string,
    limit: number,
    before?: string
  ) {
    // Найти или создать прямой канал
    let directChannel = await prisma.chatChannel.findFirst({
      where: {
        type: 'direct',
        organizationId,
        members: {
          every: {
            employeeId: { in: [employeeId1, employeeId2] }
          },
          some: {
            employeeId: { in: [employeeId1, employeeId2] }
          }
        }
      }
    });

    if (!directChannel) {
      directChannel = await prisma.chatChannel.create({
        data: {
          type: 'direct',
          organizationId,
          members: {
            create: [
              { employeeId: employeeId1, role: 'member' },
              { employeeId: employeeId2, role: 'member' }
            ]
          }
        }
      });
    }

    return this.getChannelMessages(directChannel.id, limit, before);
  }

  // Отправить личное сообщение
  async sendDirectMessage(data: SendDirectMessageData) {
    const { senderId, receiverId, body, attachments } = data;

    const message = await this.sendMessage({
      channelId: '', // Будет найден/создан внутри
      authorId: senderId,
      body,
      attachments
    });

    // Уведомить получателя
    io?.to(receiverId).emit('message:new', message);

    return message;
  }
}

export default new ChatService();
