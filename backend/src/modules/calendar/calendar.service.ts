import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { CalendarEventType } from '@prisma/client';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: CalendarEventType
  entityType?: string;
  entityId?: string;
  employeeId?: string;
  departmentId?: string;
  organizationId: string;
  location?: string;
  reminderMinutes?: number;
  isAllDay?: boolean;
  color?: string;
}

export class CalendarService {
  async createEvent(data: CalendarEvent, userId: string) {
    const { organizationId } = data;

    // Проверить организацию
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError('Организация не найдена', 404);

    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        employeeId: data.employeeId,
        departmentId: data.departmentId,
        organizationId,
        location: data.location,
        reminderMinutes: data.reminderMinutes || 30,
        isAllDay: data.isAllDay || false,
        color: data.color || '#3b82f6',
        createdById: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            departmentId: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return event;
  }

  async getEvents(
    organizationId: string,
    filters: {
      startDate: string;
      endDate: string;
      eventType?: string;
      employeeId?: string;
      departmentId?: string;
      entityType?: string;
      entityId?: string;
    }
  ) {
    const where: any = { organizationId };

    // Фильтр по дате
    where.startTime = { lte: new Date(filters.endDate) };
    where.endTime = { gte: new Date(filters.startDate) };

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            departmentId: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Получить задачи для событий типа 'task'
    const taskEvents = events.filter(e => e.entityType === 'task');
    const taskIds = taskEvents.map(e => e.entityId).filter(Boolean);

    let tasks: any[] = [];
    if (taskIds.length > 0) {
      tasks = await prisma.task.findMany({
        where: { id: { in: taskIds } },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
      });
    }

    const tasksMap = new Map(tasks.map(t => [t.id, t]));

    return events.map(event => ({
      ...event,
      task: event.entityType === 'task' ? tasksMap.get(event.entityId) : null,
    }));
  }

  async getDeadlines(organizationId: string, daysAhead: number = 7) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const events = await prisma.calendarEvent.findMany({
      where: {
        organizationId,
        eventType: 'deadline',
        startTime: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return events;
  }

  async getReminders(organizationId: string, employeeId: string, minutesAhead: number = 30) {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + minutesAhead * 60 * 1000);

    const events = await prisma.calendarEvent.findMany({
      where: {
        organizationId,
        employeeId,
        reminderMinutes: { lte: minutesAhead },
        startTime: {
          gte: now,
          lte: reminderTime,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return events;
  }

  async updateEvent(id: string, organizationId: string, data: Partial<CalendarEvent>) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizationId },
    });

    if (!event) throw new AppError('Событие не найдено', 404);

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteEvent(id: string, organizationId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizationId },
    });

    if (!event) throw new AppError('Событие не найдено', 404);

    await prisma.calendarEvent.delete({ where: { id } });

    return { success: true, message: 'Событие удалено' };
  }

  async getMonthlyView(organizationId: string, year: number, month: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const events = await prisma.calendarEvent.findMany({
      where: {
        organizationId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Группировка по датам
    const daysMap = new Map<string, typeof events>();

    for (let day = 1; day <= endDate.getDate(); day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      daysMap.set(dateKey, []);
    }

    events.forEach(event => {
      const dateKey = event.startTime.toISOString().split('T')[0];
      const dayEvents = daysMap.get(dateKey) || [];
      dayEvents.push(event);
      daysMap.set(dateKey, dayEvents);
    });

    return {
      year,
      month: month + 1,
      days: Object.fromEntries(daysMap),
    };
  }
}

export default new CalendarService();
