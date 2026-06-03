# 🗄️ База Данных - HR Platform

## Состояние Базы Данных

✅ **Все миграции применены успешно!**

### Применённые Миграции

| № | Имя миграции | Дата | Описание |
|---|--------------|------|----------|
| 1 | `initial_setup` | - | Начальная настройка схемы |
| 2 | `add_soft_delete_fields` | - | Добавлены поля soft delete (isDeleted, deletedAt) |
| 3 | `add_performance_indexes` | 2026-06-02 | Созданы индексы для производительности |

---

## 📊 Сущности (Таблицы)

### 1. **Организации** (`organizations`)
Центральная сущность для multi-tenancy архитектуры.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| name | VARCHAR | Название организации |
| settings | JSON | Настройки организации |
| createdAt | TIMESTAMP | Дата создания |

---

### 2. **Сотрудники** (`employees`)
Основные пользователи системы.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| fullName | VARCHAR | ФИО сотрудника |
| email | VARCHAR | Email (уникальный в организации) |
| phone | VARCHAR | Телефон |
| departmentId | UUID | FK → departments (подразделение) |
| managerId | UUID | FK → employees (руководитель) |
| position | VARCHAR | Должность |
| status | VARCHAR | active/inactive/terminated |
| isDeleted | BOOLEAN | Мягкое удаление |
| deletedAt | TIMESTAMP | Дата удаления |

**Индексы:**
- `idx_employees_organizationid` - по организации
- `idx_employees_departmentid` - по подразделению
- `idx_employees_managerid` - по руководителю
- `idx_employees_status` - по статусу

**Внешние ключи:**
- `organizationId` → `organizations(id)`
- `managerId` → `employees(id)` (самопоиск)

---

### 3. **Подразделения** (`departments`)
Иерархическая структура организации.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| name | VARCHAR | Название отдела |
| parentId | UUID | FK → departments (родитель) |
| headId | UUID | FK → employees (руководитель) |
| level | INT | Уровень в иерархии |

**Индексы:**
- `idx_departments_organizationid` - по организации
- `idx_departments_parent_id` - по родителю

---

### 4. **Проекты** (`projects`)
Проектная деятельность.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| ownerId | UUID | FK → employees (владелец) |
| name | VARCHAR | Название проекта |
| status | VARCHAR | active/completed/cancelled |
| startDate | DATE | Дата начала |
| dueDate | DATE | Дата окончания |
| progress | INT | Прогресс (0-100%) |
| isDeleted | BOOLEAN | Мягкое удаление |

**Индексы:**
- `idx_projects_organizationid` - по организации
- `idx_projects_ownerid` - по владельцу
- `idx_projects_status` - по статусу
- `idx_projects_is_deleted` - для soft delete

---

### 5. **Задачи** (`tasks`)
Задачи в проектах.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| projectId | UUID | FK → projects |
| sprintId | UUID | FK → sprints |
| creatorId | UUID | FK → employees (создатель) |
| assigneeId | UUID | FK → employees (исполнитель) |
| controllerId | UUID | FK → employees (контролёр) |
| title | VARCHAR | Заголовок |
| status | VARCHAR | new/in_progress/done/closed |
| priority | VARCHAR | low/normal/high/critical |
| dueDate | DATE | Срок выполнения |
| isDeleted | BOOLEAN | Мягкое удаление |

**Индексы:**
- `idx_tasks_organizationid` - по организации
- `idx_tasks_projectid` - по проекту
- `idx_tasks_sprintid` - по спринту
- `idx_tasks_creatorid` - по создателю
- `idx_tasks_assigneeid` - по исполнителю
- `idx_tasks_status` - по статусу
- `idx_tasks_priority` - по приоритету
- `idx_tasks_due_date` - по дате окончания

---

### 6. **Посещаемость** (`attendance`)
Учёт рабочего времени.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| employeeId | UUID | FK → employees |
| checkIn | TIMESTAMP | Время прихода |
| checkOut | TIMESTAMP | Время ухода |
| date | DATE | Дата |

**Индексы:**
- `idx_attendance_organizationid` - по организации
- `idx_attendance_employeeid` - по сотруднику
- `idx_attendance_date` - по дате

---

### 7. **Уведомления** (`notifications`)
Система уведомлений.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| employeeId | UUID | FK → employees |
| type | VARCHAR | Тип уведомления |
| title | VARCHAR | Заголовок |
| body | TEXT | Текст |
| isRead | BOOLEAN | Прочитано |
| readAt | TIMESTAMP | Время прочтения |

