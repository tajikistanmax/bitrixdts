import { Router } from 'express';
import * as ctrl from './memos.controller';
import { authenticate } from '../auth/auth.middleware';
import { addOrganizationToBody } from '../../core/middleware/tenantIsolation';

const router = Router();

router.use(authenticate);
router.use(addOrganizationToBody());

// Статистика
router.get('/statistics', ctrl.getStatistics);

// CRUD
router.get('/', ctrl.findAll);
router.post('/', ctrl.createValidation, ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Действия
router.post('/:id/send', ctrl.send);
router.post('/:id/resolve', ctrl.resolve);

export default router;
