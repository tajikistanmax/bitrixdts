# 📋 ШПАРГАЛКА ПО НОВЫМ API

## Быстрый старт

### 1. Workflow Engine - Согласования

```javascript
// Создать маршрут согласования
POST /api/v1/workflow/routes
{
  "name": "Согласование приказа",
  "entityType": "document",
  "steps": [
    { "order": 1, "type": "department", "departmentId": "dept-id", "required": true },
    { "order": 2, "type": "position", "position": "Юрист", "required": true },
    { "order": 3, "type": "employee", "employeeId": "employee-id", "required": true }
  ]
}

// Запустить согласование
POST /api/v1/workflow/start
{
  "routeId": "route-id",
  "entityId": "document-id",
  "entityType": "document"
}

// Одобрить шаг
PUT /api/v1/workflow/instances/{instanceId}/approve/{stepOrder}
{
  "comment": "Согласую"
}

// Мои активные согласования
GET /api/v1/workflow/routes/my-active
```

---

### 2. Делегирование - Заместители

```javascript
// Создать делегирование (отпуск)
POST /api/v1/delegation
{
  "delegatorId": "сотрудник-id",
  "delegateeId": "заместитель-id",
  "type": "all",
  "startDate": "2026-06-15",
  "endDate": "2026-06-30",
  "autoApply": true
}

// Заместитель для должности (для ВСЕХ сотрудников позиции)
POST /api/v1/delegation/position
{
  "position": "Начальник отдела",
  "deputyId": "сотрудник-id",
  "startDate": "2026-06-15",
  "endDate": "2026-07-15"
}

// Активные делегирования
GET /api/v1/delegation/my-active
```

---

### 3. Резолюции - Поручения к документам

```javascript
// Создать резолюцию
POST /api/v1/resolutions
{
  "documentId": "document-id",
  "text": "Исполнить до 15 июня. Ответственный: Иванов. Контроль: Петров.",
  "executorId": "сотрудник-ivanov",
  "controllerId": "сотрудник-petrov",
  "deadline": "2026-06-15",
  "priority": "high"
}

// Обновить статус
PUT /api/v1/resolutions/{id}/status
{
  "status": "in_progress"
}

// Все резолюции
GET /api/v1/resolutions?executorId={id}&status=pending
```

---

### 4. Service Desk - Заявки

```javascript
// Создать заявку (IT-поддержка)
POST /api/v1/tickets
{
  "title": "Не работает принтер",
  "description": "Принтер в кабинете 305 не печатает",
  "type": "it",
  "priority": "high"
}

// Создать хозяйственную заявку
POST /api/v1/tickets
{
  "title": "Нужен новый стул",
  "description": "Старый стул сломался",
  "type": "household",
  "priority": "normal"
}

// Мои заявки
GET /api/v1/tickets?my=true

// Назначить исполнителя
PUT /api/v1/tickets/{id}/assign
{
  "assigneeId": "специалист-id"
}

// Добавить комментарий
POST /api/v1/tickets/{id}/comment
{
  "body": "Принтер ремонтируется"
}
```

---

### 5. История задач - Аудит изменений

```javascript
// История изменений задачи
GET /api/v1/tasks/{taskId}/history

// Статистика изменений
GET /api/v1/tasks/{taskId}/history/statistics

// История изменений по сотруднику
GET /api/v1/tasks/history/by-employee

// История изменений по полю (например, assignee)
GET /api/v1/tasks/history/field/assignee
```

---

## 📊 Примеры использования

### Сценарий 1: Согласование приказа
```
1. Создать документ (Приказ)
2. POST /workflow/start → запустить workflow
3. Руководитель отдела получает уведомление
4. PUT /workflow/instances/{id}/approve/1 → одобрить
5. Юрист получает уведомление
6. PUT /workflow/instances/{id}/approve/2 → одобрить
7. Замминистра получает уведомление
8. PUT /workflow/instances/{id}/approve/3 → одобрить
9. Документ автоматически становится "Согласован"
```

### Сценарий 2: Отпуск начальника отдела
```
1. POST /delegation/position → установить заместителя для "Начальник отдела"
2. Начальник уходит в отпуск
3. Все задачи начальника автоматически переходят заместителю
4. Все заявки на согласование начальника идут заместителю
5. По возвращении - делегирование деактивируется
```

### Сценарий 3: Резолюция к входящему письму
```
1. Документ "Входящее письмо" создан
2. POST /resolutions → создать резолюцию
3. Исполнитель получает уведомление
4. Исполнитель работает над задачей
5. PUT /resolutions/{id}/status → обновить статус
6. Контролёр видит прогресс
```

### Сценарий 4: IT-заявка
```
1. Сотрудник: POST /tickets → "Не работает компьютер"
2. IT-отдел получает уведомление
3. IT-специалист: PUT /tickets/{id}/assign → назначить на себя
4. Специалист работает
5. POST /tickets/{id}/comment → "Установлен новый драйвер"
6. PUT /tickets/{id}/status → "resolved"
7. Сотрудник подтверждает решение
```

---

## 🔑 Ключевые возможности

| Функция | Что решает |
|---------|-----------|
| Workflow Engine | Многоуровневые согласования без программирования |
| Делегирование | Автоматическая передача задач в отпуске/командировке |
| Заместители | Автоматическое замещение должности |
| Резолюции | Поручения к документам с исполнителями и контролёрами |
| Service Desk | IT-поддержка и хозяйственные заявки |
| История задач | Полный аудит всех изменений |

---

## 🎯 Статусы

### Workflow
- `pending` - Ожидает согласования
- `in_progress` - В процессе
- `approved` - Согласовано
- `rejected` - Отклонено
- `cancelled` - Отменено

### Tickets (Service Desk)
- `open` - Открыта
- `in_progress` - В работе
- `resolved` - Решена
- `closed` - Закрыта
- `cancelled` - Отменена

### Resolutions
- `pending` - Ожидает исполнения
- `in_progress` - В процессе
- `completed` - Выполнена
- `cancelled` - Отменена

### Delegations
- `active` - Активно
- `inactive` - Неактивно

---

**Платформа готова к использованию!** 🚀
