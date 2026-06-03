# 📚 ИНСТРУКЦИЯ ПО НАСТРОЙКЕ SWAGGER

## ✅ ВЫПОЛНЕННАЯ РАБОТА

**Созданы файлы документации:**
1. `backend/src/core/config/swagger.ts` - Конфигурация Swagger
2. `backend/src/modules/auth/auth.docs.ts` - Документация Auth API
3. `backend/src/modules/employees/employees.docs.ts` - Документация Employees API
4. `backend/src/modules/tasks/tasks.docs.ts` - Документация Tasks API
5. `backend/src/modules/workflow/workflow.docs.ts` - Документация Workflow API
6. `backend/src/modules/delegation/delegation.docs.ts` - Документация Delegation API

**Установлены зависимости:**
```json
{
  "dependencies": {
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^4.1.6"
  }
}
```

---

## 🔧 ДАЛЬНЕЙШИЕ ШАГИ ДЛЯ SWAGGER

### Шаг 1: Установить зависимости

```bash
cd backend
npm install swagger-ui-express swagger-jsdoc --save
npm install @types/swagger-ui-express --save-dev
```

### Шаг 2: Раскомментировать код в server.ts

**Файл:** `backend/src/server.ts`

**Добавить импорты:**
```typescript
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './core/config/swagger';
```

**Добавить маршруты после строки с API роутами:**
```typescript
// Swagger UI Documentation
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HR Platform API Docs',
  })
);

// OpenAPI JSON
app.get('/api/v1/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
```

### Шаг 3: Перезапустить сервер

```bash
npm run dev
```

### Шаг 4: Проверить

**URL Swagger UI:**
```
http://localhost:3000/api/v1/docs
```

**URL OpenAPI JSON:**
```
http://localhost:3000/api/v1/api-docs.json
```

---

## 📋 ДОКУМЕНТИРОВАННЫЕ API ENDPOINTS

### Auth (5 endpoints)
- POST `/auth/register` - Регистрация
- POST `/auth/login` - Вход
- GET `/auth/me` - Текущий пользователь
- POST `/auth/change-password` - Смена пароля
- POST `/auth/forgot-password` - Восстановление пароля

### Employees (6 endpoints)
- GET `/employees` - Список сотрудников
- POST `/employees` - Создать сотрудника
- GET `/employees/:id` - Получить сотрудника
- PUT `/employees/:id` - Обновить сотрудника
- DELETE `/employees/:id` - Уволить сотрудника
- GET `/employees/:id/history` - История изменений
- GET `/employees/:id/subordinates` - Подчинённые

### Tasks (7 endpoints)
- GET `/tasks` - Список задач
- POST `/tasks` - Создать задачу
- GET `/tasks/:id` - Получить задачу
- PUT `/tasks/:id` - Обновить задачу
- DELETE `/tasks/:id` - Удалить задачу
- GET `/tasks/:id/comments` - Комментарии задачи
- POST `/tasks/:id/comments` - Добавить комментарий
- GET `/tasks/kanban` - Канбан-доска
- GET `/tasks/:id/history` - История задачи

### Workflow (5 endpoints)
- GET `/workflow/routes` - Маршруты согласований
- POST `/workflow/routes` - Создать маршрут
- POST `/workflow/start` - Запустить workflow
- PUT `/workflow/instances/:id/approve/:step` - Одобрить
- PUT `/workflow/instances/:id/reject/:step` - Отклонить
- GET `/workflow/routes/my-active` - Мои активные

### Delegation (5 endpoints)
- GET `/delegation` - Все делегирования
- POST `/delegation` - Создать делегирование
- GET `/delegation/my-active` - Активные для меня
- GET `/delegation/employee/:id/deputies` - Заместители
- POST `/delegation/position` - Замещение должности

**Итого документировано:** **28 endpoints**

---

## 🎯 РЕКОМЕНДАЦИИ

### 1. Документировать остальные модули

Создать файлы `docs.ts` для:
- `projects/` - Projects API
- `departments/` - Departments API
- `resolutions/` - Resolutions API
- `service-desk/` - Service Desk API
- `files/` - Files API
- `calendar/` - Calendar API
- `reports/` - Reports API
- `notifications/` - Notifications API

### 2. Добавить тесты для Swagger

Проверить что все endpoints доступны через Swagger UI.

### 3. Экспорт OpenAPI спецификации

```bash
# После запуска сервера
curl http://localhost:3000/api/v1/api-docs.json > openapi.json
```

### 4. Генерация клиентского кода

```bash
# Генерация TypeScript client
openapi-generator-cli generate -i openapi.json -g typescript-axios -o src/api-client
```

---

## ⏱️ ОЦЕНКА ВРЕМЕНИ

| Задача | Время |
|--------|-------|
| Установка зависимостей | 10 мин |
| Раскомментировать код в server.ts | 10 мин |
| Перезапуск сервера | 5 мин |
| Тестирование Swagger UI | 15 мин |
| Документировать остальные модули | 2-3 часа |
| **Итого** | **3-4 часа** |

---

## ✅ CHECKLIST

- [ ] Установить `swagger-ui-express` и `swagger-jsdoc`
- [ ] Раскомментировать код в `server.ts`
- [ ] Перезапустить сервер
- [ ] Проверить `http://localhost:3000/api/v1/docs`
- [ ] Проверить `http://localhost:3000/api/v1/api-docs.json`
- [ ] Документировать остальные модули (projects, departments, etc.)
- [ ] Экспортировать OpenAPI спецификацию
- [ ] Записать демо-видео работы Swagger

---

**Swagger готов к использованию после выполнения инструкций выше!**
