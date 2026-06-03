import prisma from '../../core/config/database';

export interface TaskReportFilters {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: string;
  projectId?: string;
}

export interface TaskCompletionReport {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  byPeriod: Array<{
    date: string;
    completed: number;
  }>;
  topPerformers: Array<{
    employeeId: string;
    employeeName: string;
    completedTasks: number;
    avgCompletionTime: number;
  }>;
}

export interface OverdueReport {
  totalOverdue: number;
  byEmployee: Array<{
    employeeId: string;
    employeeName: string;
    overdueCount: number;
  }>;
  byProject: Array<{
    projectId: string;
    projectName: string;
    overdueCount: number;
  }>;
  oldestOverdue: Array<{
    taskId: string;
    taskTitle: string;
    assigneeId: string;
    assigneeName: string;
    dueDate: Date;
    daysOverdue: number;
  }>;
}

export interface EmployeeWorkloadReport {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalStoryPoints: number;
  totalHoursLogged: number;
  efficiency: number;
}

export interface DepartmentEfficiencyReport {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  totalTasks: number;
  completedTasks: number;
  avgCompletionTime: number;
  avgTaskDuration: number;
  efficiency: number;
  topPerformers: Array<{
    employeeId: string;
    employeeName: string;
    completedTasks: number;
  }>;
}

