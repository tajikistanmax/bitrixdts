/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Получить список заявок
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed, cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, critical]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [it, hardware, household, repair, other]
 *       - in: query
 *         name: requesterId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: my
 *         schema:
 *           type: boolean
 *         description: Только мои заявки
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Список заявок
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *
 *   post:
 *     summary: Создать новую заявку
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 description: Заголовок заявки
 *               description:
 *                 type: string
 *                 description: Описание проблемы
 *               type:
 *                 type: string
 *                 enum: [it, hardware, household, repair, other]
 *                 description: Тип заявки
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, critical]
 *                 default: normal
 *     responses:
 *       201:
 *         description: Заявка создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /tickets/statistics:
 *   get:
 *     summary: Получить статистику по заявкам
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Статистика
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Получить заявку по ID
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Данные заявки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *
 *   put:
 *     summary: Обновить заявку
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, critical]
 *     responses:
 *       200:
 *         description: Заявка обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /tickets/{id}/status:
 *   put:
 *     summary: Изменить статус заявки
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed, cancelled]
 *     responses:
 *       200:
 *         description: Статус изменён
 */

/**
 * @swagger
 * /tickets/{id}/assign:
 *   put:
 *     summary: Назначить исполнителя заявки
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneeId
 *             properties:
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Исполнитель назначен
 */

/**
 * @swagger
 * /tickets/{id}/comment:
 *   post:
 *     summary: Добавить комментарий к заявке
 *     tags: [Service Desk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Комментарий добавлен
 */
