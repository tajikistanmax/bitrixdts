/**
 * @swagger
 * tags:
 *   - name: Attendance
 *     description: Учёт рабочего времени
 */

/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     tags: [Attendance]
 *     summary: Отметить начало работы
 *     description: Фиксирует время начала рабочего дня сотрудника
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
 * /attendance/check-out:
 *   post:
 *     tags: [Attendance]
 *     summary: Отметить конец работы
 *     description: Фиксирует время окончания рабочего дня сотрудника
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
 * /attendance/today:
 *   get:
 *     tags: [Attendance]
 *     summary: Отметки за сегодня
 *     description: Возвращает отметки посещаемости за текущий день
 *     security:
 *       - bearerAuth: []
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
 * /attendance/statistics:
 *   get:
 *     tags: [Attendance]
 *     summary: Статистика посещаемости
 *     description: Возвращает статистику посещаемости за указанный период по сотруднику
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
 * /attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: Список отметок
 *     description: Возвращает список отметок посещаемости с фильтрацией и пагинацией
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
 */

/**
 * @swagger
 * /attendance/{id}:
 *   get:
 *     tags: [Attendance]
 *     summary: Получить отметку по ID
 *     description: Возвращает отметку посещаемости по её ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отметки
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
