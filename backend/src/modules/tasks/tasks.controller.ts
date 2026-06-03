import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import tasksService, { CreateTaskData, UpdateTaskData, TaskFilters } from './tasks.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('title').notEmpty().withMessage('Название задачи обязательно'),
  body('description').optional().isString().withMessage('Неверное описание'),
  body('projectId').optional().isUUID().withMessage('Неверный ID проекта'),
  body('assigneeId').optional().isUUID().withMessage('Неверный ID исполнителя'),
  body('controllerId').optional().isUUID().withMessage('Неверный ID контролёра'),
  body('coAssigneeIds').optional().isArray().withMessage('Соисполнители должны быть массивом'),
  body('coAssigneeIds.*').optional().isUUID().withMessage('Неверный ID соисполнителя'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'critical']).withMessage('Неверный приоритет'),
  body('status').optional().isIn(['new', 'in_progress', 'approved', 'done', 'rejected', 'overdue']).withMessage('Неверный статус'),
  body('startDate').optional().isISO8601().withMessage('Неверная дата начала'),
  body('dueDate').optional().isISO8601().withMessage('Неверная дата окончания'),
  body('parentTaskId').optional().isUUID().withMessage('Неверный ID родительской задачи'),
  body('tags').optional().isArray().withMessage('Теги должны быть массивом'),
  body('checklist').optional().isArray().withMessage('Чек-лист должен быть массивом'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const updateValidation = [
  param('id').isUUID().withMessage('Неверный ID задачи'),
  body('title').optional().notEmpty().withMessage('Название не может быть пустым'),
  body('description').optional().isString().withMessage('Неверное описание'),
  body('status').optional().isIn(['new', 'in_progress', 'approved', 'done', 'rejected', 'overdue']).withMessage('Неверный статус'),
];

export const createCommentValidation = [
  param('taskId').isUUID().withMessage('Неверный ID задачи'),
  body('body').notEmpty().withMessage('Комментарий обязателен'),
];

export const attachmentValidation = [
  param('taskId').isUUID().withMessage('Неверный ID задачи'),
  body('fileName').notEmpty().withMessage('Имя файла обязательно'),
  body('fileUrl').notEmpty().withMessage('URL файла обязателен'),
  body('fileType').notEmpty().withMessage('Тип файла обязателен'),
  body('fileSize').isInt({ min: 0 }).withMessage('Неверный размер файла'),
];

export const sprintValidation = [
  body('name').notEmpty().withMessage('Название спринта обязательно'),
  body('startDate').isISO8601().withMessage('Неверная дата начала'),
  body('endDate').isISO8601().withMessage('Неверная дата окончания'),
];

export const timeValidation = [
  param('taskId').isUUID().withMessage('Неверный ID задачи'),
  body('minutes').isInt({ min: 1 }).withMessage('Время должно быть больше 0'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID задачи'),
];

export const commentValidation = [
  param('taskId').isUUID().withMessage('Неверный ID задачи'),
  body('body').notEmpty().withMessage('Текст комментария обязателен'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: CreateTaskData = req.body;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const task = await tasksService.create(data, userId);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters: TaskFilters = {
      search: req.query.search as string,
      projectId: req.query.projectId as string,
      assigneeId: req.query.assigneeId as string,
      controllerId: req.query.controllerId as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      departmentId: req.query.departmentId as string,
      startDateFrom: req.query.startDateFrom as string,
      startDateTo: req.query.startDateTo as string,
      dueDateFrom: req.query.dueDateFrom as string,
      dueDateTo: req.query.dueDateTo as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Парсинг тегов
    if (req.query.tags) {
      filters.tags = (req.query.tags as string).split(',');
    }

    const result = await tasksService.findAll(userOrgId!, filters);

    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const task = await tasksService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const data: UpdateTaskData = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const task = await tasksService.update(id, userOrgId!, data, userId);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    await tasksService.delete(id, userOrgId!);

    res.json({
      success: true,
      message: 'Задача удалена',
    });
  } catch (error) {
    next(error);
  }
};

export const restore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const task = await tasksService.restore(id, userOrgId!);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Комментарии
export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const taskId = req.params.taskId;
    const body = req.body.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const comment = await tasksService.addComment(taskId, userOrgId!, body, userId);

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const taskId = req.params.taskId;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const comments = await tasksService.getComments(taskId, userOrgId!);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// Канбан-доска
export const getKanbanBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const projectId = req.query.projectId as string;

    const board = await tasksService.getKanbanBoard(userOrgId!, projectId);

    res.json({
      success: true,
      data: board,
    });
  } catch (error) {
    next(error);
  }
};

// Статистика
export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const departmentId = req.query.departmentId as string;

    const stats = await tasksService.getStatistics(userOrgId!, departmentId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Вложения
export const uploadAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const taskId = req.params.taskId;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId!;

    const { fileName, fileUrl, fileType, fileSize } = req.body;

    const attachment = await tasksService.uploadAttachment(
      taskId,
      userOrgId!,
      fileName,
      fileUrl,
      fileType,
      fileSize,
      userId
    );

    res.status(201).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttachments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const attachments = await tasksService.getAttachments(taskId, userOrgId!);

    res.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId;
    const attachmentId = req.params.attachmentId;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    await tasksService.deleteAttachment(attachmentId, taskId, userOrgId!);

    res.json({
      success: true,
      message: 'Вложение удалено',
    });
  } catch (error) {
    next(error);
  }
};

// Спринты
export const createSprint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const projectId = req.body.projectId;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const { name, startDate, endDate, goal } = req.body;

    const sprint = await tasksService.createSprint(
      projectId,
      userOrgId!,
      name,
      startDate,
      endDate,
      goal
    );

    res.status(201).json({
      success: true,
      data: sprint,
    });
  } catch (error) {
    next(error);
  }
};

export const getSprints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const sprints = await tasksService.getSprints(projectId, userOrgId!);

    res.json({
      success: true,
      data: sprints,
    });
  } catch (error) {
    next(error);
  }
};

export const getSprint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sprintId = req.params.sprintId;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const sprint = await tasksService.getSprintById(sprintId, userOrgId!);

    res.json({
      success: true,
      data: sprint,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSprintStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sprintId = req.params.sprintId;
    const status = req.body.status;

    const sprint = await tasksService.updateSprintStatus(sprintId, status);

    res.json({
      success: true,
      data: sprint,
    });
  } catch (error) {
    next(error);
  }
};

// Учёт времени
export const logTime = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const taskId = req.params.taskId;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const { minutes, comment } = req.body;

    const result = await tasksService.logTime(taskId, userOrgId!, minutes, comment);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskTimeReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const report = await tasksService.getTaskTimeReport(taskId, userOrgId!);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

