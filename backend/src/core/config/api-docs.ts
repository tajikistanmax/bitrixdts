/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Аутентификация и авторизация
 *   - name: Employees
 *     description: Управление сотрудниками
 *   - name: Departments
 *     description: Управление подразделениями
 *   - name: Projects
 *     description: Управление проектами
 *   - name: Tasks
 *     description: Управление задачами
 *   - name: Attendance
 *     description: Учет посещаемости
 *   - name: Timesheet
 *     description: Табель учета рабочего времени
 *   - name: Vacations
 *     description: Заявки на отпуск
 *   - name: Trips
 *     description: Командировки
 *   - name: SickLeaves
 *     description: Больничные листы
 *   - name: Chat
 *     description: Корпоративный чат
 *   - name: Meetings
 *     description: Встречи и совещания
 *   - name: Documents
 *     description: Документооборот
 *   - name: KPI
 *     description: Ключевые показатели эффективности
 *   - name: Reports
 *     description: Отчёты и аналитика
 *   - name: Calendar
 *     description: Календарь событий
 *   - name: Delegation
 *     description: Делегирование полномочий
 *   - name: Resolutions
 *     description: Резолюции и поручения
 *   - name: Service Desk
 *     description: Заявки в техподдержку
 *   - name: Files
 *     description: Управление файлами
 *   - name: Workflow
 *     description: Маршруты согласования
 *   - name: Notifications
 *     description: Уведомления
 *   - name: News
 *     description: Новости компании
 *   - name: Announcements
 *     description: Объявления
 *   - name: Sync
 *     description: Синхронизация данных
 *   - name: Audit
 *     description: Аудит действий
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вход в систему
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 *       401:
 *         description: Неверные учетные данные
 *
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация нового пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 *
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Получить профиль текущего пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Обновить токен доступа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Новый токен доступа
 */

/**
 * @openapi
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: Получить список сотрудников
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Список сотрудников
 *   post:
 *     tags: [Employees]
 *     summary: Создать сотрудника
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Сотрудник создан
 *
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Получить сотрудника по ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Данные сотрудника
 *   put:
 *     tags: [Employees]
 *     summary: Обновить сотрудника
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Сотрудник обновлён
 *   delete:
 *     tags: [Employees]
 *     summary: Удалить сотрудника
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Сотрудник удалён
 */

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: Получить список отделов
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список отделов
 *   post:
 *     tags: [Departments]
 *     summary: Создать отдел
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Отдел создан
 *
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Получить список задач
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список задач
 *   post:
 *     tags: [Tasks]
 *     summary: Создать задачу
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Задача создана
 *
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: Получить список проектов
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список проектов
 *   post:
 *     tags: [Projects]
 *     summary: Создать проект
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Проект создан
 *
 * /attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: Получить записи посещаемости
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список записей посещаемости
 *   post:
 *     tags: [Attendance]
 *     summary: Отметить вход/выход
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Запись создана
 *
 * /timesheet:
 *   get:
 *     tags: [Timesheet]
 *     summary: Получить записи табеля
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список записей табеля
 *   post:
 *     tags: [Timesheet]
 *     summary: Создать запись табеля
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Запись создана
 *
 * /vacations:
 *   get:
 *     tags: [Vacations]
 *     summary: Получить заявки на отпуск
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список заявок
 *   post:
 *     tags: [Vacations]
 *     summary: Создать заявку на отпуск
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Заявка создана
 *
 * /trips:
 *   get:
 *     tags: [Trips]
 *     summary: Получить командировки
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список командировок
 *   post:
 *     tags: [Trips]
 *     summary: Создать командировку
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Командировка создана
 *
 * /sickleaves:
 *   get:
 *     tags: [SickLeaves]
 *     summary: Получить больничные листы
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список больничных
 *   post:
 *     tags: [SickLeaves]
 *     summary: Создать больничный лист
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Больничный создан
 *
 * /chat/channels:
 *   get:
 *     tags: [Chat]
 *     summary: Получить список каналов
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список каналов
 *   post:
 *     tags: [Chat]
 *     summary: Создать канал
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Канал создан
 *
 * /meetings:
 *   get:
 *     tags: [Meetings]
 *     summary: Получить список встреч
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список встреч
 *   post:
 *     tags: [Meetings]
 *     summary: Создать встречу
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Встреча создана
 *
 * /documents:
 *   get:
 *     tags: [Documents]
 *     summary: Получить список документов
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список документов
 *   post:
 *     tags: [Documents]
 *     summary: Создать документ
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Документ создан
 *
 * /kpi:
 *   get:
 *     tags: [KPI]
 *     summary: Получить KPI метрики
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список метрик
 *   post:
 *     tags: [KPI]
 *     summary: Создать метрику
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Метрика создана
 *
 * /reports:
 *   get:
 *     tags: [Reports]
 *     summary: Получить список отчётов
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список отчётов
 *   post:
 *     tags: [Reports]
 *     summary: Создать отчёт
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Отчёт создан
 *
 * /calendar:
 *   get:
 *     tags: [Calendar]
 *     summary: Получить события календаря
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список событий
 *   post:
 *     tags: [Calendar]
 *     summary: Создать событие
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Событие создано
 *
 * /delegation:
 *   get:
 *     tags: [Delegation]
 *     summary: Получить делегирования
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список делегирований
 *   post:
 *     tags: [Delegation]
 *     summary: Создать делегирование
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Делегирование создано
 *
 * /resolutions:
 *   get:
 *     tags: [Resolutions]
 *     summary: Получить резолюции
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список резолюций
 *   post:
 *     tags: [Resolutions]
 *     summary: Создать резолюцию
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Резолюция создана
 *
 * /tickets:
 *   get:
 *     tags: [Service Desk]
 *     summary: Получить заявки
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список заявок
 *   post:
 *     tags: [Service Desk]
 *     summary: Создать заявку
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Заявка создана
 *
 * /files:
 *   get:
 *     tags: [Files]
 *     summary: Получить список файлов
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список файлов
 *   post:
 *     tags: [Files]
 *     summary: Загрузить файл
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Файл загружен
 *
 * /workflow:
 *   get:
 *     tags: [Workflow]
 *     summary: Получить маршруты согласования
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список маршрутов
 *   post:
 *     tags: [Workflow]
 *     summary: Создать маршрут
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Маршрут создан
 *
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Получить уведомления
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список уведомлений
 *
 * /news:
 *   get:
 *     tags: [News]
 *     summary: Получить новости
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список новостей
 *   post:
 *     tags: [News]
 *     summary: Создать новость
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Новость создана
 *
 * /announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: Получить объявления
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список объявлений
 *   post:
 *     tags: [Announcements]
 *     summary: Создать объявление
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Объявление создано
 *
 * /sync/queue:
 *   get:
 *     tags: [Sync]
 *     summary: Получить очередь синхронизации
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Очередь синхронизации
 *
 * /sync/stats:
 *   get:
 *     tags: [Sync]
 *     summary: Получить статистику синхронизации
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика синхронизации
 *
 * /audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: Получить логи аудита
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Логи аудита
 */

export default {};
