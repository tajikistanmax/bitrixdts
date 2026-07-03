/**
 * @swagger
 * tags:
 *   - name: Payroll
 *     description: Управление зарплатными ведомостями
 */

/**
 * @swagger
 * /payroll:
 *   get:
 *     summary: Получить список ведомостей
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, calculated, approved, paid]
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Список ведомостей
 *   post:
 *     summary: Создать ведомость за период
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period
 *             properties:
 *               period:
 *                 type: string
 *                 format: date
 *                 description: Первый день месяца (YYYY-MM-01)
 *                 example: "2025-06-01"
 *     responses:
 *       201:
 *         description: Ведомость создана
 */

/**
 * @swagger
 * /payroll/{id}:
 *   get:
 *     summary: Получить ведомость по ID (с записями)
 *     tags: [Payroll]
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
 *         description: Ведомость с записями
 */

/**
 * @swagger
 * /payroll/{id}/auto-fill:
 *   post:
 *     summary: Автозаполнение ведомости из штатного расписания
 *     tags: [Payroll]
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
 *         description: Ведомость заполнена окладами
 */

/**
 * @swagger
 * /payroll/{id}/entries:
 *   post:
 *     summary: Добавить запись (премия, удержание, аванс и т.д.)
 *     tags: [Payroll]
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
 *               - employeeId
 *               - type
 *               - amount
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [salary, bonus, overtime, deduction, advance, vacation_pay, sick_pay, tax, pension, other]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               hoursWorked:
 *                 type: number
 *               rate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Запись добавлена
 */

/**
 * @swagger
 * /payroll/{id}/entries/{entryId}:
 *   delete:
 *     summary: Удалить запись из ведомости
 *     tags: [Payroll]
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
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Запись удалена
 */

/**
 * @swagger
 * /payroll/{id}/calculate:
 *   post:
 *     summary: Рассчитать ведомость (сумма начислений и удержаний)
 *     tags: [Payroll]
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
 *         description: Ведомость рассчитана
 */

/**
 * @swagger
 * /payroll/{id}/approve:
 *   post:
 *     summary: Утвердить ведомость (только admin)
 *     tags: [Payroll]
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
 *         description: Ведомость утверждена
 */

/**
 * @swagger
 * /payroll/{id}/pay:
 *   post:
 *     summary: Отметить ведомость как выплаченную
 *     tags: [Payroll]
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
 *         description: Ведомость выплачена
 */

/**
 * @swagger
 * /payroll/employee/{employeeId}:
 *   get:
 *     summary: Получить зарплатные квитки сотрудника
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Зарплатные квитки
 */
