import { Router } from 'express';
import * as ctrl from './workspaces.controller';
import { authenticate } from '../auth/auth.middleware';
import { addOrganizationToBody } from '../../core/middleware/tenantIsolation';

const router = Router();

router.use(authenticate);
router.use(addOrganizationToBody());

// CRUD Workspaces
router.get('/', ctrl.findAll);
router.post('/', ctrl.createValidation, ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Members
router.get('/:id/members', ctrl.getMembers);
router.post('/:id/members', ctrl.addMember);
router.delete('/:id/members/:employeeId', ctrl.removeMember);

// Discussions (threads)
router.get('/:id/discussions', ctrl.getDiscussions);
router.post('/:id/discussions', ctrl.createDiscussion);
router.get('/:id/discussions/:discussionId/replies', ctrl.getReplies);
router.post('/:id/discussions/:discussionId/replies', ctrl.addReply);

// Wiki
router.get('/:id/wiki', ctrl.getWikiPages);
router.post('/:id/wiki', ctrl.createWikiPage);
router.get('/:id/wiki/:pageId', ctrl.getWikiPage);
router.put('/:id/wiki/:pageId', ctrl.updateWikiPage);
router.delete('/:id/wiki/:pageId', ctrl.deleteWikiPage);

export default router;
