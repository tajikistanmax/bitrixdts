import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import workspacesService from './workspaces.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('type').optional().isIn(['department', 'project', 'team', 'commission']),
  body('memberIds').optional().isArray(),
];

export const idValidation = [param('id').notEmpty()];

// ─── CRUD ───────────────────────────────────────────────────────────────

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;

    const workspace = await workspacesService.create({
      organizationId: orgId,
      createdById: userId,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      icon: req.body.icon,
      color: req.body.color,
      memberIds: req.body.memberIds,
    });

    res.status(201).json({ success: true, data: workspace });
  } catch (error) { next(error); }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;

    const result = await workspacesService.findAll(orgId, userId, {
      type: req.query.type as any,
      search: req.query.search as string,
      isArchived: req.query.isArchived === 'true',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });

    res.json({ success: true, data: result.data, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const workspace = await workspacesService.getById(req.params.id, orgId);
    res.json({ success: true, data: workspace });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const workspace = await workspacesService.update(req.params.id, orgId, req.body);
    res.json({ success: true, data: workspace });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    await workspacesService.delete(req.params.id, orgId);
    res.json({ success: true, message: 'Пространство удалено' });
  } catch (error) { next(error); }
};

// ─── Участники ──────────────────────────────────────────────────────────

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await workspacesService.addMember(req.params.id, req.body.employeeId, req.body.role);
    res.status(201).json({ success: true, data: member });
  } catch (error) { next(error); }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await workspacesService.removeMember(req.params.id, req.params.employeeId);
    res.json({ success: true, message: 'Участник удалён' });
  } catch (error) { next(error); }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await workspacesService.getMembers(req.params.id);
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
};

// ─── Обсуждения ─────────────────────────────────────────────────────────

export const createDiscussion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const discussion = await workspacesService.createDiscussion(req.params.id, userId, req.body.title, req.body.body);
    res.status(201).json({ success: true, data: discussion });
  } catch (error) { next(error); }
};

export const getDiscussions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await workspacesService.getDiscussions(req.params.id, parseInt(req.query.page as string) || 1);
    res.json({ success: true, data: result.data, meta: { total: result.total, page: result.page } });
  } catch (error) { next(error); }
};

export const addReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const reply = await workspacesService.addReply(req.params.discussionId, userId, req.body.body);
    res.status(201).json({ success: true, data: reply });
  } catch (error) { next(error); }
};

export const getReplies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const replies = await workspacesService.getReplies(req.params.discussionId);
    res.json({ success: true, data: replies });
  } catch (error) { next(error); }
};

// ─── Wiki ───────────────────────────────────────────────────────────────

export const createWikiPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const page = await workspacesService.createWikiPage({
      workspaceId: req.params.id,
      organizationId: orgId,
      title: req.body.title,
      content: req.body.content || '',
      parentId: req.body.parentId,
      authorId: userId,
    });
    res.status(201).json({ success: true, data: page });
  } catch (error) { next(error); }
};

export const getWikiPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tree = await workspacesService.getWikiPages(req.params.id);
    res.json({ success: true, data: tree });
  } catch (error) { next(error); }
};

export const getWikiPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await workspacesService.getWikiPage(req.params.pageId);
    res.json({ success: true, data: page });
  } catch (error) { next(error); }
};

export const updateWikiPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await workspacesService.updateWikiPage(req.params.pageId, req.body);
    res.json({ success: true, data: page });
  } catch (error) { next(error); }
};

export const deleteWikiPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await workspacesService.deleteWikiPage(req.params.pageId);
    res.json({ success: true, message: 'Страница удалена' });
  } catch (error) { next(error); }
};
