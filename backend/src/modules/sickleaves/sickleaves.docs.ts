/**
 * @swagger
 * tags:
 *   - name: Sick Leaves
 *     description: Управление больничными листами
 */

/**
 * @swagger
 * /sickleaves:
 *   get:
 *     tags: [Sick Leaves]
 *     summary: Список больничных
 *     description: Возвращает список больничных листов с фильтрацией и пагинацией
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
 *     tags: [Sick Leaves]
 *     summary: Создать больничный
 *     description: Создаёт новый больничный лист с указанием дат и причины
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
 * /sickleaves/statistics:
 *   get:
 *     tags: [Sick Leaves]
 *     summary: Статистика больничных
 *     description: Возвращает статистику по больничным листам за период
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
 * /sickleaves/{id}:
 *   get:
 *     tags: [Sick Leaves]
 *     summary: Получить больничный по ID
 *     description: Возвращает больничный лист по его ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID больничного
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
 * /sickleaves/{id}/verify:
 *   post:
 *     tags: [Sick Leaves]
 *     summary: Верифицировать больничный
 *     description: Подтверждает подлинность больничного листа
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID больничного
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
 * /sickleaves/{id}/close:
 *   post:
 *     tags: [Sick Leaves]
 *     summary: Закрыть больничный
 *     description: Закрывает больничный лист с указанием даты окончания
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID больничного
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
