# CMR-DTS — Корпоративная платформа управления персоналом

## 📋 О проекте

CMR-DTS — это полнофункциональная корпоративная платформа для управления персоналом, автоматизации HR-процессов и внутренних коммуникаций. Система предоставляет инструменты для учёта сотрудников, управления отпусками, командировками, больничными, проектами, задачами, KPI, документооборотом и служебными запросами с разграничением прав доступа и real-time уведомлениями.

## 🚀 Быстрый старт

### Требования

- **PostgreSQL** 15+
- **Node.js** 20+
- **npm**
- **Redis** (опционально, для очередей и кэша)

### Установка и запуск

**Бэкенд:**

```bash
git clone <repository-url>
cd backend
npm install
cp .env.example .env
npx prisma db push
npx ts-node src/db/seed.ts
npm run dev
```

**Фронтенд:**

```bash
cd frontend
npm install
npm run dev
```

Фронтенд доступен по адресу http://localhost:3001, API бэкенда — http://localhost:3000.

### Docker

```bash
cd backend
docker compose up -d
```

Docker Compose запускает PostgreSQL, Redis, MinIO (S3-совместимое хранилище файлов) и сервер бэкенда.

### Тестовые учётные данные

После запуска `seed.ts` доступны следующие учётные записи:

| Роль      | Email                  | Пароль     |
|-----------|------------------------|------------|
| Admin     | admin@hr-platform.com  | password   |
| Manager   | manager@hr-platform.com| password   |
| Employee  | employee@hr-platform.com| password  |
| HR        | hr@hr-platform.com     | password   |

## 🏗 Архитектура

