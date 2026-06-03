/**
 * Seed script для заполнения БД тестовыми данными
 * Запуск: npx ts-node scripts/seed-db.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполнение базы тестовыми данными...\n');

  // 1. Создаём организации
  console.log('📦 Создание организаций...');
  const org1 = await prisma.organization.upsert({
    where: { id: 'org-001' },
    update: {},
    create: {
      id: 'org-001',
      name: 'ООО "Рога и Копыта"',
      settings: { timezone: 'Europe/Moscow', language: 'ru' }
    }
  });

  const org2 = await prisma.organization.upsert({
    where: { id: 'org-002' },
    update: {},
    create: {
      id: 'org-002',
      name: 'ЗАО "Вектор"',
      settings: { timezone: 'Europe/Moscow', language: 'ru' }
    }
  });
  console.log(`✅ Создано организаций: 2`);

  // 2. Создаём роли
  console.log('\n🔐 Создание ролей...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { id: 'role-admin' },
      update: {},
      create: { id: 'role-admin', name: 'admin', organizationId: org1.id, permissions: ['*'] }
    }),
    prisma.role.upsert({
      where: { id: 'role-manager' },
      update: {},
      create: { id: 'role-manager', name: 'manager', organizationId: org1.id, permissions: ['employee:read', 'employee:create', 'task:approve'] }
    }),
    prisma.role.upsert({
      where: { id: 'role-hr' },
      update: {},
      create: { id: 'role-hr', name: 'hr', organizationId: org1.id, permissions: ['employee:read', 'employee:create'] }
    }),
    prisma.role.upsert({
      where: { id: 'role-employee' },
      update: {},
      create: { id: 'role-employee', name: 'employee', organizationId: org1.id, permissions: ['task:read'] }
    })
  ]);
  console.log(`✅ Создано ролей: ${roles.length}`);

  // 3. Создаём сотрудников
  console.log('\n👥 Создание сотрудников...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.employee.upsert({
    where: { id: 'emp-admin' },
    update: {},
    create: {
      id: 'emp-admin',
      email: 'admin@example.com',
      fullName: 'Администратор Системы',
      position: 'CEO',
      phone: '+7 (999) 000-00-01',
      passwordHash,
      organizationId: org1.id,
      status: 'active',
      hireDate: new Date('2020-01-15')
    }
  });

  const manager = await prisma.employee.upsert({
    where: { id: 'emp-manager' },
    update: {},
    create: {
      id: 'emp-manager',
      email: 'manager@example.com',
      fullName: 'Менеджер Отдела',
      position: 'Руководитель отдела разработки',
      phone: '+7 (999) 000-00-02',
      passwordHash,
      organizationId: org1.id,
      status: 'active',
      hireDate: new Date('2021-03-20'),
      managerId: admin.id
    }
  });

  const hr = await prisma.employee.upsert({
    where: { id: 'emp-hr' },
    update: {},
    create: {
      id: 'emp-hr',
      email: 'hr@example.com',
      fullName: 'HR Менеджер',
      position: 'HR Specialist',
      phone: '+7 (999) 000-00-03',
      passwordHash,
      organizationId: org1.id,
      status: 'active',
      hireDate: new Date('2021-06-01'),
      managerId: admin.id
    }
  });

  const employee1 = await prisma.employee.upsert({
    where: { id: 'emp-dev1' },
    update: {},
    create: {
      id: 'emp-dev1',
      email: 'dev1@example.com',
      fullName: 'Разработчик Иванов',
      position: 'Senior Developer',
      phone: '+7 (999) 000-00-04',
      passwordHash,
      organizationId: org1.id,
      status: 'active',
      hireDate: new Date('2022-01-10'),
      managerId: manager.id
    }
  });

  const employee2 = await prisma.employee.upsert({
    where: { id: 'emp-dev2' },
    update: {},
    create: {
      id: 'emp-dev2',
      email: 'dev2@example.com',
      fullName: 'Разработчик Петров',
      position: 'Junior Developer',
      phone: '+7 (999) 000-00-05',
      passwordHash,
      organizationId: org1.id,
      status: 'active',
      hireDate: new Date('2023-05-15'),
      managerId: manager.id
    }
  });

  const employeeOrg2 = await prisma.employee.upsert({
    where: { id: 'emp-org2' },
    update: {},
    create: {
      id: 'emp-org2',
      email: 'user@vector.com',
      fullName: 'Сотрудник Вектор',
      position: 'Менеджер',
      phone: '+7 (999) 111-22-33',
      passwordHash,
      organizationId: org2.id,
      status: 'active',
      hireDate: new Date('2022-09-01')
    }
  });
  void employeeOrg2; // Использовано для исключения warning

  console.log(`✅ Создано сотрудников: 6`);

  // 4. Назначаем роли
  console.log('\n🎭 Назначение ролей...');
  await prisma.employeeRole.createMany({
    data: [
      { employeeId: admin.id, roleId: roles[0].id },
      { employeeId: manager.id, roleId: roles[1].id },
      { employeeId: hr.id, roleId: roles[2].id },
      { employeeId: employee1.id, roleId: roles[3].id },
      { employeeId: employee2.id, roleId: roles[3].id }
    ],
    skipDuplicates: true
  });
  console.log(`✅ Назначено ролей: 5`);

  // 5. Создаём отделы
  console.log('\n🏢 Создание отделов...');
  const itDept = await prisma.department.upsert({
    where: { id: 'dept-it' },
    update: {},
    create: {
      id: 'dept-it',
      name: 'IT Департамент',
      organizationId: org1.id,
      headId: manager.id
    }
  });

  const devDept = await prisma.department.upsert({
    where: { id: 'dept-dev' },
    update: {},
    create: {
      id: 'dept-dev',
      name: 'Отдел разработки',
      organizationId: org1.id,
      parentId: itDept.id,
      headId: manager.id
    }
  });

  const hrDept = await prisma.department.upsert({
    where: { id: 'dept-hr' },
    update: {},
    create: {
      id: 'dept-hr',
      name: 'HR Отдел',
      organizationId: org1.id,
      headId: hr.id
    }
  });

  console.log(`✅ Создано отделов: 3`);

  // Обновляем сотрудников с departmentId
  await Promise.all([
    prisma.employee.update({ where: { id: manager.id }, data: { departmentId: devDept.id } }),
    prisma.employee.update({ where: { id: employee1.id }, data: { departmentId: devDept.id } }),
    prisma.employee.update({ where: { id: employee2.id }, data: { departmentId: devDept.id } }),
    prisma.employee.update({ where: { id: hr.id }, data: { departmentId: hrDept.id } })
  ]);

  // 6. Создаём проекты
  console.log('\n📋 Создание проектов...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Корпоративный портал',
      description: 'Разработка корпоративного портала для компании',
      organizationId: org1.id,
      ownerId: admin.id,
      status: 'active',
      startDate: new Date('2024-01-01')
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Мобильное приложение',
      description: 'Разработка мобильного приложения для сотрудников',
      organizationId: org1.id,
      ownerId: manager.id,
      status: 'active',
      startDate: new Date('2024-03-01')
    }
  });
  console.log(`✅ Создано проектов: 2`);

  // 7. Создаём задачи
  console.log('\n✅ Создание задач...');
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Разработать архитектуру БД',
        description: 'Спроектировать схему базы данных для всех модулей',
        organizationId: org1.id,
        projectId: project1.id,
        assigneeId: employee1.id,
        controllerId: manager.id,
        creatorId: admin.id,
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date('2024-06-15')
      }
    }),
    prisma.task.create({
      data: {
        title: 'Настроить API для Auth',
        description: 'Реализовать регистрацию, логин, JWT',
        organizationId: org1.id,
        projectId: project1.id,
        assigneeId: employee2.id,
        controllerId: manager.id,
        creatorId: employee1.id,
        priority: 'high',
        status: 'done',
        dueDate: new Date('2024-05-01')
      }
    }),
    prisma.task.create({
      data: {
        title: 'Сделать макеты UI',
        description: 'Нарисовать макеты основных экранов',
        organizationId: org1.id,
        projectId: project2.id,
        assigneeId: employee1.id,
        controllerId: manager.id,
        creatorId: admin.id,
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2024-07-01')
      }
    }),
    prisma.task.create({
      data: {
        title: 'Интеграция с WebSocket',
        description: 'Настроить real-time уведомления',
        organizationId: org1.id,
        projectId: project1.id,
        assigneeId: employee2.id,
        controllerId: employee1.id,
        creatorId: manager.id,
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2024-06-30')
      }
    })
  ]);
  console.log(`✅ Создано задач: ${tasks.length}`);

  // 8. Создаём workflow маршруты
  console.log('\n🔄 Создание workflow маршрутов...');
  await prisma.workflowRoute.create({
    data: {
      name: 'Согласование отпуска',
      entityType: 'vacation',
      organizationId: org1.id,
      steps: [
        { order: 1, type: 'employee', employeeId: employee1.id },
        { order: 2, type: 'position', position: 'Руководитель отдела разработки' },
        { order: 3, type: 'employee', employeeId: hr.id }
      ]
    }
  });
  console.log(`✅ Создано workflow маршрутов: 1`);

  // Итог
  console.log('\n' + '═'.repeat(50));
  console.log('✅ БАЗА ДАННЫХ ЗАПОЛНЕНА УСПЕШНО!');
  console.log('═'.repeat(50));
  console.log('\n📊 Итого:');
  console.log(`  • Организаций: 2`);
  console.log(`  • Сотрудников: 6`);
  console.log(`  • Ролей: 4`);
  console.log(`  • Отделов: 3`);
  console.log(`  • Проектов: 2`);
  console.log(`  • Задач: 4`);
  console.log(`  • Workflow: 1`);
  console.log('\n🔐 Тестовые учётные данные:');
  console.log(`  Email: admin@example.com`);
  console.log(`  Password: password123`);
  console.log('\n🚀 Готово к работе!\n');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