export class ReportsService {
  // Отчёт по выполненным задачам
  async getTaskCompletionReport(filters: TaskReportFilters): Promise<TaskCompletionReport> {
    const { organizationId, startDate, endDate, employeeId, departmentId } = filters;

    const where: any = {
      organizationId,
      status: 'done',
    };

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (employeeId) {
      where.assigneeId = employeeId;
    }

    if (departmentId) {
      const deptEmployees = await prisma.employee.findMany({
        where: { departmentId, organizationId },
        select: { id: true },
      });
      where.assigneeId = { in: deptEmployees.map(e => e.id) };
    }

    const completedTasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        assigneeId: true,
        dueDate: true,
        createdAt: true,
        storyPoints: true,
      },
    });

    const totalTasks = await prisma.task.count({
      where: {
        organizationId,
        assigneeId: employeeId ? { equals: employeeId } : undefined,
      },
    });

    // Группировка по периодам (по дням)
    const byPeriodMap = new Map<string, number>();
    completedTasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.toISOString().split('T')[0];
        byPeriodMap.set(dateKey, (byPeriodMap.get(dateKey) || 0) + 1);
      }
    });

    const byPeriod = Array.from(byPeriodMap.entries())
      .map(([date, completed]) => ({ date, completed }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Топ исполнителей
    const performersMap = new Map<string, { count: number; totalTime: number; name: string }>();
    completedTasks.forEach(task => {
      if (task.assigneeId) {
        const existing = performersMap.get(task.assigneeId) || { count: 0, totalTime: 0, name: '' };
        const completionTime = task.dueDate
          ? (task.dueDate.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60) // часы
          : 0;
        performersMap.set(task.assigneeId, {
          count: existing.count + 1,
          totalTime: existing.totalTime + completionTime,
          name: existing.name,
        });
      }
    });

    // Получить имена сотрудников
    const performerIds = Array.from(performersMap.keys());
    if (performerIds.length > 0) {
      const employees = await prisma.employee.findMany({
        where: { id: { in: performerIds } },
        select: { id: true, fullName: true },
      });
      const namesMap = new Map(employees.map(e => [e.id, e.fullName]));
      performersMap.forEach((v, k) => {
        v.name = namesMap.get(k) || 'Unknown';
      });
    }

    const topPerformers = Array.from(performersMap.entries())
      .map(([employeeId, data]) => ({
        employeeId,
        employeeName: data.name,
        completedTasks: data.count,
        avgCompletionTime: Math.round((data.totalTime / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.completedTasks - a.completedTasks)
      .slice(0, 10);

    return {
      totalTasks,
      completedTasks: completedTasks.length,
      completionRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
      byPeriod,
      topPerformers,
    };
  }

  // Отчёт по просроченным задачам
  async getOverdueReport(filters: TaskReportFilters): Promise<OverdueReport> {
    const { organizationId, startDate, endDate, employeeId, departmentId } = filters;

    const where: any = {
      organizationId,
      status: { not: 'done' },
      dueDate: { lt: new Date() },
    };

    if (startDate && endDate) {
      where.dueDate = {
        ...where.dueDate,
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (employeeId) {
      where.assigneeId = employeeId;
    }

    if (departmentId) {
      const deptEmployees = await prisma.employee.findMany({
        where: { departmentId, organizationId },
        select: { id: true },
      });
      where.assigneeId = { in: deptEmployees.map(e => e.id) };
    }

    const overdueTasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Группировка по сотрудникам
    const byEmployeeMap = new Map<string, { count: number; name: string }>();
    overdueTasks.forEach(task => {
      if (task.assigneeId) {
        const existing = byEmployeeMap.get(task.assigneeId) || { count: 0, name: '' };
        byEmployeeMap.set(task.assigneeId, { count: existing.count + 1, name: task.assignee?.fullName || '' });
      }
    });

    const byEmployee = Array.from(byEmployeeMap.entries())
      .map(([employeeId, data]) => ({
        employeeId,
        employeeName: data.name,
        overdueCount: data.count,
      }))
      .sort((a, b) => b.overdueCount - a.overdueCount);

    // Группировка по проектам
    const byProjectMap = new Map<string, { count: number; name: string }>();
    overdueTasks.forEach(task => {
      if (task.projectId) {
        const existing = byProjectMap.get(task.projectId) || { count: 0, name: '' };
        byProjectMap.set(task.projectId, { count: existing.count + 1, name: task.project?.name || '' });
      }
    });

    const byProject = Array.from(byProjectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.name,
        overdueCount: data.count,
      }))
      .sort((a, b) => b.overdueCount - a.overdueCount);

    // Самые старые просрочки
    const oldestOverdue = overdueTasks.slice(0, 10).map(task => {
      const daysOverdue = task.dueDate
        ? Math.floor((new Date().getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: task.assigneeId || '',
        assigneeName: task.assignee?.fullName || 'Не назначен',
        dueDate: task.dueDate!,
        daysOverdue,
      };
    });

    return {
      totalOverdue: overdueTasks.length,
      byEmployee,
      byProject,
      oldestOverdue,
    };
  }

  // Отчёт по нагрузке сотрудников
  async getEmployeeWorkloadReport(filters: TaskReportFilters): Promise<EmployeeWorkloadReport[]> {
    const { organizationId, departmentId } = filters;

    let employees = [];
    if (departmentId) {
      employees = await prisma.employee.findMany({
        where: { departmentId, organizationId, status: 'active' },
        select: { id: true, fullName: true, departmentId: true },
      });
    } else {
      employees = await prisma.employee.findMany({
        where: { organizationId, status: 'active' },
        select: { id: true, fullName: true, departmentId: true },
      });
    }

    const reports: EmployeeWorkloadReport[] = [];

    for (const employee of employees) {
      const tasks = await prisma.task.findMany({
        where: { assigneeId: employee.id },
      });

      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const activeTasks = tasks.filter(t => t.status !== 'done').length;
      const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;

      const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      // Получить время
      const timeEntries = await prisma.task.findMany({
        where: { assigneeId: employee.id },
        select: { timeSpent: true },
      });
      const totalMinutes = timeEntries.reduce((sum, t) => sum + t.timeSpent, 0);

      // Эффективность = выполненные / (активные + выполненные)
      const efficiency = activeTasks + completedTasks > 0
        ? Math.round((completedTasks / (activeTasks + completedTasks)) * 100)
        : 0;

      reports.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        departmentName: employee.department?.name || 'Не назначен',
        totalTasks: tasks.length,
        activeTasks,
        completedTasks,
        overdueTasks,
        totalStoryPoints,
        totalHoursLogged: Math.round((totalMinutes / 60) * 100) / 100,
        efficiency,
      });
    }

    return reports.sort((a, b) => b.completedTasks - a.completedTasks);
  }

  // Отчёт по эффективности подразделений
  async getDepartmentEfficiencyReport(filters: TaskReportFilters): Promise<DepartmentEfficiencyReport[]> {
    const { organizationId } = filters;

    const departments = await prisma.department.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });

    const reports: DepartmentEfficiencyReport[] = [];

    for (const dept of departments) {
      const employees = await prisma.employee.findMany({
        where: { departmentId: dept.id, organizationId, status: 'active' },
        select: { id: true, fullName: true },
      });

      const employeeIds = employees.map(e => e.id);

      const tasks = await prisma.task.findMany({
        where: { assigneeId: { in: employeeIds } },
      });

      const completedTasks = tasks.filter(t => t.status === 'done').length;

      // Среднее время выполнения
      let avgCompletionTime = 0;
      let avgTaskDuration = 0;
      const completionTimes: number[] = [];
      const taskDurations: number[] = [];

      tasks.forEach(task => {
        if (task.dueDate && task.createdAt) {
          const duration = (task.dueDate.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60); // часы
          taskDurations.push(duration);
        }
        if (task.status === 'done' && task.dueDate && task.createdAt) {
          const completion = (task.dueDate.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
          completionTimes.push(completion);
        }
      });

      avgCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

      avgTaskDuration = taskDurations.length > 0
        ? taskDurations.reduce((a, b) => a + b, 0) / taskDurations.length
        : 0;

      const efficiency = tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

      // Топ исполнителей в отделе
      const performersMap = new Map<string, number>();
      tasks.filter(t => t.status === 'done').forEach(t => {
        if (t.assigneeId) {
          performersMap.set(t.assigneeId, (performersMap.get(t.assigneeId) || 0) + 1);
        }
      });

      const topPerformers = Array.from(performersMap.entries())
        .map(([employeeId, count]) => ({
          employeeId,
          employeeName: employees.find(e => e.id === employeeId)?.fullName || 'Unknown',
          completedTasks: count,
        }))
        .sort((a, b) => b.completedTasks - a.completedTasks)
        .slice(0, 5);

      reports.push({
        departmentId: dept.id,
        departmentName: dept.name,
        totalEmployees: employees.length,
        totalTasks: tasks.length,
        completedTasks,
        avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
        avgTaskDuration: Math.round(avgTaskDuration * 100) / 100,
        efficiency,
        topPerformers,
      });
    }

    return reports.sort((a, b) => b.efficiency - a.efficiency);
  }

  // Общий дашборд отчётов
  async getDashboardReport(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalTasks = await prisma.task.count({
      where: { organizationId },
    });

    const completedTasks = await prisma.task.count({
      where: { organizationId, status: 'done' },
    });

    const overdueTasks = await prisma.task.count({
      where: {
        organizationId,
        status: { not: 'done' },
        dueDate: { lt: now },
      },
    });

    const tasksThisMonth = await prisma.task.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
      },
    });

    const completedThisMonth = await prisma.task.count({
      where: {
        organizationId,
        status: 'done',
        updatedAt: { gte: startOfMonth },
      },
    });

    const totalProjects = await prisma.project.count({
      where: { organizationId, isDeleted: false },
    });

    const activeProjects = await prisma.project.count({
      where: { organizationId, status: 'active' },
    });

    const totalEmployees = await prisma.employee.count({
      where: { organizationId, status: 'active' },
    });

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksThisMonth,
      completedThisMonth,
      monthCompletionRate: tasksThisMonth > 0 ? Math.round((completedThisMonth / tasksThisMonth) * 100) : 0,
      totalProjects,
      activeProjects,
      totalEmployees,
    };
  }
}

export default new ReportsService();
