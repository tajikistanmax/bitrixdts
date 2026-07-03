import prisma from '../../core/config/database';

export class DashboardService {
  // ═══════════════════════════════════════════════════════════════════════
  // ДАШБОРД СОТРУДНИКА
  // ═══════════════════════════════════════════════════════════════════════

  async getEmployeeDashboard(employeeId: string, organizationId: string) {
    const now = new Date();

    const [
      myTasks,
      myOverdueTasks,
      myMeetingsToday,
      myNotificationsUnread,
      myVacations,
      myDocumentsForApproval,
    ] = await Promise.all([
      // Мои задачи (активные)
      prisma.task.findMany({
        where: { assigneeId: employeeId, organizationId, isDeleted: false, status: { notIn: ['done', 'cancelled'] } },
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // Просроченные задачи
      prisma.task.count({
        where: { assigneeId: employeeId, organizationId, isDeleted: false, status: { notIn: ['done', 'cancelled'] }, dueDate: { lt: now } },
      }),
      // Встречи сегодня
      prisma.calendarEvent.findMany({
        where: {
          organizationId,
          OR: [{ employeeId }, { createdById: employeeId }],
          startTime: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          endTime: { lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
        },
        select: { id: true, title: true, startTime: true, endTime: true, location: true },
        orderBy: { startTime: 'asc' },
      }),
      // Непрочитанные уведомления
      prisma.notification.count({
        where: { employeeId, organizationId, isRead: false },
      }),
      // Ближайшие отпуска
      prisma.vacationRequest.findMany({
        where: { employeeId, organizationId, status: { in: ['planned', 'approved'] }, startDate: { gte: now } },
        select: { id: true, type: true, startDate: true, endDate: true, status: true },
        orderBy: { startDate: 'asc' },
        take: 3,
      }),
      // Документы на согласование (где я согласующий)
      prisma.workflowApproval.count({
        where: { approverId: employeeId, status: 'pending' },
      }),
    ]);

    // Статистика задач
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { assigneeId: employeeId, organizationId, isDeleted: false },
      _count: { status: true },
    });

    return {
      tasks: {
        active: myTasks,
        overdue: myOverdueTasks,
        stats: taskStats.reduce((acc, s) => { acc[s.status] = s._count.status; return acc; }, {} as any),
      },
      meetings: myMeetingsToday,
      notifications: { unread: myNotificationsUnread },
      vacations: myVacations,
      documentsForApproval: myDocumentsForApproval,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ДАШБОРД РУКОВОДИТЕЛЯ ОТДЕЛА
  // ═══════════════════════════════════════════════════════════════════════

  async getManagerDashboard(employeeId: string, organizationId: string) {
    const now = new Date();

    // Найти отдел, которым руководит сотрудник
    const department = await prisma.department.findFirst({
      where: { headId: employeeId, organizationId },
    });

    if (!department) {
      // Если не руководитель — возвращаем пустой dashboard
      return { departmentId: null, message: 'Вы не являетесь руководителем подразделения' };
    }

    // Сотрудники отдела
    const deptEmployees = await prisma.employee.findMany({
      where: { departmentId: department.id, organizationId, status: 'active' },
      select: { id: true, fullName: true, position: true, status: true },
    });
    const deptEmployeeIds = deptEmployees.map(e => e.id);

    const [
      deptTasks,
      deptOverdue,
      deptTasksByStatus,
      deptWorkload,
      deptPendingApprovals,
      deptAttendanceToday,
    ] = await Promise.all([
      // Всего задач отдела (активные)
      prisma.task.count({
        where: { assigneeId: { in: deptEmployeeIds }, organizationId, isDeleted: false, status: { notIn: ['done', 'cancelled'] } },
      }),
      // Просроченные задачи отдела
      prisma.task.findMany({
        where: { assigneeId: { in: deptEmployeeIds }, organizationId, isDeleted: false, status: { notIn: ['done', 'cancelled'] }, dueDate: { lt: now } },
        select: { id: true, title: true, priority: true, dueDate: true, assigneeId: true },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      // Задачи по статусам
      prisma.task.groupBy({
        by: ['status'],
        where: { assigneeId: { in: deptEmployeeIds }, organizationId, isDeleted: false },
        _count: { status: true },
      }),
      // Нагрузка сотрудников (количество активных задач)
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { assigneeId: { in: deptEmployeeIds }, organizationId, isDeleted: false, status: { notIn: ['done', 'cancelled'] } },
        _count: { assigneeId: true },
      }),
      // Документы на согласование в отделе
      prisma.workflowApproval.count({
        where: { approverId: { in: deptEmployeeIds }, status: 'pending' },
      }),
      // Посещаемость сегодня
      prisma.attendance.findMany({
        where: {
          employeeId: { in: deptEmployeeIds },
          organizationId,
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
        select: { employeeId: true, checkIn: true, checkOut: true },
      }),
    ]);

    // Маппинг нагрузки к именам
    const workload = deptWorkload.map(w => {
      const emp = deptEmployees.find(e => e.id === w.assigneeId);
      return {
        employeeId: w.assigneeId,
        fullName: emp?.fullName || 'Unknown',
        position: emp?.position,
        activeTasks: w._count.assigneeId,
      };
    }).sort((a, b) => b.activeTasks - a.activeTasks);

    return {
      department: { id: department.id, name: department.name },
      employees: { total: deptEmployees.length, list: deptEmployees },
      tasks: {
        active: deptTasks,
        overdue: deptOverdue,
        byStatus: deptTasksByStatus.reduce((acc, s) => { acc[s.status] = s._count.status; return acc; }, {} as any),
      },
      workload,
      pendingApprovals: deptPendingApprovals,
      attendance: {
        present: deptAttendanceToday.filter(a => a.checkIn).length,
        total: deptEmployees.length,
        details: deptAttendanceToday,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ДАШБОРД РУКОВОДСТВА (TOP-LEVEL)
  // ═══════════════════════════════════════════════════════════════════════

  async getExecutiveDashboard(organizationId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEmployees,
      totalTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      kpiByDepartment,
      attendanceRate,
      recentMemos,
      pendingWorkflows,
      projectStats,
    ] = await Promise.all([
      // Сотрудники
      prisma.employee.count({ where: { organizationId, status: 'active' } }),
      // Всего задач
      prisma.task.count({ where: { organizationId, isDeleted: false } }),
      // Просроченные
      prisma.task.count({ where: { organizationId, isDeleted: false, status: { notIn: ['done', 'cancelled'] }, dueDate: { lt: now } } }),
      // Задачи по статусам
      prisma.task.groupBy({
        by: ['status'],
        where: { organizationId, isDeleted: false },
        _count: { status: true },
      }),
      // Задачи по приоритетам
      prisma.task.groupBy({
        by: ['priority'],
        where: { organizationId, isDeleted: false, status: { notIn: ['done', 'cancelled'] } },
        _count: { priority: true },
      }),
      // KPI по подразделениям (количество просроченных задач)
      prisma.department.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          _count: { select: { staffPositions: true } },
        },
      }),
      // Посещаемость за сегодня
      prisma.attendance.count({
        where: { organizationId, date: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      }),
      // Служебные записки (нерешённые)
      prisma.memo.count({
        where: { organizationId, status: { in: ['sent', 'in_review'] } },
      }),
      // Активные workflow на согласовании
      prisma.workflowApproval.count({
        where: { status: 'pending', instance: { organizationId } },
      }),
      // Проекты
      prisma.project.groupBy({
        by: ['status'],
        where: { organizationId, isDeleted: false },
        _count: { status: true },
      }),
    ]);

    // Выполнение задач за 30 дней
    const completedLast30Days = await prisma.task.count({
      where: { organizationId, status: 'done', updatedAt: { gte: thirtyDaysAgo } },
    });

    const createdLast30Days = await prisma.task.count({
      where: { organizationId, createdAt: { gte: thirtyDaysAgo } },
    });

    return {
      overview: {
        totalEmployees,
        totalTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round(((tasksByStatus.find(s => s.status === 'done')?._count.status || 0) / totalTasks) * 100) : 0,
      },
      tasks: {
        byStatus: tasksByStatus.reduce((acc, s) => { acc[s.status] = s._count.status; return acc; }, {} as any),
        byPriority: tasksByPriority.reduce((acc, s) => { acc[s.priority] = s._count.priority; return acc; }, {} as any),
        completedLast30Days,
        createdLast30Days,
      },
      projects: projectStats.reduce((acc, s) => { acc[s.status] = s._count.status; return acc; }, {} as any),
      attendance: {
        todayPresent: attendanceRate,
        totalEmployees,
        rate: totalEmployees > 0 ? Math.round((attendanceRate / totalEmployees) * 100) : 0,
      },
      memos: { pending: recentMemos },
      workflows: { pendingApprovals: pendingWorkflows },
      departments: kpiByDepartment,
    };
  }
}

export default new DashboardService();
