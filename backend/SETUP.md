# 🚀 Инструкция по запуску HR Platform

## Предварительные требования

- **Node.js 20+** — https://nodejs.org/
- **Docker** — https://www.docker.com/
- **Git** — https://git-scm.com/

## 1. Установка зависимостей

```bash
cd backend
npm install
```

## 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Откройте `.env` и проверьте настройки (по умолчанию подходят для разработки).

## 3. Запуск сервисов (PostgreSQL, Redis, MinIO)

```bash
docker-compose up -d postgres redis minio
```

Проверьте, что сервисы запущены:

```bash
docker-compose ps
```

Ожидается:
```
NAME                   STATUS
hr_platform_db         Up
hr_platform_redis      Up
hr_platform_minio      Up
```

## 4. Применение миграций базы данных

```bash
npm run db:migrate
```

Это создаст все таблицы в PostgreSQL согласно `prisma/schema.prisma`.

## 5. Заполнение тестовыми данными (опционально)

```bash
npm run db:seed
```

Создаст:
- 1 организацию
- 5 ролей (admin, manager, hr, controller, employee)
- 4 отдела (Центральный аппарат, IT, HR, Разработка)
- 4 тестовых сотрудника

## 6. Запуск сервера разработки

```bash
npm run dev
```

Сервер запустится на **http://localhost:3000**

## 7. Проверка работы

### Health check
```bash
curl http://localhost:3000/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

### Аутентификация (получить токен)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Ответ:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "emp-admin",
      "fullName": "Иванов Иван Иванович",
      "email": "admin@example.com",
      "position": "Генеральный директор"
    }
  }
}
```

### Получить список сотрудников

```bash
curl http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer <access_token>"
```

## API Документация

Основные эндпоинты:

### Аутентификация
- `POST /api/v1/auth/login` — Вход
- `POST /api/v1/auth/register` — Регистрация
- `POST /api/v1/auth/refresh-token` — Обновление токена
- `GET /api/v1/auth/me` — Профиль

### Сотрудники
- `GET /api/v1/employees` — Список (с фильтрами)
- `POST /api/v1/employees` — Создать
- `GET /api/v1/employees/:id` — Получить
- `PATCH /api/v1/employees/:id` — Обновить
- `DELETE /api/v1/employees/:id` — Удалить
- `POST /api/v1/employees/:id/restore` — Восстановить
- `GET /api/v1/employees/:id/history` — История
- `GET /api/v1/employees/:id/subordinates` — Подчинённые

### Примеры фильтров
```
GET /api/v1/employees?search=Иванов
GET /api/v1/employees?status=active
GET /api/v1/employees?departmentId=dept-it
GET /api/v1/employees?page=2&limit=10
GET /api/v1/employees?sortBy=fullName&sortOrder=asc
```

## Полезные команды

### Docker
```bash
# Остановить все сервисы
docker-compose down

# Перезапустить сервис
docker-compose restart postgres

# Посмотреть логи
docker-compose logs -f postgres
```

### База данных
```bash
# Открыть Prisma Studio (GUI для БД)
npm run db:studio

# Создать новую миграцию
npx prisma migrate dev --name my_migration

# Сбросить БД (осторожно! удалит все данные)
npx prisma migrate reset
```

### Разработка
```bash
# Запуск с перезагрузкой при изменении файлов
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен-версии
npm start

# Тесты
npm test

# Проверка кода
npm run lint
```

## Решение проблем

### Ошибка: "Cannot connect to PostgreSQL"
```bash
# Проверить, что PostgreSQL запущен
docker-compose ps

# Перезапустить
docker-compose restart postgres

# Проверить логи
docker-compose logs postgres
```

### Ошибка: "Database already exists"
```bash
# Удалить и создать заново
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
```

### Ошибка: "Port already in use"
```bash
# Изменить порт в docker-compose.yml
# или освободить порт
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

## Следующие шаги

1. **Протестировать API** — используйте Postman или Swagger
2. **Подключить frontend** — запустите React приложение
3. **Добавить новые модули** — задачи, проекты, документооборот

## Контакты

Возникли вопросы? Смотрите `doc/ТЗ_Платформа_Управления_Персоналом.md`
