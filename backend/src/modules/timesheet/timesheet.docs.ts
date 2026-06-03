/**
 * @swagger
 * tags:
 *   - name: Timesheet
 *     description: Учёт рабочего времени
 */

/**
 * @swagger
 * /timesheet:
 *   get:
 *     tags: [Timesheet]
 *     summary: Список таймшитов
 *     description: Возвращает список записей таймшита с фильтрацией и пагинацией
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начало периода
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конец периода
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: ID сотрудника
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Количество записей на странице
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     tags: [Timesheet]
 *     summary: Создать запись таймшита
 *     description: Создаёт новую запись таймшита с указанием даты, часов, проекта и описания
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               hoursWorked:
 *                 type: number
 *               projectId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /timesheet/generate-from-attendance:
 *   post:
 *     tags: [Timesheet]
 *     summary: Сгенерировать из посещаемости
 *     description: Автоматически генерирует записи таймшита на основе данных посещаемости
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /timesheet/month-stats:
 *   get:
 *     tags: [Timesheet]
 *     summary: Статистика за месяц
 *     description: Возвращает статистику таймшита за указанный месяц и год по сотруднику
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Год
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Месяц
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: ID сотрудника
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /timesheet/{id}:
 *   get:
 *     tags: [Timesheet]
 *     summary: Получить запись таймшита по ID
 *     description: Возвращает запись таймшита по её ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID записи
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   patch:
 *     tags: [Timesheet]
 *     summary: Обновить запись таймшита
 *     description: Частично обновляет запись таймшита
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID записи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               hoursWorked:
 *                 type: number
 *               projectId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /timesheet/{id}/approve:
 *   post:
 *     tags: [Timesheet]
 *     summary: Одобрить запись
 *     description: Одобряет запись таймшита
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID записи
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /timesheet/{id}/reject:
 *   post:
 *     tags: [Timesheet]
 *     summary: Отклонить запись
 *     description: Отклоняет запись таймшита с указанием причины
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID записи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
