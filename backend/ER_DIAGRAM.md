# 🗄️ ER-ДИАГРАММА БАЗЫ ДАННЫХ

**Платформа:** HR Platform  
**Версия:** 4.0.0  
**Дата:** 2026-06-02  
**Всего таблиц:** 40

---

## 📊 СХМА БАЗЫ ДАННЫХ

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORGANIZATIONS                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ organizations (органзации - мультиарендность)                              │  │
│  │ ├── id: UUID PK                                                            │  │
│  │ ├── name: String                                                           │  │
│  │ └── settings: JSON                                                         │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                   │                                              │
│         ┌─────────────────────────┼─────────────────────────┐                   │
│         ▼                         ▼                         ▼                   │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐             │
│  │  EMPLOYEES  │          │ DEPARTMENTS │          │    ROLES    │             │
│  │ ├── id: PK  │          │ ├── id: PK  │          │ ├── id: PK  │             │
│  │ ├── email   │◄─────────┤ ├── id: PK  │          │ ├── name    │             │
│  │ ├── position│          │ │ parent_id │──────────┤ └───────────┘             │
│  │ └── manager │          │ │ head_id ──┼──────┐   │                           │
│  └─────────────┘          └─────────────┘      │   │  employee_roles           │
│         │              │                        └───┼── employee_id FK          │
│         │              │                            └── role_id FK              │
│         ▼              ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐           │
│  │                    CORE MODULES                                  │           │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │           │
│  │  │  PROJECTS   │  │    TASKS    │  │   VACATIONS │              │           │
│  │  ├── members   │  │ ├── assign  │  │ ├── approver│              │           │
│  │  └─────────────┘  └──────┬──────┘  └─────────────┘              │           │
│  │                          │                                      │           │
│  │  ┌───────────────────────┼────────────────────────┐             │           │
│  │  ▼                       ▼                        ▼              │           │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │           │
│  │  │  COMMENTS   │  │ ATTACHMENTS │  │  HISTORY    │              │           │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │           │
│  └──────────────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW ENGINE                                       │
│  ┌─────────────────────┐       ┌─────────────────────┐                         │
│  │   WORKFLOW_ROUTES   │──────▶│  WORKFLOW_INSTANCES │                         │
│  │ ├── name            │       │ ├── route_id FK     │                         │
│  │ ├── entityType      │       │ ├── entity_id       │                         │
│  │ └── steps: JSON     │       │ ├── status          │                         │
│  └─────────────────────┘       └──────────┬──────────┘                         │
│                                           │                                     │
│                                           ▼                                     │
│                                  ┌─────────────────────┐                        │
│                                  │ WORKFLOW_APPROVALS  │                        │
│                                  │ ├── instance_id FK  │                        │
│                                  │ ├── approver_id FK  │                        │
│                                  │ └── status          │                        │
│                                  └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DELEGATION & RESOLUTIONS                               │
│  ┌─────────────────────┐       ┌─────────────────────┐                         │
│  │    DELEGATIONS      │       │     RESOLUTIONS     │                         │
│  │ ├── delegator_id FK │       │ ├── document_id FK  │                         │
│  │ ├── delegatee_id FK │       │ ├── executor_id FK  │                         │
│  │ ├── type            │       │ ├── controller_id FK│                         │
│  │ └── dates           │       │ ├── deadline        │                         │
│  └─────────────────────┘       └──────────┬──────────┘                         │
│                                           │                                     │
│                                           ▼                                     │
│                                  ┌─────────────────────┐                        │
│                                  │  RESOLUTION_HISTORY │                        │
│                                  └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE DESK & FILES                                   │
│  ┌─────────────────────┐       ┌─────────────────────┐                         │
│  │      TICKETS        │       │      DOCUMENTS      │                         │
│  │ ├── requester_id FK │       │ ├── owner_id FK     │                         │
│  │ ├── assignee_id FK  │       │ ├── executor_id FK  │                         │
│  │ ├── type            │       │ ├── uploader_id FK  │                         │
│  │ └── status          │       │ └── approvals       │                         │
│  └──────────┬──────────┘       └──────────┬──────────┘                         │
│             │                              │                                    │
│             ▼                              ▼                                    │
│  ┌─────────────────────┐       ┌─────────────────────┐                         │
│  │   TICKET_COMMENTS   │       │    FILE_STORAGE     │                         │
│  └─────────────────────┘       └─────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          NOTIFICATIONS & CALENDAR                               │
│  ┌─────────────────────┐       ┌─────────────────────┐                         │
│  │    NOTIFICATIONS    │       │   CALENDAR_EVENTS   │                         │
│  │ ├── employee_id FK  │       │ ├── employee_id FK  │                         │
│  │ ├── type            │       │ ├── department_id FK│                         │
│  │ └── is_read         │       │ └── event_type      │                         │
│  └─────────────────────┘       └─────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 ПОЛНЫЙ СПИСОК ТАБЛИЦ

