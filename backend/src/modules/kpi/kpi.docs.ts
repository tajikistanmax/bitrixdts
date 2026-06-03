/**
 * @swagger
 * tags:
 *   - name: KPI
 *     description: Управление KPI и метриками
 */

/**
 * @swagger
 * /kpi:
 *   get:
 *     tags: [KPI]
 *     summary: Список метрик KPI
 *     description: Возвращает список метрик KPI с фильтрацией по отделу или сотруднику
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: ID отдела
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
 *   post:
 *     tags: [KPI]
 *     summary: Создать метрику KPI
 *     description: Создаёт новую метрику KPI с указанием названия, описания, целевого значения, веса и отдела
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               targetValue:
 *                 type: number
 *               weight:
 *                 type: number
 *               departmentId:
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
 * /kpi/{metricId}:
 *   get:
 *     tags: [KPI]
 *     summary: Получить метрику KPI по ID
 *     description: Возвращает метрику KPI по её ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID метрики
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   put:
 *     tags: [KPI]
 *     summary: Обновить метрику KPI
 *     description: Обновляет существующую метрику KPI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: string
 *         discipline: ID метрики
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               targetValue:
 *                 type: number
 *               weight:
 *                 type: number
 *               departmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   delete:
 *     tags: [KPI]
 *     summary: Удалить метрику KPI
 *     description: Удаляет метрику KPI по её ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID метрики
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
 * /kpi/values:
 *   post:
 *     tags: [KPI]
 *     summary: Записать прогресс KPI
 *     description: Записывает фактическое значение прогресса по метрике KPI за период
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metricId:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               actualValue:
 *                 type: number
 *               period:
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
 * /kpi/{metricId}/values:
 *   get:
 *     tags: [KPI]
 *     summary: История прогресса KPI
 *     description: Возвращает историю значений прогресса по метрике KPI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID метрики
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
 * /kpi/calculate/employee/{employeeId}:
 *   post:
 *     tags: [KPI]
 *     summary: Рассчитать KPI сотрудника
 *     description: Выполняет расчёт KPI для указанного сотрудника
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
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
 * /kpi/calculate/department/{departmentId}:
 *   post:
 *     tags: [KPI]
 *     summary: Рассчитать KPI отдела
 *     description: Выполняет расчёт KPI для указанного отдела
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отдела
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
