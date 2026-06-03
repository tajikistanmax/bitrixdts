import { prisma } from '../../core/config/database';

interface CreateKPIMetricData {
  organizationId: string;
  name: string;
  target: number;
  weight: number;
  period: string;
  employeeId?: string;
  departmentId?: string;
}

interface AddKPIValueData {
  metricId: string;
  periodDate: Date | string;
  actual: number;
}

class KPIService {
  // Создать метрику KPI
  async createMetric(data: CreateKPIMetricData) {
    const { organizationId, name, target, weight, period, employeeId, departmentId } = data;

    const metric = await prisma.kPIMetric.create({
      data: {
        organizationId,
        name,
        target,
        weight,
        period,
        employeeId,
        departmentId
      }
    });

    return metric;
  }

  // Получить метрики организации
  async getMetrics(organizationId: string, employeeId?: string, departmentId?: string) {
    const where: any = { organizationId };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    return prisma.kPIMetric.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        values: {
          orderBy: { periodDate: 'desc' },
          take: 10
        }
      }
    });
  }

  // Получить метрику по ID
  async getMetric(metricId: string) {
    return prisma.kPIMetric.findUnique({
      where: { id: metricId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        values: {
          orderBy: { periodDate: 'desc' }
        }
      }
    });
  }

  // Обновить метрику
  async updateMetric(metricId: string, updateData: any) {
    return prisma.kPIMetric.update({
      where: { id: metricId },
      data: updateData
    });
  }

  // Удалить метрику
  async deleteMetric(metricId: string) {
    return prisma.kPIMetric.delete({
      where: { id: metricId }
    });
  }

  // Добавить значение KPI
  async addValue(data: AddKPIValueData) {
    const { metricId, periodDate, actual } = data;

    const value = await prisma.kPIValue.create({
      data: {
        metricId,
        periodDate: new Date(periodDate),
        actual
      }
    });

    return value;
  }

  // Получить значения метрики
  async getMetricValues(metricId: string, startDate?: Date, endDate?: Date) {
    const where: any = { metricId };

    if (startDate && endDate) {
      where.periodDate = {
        gte: startDate,
        lte: endDate
      };
    }

    return prisma.kPIValue.findMany({
      where,
      orderBy: { periodDate: 'asc' }
    });
  }

  // Рассчитать KPI для сотрудника
  async calculateEmployeeKPI(employeeId: string, periodStart: Date, periodEnd: Date) {
    const metrics = await prisma.kPIMetric.findMany({
      where: {
        employeeId,
        period: 'monthly'
      },
      include: {
        values: {
          where: {
            periodDate: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }
      }
    });

    const result = metrics.map((metric) => {
      const totalWeight = Number(metric.weight);
      const values = metric.values;

      let totalScore = 0;
      values.forEach((value) => {
        const achievement = Number(value.actual) / Number(metric.target);
        totalScore += achievement * totalWeight;
      });

      return {
        metricId: metric.id,
        metricName: metric.name,
        target: metric.target,
        actual: values.reduce((sum, v) => sum + Number(v.actual), 0),
        achievement: totalScore,
        weight: metric.weight
      };
    });

    const totalAchievement = result.reduce((sum, m) => sum + m.achievement, 0);

    return {
      employeeId,
      periodStart,
      periodEnd,
      metrics: result,
      totalAchievement,
      performance: totalAchievement >= 100 ? 'excellent' : totalAchievement >= 80 ? 'good' : totalAchievement >= 60 ? 'satisfactory' : 'needs_improvement'
    };
  }

  // Рассчитать KPI для отдела
  async calculateDepartmentKPI(departmentId: string, periodStart: Date, periodEnd: Date) {
    const employees = await prisma.employee.findMany({
      where: { departmentId },
      select: { id: true }
    });

    const employeeIds = employees.map((e) => e.id);
    const employeeResults = await Promise.all(
      employeeIds.map((empId) => this.calculateEmployeeKPI(empId, periodStart, periodEnd))
    );

    const averageAchievement =
      employeeResults.reduce((sum, r) => sum + r.totalAchievement, 0) /
      employeeResults.length;

    return {
      departmentId,
      periodStart,
      periodEnd,
      employeeCount: employeeResults.length,
      employees: employeeResults,
      averageAchievement,
      performance: averageAchievement >= 100 ? 'excellent' : averageAchievement >= 80 ? 'good' : averageAchievement >= 60 ? 'satisfactory' : 'needs_improvement'
    };
  }
}

export default new KPIService();
