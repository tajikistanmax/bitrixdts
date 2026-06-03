/**
 * @swagger
 * tags:
 *   - name: Vacations
 *     description: Управление отпусками
 */

/**
 * @swagger
 * /vacations:
 *   get:
 *     tags: [Vacations]
 *     summary: Список отпусков
 *     description: Возвращает список отпусков с фильтрацией и пагинацией
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Статус
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
 *     tags: [Vacations]
 *     summary: Создать отпуск
 *     description: Создаёт новый отпуск с указанием дат, типа и причины
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               type:
 *                 type: string
 *               reason:
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
 * /vacations/upcoming:
 *   get:
 *     tags: [Vacations]
 *     summary: Предстоящие отпуска
 *     description: Возвращает список предстоящих отпусков
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
 * /vacations/balance:
 *   get:
 *     tags: [Vacations]
 *     summary: Баланс отпусков
 *     description: Возвращает информацию о балансе отпусков текущего сотрудника
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
 * /vacations/{id}:
 *   get:
 *     tags: [Vacations]
 *     summary: Получить отпуск по ID
 *     description: Возвращает отпуск по его ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отпуска
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
 * /vacations/{id}/approve:
 *   post:
 *     tags: [Vacations]
 *     summary: Одобрить отпуск
 *     description: Одобряет заявку на отпуск
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отпуска
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
 * /vacations/{id}/reject:
 *   post:
 *     tags: [Vacations]
 *     summary: Отклонить отпуск
 *     description: Отклоняет заявку на отпуск с указанием причины
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отпуска
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
