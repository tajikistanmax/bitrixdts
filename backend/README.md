# HR Platform Backend

Корпоративная платформа для управления персоналом, задачами и документооборотом.

## 🚀 Технологии

- **Node.js 20** + **Express** + **TypeScript**
- **PostgreSQL 15** (Prisma ORM)
- **Redis** (кэш и очереди)
- **Socket.IO** (real-time)
- **Docker** (контейнеризация)
- **JWT** (аутентификация)
- **MinIO** (хранилище файлов)

## 📋 Модули

✅ **Готово:**
- Auth (JWT, refresh token)
- Employees (сотрудники, оргструктура, история)
- Tasks (Kanban, комментарии, соисполнители)
- Projects (участники, прогресс, статистика)
- Attendance (check-in/out, журнал, статистика)
- Timesheet (табель, генерация из посещаемости)
- Vacations (отпуска, баланс, согласование)
- Trips (командировки, отчёты)
- SickLeaves (больничные, верификация)

⏳ **В планах:**
- Documents (документооборот, ЭЦП)
- Chat (мессенджер)
- Meetings (видеосовещания)
- KPI (метрики эффективности)
- Reports (отчёты)
- Sync (офлайн-синхронизация)

## 🚀 Быстрый старт

### 1. Запуск через Docker

```bash
# Запуск PostgreSQL
docker-compose up -d

# Применить миграции
npm run db:migrate

# Засеять тестовые данные
npm run db:seed

# Запустить сервер
npm run dev
```

Сервер запустится на **http://localhost:3000**

**Тестовые пользователи:**
- admin@example.com / admin123 (админ)
- it.manager@example.com / manager123 (менеджер)
- dev@example.com / employee123 (сотрудник)

## 🛠️ Установка

### 1. Клонировать репозиторий
```bash
git clone <repository-url>
cd backend
```

### 2. Установить зависимости
```bash
npm install
```

### 3. Настроить переменные окружения
```bash
cp .env.example .env
# Отредактируйте .env под вашу конфигурацию
```

### 4. Запустить базу данных (Docker)
```bash
docker-compose up -d postgres redis minio
```

### 5. Применить миграции Prisma
```bash
npm run db:migrate
```

### 6. Запустить сервер разработки
```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

## 📦 Скрипты

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка TypeScript
npm run start        # Запуск продакшн-версии
npm run db:migrate   # Применить миграции
npm run db:studio    # Prisma Studio (GUI для БД)
npm run test         # Запуск тестов
npm run test:watch   # Тесты в режиме наблюдения
npm run lint         # Проверка кода
npm run lint:fix     # Исправление проблем линтера
```

## 🏗️ Структура проекта

```
backend/
├── prisma/
│   └── schema.prisma          # Схема базы данных
├── src/
│   ├── modules/               # Бизнес-модули
│   │   ├── auth/              # Аутентификация
│   │   ├── employees/         # Сотрудники
│   │   ├── tasks/             # Задачи
│   │   ├── projects/          # Проекты
│   │   ├── attendance/        # Посещаемость
│   │   ├── timesheet/         # Табель
│   │   ├── vacations/         # Отпуска
│   │   ├── trips/             # Командировки
│   │   ├── documents/         # Документооборот
│   │   ├── chat/              # Чат
│   │   ├── meetings/          # Видеосовещания
│   │   ├── kpi/               # KPI
│   │   ├── reports/           # Отчёты
│   │   └── sync/              # Синхронизация
│   ├── core/                  # Ядро
│   │   ├── config/            # Конфигурация
│   │   ├── middleware/        # Middleware
│   │   ├── utils/             # Утилиты
│   │   └── types/             # Типы
│   ├── db/                    # База данных
│   │   ├── seed.ts            # Seed данные
│   └── server.ts              # Точка входа
├── docker-compose.yml         # Docker конфигурация
├── package.json
└── tsconfig.json
```

## 🔐 Аутентификация

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "fullName": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "password123",
  "organizationId": "uuid-organization-id"
}
```

### Get Profile
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

## 🗄️ База данных

Схема БД определена в `prisma/schema.prisma`. Основные сущности:

- **Organization** — организации (мультиарендность)
- **Employee** — сотрудники
- **Department** — подразделения (оргструктура)
- **Task** — задачи
- **Project** — проекты
- **Document** — документы
- **ChatChannel** — чаты
- **Timesheet** — табели
- **VacationRequest** — отпуска
- **SickLeave** — больничные
- **BusinessTrip** — командировки

## 🔧 Конфигурация

Основные переменные окружения:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hr_platform
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

## 📝 Разработка

### Добавление нового модуля

1. Создать папку в `src/modules/<module-name>/`
2. Создать файлы:
   - `<module-name>.routes.ts` — маршруты
   - `<module-name>.controller.ts` — контроллеры
   - `<module-name>.service.ts` — бизнес-логика
   - `<module-name>.validation.ts` — валидация
3. Зарегистрировать маршрут в `src/core/config/routes.ts`

### Миграции

```bash
# Создать новую миграцию
npx prisma migrate dev --name <migration-name>

# Применить миграции в продакшене
npx prisma migrate deploy

# Сбросить БД (разработка!)
npx prisma migrate reset
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Тесты с coverage
npm run test:coverage

# TDD режим
npm run test:watch
```

## 🚢 Docker

### Запустить все сервисы
```bash
docker-compose up -d
```

### Остановить все сервисы
```bash
docker-compose down
```

### Пересобрать образы
```bash
docker-compose up --build -d
```

## 📚 Документация

- ТЗ: `../doc/ТЗ_Платформа_Управления_Персоналом.md`
- Swagger (после запуска): `http://localhost:3000/api/v1/docs`

## 👥 Команда

Разрабатывается для автоматизации корпоративных процессов.

## 📄 Лицензия

Proprietary