### Core (6 таблиц)
1. **organizations** - Организации (мультиарендность)
2. **employees** - Сотрудники
3. **departments** - Подразделения (дерево)
4. **roles** - Роли
5. **employee_roles** - Назначение ролей (многие-ко-многим)
6. **employee_history** - История изменений сотрудников

### Проекты и задачи (9 таблиц)
7. **projects** - Проекты
8. **project_members** - Участники проектов
9. **tasks** - Задачи
10. **task_attachments** - Вложения задач
11. **task_comments** - Комментарии
12. **task_coassignees** - Соисполнители
13. **task_watchers** - Наблюдатели
14. **task_history** - История изменений задач
15. **sprints** - Спринты

### Время и отпуска (5 таблиц)
16. **attendance** - Посещаемость
17. **timesheets** - Учёт времени
18. **vacation_requests** - Отпуска
19. **sick_leaves** - Больничные
20. **business_trips** - Командировки

### Документы (3 таблицы)
21. **documents** - Документы
22. **document_approvals** - Согласования документов
23. **document_versions** - Версии документов

### Чат (3 таблицы)
24. **chat_channels** - Каналы чата
25. **chat_members** - Участники каналов
26. **chat_messages** - Сообщения

### Новости и объявления (2 таблицы)
27. **news** - Новости
28. **announcements** - Объявления

### KPI (2 таблицы)
29. **kpi_metrics** - Метрики KPI
30. **kpi_values** - Значения KPI

### Уведомления (1 таблица)
31. **notifications** - Уведомления

### Синхронизация (1 таблица)
32. **sync_queue** - Очередь синхронизации

### Workflow Engine (3 таблицы)
33. **workflow_routes** - Маршруты согласований
34. **workflow_instances** - Инстансы workflow
35. **workflow_approvals** - Согласования

### Делегирование (1 таблица)
36. **delegations** - Делегирования

### Резолюции (2 таблицы)
37. **resolutions** - Резолюции
38. **resolution_history** - История резолюций

### Service Desk (2 таблицы)
39. **tickets** - Заявки
40. **ticket_comments** - Комментарии заявок

---

## 🔗 ОСНОВНЫЕ СВЯЗИ

### Employee связи:
- employee.departmentId → department.id
- employee.managerId → employee.id (самосвязь)
- employee.organizationId → organization.id

### Project связи:
- project.organizationId → organization.id
- project.ownerId → employee.id
- project_member.projectId → project.id
- project_member.employeeId → employee.id

### Task связи:
- task.organizationId → organization.id
- task.projectId → project.id
- task.assigneeId → employee.id
- task.controllerId → employee.id
- task.creatorId → employee.id
- task.parentTaskId → task.id (самосвязь)

### Workflow связи:
- workflow_route.organizationId → organization.id
- workflow_instance.routeId → workflow_route.id
- workflow_instance.organizationId → organization.id
- workflow_approval.instanceId → workflow_instance.id
- workflow_approval.approverId → employee.id

### Delegation связи:
- delegation.delegatorId → employee.id
- delegation.delegateeId → employee.id
- delegation.organizationId → organization.id

### Resolution связи:
- resolution.documentId → document.id
- resolution.executorId → employee.id
- resolution.controllerId → employee.id
- resolution.organizationId → organization.id

### Ticket связи:
- ticket.requesterId → employee.id
- ticket.assigneeId → employee.id
- ticket.organizationId → organization.id
- ticket_comment.ticketId → ticket.id
- ticket_comment.authorId → employee.id

---

## 📊 СТАТИСТИКА

| Категория | Таблиц |
|-----------|--------|
| Core | 6 |
| Проекты и задачи | 9 |
| Время и отпуска | 5 |
| Документы | 3 |
| Чат | 3 |
| Новости | 2 |
| KPI | 2 |
| Уведомления | 1 |
| Синхронизация | 1 |
| **Workflow Engine** | **3** |
| **Делегирование** | **1** |
| **Резолюции** | **2** |
| **Service Desk** | **2** |
| **Всего** | **40** |

---

## 🎯 КЛЮЧЕВЫЕ ФУНКЦИОНАЛЬНОСТИ

### Мультиарендность (Tenant Isolation)
Все таблицы содержат `organizationId` для изоляции данных между организациями.

### Soft Deletes
Ключевые таблицы используют soft delete:
- `employees.isDeleted`, `employees.deletedAt`
- `tasks.isDeleted`, `tasks.deletedAt`
- `projects.isDeleted`, `projects.deletedAt`

### Аудит и История
- `employee_history` - История сотрудников
- `task_history` - История задач
- `resolution_history` - История резолюций
- `document_versions` - Версии документов

### Ролевая модель
- `roles` - Роли организации
- `employee_roles` - Назначение ролей
- Permissions в JSON формате

---

**ER-диаграмма готова для экспорта в Draw.io или PDF!**
