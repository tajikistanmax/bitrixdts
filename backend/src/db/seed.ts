import { PrismaClient, $Enums } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Создать тестовую организацию
  const organization = await prisma.organization.upsert({
    where: { id: 'org-00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'org-00000000-0000-0000-0000-000000000001',
      name: 'Тестовая Организация',
      settings: JSON.stringify({
        timezone: 'Europe/Moscow',
        currency: 'RUB',
        language: 'ru',
      }),
    },
  });
  console.log(`✅ Created organization: ${organization.name}`);

  // 2. Создать роли
  const roles = [
    { name: 'admin', permissions: JSON.stringify(['*']) },
    { name: 'manager', permissions: JSON.stringify(['employees:read', 'employees:write', 'tasks:read', 'tasks:write', 'reports:read']) },
    { name: 'hr', permissions: JSON.stringify(['employees:read', 'employees:write', 'timesheet:read', 'vacations:read', 'trips:read']) },
    { name: 'controller', permissions: JSON.stringify(['tasks:read', 'tasks:control', 'reports:read']) },
    { name: 'employee', permissions: JSON.stringify(['profile:read', 'tasks:read', 'tasks:write', 'chat:read', 'chat:write']) },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { id: `role-${roleData.name}` },
      update: {},
      create: {
        id: `role-${roleData.name}`,
        organizationId: organization.id,
        name: roleData.name,
        permissions: roleData.permissions,
      },
    });
  }
  console.log(`✅ Created ${roles.length} roles`);

  // 3. Создать отделы (оргструктура)
  const centralOffice = await prisma.department.upsert({
    where: { id: 'dept-central' },
    update: {},
    create: {
      id: 'dept-central',
      organizationId: organization.id,
      name: 'Центральный аппарат',
      level: 0,
    },
  });

  const itDepartment = await prisma.department.upsert({
    where: { id: 'dept-it' },
    update: {},
    create: {
      id: 'dept-it',
      organizationId: organization.id,
      name: 'IT Управление',
      parentId: centralOffice.id,
      level: 1,
    },
  });

  const hrDepartment = await prisma.department.upsert({
    where: { id: 'dept-hr' },
    update: {},
    create: {
      id: 'dept-hr',
      organizationId: organization.id,
      name: 'Отдел кадров',
      parentId: centralOffice.id,
      level: 1,
    },
  });

  const developmentSector = await prisma.department.upsert({
    where: { id: 'sector-dev' },
    update: {},
    create: {
      id: 'sector-dev',
      organizationId: organization.id,
      name: 'Сектор разработки',
      parentId: itDepartment.id,
      level: 2,
    },
  });

  console.log(`✅ Created ${centralOffice.name} structure`);

  // 4. Создать тестовых сотрудников
  const adminPassword = await bcrypt.hash('admin123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);
  const employeePassword = await bcrypt.hash('employee123', 12);

  // Администратор
  const admin = await prisma.employee.upsert({
    where: { id: 'emp-admin' },
    update: {},
    create: {
      id: 'emp-admin',
      organizationId: organization.id,
      fullName: 'Иванов Иван Иванович',
      email: 'admin@example.com',
      inn: '123456789012',
      phone: '+7 (999) 123-45-67',
      passwordHash: adminPassword,
      position: 'Генеральный директор',
      departmentId: centralOffice.id,
      status: 'active',
      hireDate: new Date('2020-01-01'),
    },
  });

  // Руководитель IT
  const itManager = await prisma.employee.upsert({
    where: { id: 'emp-it-manager' },
    update: {},
    create: {
      id: 'emp-it-manager',
      organizationId: organization.id,
      fullName: 'Петров Петр Петрович',
      email: 'it.manager@example.com',
      phone: '+7 (999) 234-56-78',
      passwordHash: managerPassword,
      position: 'Руководитель IT',
      departmentId: itDepartment.id,
      managerId: admin.id,
      status: 'active',
      hireDate: new Date('2021-03-15'),
    },
  });

  // HR менеджер
  const hrManager = await prisma.employee.upsert({
    where: { id: 'emp-hr-manager' },
    update: {},
    create: {
      id: 'emp-hr-manager',
      organizationId: organization.id,
      fullName: 'Сидорова Анна Сергеевна',
      email: 'hr@example.com',
      phone: '+7 (999) 345-67-89',
      passwordHash: managerPassword,
      position: 'HR менеджер',
      departmentId: hrDepartment.id,
      managerId: admin.id,
      status: 'active',
      hireDate: new Date('2021-06-01'),
    },
  });

  // Разработчик
  const developer = await prisma.employee.upsert({
    where: { id: 'emp-dev' },
    update: {},
    create: {
      id: 'emp-dev',
      organizationId: organization.id,
      fullName: 'Смирнов Алексей Дмитриевич',
      email: 'dev@example.com',
      phone: '+7 (999) 456-78-90',
      passwordHash: employeePassword,
      position: 'Разработчик',
      departmentId: developmentSector.id,
      managerId: itManager.id,
      status: 'active',
      hireDate: new Date('2022-01-10'),
    },
  });

  console.log(`✅ Created ${4} employees`);

  // 5. Назначить роли
  const roleAssignments = [
    { employeeId: admin.id, roleId: 'role-admin' },
    { employeeId: itManager.id, roleId: 'role-manager' },
    { employeeId: hrManager.id, roleId: 'role-hr' },
    { employeeId: developer.id, roleId: 'role-employee' },
  ];

  for (const assignment of roleAssignments) {
    await prisma.employeeRole.upsert({
      where: {
        employeeId_roleId: {
          employeeId: assignment.employeeId,
          roleId: assignment.roleId,
        },
      },
      update: {},
      create: assignment,
    });
  }

  console.log(`✅ Assigned ${roleAssignments.length} roles`);

  // 6. Создать тестовые задачи
  const tasks = [
    {
      id: 'task-001',
      title: 'Настроить CI/CD пайплайн',
      description: 'Реализовать автоматическую сборку и деплой приложения через GitHub Actions',
      assigneeId: developer.id,
      controllerId: itManager.id,
      priority: 'high' as const,
      status: 'in_progress' as const,
      dueDate: new Date('2025-06-15'),
    },
    {
      id: 'task-002',
      title: 'Подготовить отчёт по сотрудникам за май',
      description: 'Сформировать отчёт по посещаемости и KPI за май 2025',
      assigneeId: hrManager.id,
      controllerId: admin.id,
      priority: 'normal' as const,
      status: 'new' as const,
      dueDate: new Date('2025-06-10'),
    },
    {
      id: 'task-003',
      title: 'Исправить баг в модуле аутентификации',
      description: 'Пользователи не могут войти через Google OAuth',
      assigneeId: developer.id,
      controllerId: itManager.id,
      priority: 'critical' as const,
      status: 'new' as const,
      dueDate: new Date('2025-06-05'),
    },
    {
      id: 'task-004',
      title: 'Провести собеседование с кандидатом',
      description: 'Senior Frontend Developer - Алексей С.',
      assigneeId: hrManager.id,
      controllerId: admin.id,
      priority: 'normal' as const,
      status: 'done' as const,
      dueDate: new Date('2025-06-01'),
    },
    {
      id: 'task-005',
      title: 'Обновить документацию API',
      description: 'Добавить описание новых эндпоинтов сотрудников',
      assigneeId: developer.id,
      controllerId: itManager.id,
      priority: 'low' as const,
      status: 'approved' as const,
      dueDate: new Date('2025-06-20'),
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.upsert({
      where: { id: taskData.id },
      update: {},
      create: {
        ...taskData,
        creatorId: itManager.id,
        organizationId: organization.id,
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

  // 7. Создать тестовые проекты
  const projects = [
    {
      id: 'proj-001',
      name: 'Разработка HR Platform',
      description: 'Создание корпоративной платформы управления персоналом',
      ownerId: itManager.id,
      status: 'active' as const,
      startDate: new Date('2025-01-01'),
      dueDate: new Date('2025-12-31'),
      budget: 500000,
    },
    {
      id: 'proj-002',
      name: 'Рекрутинг Q2 2025',
      description: 'Набор новых сотрудников в отделы разработки и поддержки',
      ownerId: hrManager.id,
      status: 'active' as const,
      startDate: new Date('2025-04-01'),
      dueDate: new Date('2025-06-30'),
      budget: 100000,
    },
    {
      id: 'proj-003',
      name: 'Миграция на PostgreSQL 15',
      description: 'Обновление версии базы данных и оптимизация запросов',
      ownerId: itManager.id,
      status: 'completed' as const,
      startDate: new Date('2025-01-15'),
      dueDate: new Date('2025-03-31'),
      budget: 50000,
    },
  ];

  for (const projectData of projects) {
    const project = await prisma.project.upsert({
      where: { id: projectData.id },
      update: {},
      create: {
        ...projectData,
        organizationId: organization.id,
      },
    });

    // Добавить участников
    if (projectData.id === 'proj-001') {
      await prisma.projectMember.upsert({
        where: { projectId_employeeId: { projectId: project.id, employeeId: admin.id } },
        update: {},
        create: { projectId: project.id, employeeId: admin.id, role: 'manager' },
      });
      await prisma.projectMember.upsert({
        where: { projectId_employeeId: { projectId: project.id, employeeId: developer.id } },
        update: {},
        create: { projectId: project.id, employeeId: developer.id, role: 'developer' },
      });
    }

    if (projectData.id === 'proj-002') {
      await prisma.projectMember.upsert({
        where: { projectId_employeeId: { projectId: project.id, employeeId: hrManager.id } },
        update: {},
        create: { projectId: project.id, employeeId: hrManager.id, role: 'manager' },
      });
    }
  }

  console.log(`✅ Created ${projects.length} projects`);

  // 8. Создать тестовые записи посещаемости
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendances = [
    {
      id: 'att-001',
      employeeId: developer.id,
      checkIn: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00
      checkOut: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
      source: $Enums.AttendanceSource.terminal,
      date: today,
    },
    {
      id: 'att-002',
      employeeId: hrManager.id,
      checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00
      checkOut: null,
      source: $Enums.AttendanceSource.manual,
      date: today,
    },
  ];

  for (const att of attendances) {
    await prisma.attendance.upsert({
      where: { id: att.id },
      update: {},
      create: {
        ...att,
        organizationId: organization.id,
      },
    });
  }

  console.log(`✅ Created ${attendances.length} attendance records`);

  // 9. Создать тестовые заявки на отпуск
  const vacations = [
    {
      id: 'vac-001',
      employeeId: developer.id,
      type: $Enums.VacationType.annual,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-14'),
      status: $Enums.VacationStatus.planned,
    },
    {
      id: 'vac-002',
      employeeId: hrManager.id,
      type: $Enums.VacationType.annual,
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-06-28'),
      status: $Enums.VacationStatus.approved,
    },
  ];

  for (const vac of vacations) {
    await prisma.vacationRequest.upsert({
      where: { id: vac.id },
      update: {},
      create: {
        ...vac,
        organizationId: organization.id,
      },
    });
  }

  console.log(`✅ Created ${vacations.length} vacation requests`);

  // 17. Создать тестовые заявки в Service Desk
  const tickets = [
    {
      id: 'ticket-001',
      title: 'Не работает почта Outlook',
      description: 'При попытке отправить письмо выходит ошибка соединения с сервером',
      type: $Enums.TicketType.it,
      priority: $Enums.TicketPriority.high,
      status: $Enums.TicketStatus.open,
      requesterId: developer.id,
      assigneeId: itManager.id,
      departmentId: 'dept-it',
    },
    {
      id: 'ticket-002',
      title: 'Сломался принтер в бухгалтерии',
      description: 'Принтер HP LaserJet не печатает, замятие бумаги',
      type: $Enums.TicketType.hardware,
      priority: $Enums.TicketPriority.normal,
      status: $Enums.TicketStatus.in_progress,
      requesterId: hrManager.id,
      assigneeId: itManager.id,
      departmentId: 'dept-it',
    },
    {
      id: 'ticket-003',
      title: 'Нужен доступ к 1С',
      description: 'Новому сотруднику требуется доступ к базе 1С Бухгалтерия',
      type: $Enums.TicketType.it,
      priority: $Enums.TicketPriority.critical,
      status: $Enums.TicketStatus.resolved,
      requesterId: admin.id,
      assigneeId: itManager.id,
    },
    {
      id: 'ticket-004',
      title: 'Протечка в серверной',
      description: 'С потолка капает вода, сервера под угрозой',
      type: $Enums.TicketType.repair,
      priority: $Enums.TicketPriority.critical,
      status: $Enums.TicketStatus.open,
      requesterId: admin.id,
      departmentId: 'dept-it',
    },
    {
      id: 'ticket-005',
      title: 'Заменить лампочку в коридоре',
      description: 'На 3-м этаже перегорела лампа дневного света',
      type: $Enums.TicketType.household,
      priority: $Enums.TicketPriority.low,
      status: $Enums.TicketStatus.closed,
      requesterId: developer.id,
      assigneeId: itManager.id,
    },
  ];

  for (const t of tickets) {
    await prisma.ticket.upsert({
      where: { id: t.id },
      update: {},
      create: {
        ...t,
        organizationId: organization.id,
      },
    });
  }

  console.log(`✅ Created ${tickets.length} tickets`);

  // Комментарий к заявке
  await prisma.ticketComment.upsert({
    where: { id: 'ticket-cmt-001' },
    update: {},
    create: {
      id: 'ticket-cmt-001',
      ticketId: 'ticket-002',
      authorId: itManager.id,
      body: 'Заказал картридж в сервисном центре, ожидаю поставку',
    },
  });

  await prisma.ticketComment.upsert({
    where: { id: 'ticket-cmt-002' },
    update: {},
    create: {
      id: 'ticket-cmt-002',
      ticketId: 'ticket-003',
      authorId: itManager.id,
      body: 'Доступ предоставлен, учётная запись создана',
      systemComment: true,
    },
  });

  console.log('✅ Created 2 ticket comments');

  console.log('🌱 Seeding completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Manager: it.manager@example.com / manager123');
  console.log('  Employee: dev@example.com / employee123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
