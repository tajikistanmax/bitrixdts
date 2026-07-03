/**
 * @swagger
 * tags:
 *   - name: Staff
 *     description: Штатное расписание и организационная структура
 */

/**
 * @swagger
 * /staff/statistics:
 *   get:
 *     summary: Статистика штатного расписания
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика (всего позиций, занято, вакансий, процент заполнения)
 */

/**
 * @swagger
 * /staff/org-chart:
 *   get:
 *     summary: Организационная структура (для визуализации)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Дерево подразделений с позициями и сотрудниками
 */

/**
 * @swagger
 * /staff/positions:
 *   get:
 *     summary: Получить все позиции штатного расписания
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Список позиций с назначенными сотрудниками
 *   post:
 *     summary: Создать позицию в штатном расписании
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentId
 *               - title
 *             properties:
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *                 example: "Ведущий разработчик"
 *               grade:
 *                 type: string
 *                 example: "Senior"
 *               minSalary:
 *                 type: number
 *                 example: 150000
 *               maxSalary:
 *                 type: number
 *                 example: 250000
 *               headcount:
 *                 type: integer
 *                 default: 1
 *               description:
 *                 type: string
 *               requirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Позиция создана
 */

/**
 * @swagger
 * /staff/positions/{id}:
 *   get:
 *     summary: Получить позицию по ID (с назначениями)
 *     tags: [Staff]
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
 *         description: Данные позиции
 *   put:
 *     summary: Обновить позицию
 *     tags: [Staff]
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
 *               grade:
 *                 type: string
 *               minSalary:
 *                 type: number
 *               maxSalary:
 *                 type: number
 *               headcount:
 *                 type: integer
 *               description:
 *                 type: string
 *               requirements:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Позиция обновлена
 *   delete:
 *     summary: Удалить позицию (без активных назначений)
 *     tags: [Staff]
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
 *         description: Позиция удалена
 */

/**
 * @swagger
 * /staff/positions/{id}/assign:
 *   post:
 *     summary: Назначить сотрудника на позицию
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: ID позиции
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - salary
 *               - startDate
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               salary:
 *                 type: number
 *                 example: 180000
 *               rate:
 *                 type: number
 *                 default: 1.0
 *                 description: "Ставка (0.5 = полставки, 1.0 = полная)"
 *               startDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Сотрудник назначен
 */

/**
 * @swagger
 * /staff/assignments/{assignmentId}:
 *   delete:
 *     summary: Снять назначение сотрудника с позиции
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Назначение снято
 */
