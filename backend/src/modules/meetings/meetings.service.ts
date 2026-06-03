import { prisma } from '../../core/config/database';
import { CalendarEventType } from '@prisma/client';

interface CreateMeetingData {
  organizationId: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  creatorId: string;
  participantIds?: string[];
  location?: string;
  meetingUrl?: string;
}

class MeetingsService {
  async findEmployee(id: string, organizationId?: string) {
    return prisma.employee.findFirst({
      where: organizationId ? { id, organizationId } : { id },
      select: { organizationId: true }
    });
  }

  // Создать встречу
  async createMeeting(data: CreateMeetingData) {
    const {
      organizationId,
      title,
      description,
      startTime,
      endTime,
      creatorId,
      participantIds = [],
      location,
      meetingUrl
    } = data;

    // Генерируем ссылку на встречу (для интеграции с Zoom/Google Meet)
    const videoCallUrl = meetingUrl || `https://meet.hr-platform.com/${Date.now()}`;

    const meeting = await prisma.$transaction(async (tx) => {
      // Создаем встречу через CalendarEvent
      const event = await tx.calendarEvent.create({
        data: {
          organizationId,
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          eventType: 'meeting',
          entityType: 'meeting',
          location,
          createdById: creatorId,
          color: '#8b5cf6'
        }
      });

      // Добавляем участников
      if (participantIds.length > 0) {
        await Promise.all(
          participantIds.map((participantId) =>
            tx.calendarEvent.create({
              data: {
                organizationId,
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                eventType: 'meeting',
                entityType: 'meeting',
                entityId: event.id,
                employeeId: participantId,
                createdById: creatorId
              }
            })
          )
        );
      }

      return this.getMeeting(event.id);
    });

    return meeting;
  }

  // Получить встречи сотрудника
  async getMeetings(
    employeeId: string,
    startDate?: string,
    endDate?: string,
    status?: string
  ) {
    const where: any = {
      createdById: employeeId,
      eventType: 'meeting'
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    return prisma.calendarEvent.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });
  }

  // Получить встречу по ID
  async getMeeting(meetingId: string) {
    return prisma.calendarEvent.findUnique({
      where: { id: meetingId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true
          }
        }
      }
    });
  }

  // Обновить встречу
  async updateMeeting(meetingId: string, updateData: any) {
    return prisma.calendarEvent.update({
      where: { id: meetingId },
      data: updateData
    });
  }

  // Отменить встречу
  async cancelMeeting(meetingId: string) {
    return prisma.calendarEvent.update({
      where: { id: meetingId },
      data: {
        eventType: 'cancelled' as CalendarEventType,
        description: 'Meeting cancelled\n' + (await this.getMeeting(meetingId))?.description
      }
    });
  }

  // Подтвердить участие
  async confirmAttendance(meetingId: string, employeeId: string) {
    // Создаем запись о подтверждении участия
    await prisma.calendarEvent.upsert({
      where: {
        id: meetingId
      },
      update: {},
      create: {
        id: meetingId,
        organizationId: '', // Будет установлено при создании
        title: '',
        startTime: new Date(),
        endTime: new Date(),
        eventType: 'meeting',
        entityType: 'meeting',
        employeeId,
        createdById: employeeId
      }
    });

    return this.getMeeting(meetingId);
  }

  // Присоединиться к встрече
  async joinMeeting(meetingId: string, employeeId: string) {
    const meeting = await this.getMeeting(meetingId);
    
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Генерируем токен для доступа к видеосервису
    const token = Buffer.from(`${employeeId}:${meetingId}:${Date.now()}`).toString('base64');
    
    return `https://meet.hr-platform.com/join?token=${token}`;
  }
}

export default new MeetingsService();
