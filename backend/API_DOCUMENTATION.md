# 📚 API Документация - HR Platform

**Base URL:** `http://localhost:3000/api/v1`

---

## 📋 Содержание

1. [Авторизация (Этап 4)](#1-авторизация)
2. [Организационная структура (Этап 5)](#2-организационная-структура)
3. [Проекты (Этап 6)](#3-проекты)
4. [Задачи (Этап 7)](#4-задачи)

---

## 1. Авторизация

### 1.1 Регистрация
```http
POST /auth/register
```

**Request Body:**
```json
{
  "fullName": "Иванов Иван",
  "email": "ivanov@example.com",
  "password": "securePassword123",
  "organizationId": "org-uuid",
  "departmentId": "dept-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": "emp-uuid",
      "fullName": "Иванов Иван",
      "email": "ivanov@example.com",
      "position": "Сотрудник",
      "organization": "Организация"
    }
  }
}
```

### 1.2 Вход
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### 1.3 Смена пароля
```http
POST /auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

### 1.4 Запрос сброса пароля
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 1.5 Сброс пароля по токену
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "resetToken": "uuid-token",
  "newPassword": "newPassword123"
}
```

### 1.6 Получение профиля
```http
GET /auth/me
Authorization: Bearer <token>
```

### 1.7 Назначение роли
```http
POST /auth/roles/assign
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "employeeId": "emp-uuid",
  "roleId": "role-uuid"
}
```

### 1.8 Получение ролей сотрудника
```http
GET /auth/employees/:employeeId/roles
Authorization: Bearer <token>
```

---

## 2. Организационная Структура

### 2.1 Создать сотрудника
```http
POST /employees
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fullName": "Петров Петр",
  "email": "petrov@example.com",
  "password": "password123",
  "inn": "123456789012",
  "phone": "+7 (999) 123-45-67",
  "position": "Разработчик",
  "departmentId": "dept-uuid",
  "managerId": "manager-uuid",
  "hireDate": "2024-01-15",
  "organizationId": "org-uuid"
}
```

### 2.2 Получить список сотрудников
```http
GET /employees?page=1&limit=20&search=иванов&departmentId=dept-uuid&status=active
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "emp-uuid",
      "fullName": "Иванов Иван",
      "email": "ivanov@example.com",
      "position": "Разработчик",
      "departmentId": "dept-uuid",
      "managerId": "manager-uuid",
      "status": "active",
      "manager": {
        "id": "manager-uuid",
        "fullName": "Руководитель",
        "position": "Team Lead"
      },
      "roles": ["employee"]
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "totalPages": 5
  }
}
```

### 2.3 Получить сотрудника по ID
```http
GET /employees/:id
Authorization: Bearer <token>
```

### 2.4 Обновить сотрудника
```http
PATCH /employees/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "position": "Senior Разработчик",
  "departmentId": "new-dept-uuid"
}
```

### 2.5 Удалить сотрудника (мягкое)
```http
DELETE /employees/:id
Authorization: Bearer <token>
```

### 2.6 Восстановить сотрудника
```http
POST /employees/:id/restore
Authorization: Bearer <token>
```

### 2.7 История изменений сотрудника
```http
GET /employees/:id/history
Authorization: Bearer <token>
```

### 2.8 Получить подчинённых
```http
GET /employees/:id/subordinates
Authorization: Bearer <token>
```

---

### 2.9 Департаменты

#### Создать отдел
```http
POST /departments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Отдел разработки",
  "organizationId": "org-uuid",
  "parentId": "parent-dept-uuid",
  "headId": "head-employee-uuid"
}
```

#### Получить все отделы
```http
GET /departments
Authorization: Bearer <token>
```

#### Получить дерево отделов
```http
GET /departments/tree
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dept-1",
      "name": "Главный офис",
      "level": 0,
      "children": [
        {
          "id": "dept-1-1",
          "name": "Отдел разработки",
          "level": 1,
          "children": []
        }
      ]
    }
  ]
}
```

#### Получить отдел по ID
```http
GET /departments/:id
Authorization: Bearer <token>
```

#### Обновить отдел
```http
PATCH /departments/:id
Authorization: Bearer <token>
```

#### Удалить отдел
```http
DELETE /departments/:id
Authorization: Bearer <token>
```

---

## 3. Проекты

### 3.1 Создать проект
```http
POST /projects
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Разработка мобильного приложения",
  "description": "Создание iOS и Android приложения",
  "ownerId": "owner-employee-uuid",
  "startDate": "2024-01-01",
  "dueDate": "2024-12-31",
  "budget": 500000,
  "organizationId": "org-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj-uuid",
    "name": "Разработка мобильного приложения",
    "status": "active",
    "ownerId": "owner-employee-uuid",
    "progress": 0,
    "startDate": "2024-01-01T00:00:00.000Z",
    "dueDate": "2024-12-31T00:00:00.000Z",
    "budget": 500000,
    "owner": {
      "id": "owner-employee-uuid",
      "fullName": "Иванов Иван",
      "position": "Project Manager"
    },
    "members": [
      {
        "role": "owner",
        "employee": {
          "id": "owner-employee-uuid",
          "fullName": "Иванов Иван"
        }
      }
    ]
  }
}
```

### 3.2 Получить список проектов
```http
GET /projects?page=1&limit=20&search=приложение&status=active&ownerId=owner-uuid
Authorization: Bearer <token>
```

**Статусы проектов:**
- `new` - Новый
- `active` - Активный
- `completed` - Завершённый
- `archived` - Архивный

### 3.3 Получить проект по ID
```http
GET /projects/:id
Authorization: Bearer <token>
```

### 3.4 Обновить проект
```http
PATCH /projects/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Разработка мобильного приложения 2.0",
  "status": "completed",
  "dueDate": "2025-06-30"
}
```

### 3.5 Удалить проект (мягкое)
```http
DELETE /projects/:id
Authorization: Bearer <token>
```

### 3.6 Добавить участника проекта
```http
POST /projects/:id/members
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "employeeId": "employee-uuid",
  "role": "member"
}
```

**Роли участников:**
- `owner` - Владелец
- `admin` - Администратор
- `member` - Участник
- `viewer` - Наблюдатель

### 3.7 Обновить роль участника
```http
PATCH /projects/:id/members/:employeeId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "admin"
}
```

### 3.8 Удалить участника проекта
```http
DELETE /projects/:id/members/:employeeId
Authorization: Bearer <token>
```

### 3.9 Получить участников проекта
```http
GET /projects/:id/members
Authorization: Bearer <token>
```

### 3.10 Получить статистику проектов
```http
GET /projects/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "byStatus": {
      "new": 2,
      "active": 5,
      "completed": 2,
      "archived": 1
    },
    "active": 5,
    "completed": 2,
    "totalTasks": 150,
    "doneTasks": 75,
    "tasksProgress": 50
  }
}
```

---

## 4. Задачи

### 4.1 Создать задачу
```http
POST /tasks
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Реализовать авторизацию через Google",
  "description": "Добавить OAuth 2.0 интеграцию",
  "projectId": "proj-uuid",
  "assigneeId": "assignee-uuid",
  "controllerId": "controller-uuid",
  "coAssigneeIds": ["coassignee1-uuid", "coassignee2-uuid"],
  "priority": "high",
  "status": "new",
  "startDate": "2024-01-15",
  "dueDate": "2024-01-30",
  "parentTaskId": null,
  "tags": ["auth", "google", "oauth"],
  "checklist": [
    { "text": "Изучить документацию Google OAuth", "checked": false },
    { "text": "Настроить Google Console", "checked": false },
    { "text": "Реализовать backend", "checked": false },
    { "text": "Протестировать", "checked": false }
  ],
  "storyPoints": 5,
  "organizationId": "org-uuid"
}
```

**Статусы задач:**
- `new` - Новая
- `in_progress` - В работе
- `approved` - На согласовании
- `done` - Выполнена
- `rejected` - Отменена
- `overdue` - Просрочена

**Приоритеты:**
- `low` - Низкий
- `normal` - Средний
- `high` - Высокий
- `critical` - Критический

### 4.2 Получить список задач (Канбан)
```http
GET /tasks?page=1&limit=50&projectId=proj-uuid&assigneeId=assignee-uuid&status=in_progress
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-uuid",
      "title": "Реализовать авторизацию через Google",
      "description": "Добавить OAuth 2.0 интеграцию",
      "status": "in_progress",
      "priority": "high",
      "assigneeId": "assignee-uuid",
      "controllerId": "controller-uuid",
      "creatorId": "creator-uuid",
      "projectId": "proj-uuid",
      "dueDate": "2024-01-30T00:00:00.000Z",
      "storyPoints": 5,
      "timeSpent": 120,
      "assignee": {
        "id": "assignee-uuid",
        "fullName": "Петров Петр"
      },
      "controller": {
        "id": "controller-uuid",
        "fullName": "Сидоров Сидор"
      },
      "tags": ["auth", "google"],
      "checklist": [
        { "text": "Изучить документацию", "checked": true },
        { "text": "Реализовать backend", "checked": false }
      ]
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "totalPages": 1
  }
}
```

### 4.3 Получить задачу по ID
```http
GET /tasks/:id
Authorization: Bearer <token>
```

### 4.4 Обновить задачу
```http
PATCH /tasks/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Реализовать авторизацию через Google (обновлено)",
  "status": "approved",
  "priority": "critical",
  "assigneeId": "new-assignee-uuid"
}
```

### 4.5 Удалить задачу (мягкое)
```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

### 4.6 Восстановить задачу
```http
POST /tasks/:id/restore
Authorization: Bearer <token>
```

### 4.7 Добавить комментарий
```http
POST /tasks/:taskId/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "body": "Готово, готово к тестированию"
}
```

### 4.8 Получить комментарии
```http
GET /tasks/:taskId/comments
Authorization: Bearer <token>
```

### 4.9 Канбан-доска
```http
GET /tasks/kanban?projectId=proj-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "new": [...],
    "in_progress": [...],
    "approved": [...],
    "done": [...],
    "rejected": [...],
    "overdue": [...]
  }
}
```

### 4.10 Прикрепить файл
```http
POST /tasks/:taskId/attachments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fileName": "design.pdf",
  "fileUrl": "https://storage.example.com/design.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

### 4.11 Получить вложения
```http
GET /tasks/:taskId/attachments
Authorization: Bearer <token>
```

### 4.12 Удалить вложение
```http
DELETE /tasks/:taskId/attachments/:attachmentId
Authorization: Bearer <token>
```

### 4.13 Создать спринт
```http
POST /tasks/sprints
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "projectId": "proj-uuid",
  "name": "Спринт #1",
  "startDate": "2024-01-01",
  "endDate": "2024-01-14",
  "goal": "Реализовать авторизацию"
}
```

### 4.14 Получить спринты проекта
```http
GET /tasks/sprints?projectId=proj-uuid
Authorization: Bearer <token>
```

### 4.15 Обновить статус спринта
```http
PATCH /tasks/sprints/:sprintId/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "active"
}
```

**Статусы спринтов:**
- `planning` - Планирование
- `active` - Активный
- `completed` - Завершённый
- `cancelled` - Отменённый

### 4.16 Учёт времени
```http
POST /tasks/:taskId/time
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "minutes": 120,
  "comment": "Разработка backend API"
}
```

### 4.17 Получить отчёт по времени
```http
GET /tasks/:taskId/time
Authorization: Bearer <token>
```

### 4.18 Статистика задач
```http
GET /tasks/statistics?departmentId=dept-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTasks": 150,
    "byStatus": {
      "new": 30,
      "in_progress": 45,
      "approved": 15,
      "done": 50,
      "rejected": 10
    },
    "byPriority": {
      "low": 20,
      "normal": 80,
      "high": 40,
      "critical": 10
    },
    "overdueTasks": 5,
    "avgCompletionTime": 3.5
  }
}
```

---

## 📝 Общие Ответы об Ошибках

### 400 Bad Request
```json
{
  "success": false,
  "error": "Ошибка валидации"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Неверный токен доступа"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Недостаточно прав"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Ресурс не найден"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Внутренняя ошибка сервера"
}
```

---

## 🔑 Авторизация

Все защищённые маршруты требуют заголовок:

```
Authorization: Bearer <access_token>
```

Access Token истекает через 15 минут. Используйте Refresh Token для получения нового:

```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

---

**Версия API:** 1.0.0  
**Последнее обновление:** 2026-06-02