- **Backend:** Express + TypeScript + Prisma ORM + PostgreSQL + Socket.IO + Redis + MinIO
- **Frontend:** React 19 + TypeScript + Vite + TanStack Query + Zustand + React Router + Tailwind CSS
- **Real-time:** Socket.IO для мгновенных уведомлений и чата
- **API документация:** Swagger (http://localhost:3000/api-docs)
- **Аутентификация:** JWT (access + refresh токены)
- **Файловое хранилище:** MinIO (S3-совместимое)

## 📁 Структура проекта

```
backend/
├── prisma/                  # Prisma schema и миграции
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── core/                # Ядро: конфиги, middleware, типы, утилиты
│   │   ├── config/          # Swagger, маршруты, CORS
│   │   ├── middleware/      # Auth, error handler, sanitize, rate limiter
│   │   ├── types/           # Глобальные типы TypeScript
│   │   └── utils/           # Вспомогательные функции
│   ├── db/                  # Подключение к БД, seed
│   ├── modules/             # 26 функциональных модулей
│   │   ├── auth/            # Аутентификация и регистрация
│   │   ├── employees/       # Управление сотрудниками
│   │   ├── departments/     # Отделы и структура
│   │   ├── vacations/       # Отпуска
│   │   ├── sickleaves/      # Больничные
│   │   ├── trips/           # Командировки
│   │   ├── attendance/      # Учёт рабочего времени
│   │   ├── timesheet/       # Табель
│   │   ├── documents/       # Документооборот
│   │   ├── projects/        # Проекты и задачи
│   │   ├── tasks/           # Задачи
│   │   ├── kpi/             # KPI и метрики
│   │   ├── meetings/        # Встречи и совещания
│   │   ├── chat/            # Корпоративный чат
│   │   ├── notifications/   # Уведомления (in-app + email)
│   │   ├── announcements/   # Объявления
│   │   ├── news/            # Новости
│   │   ├── calendar/        # Календарь событий
│   │   ├── service-desk/    # Сервис-деск / заявки
│   │   ├── reports/         # Отчёты и аналитика
│   │   ├── workflow/        # Бизнес-процессы
│   │   ├── delegation/      # Делегирование полномочий
│   │   ├── audit-log/       # Аудит действий
│   │   ├── resolutions/     # Приказы и распоряжения
│   │   ├── sync/            # Синхронизация с облаком
│   │   └── files/           # Загрузка и управление файлами
│   ├── server.ts            # Точка входа
│   └── tests/               # Тесты
├── scripts/                 # Вспомогательные скрипты
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── jest.config.js
├── tsconfig.json
└── package.json

frontend/
├── src/
│   ├── components/          # Переиспользуемые UI-компоненты
│   ├── pages/               # Страницы приложения
│   ├── services/            # API-клиенты (Axios)
│   ├── store/               # Zustand store
│   ├── lib/                 # Утилиты и хелперы
│   ├── types/               # TypeScript типы
│   ├── assets/              # Статические ресурсы
│   ├── test/                # Настройка тестов
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
└── package.json
```

## 🔧 Команды

### Backend

| Команда                              | Описание                               |
|--------------------------------------|----------------------------------------|
| `npm run dev`                        | Запуск сервера в режиме разработки     |
| `npm run build`                      | Компиляция TypeScript                  |
| `npm start`                          | Запуск собранного сервера              |
| `npm test`                           | Запуск unit/integration тестов (Jest)  |
| `npm run test:watch`                 | Тесты в watch-режиме                   |
| `npm run test:coverage`              | Тесты с отчётом о покрытии             |
| `npm run lint`                       | Проверка кода ESLint                   |
| `npm run lint:fix`                   | Автоисправление lint-ошибок            |
| `npx prisma db push`                 | Синхронизация схемы Prisma с БД        |
| `npx prisma migrate dev`             | Создание миграции                      |
| `npx prisma migrate deploy`          | Применение миграций (prod)             |
| `npx prisma studio`                  | GUI для работы с БД                    |
| `npx ts-node src/db/seed.ts`         | Заполнение БД тестовыми данными        |
| `npm run db:check`                   | Проверка подключения к БД              |
| `npm run services:check`             | Проверка всех сервисов (БД, Redis, S3) |

### Frontend

| Команда            | Описание                           |
|--------------------|------------------------------------|
| `npm run dev`      | Запуск dev-сервера (порт 3001)     |
| `npm run build`    | Сборка для production              |
| `npm run lint`     | Проверка кода ESLint               |
| `npm run test`     | Запуск компонентных тестов (Vitest)|
| `npm run preview`  | Предпросмотр собранного приложения |

### E2E

| Команда                     | Описание                 |
|-----------------------------|--------------------------|
| `npx playwright test`       | Запуск E2E тестов        |

## 🧪 Тестирование

- **Backend:** 34+ unit/integration тестов на Jest + Supertest
- **Frontend:** Компонентные тесты на Vitest + React Testing Library (jsdom)
- **E2E:** Playwright для сквозного тестирования
- **Покрытие:** порог 40% (branches, functions, lines, statements)

## 📚 API

Swagger-документация доступна по адресу http://localhost:3000/api-docs после запуска бэкенда. Все эндпоинты сгруппированы по модулям с описанием схем запросов и ответов.

## 🔐 Безопасность

- **JWT аутентификация** с access (15 мин) и refresh (7 дней) токенами
- **Role-Based Access Control (RBAC):** admin, manager, hr, employee
- **Rate limiting:** 200 запросов на 15 минут (express-rate-limit)
- **Input sanitization:** очистка HTML-ввода (sanitize-html)
- **Helmet:** защита HTTP-заголовков
- **CORS:** ограниченный список разрешённых источников
- **Tenant isolation:** разделение данных по организациям
- **Redis пароль:** защищённое подключение к кэшу
- **Аудит действий:** логирование всех критических операций

## 🐳 CI/CD

GitHub Actions автоматизирует полный пайплайн:

1. **Backend Lint & Test** — линтинг, type check, прогон тестов с PostgreSQL-контейнером
2. **Frontend Lint & Build** — линтинг, type check, сборка
3. **Docker Build & Push** — сборка Docker-образа и публикация в `ghcr.io` (на push в main)
4. **Deploy** — заглушка для деплоя (расширяется под целевую инфраструктуру)

Образы публикуются в GitHub Container Registry:
```
ghcr.io/<owner>/<repo>/hr-platform-api:latest
ghcr.io/<owner>/<repo>/hr-platform-api:<sha>
```