**Индексы:**
- `idx_notifications_organizationid` - по организации
- `idx_notifications_employeeid` - по сотруднику
- `idx_notifications_is_read` - по статусу прочтения

---

### 8. **ОТПУСКА** (`vacation_requests`)
Запросы отпусков.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| employeeId | UUID | FK → employees |
| type | VARCHAR | тип (ежегодный/за свой счёт) |
| startDate | DATE | Дата начала |
| endDate | DATE | Дата окончания |
| status | VARCHAR | pending/approved/rejected |
| approverId | UUID | FK → employees (утверждающий) |

---

### 9. **БОЛЬНИЧНЫЕ** (`sick_leaves`)
Листки нетрудоспособности.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| employeeId | UUID | FK → employees |
| documentNumber | VARCHAR | Номер листа |
| issueDate | DATE | Дата выдачи |
| startDate | DATE | Дата начала |
| endDate | DATE | Дата окончания |
| status | VARCHAR | registered/verified/closed |
| verifiedById | UUID | FK → employees (проверивший) |

---

### 10. **КОМАНДИРОВКИ** (`business_trips`)
Командировки сотрудников.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| employeeId | UUID | FK → employees |
| destination | VARCHAR | Место назначения |
| purpose | TEXT | Цель |
| startDate | DATE | Дата начала |
| endDate | DATE | Дата окончания |
| status | VARCHAR | pending/approved/completed |
| approverId | UUID | FK → employees (утверждающий) |

---

### 11. **Чат** (`chat_channels`, `chat_messages`, `chat_members`)
Внутренняя система общения.

**chat_channels:**
- id, organizationId, name, type (public/private), createdAt

**chat_messages:**
- id, channelId, authorId, body, attachments, createdAt

**chat_members:**
- channelId, employeeId, joinedAt, role

---

### 12. **Новости** (`news`)
Корпоративные новости.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| authorId | UUID | FK → employees |
| title | VARCHAR | Заголовок |
| body | TEXT | Текст |
| category | VARCHAR | Категория |
| publishedAt | TIMESTAMP | Дата публикации |

---

### 13. **Объявления** (`announcements`)
Важные объявления.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PRIMARY KEY |
| organizationId | UUID | FK → organizations |
| authorId | UUID | FK → employees |
| title | VARCHAR | Заголовок |
| body | TEXT | Текст |
| targetDepartments | JSON | Целевые отделы |
| publishedAt | TIMESTAMP | Дата публикации |

---

### 14. **KPI** (`kpi_metrics`, `kpi_values`)
Система показателей эффективности.

**kpi_metrics:**
- id, organizationId, employeeId, departmentId, name, target, weight, period

**kpi_values:**
- id, metricId, periodDate, actual

---

## 🔗 Внешние Ключи (Foreign Keys)

Все внешние ключи настроены с `ON DELETE RESTRICT` или `ON DELETE CASCADE`:

| Таблица | Поле | Ссылка | Действие |
|---------|------|--------|----------|
| employees | organizationId | organizations(id) | RESTRICT |
| employees | managerId | employees(id) | SET NULL |
| employees | departmentId | departments(id) | SET NULL |
| tasks | projectId | projects(id) | SET NULL |
| tasks | assigneeId | employees(id) | SET NULL |
| tasks | creatorId | employees(id) | RESTRICT |
| vacation_requests | approverId | employees(id) | SET NULL |
| business_trips | approverId | employees(id) | SET NULL |
| chat_messages | authorId | employees(id) | CASCADE |
| chat_messages | channelId | chat_channels(id) | CASCADE |

---

## 📈 Статистика

- **Всего таблиц:** 31
- **Всего индексов:** 45+
- **Всего внешних ключей:** 50+
- **Тип БД:** PostgreSQL 14+
- **Характеристики:** ACID, JSONB, полнотекстовый поиск

---

## 🛠️ Управление Миграциями

### Просмотр статуса миграций
```bash
cd backend
npx prisma migrate status
```

### Создание новой миграции
```bash
npx prisma migrate dev --name <имя_миграции>
```

### Применение миграций в production
```bash
npx prisma migrate deploy
```

### Открытие Prisma Studio (GUI для БД)
```bash
npx prisma studio
```

---

## ✅ Проверка Целостности

```bash
# Проверка схемы
npx prisma validate

# Сброс и пересоздание БД (development только!)
npx prisma migrate reset
```

---

**Последнее обновление:** 2026-06-02  
**Версия схемы:** 3 migrations applied
