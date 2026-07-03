/**
 * @swagger
 * tags:
 *   - name: Folders
 *     description: Папки для организации документов
 */

/**
 * @swagger
 * /folders/tree:
 *   get:
 *     summary: Получить дерево папок
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Дерево папок (вложенная структура)
 */

/**
 * @swagger
 * /folders:
 *   get:
 *     summary: Получить папки (по родителю или корневые)
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID родительской папки (пусто = корневые)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени
 *     responses:
 *       200:
 *         description: Список папок
 *   post:
 *     summary: Создать папку
 *     tags: [Folders]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Договоры 2025"
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               color:
 *                 type: string
 *                 example: "#3b82f6"
 *               isShared:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Папка создана
 */

/**
 * @swagger
 * /folders/{id}:
 *   get:
 *     summary: Получить папку по ID (с вложенными)
 *     tags: [Folders]
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
 *         description: Данные папки с дочерними папками
 *   put:
 *     summary: Обновить папку
 *     tags: [Folders]
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
 *               name:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               color:
 *                 type: string
 *               isShared:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Папка обновлена
 *   delete:
 *     summary: Удалить папку (без вложений)
 *     tags: [Folders]
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
 *         description: Папка удалена
 */

/**
 * @swagger
 * /folders/{id}/breadcrumbs:
 *   get:
 *     summary: Получить хлебные крошки (путь от корня)
 *     tags: [Folders]
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
 *         description: Массив {id, name} от корня до текущей папки
 */
