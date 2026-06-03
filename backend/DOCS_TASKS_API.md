# API Документация - Модуль Задач (CRM)

## 📋 Обзор

Полнофункциональная система управления задачами с поддержкой:
- Канбан-доски
- Спринтов (Scrum)
- Вложений и файлов
- Учёта времени
- Чек-листов
- Иерархии задач

---

## 🔧 Основные операции

### 1. Создать задачу

```http
POST /api/v1/tasks
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Разработать API для модуля задач",
  "description": "Реализовать CRUD операции и комментарии",
  "projectId": "proj-001",
  "sprintId": "sprint-001",
  "assigneeId": "emp-dev-001",
  "controllerId": "emp-manager-001",
  "coAssigneeIds": ["emp-dev-002", "emp-dev-003"],
  "priority": "high",
  "status": "new",
  "startDate": "2025-06-01",
  "dueDate": "2025-06-30",
  "parentTaskId": null,
  "tags": ["backend", "api", "urgent"],
  "checklist": [
    {"id": "1", "text": "Создать service", "completed": true},
    {"id": "2", "text": "Написать controller", "completed": false},
    {"id": "3", "text": "Добавить тесты", "completed": false}
  ],
  "storyPoints": 5,
  "organizationId": "org-00000000-0000-0000-0000-000000000001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "title": "Разработать API для модуля задач",
    "status": "new",
    "priority": "high",
    "assignee": {
      "id": "emp-dev-001",
      "fullName": "Иван Иванов",
      "position": "Backend Developer"
    },
    "controller": {
      "id": "emp-manager-001",
      "fullName": "Петр Петров"
    },
    "coAssignees": [],
    "checklist": [...],
    "tags": ["backend", "api", "urgent"],
    "storyPoints": 5,
    "createdAt": "2025-06-01T10:00:00Z"
  }
}
```

---

### 2. Получить список задач (с фильтрами)

```http
GET /api/v1/tasks?status=in_progress&priority=high&assigneeId=emp-001&page=1&limit=20
Authorization: Bearer <token>
```

