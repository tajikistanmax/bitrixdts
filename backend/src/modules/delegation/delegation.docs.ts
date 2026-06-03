/**
 * @swagger
 * tags:
 *   - name: Delegation
 *     description: Делегирование и заместители
 */

/**
 * @swagger
 * /delegation:
 *   get:
 *     summary: Получить все делегирования
 *     tags: [Delegation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: activeNow
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Список делегирований
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Создать делегирование
 *     tags: [Delegation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delegatorId
 *               - delegateeId
 *               - type
 *               - startDate
 *               - endDate
 *             properties:
 *               delegatorId:
 *                 type: string
 *                 format: uuid
 *               delegateeId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [task, approval, position, all]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               autoApply:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Делегирование создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /delegation/my-active:
 *   get:
 *     summary: Получить активные делегирования для текущего пользователя
 *     tags: [Delegation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Активные делегирования
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /delegation/position:
 *   post:
 *     summary: Установить заместителя для должности
 *     tags: [Delegation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *               - deputyId
 *               - startDate
 *               - endDate
 *             properties:
 *               position:
 *                 type: string
 *               deputyId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Заместитель установлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /delegation/employee/{id}/deputies:
 *   get:
 *     summary: Получить заместителей сотрудника
 *     tags: [Delegation]
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
 *         description: Список заместителей
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
