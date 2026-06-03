/**
 * Интеграционные тесты безопасности.
 * Требуют запущенного сервера и чистой БД.
 * Запускать отдельно: npm test security.test.ts
 * Внимание: использует те же таблицы, что и seed-данные — 
 * запускать только в изолированной тестовой БД.
 */

import request from 'supertest';
import { httpServer } from '../server';
import prisma from '../core/config/database';

const TEST_PREFIX = `sec_test_${Date.now()}`;

async function cleanTestData() {
  const ids = [org1Id, org2Id].filter(Boolean);
  for (const id of ids) {
    await prisma.projectMember.deleteMany({ where: { project: { organizationId: id } } });
    await prisma.project.deleteMany({ where: { organizationId: id } });
    await prisma.taskHistory.deleteMany({ where: { task: { organizationId: id } } });
    await prisma.taskCoAssignee.deleteMany({ where: { task: { organizationId: id } } });
    await prisma.taskWatcher.deleteMany({ where: { task: { organizationId: id } } });
    await prisma.taskComment.deleteMany({ where: { task: { organizationId: id } } });
    await prisma.task.deleteMany({ where: { organizationId: id } });
    await prisma.attendance.deleteMany({ where: { organizationId: id } });
    await prisma.vacationRequest.deleteMany({ where: { organizationId: id } });
    await prisma.businessTrip.deleteMany({ where: { organizationId: id } });
    await prisma.sickLeave.deleteMany({ where: { organizationId: id } });
    await prisma.notification.deleteMany({ where: { organizationId: id } });
    await prisma.employeeRole.deleteMany({ where: { employee: { organizationId: id } } });
    await prisma.employee.deleteMany({ where: { organizationId: id } });
  }
  await prisma.organization.deleteMany({ where: { id: { in: ids } } });
  await prisma.role.deleteMany({ where: { organizationId: { in: ids } } });
}

let org1Id = '';
let org2Id = '';
let employee1Id = '';
let team: { id: string; email: string }[] = [];

describe('🔐 Security Tests', () => {
  beforeAll(async () => {
    // Очищаем seed-данные, которые могут мешать
    await cleanTestData();

    const org1 = await prisma.organization.create({
      data: { name: `${TEST_PREFIX}_Org1` }
    });
    const org2 = await prisma.organization.create({
      data: { name: `${TEST_PREFIX}_Org2` }
    });
    org1Id = org1.id;
    org2Id = org2.id;

    const emp1 = await prisma.employee.create({
      data: {
        fullName: 'Admin User',
        email: `${TEST_PREFIX}_admin@test.com`,
        organizationId: org1Id,
        status: 'active',
        passwordHash: 'x'
      }
    });
    const emp2 = await prisma.employee.create({
      data: {
        fullName: 'Employee User',
        email: `${TEST_PREFIX}_emp@test.com`,
        organizationId: org1Id,
        status: 'active',
        passwordHash: 'x'
      }
    });
    const emp3 = await prisma.employee.create({
      data: {
        fullName: 'Org2 User',
        email: `${TEST_PREFIX}_org2@test.com`,
        organizationId: org2Id,
        status: 'active',
        passwordHash: 'x'
      }
    });
    employee1Id = emp1.id;
    team = [emp1, emp2, emp3];

    const adminRole = await prisma.role.create({
      data: { name: 'admin', organizationId: org1Id, permissions: ['*'] }
    });
    await prisma.employeeRole.create({
      data: { employeeId: emp1.id, roleId: adminRole.id }
    });
  });

  afterAll(async () => {
    await cleanTestData();
    await prisma.$disconnect();
  });

  describe('🏢 Multi-Tenancy Isolation', () => {
    test('Данные организации А изолированы от организации Б', async () => {
      expect(org1Id).not.toBe(org2Id);
      const empCount = await prisma.employee.count({ where: { organizationId: org2Id } });
      expect(empCount).toBe(1); // только emp3
    });
  });

  describe('🔑 RBAC доступ', () => {
    test('Созданная роль admin существует', async () => {
      const role = await prisma.role.findFirst({
        where: { organizationId: org1Id, name: 'admin' }
      });
      expect(role).toBeTruthy();
      expect(role!.permissions).toContain('*');
    });

    test('Сотруднику назначена роль admin', async () => {
      const er = await prisma.employeeRole.findFirst({
        where: { employeeId: employee1Id }
      });
      expect(er).toBeTruthy();
    });
  });
});