**Фильтры:**
- `search` - поиск по названию/описанию
- `projectId` - фильтр по проекту
- `sprintId` - фильтр по спринту
- `assigneeId` - исполнитель
- `controllerId` - контролёр
- `status` - статус (new/in_progress/approved/done/rejected/overdue)
- `priority` - приоритет (low/normal/high/critical)
- `departmentId` - отдел
- `startDateFrom` / `startDateTo` - диапазон дат начала
- `dueDateFrom` / `dueDateTo` - диапазон дат окончания
- `tags` - теги (JSON array)
- `page` - страница (по умолчанию 1)
- `limit` - количество (по умолчанию 20)
- `sortBy` - сортировка (createdAt, dueDate, priority)
- `sortOrder` - порядок (asc/desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-001",
      "title": "Задача 1",
      "status": "in_progress",
      "priority": "high",
      "assignee": {...},
      "comments": [...],
      "attachments": [...]
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### 3. Получить задачу по ID

```http
GET /api/v1/tasks/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "title": "Разработать API",
    "description": "...",
    "status": "in_progress",
    "priority": "high",
    "assignee": {...},
    "controller": {...},
    "coAssignees": [...],
    "watchers": [...],
    "subtasks": [...],
    "comments": [...],
    "attachments": [...],
    "checklist": [...],
    "timeSpent": 360,
    "storyPoints": 5,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 4. Обновить задачу

```http
PATCH /api/v1/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Обновленное название",
  "status": "approved",
  "assigneeId": "emp-new-dev",
  "coAssigneeIds": ["emp-dev-1", "emp-dev-2"],
  "checklist": [
    {"id": "1", "text": "Готово", "completed": true}
  ]
}
```

---

### 5. Удалить задачу (мягкое)

```http
DELETE /api/v1/tasks/:id
Authorization: Bearer <token>
```

---

### 6. Восстановить задачу

```http
POST /api/v1/tasks/:id/restore
Authorization: Bearer <token>
```

---

## 💬 Комментарии

### Добавить комментарий

```http
POST /api/v1/tasks/:taskId/comment
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "body": "Задача готова к ревью"
}
```

### Получить комментарии

```http
GET /api/v1/tasks/:taskId/comments
Authorization: Bearer <token>
```

---

## 📎 Вложения (файлы)

### Загрузить файл

```http
POST /api/v1/tasks/:taskId/attachments
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileName": "spec.pdf",
  "fileUrl": "https://storage.example.com/files/spec.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "att-001",
    "fileName": "spec.pdf",
    "fileUrl": "https://storage.example.com/files/spec.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "uploadedBy": "emp-001",
    "createdAt": "2025-06-01T10:00:00Z"
  }
}
```

### Получить список файлов

```http
GET /api/v1/tasks/:taskId/attachments
Authorization: Bearer <token>
```

### Удалить файл

```http
DELETE /api/v1/tasks/:taskId/attachments/:attachmentId
Authorization: Bearer <token>
```

---

## 🏃 Спринты (Scrum)

### Создать спринт

```http
POST /api/v1/tasks/sprints
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "projectId": "proj-001",
  "name": "Спринт 1: MVP",
  "description": "Реализация основных функций",
  "startDate": "2025-06-01",
  "endDate": "2025-06-14",
  "goal": "Завершить MVP версии"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sprint-001",
    "name": "Спринт 1: MVP",
    "startDate": "2025-06-01",
    "endDate": "2025-06-14",
    "status": "planning",
    "goal": "Завершить MVP версии",
    "project": {
      "id": "proj-001",
      "name": "HR Platform"
    }
  }
}
```

### Получить список спринтов

```http
GET /api/v1/tasks/sprints?projectId=proj-001
Authorization: Bearer <token>
```

### Получить спринт с задачами

```http
GET /api/v1/tasks/sprints/:sprintId
Authorization: Bearer <token>
```

### Обновить статус спринта

```http
PATCH /api/v1/tasks/sprints/:sprintId/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "active"
}
```

**Возможные статусы:**
- `planning` - планирование
- `active` - активный
- `completed` - завершен
- `cancelled` - отменен

---

## ⏱️ Учёт времени

### Залогировать время

```http
POST /api/v1/tasks/:taskId/time
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "minutes": 120,
  "comment": "Разработка API endpoints"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task-001",
    "totalMinutes": 360,
    "addedMinutes": 120
  }
}
```

### Отчёт по времени

```http
GET /api/v1/tasks/:taskId/time-report
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task-001",
    "title": "Разработать API",
    "assignee": {
      "id": "emp-001",
      "fullName": "Иван Иванов"
    },
    "totalMinutes": 360,
    "totalHours": 6.0,
    "dueDate": "2025-06-30"
  }
}
```

---

## 📊 Статистика и Канбан

### Канбан-доска

```http
GET /api/v1/tasks/kanban?projectId=proj-001
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "new": [
      {
        "id": "task-001",
        "title": "Новая задача",
        "priority": "high",
        "assignee": {...},
        "isOverdue": false
      }
    ],
    "in_progress": [...],
    "approved": [...],
    "done": [...],
    "rejected": [...],
    "overdue": [...]
  }
}
```

### Статистика задач

```http
GET /api/v1/tasks/statistics?departmentId=dept-001
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": {
      "new": 10,
      "in_progress": 15,
      "approved": 5,
      "done": 18,
      "rejected": 2
    },
    "byPriority": {
      "low": 5,
      "normal": 20,
      "high": 20,
      "critical": 5
    },
    "overdue": 3,
    "totalStoryPoints": 85
  }
}
```

---

## 🎯 Примеры использования

### 1. Полная постановка задачи

```javascript
// Создать задачу с чек-листом и назначить исполнителя
const task = await fetch('/api/v1/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Разработать модуль аутентификации',
    description: 'Реализовать JWT аутентификацию с refresh token',
    assigneeId: 'emp-dev-001',
    controllerId: 'emp-manager-001',
    priority: 'critical',
    dueDate: '2025-06-15',
    checklist: [
      {id: '1', text: 'Изучить JWT', completed: false},
      {id: '2', text: 'Настроить Passport.js', completed: false},
      {id: '3', text: 'Реализовать refresh token', completed: false},
      {id: '4', text: 'Написать тесты', completed: false}
    ],
    tags: ['backend', 'auth', 'security'],
    storyPoints: 8,
    organizationId: 'org-001'
  })
});
```

### 2. Логирование времени после работы

```javascript
// Залогировать 3 часа работы
await fetch('/api/v1/tasks/task-001/time', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    minutes: 180,
    comment: 'Разработка endpoints аутентификации'
  })
});
```

### 3. Загрузить документ к задаче

```javascript
await fetch('/api/v1/tasks/task-001/attachments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: 'technical-spec.docx',
    fileUrl: 'https://storage.example.com/specs/tech-spec.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 2048000
  })
});
```

### 4. Создать спринт и добавить задачи

```javascript
// Создать спринт
const sprint = await fetch('/api/v1/tasks/sprints', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectId: 'proj-001',
    name: 'Спринт 1: Authentication',
    startDate: '2025-06-01',
    endDate: '2025-06-14',
    goal: 'Реализовать полную систему аутентификации'
  })
});

// Назначить задачи на спринт
await fetch('/api/v1/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'JWT Authentication',
    sprintId: sprint.data.id,
    assigneeId: 'emp-dev-001',
    storyPoints: 5,
    organizationId: 'org-001'
  })
});
```

---

## 🔐 Права доступа

- **Исполнитель (assignee)** - может обновлять статус, логировать время
- **Контролёр (controller)** - может утверждать задачи, менять исполнителя
- **Создатель** - может редактировать задачу, добавлять вложения
- **Наблюдатель (watcher)** - только чтение, получает уведомления
- **Член команды (coAssignee)** - может логировать время, комментировать

---

## 📝 Заметки

- Все даты в формате ISO 8601 (`YYYY-MM-DD` или `YYYY-MM-DDTHH:mm:ss`)
- ID задач, проектов, сотрудников - UUID
- Время логирования в минутах (целое число)
- Файлы хранятся во внешнем хранилище (S3/MinIO), в БД только метаданные
- Soft delete - задачи не удаляются физически, а помечаются как удалённые
