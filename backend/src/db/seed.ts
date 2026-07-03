import { PrismaClient, $Enums } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Фиксированные валидные UUID для воспроизводимого seed ───────────────────
const ID = {
  org: '00000000-0000-4000-8000-000000000001',
  // roles
  roleAdmin: '00000000-0000-4000-8000-000000000010',
  roleManager: '00000000-0000-4000-8000-000000000011',
  roleHr: '00000000-0000-4000-8000-000000000012',
  roleController: '00000000-0000-4000-8000-000000000013',
  roleEmployee: '00000000-0000-4000-8000-000000000014',
  // departments
  deptCentral: '00000000-0000-4000-8000-000000000020',
  deptIt: '00000000-0000-4000-8000-000000000021',
  deptHr: '00000000-0000-4000-8000-000000000022',
  sectorDev: '00000000-0000-4000-8000-000000000023',
  // employees
  admin: '00000000-0000-4000-8000-000000000030',
  itManager: '00000000-0000-4000-8000-000000000031',
  hrManager: '00000000-0000-4000-8000-000000000032',
  developer: '00000000-0000-4000-8000-000000000033',
  // tasks
  task1: '00000000-0000-4000-8000-000000000040',
  task2: '00000000-0000-4000-8000-000000000041',
  task3: '00000000-0000-4000-8000-000000000042',
  task4: '00000000-0000-4000-8000-000000000043',
  task5: '00000000-0000-4000-8000-000000000044',
  // projects
  proj1: '00000000-0000-4000-8000-000000000050',
  proj2: '00000000-0000-4000-8000-000000000051',
  proj3: '00000000-0000-4000-8000-000000000052',
  // attendance
  att1: '00000000-0000-4000-8000-000000000060',
  att2: '00000000-0000-4000-8000-000000000061',
  // vacations
  vac1: '00000000-0000-4000-8000-000000000070',
  vac2: '00000000-0000-4000-8000-000000000071',
  // tickets
  ticket1: '00000000-0000-4000-8000-000000000080',
  ticket2: '00000000-0000-4000-8000-000000000081',
  ticket3: '00000000-0000-4000-8000-000000000082',
  ticket4: '00000000-0000-4000-8000-000000000083',
  ticket5: '00000000-0000-4000-8000-000000000084',
  ticketCmt1: '00000000-0000-4000-8000-000000000090',
  ticketCmt2: '00000000-0000-4000-8000-000000000091',
};

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Организация
  const organization = await prisma.organization.upsert({
    where: { id: ID.org },
    update: {},
    create: {
      id: ID.org,
      name: 'Тестовая Организация',
      settings: JSON.stringify({ timezone: 'Europe/Moscow', currency: 'RUB', language: 'ru' }),
    },
  });
  console.log(`✅ Created organization: ${organization.name}`);

  // 2. Роли
  const roles = [
    { id: ID.roleAdmin, name: 'admin', permissions: JSON.stringify(['*']) },
    { id: ID.roleManager, name: 'manager', permissions: JSON.stringify(['employees:read', 'employees:write', 'tasks:read', 'tasks:write', 'reports:read']) },
    { id: ID.roleHr, name: 'hr', permissions: JSON.stringify(['employees:read', 'employees:write', 'timesheet:read', 'vacations:read', 'trips:read']) },
    { id: ID.roleController, name: 'controller', permissions: JSON.stringify(['tasks:read', 'tasks:control', 'reports:read']) },
    { id: ID.roleEmployee, name: 'employee', permissions: JSON.stringify(['profile:read', 'tasks:read', 'tasks:write', 'chat:read', 'chat:write']) },
  ];
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { id: roleData.id },
      update: {},
      create: { id: roleData.id, organizationId: organization.id, name: roleData.name, permissions: roleData.permissions },
    });
  }
  console.log(`✅ Created ${roles.length} roles`);

  // 3. Отделы
  const centralOffice = await prisma.department.upsert({
    where: { id: ID.deptCentral },
    update: {},
    create: { id: ID.deptCentral, organizationId: organization.id, name: 'Центральный аппарат', level: 0 },
  });
  const itDepartment = await prisma.department.upsert({
    where: { id: ID.deptIt },
    update: {},
    create: { id: ID.deptIt, organizationId: organization.id, name: 'IT Управление', parentId: centralOffice.id, level: 1 },
  });
  const hrDepartment = await prisma.department.upsert({
    where: { id: ID.deptHr },
    update: {},
    create: { id: ID.deptHr, organizationId: organization.id, name: 'Отдел кадров', parentId: centralOffice.id, level: 1 },
  });
  const developmentSector = await prisma.department.upsert({
    where: { id: ID.sectorDev },
    update: {},
    create: { id: ID.sectorDev, organizationId: organization.id, name: 'Сектор разработки', parentId: itDepartment.id, level: 2 },
  });
  console.log(`✅ Created ${centralOffice.name} structure`);

  // 4. Сотрудники
  const adminPassword = await bcrypt.hash('admin123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);
  const employeePassword = await bcrypt.hash('employee123', 12);

  const admin = await prisma.employee.upsert({
    where: { id: ID.admin },
    update: {},
    create: {
      id: ID.admin, organizationId: organization.id, fullName: 'Иванов Иван Иванович',
      email: 'admin@example.com', inn: '123456789012', phone: '+7 (999) 123-45-67',
      passwordHash: adminPassword, position: 'Генеральный директор', departmentId: centralOffice.id,
      status: 'active', hireDate: new Date('2020-01-01'),
    },
  });
  const itManager = await prisma.employee.upsert({
    where: { id: ID.itManager },
    update: {},
    create: {
      id: ID.itManager, organizationId: organization.id, fullName: 'Петров Петр Петрович',
      email: 'it.manager@example.com', phone: '+7 (999) 234-56-78', passwordHash: managerPassword,
      position: 'Руководитель IT', departmentId: itDepartment.id, managerId: admin.id,
      status: 'active', hireDate: new Date('2021-03-15'),
    },
  });
  const hrManager = await prisma.employee.upsert({
    where: { id: ID.hrManager },
    update: {},
    create: {
      id: ID.hrManager, organizationId: organization.id, fullName: 'Сидорова Анна Сергеевна',
      email: 'hr@example.com', phone: '+7 (999) 345-67-89', passwordHash: managerPassword,
      position: 'HR менеджер', departmentId: hrDepartment.id, managerId: admin.id,
      status: 'active', hireDate: new Date('2021-06-01'),
    },
  });
  const developer = await prisma.employee.upsert({
    where: { id: ID.developer },
    update: {},
    create: {
      id: ID.developer, organizationId: organization.id, fullName: 'Смирнов Алексей Дмитриевич',
      email: 'dev@example.com', phone: '+7 (999) 456-78-90', passwordHash: employeePassword,
      position: 'Разработчик', departmentId: developmentSector.id, managerId: itManager.id,
      status: 'active', hireDate: new Date('2022-01-10'),
    },
  });
  console.log(`✅ Created 4 employees`);

  // Назначить руководителей отделов
  await prisma.department.update({ where: { id: ID.deptIt }, data: { headId: itManager.id } });
  await prisma.department.update({ where: { id: ID.deptHr }, data: { headId: hrManager.id } });
  await prisma.department.update({ where: { id: ID.deptCentral }, data: { headId: admin.id } });

  // 5. Роли сотрудников
  const roleAssignments = [
    { employeeId: admin.id, roleId: ID.roleAdmin },
    { employeeId: itManager.id, roleId: ID.roleManager },
    { employeeId: hrManager.id, roleId: ID.roleHr },
    { employeeId: developer.id, roleId: ID.roleEmployee },
  ];
  for (const a of roleAssignments) {
    await prisma.employeeRole.upsert({
      where: { employeeId_roleId: { employeeId: a.employeeId, roleId: a.roleId } },
      update: {},
      create: a,
    });
  }
  console.log(`✅ Assigned ${roleAssignments.length} roles`);

  // 6. Задачи
  const tasks = [
    { id: ID.task1, title: 'Настроить CI/CD пайплайн', description: 'Реализовать автоматическую сборку и деплой через GitHub Actions', assigneeId: developer.id, controllerId: itManager.id, priority: 'high' as const, status: 'in_progress' as const, dueDate: new Date('2025-06-15') },
    { id: ID.task2, title: 'Подготовить отчёт по сотрудникам за май', description: 'Сформировать отчёт по посещаемости и KPI', assigneeId: hrManager.id, controllerId: admin.id, priority: 'normal' as const, status: 'new' as const, dueDate: new Date('2025-06-10') },
    { id: ID.task3, title: 'Исправить баг в модуле аутентификации', description: 'Пользователи не могут войти через Google OAuth', assigneeId: developer.id, controllerId: itManager.id, priority: 'critical' as const, status: 'new' as const, dueDate: new Date('2025-06-05') },
    { id: ID.task4, title: 'Провести собеседование с кандидатом', description: 'Senior Frontend Developer', assigneeId: hrManager.id, controllerId: admin.id, priority: 'normal' as const, status: 'done' as const, dueDate: new Date('2025-06-01') },
    { id: ID.task5, title: 'Обновить документацию API', description: 'Добавить описание новых эндпоинтов', assigneeId: developer.id, controllerId: itManager.id, priority: 'low' as const, status: 'approved' as const, dueDate: new Date('2025-06-20') },
  ];
  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: {
        ...t, creatorId: itManager.id, organizationId: organization.id,
        tags: JSON.stringify(['development', 'urgent']),
        checklist: JSON.stringify([
          { id: '1', text: 'Анализ проблемы', completed: true },
          { id: '2', text: 'Реализация решения', completed: false },
          { id: '3', text: 'Тестирование', completed: false },
        ]),
      },
    });
  }
  console.log(`✅ Created ${tasks.length} tasks`);

  // 7. Проекты
  const projects = [
    { id: ID.proj1, name: 'Разработка HR Platform', description: 'Создание корпоративной платформы', ownerId: itManager.id, status: 'active' as const, startDate: new Date('2025-01-01'), dueDate: new Date('2025-12-31'), budget: 500000 },
    { id: ID.proj2, name: 'Рекрутинг Q2 2025', description: 'Набор новых сотрудников', ownerId: hrManager.id, status: 'active' as const, startDate: new Date('2025-04-01'), dueDate: new Date('2025-06-30'), budget: 100000 },
    { id: ID.proj3, name: 'Миграция на PostgreSQL 15', description: 'Обновление БД', ownerId: itManager.id, status: 'completed' as const, startDate: new Date('2025-01-15'), dueDate: new Date('2025-03-31'), budget: 50000 },
  ];
  for (const p of projects) {
    const project = await prisma.project.upsert({ where: { id: p.id }, update: {}, create: { ...p, organizationId: organization.id } });
    if (p.id === ID.proj1) {
      await prisma.projectMember.upsert({ where: { projectId_employeeId: { projectId: project.id, employeeId: admin.id } }, update: {}, create: { projectId: project.id, employeeId: admin.id, role: 'manager' } });
      await prisma.projectMember.upsert({ where: { projectId_employeeId: { projectId: project.id, employeeId: developer.id } }, update: {}, create: { projectId: project.id, employeeId: developer.id, role: 'developer' } });
    }
    if (p.id === ID.proj2) {
      await prisma.projectMember.upsert({ where: { projectId_employeeId: { projectId: project.id, employeeId: hrManager.id } }, update: {}, create: { projectId: project.id, employeeId: hrManager.id, role: 'manager' } });
    }
  }
  console.log(`✅ Created ${projects.length} projects`);

  // 8. Посещаемость
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendances = [
    { id: ID.att1, employeeId: developer.id, checkIn: new Date(today.getTime() + 8 * 3600000), checkOut: new Date(today.getTime() + 17 * 3600000), source: $Enums.AttendanceSource.terminal, date: today },
    { id: ID.att2, employeeId: hrManager.id, checkIn: new Date(today.getTime() + 9 * 3600000), checkOut: null, source: $Enums.AttendanceSource.manual, date: today },
  ];
  for (const att of attendances) {
    await prisma.attendance.upsert({ where: { id: att.id }, update: {}, create: { ...att, organizationId: organization.id } });
  }
  console.log(`✅ Created ${attendances.length} attendance records`);

  // 9. Отпуска
  const vacations = [
    { id: ID.vac1, employeeId: developer.id, type: $Enums.VacationType.annual, startDate: new Date('2025-07-01'), endDate: new Date('2025-07-14'), status: $Enums.VacationStatus.planned },
    { id: ID.vac2, employeeId: hrManager.id, type: $Enums.VacationType.annual, startDate: new Date('2025-06-15'), endDate: new Date('2025-06-28'), status: $Enums.VacationStatus.approved },
  ];
  for (const vac of vacations) {
    await prisma.vacationRequest.upsert({ where: { id: vac.id }, update: {}, create: { ...vac, organizationId: organization.id } });
  }
  console.log(`✅ Created ${vacations.length} vacation requests`);

  // 10. Service Desk
  const tickets = [
    { id: ID.ticket1, title: 'Не работает почта Outlook', description: 'Ошибка соединения с сервером', type: $Enums.TicketType.it, priority: $Enums.TicketPriority.high, status: $Enums.TicketStatus.open, requesterId: developer.id, assigneeId: itManager.id, departmentId: ID.deptIt },
    { id: ID.ticket2, title: 'Сломался принтер в бухгалтерии', description: 'Замятие бумаги', type: $Enums.TicketType.hardware, priority: $Enums.TicketPriority.normal, status: $Enums.TicketStatus.in_progress, requesterId: hrManager.id, assigneeId: itManager.id, departmentId: ID.deptIt },
    { id: ID.ticket3, title: 'Нужен доступ к 1С', description: 'Доступ к базе 1С Бухгалтерия', type: $Enums.TicketType.it, priority: $Enums.TicketPriority.critical, status: $Enums.TicketStatus.resolved, requesterId: admin.id, assigneeId: itManager.id },
    { id: ID.ticket4, title: 'Протечка в серверной', description: 'С потолка капает вода', type: $Enums.TicketType.repair, priority: $Enums.TicketPriority.critical, status: $Enums.TicketStatus.open, requesterId: admin.id, departmentId: ID.deptIt },
    { id: ID.ticket5, title: 'Заменить лампочку в коридоре', description: 'Перегорела лампа на 3-м этаже', type: $Enums.TicketType.household, priority: $Enums.TicketPriority.low, status: $Enums.TicketStatus.closed, requesterId: developer.id, assigneeId: itManager.id },
  ];
  for (const t of tickets) {
    await prisma.ticket.upsert({ where: { id: t.id }, update: {}, create: { ...t, organizationId: organization.id } });
  }
  console.log(`✅ Created ${tickets.length} tickets`);

  await prisma.ticketComment.upsert({
    where: { id: ID.ticketCmt1 }, update: {},
    create: { id: ID.ticketCmt1, ticketId: ID.ticket2, authorId: itManager.id, body: 'Заказал картридж, ожидаю поставку' },
  });
  await prisma.ticketComment.upsert({
    where: { id: ID.ticketCmt2 }, update: {},
    create: { id: ID.ticketCmt2, ticketId: ID.ticket3, authorId: itManager.id, body: 'Доступ предоставлен', systemComment: true },
  });
  console.log('✅ Created 2 ticket comments');

  console.log('🌱 Seeding completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Manager: it.manager@example.com / manager123');
  console.log('  Employee: dev@example.com / employee123');
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
