/**
 * @swagger
 * tags:
 *   - name: Sync
 *     description: Синхронизация данных
 */

/**
 * @swagger
 * /sync/queue:
 *   get:
 *     tags: [Sync]
 *     summary: Очередь синхронизации
 *     description: Возвращает список элементов в очереди синхронизации с фильтрацией и пагинацией
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Статус
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
 *     tags: [Sync]
 *     summary: Добавить в очередь
 *     description: Добавляет новый элемент в очередь синхронизации
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               payload:
 *                 type: object
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
 * /sync/queue/{itemId}/process:
 *   post:
 *     tags: [Sync]
 *     summary: Обработать элемент очереди
 *     description: Запускает обработку указанного элемента очереди синхронизации
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID элемента очереди
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
 * /sync/queue/process-all:
 *   post:
 *     tags: [Sync]
 *     summary: Обработать всю очередь
 *     description: Запускает обработку всех ожидающих элементов очереди синхронизации
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
 * /sync/stats:
 *   get:
 *     tags: [Sync]
 *     summary: Статистика синхронизации
 *     description: Возвращает статистику по процессам синхронизации
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
 * /sync/force-sync:
 *   post:
 *     tags: [Sync]
 *     summary: Принудительная синхронизация
 *     description: Запускает принудительную синхронизацию по указанному типу
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
