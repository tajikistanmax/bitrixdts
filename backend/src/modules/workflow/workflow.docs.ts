/**
 * @swagger
 * tags:
 *   - name: Workflow
 *     description: Система согласований (Workflow Engine)
 */

/**
 * @swagger
 * /workflow/routes:
 *   get:
 *     summary: Получить все маршруты согласований
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список маршрутов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Создать новый маршрут согласования
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - entityType
 *               - steps
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название маршрута
 *               entityType:
 *                 type: string
 *                 description: Тип сущности (document, vacation, task)
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: integer
 *                     type:
 *                       type: string
 *                       enum: [employee, position, department, role, condition]
 *                     employeeId:
 *                       type: string
 *                     position:
 *                       type: string
 *                     departmentId:
 *                       type: string
 *     responses:
 *       201:
 *         description: Маршрут создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /workflow/start:
 *   post:
 *     summary: Запустить workflow для сущности
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeId
 *               - entityId
 *               - entityType
 *             properties:
 *               routeId:
 *                 type: string
 *                 format: uuid
 *               entityId:
 *                 type: string
 *               entityType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workflow запущен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /workflow/instances/{id}/approve/{stepOrder}:
 *   put:
 *     summary: Одобрить текущий шаг согласования
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: stepOrder
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Шаг одобрен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /workflow/instances/{id}/reject/{stepOrder}:
 *   put:
 *     summary: Отклонить текущий шаг согласования
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: stepOrder
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Шаг отклонён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /workflow/routes/my-active:
 *   get:
 *     summary: Получить активные согласования для текущего пользователя
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Активные согласования
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
