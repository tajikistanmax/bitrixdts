import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../modules/auth/auth.middleware';
import auditService, { AuditAction } from '../utils/audit.service';

export const auditLog = (entityType: string, action: AuditAction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const user = (req as AuthRequest).user;
      if (body?.success !== false) {
        const entityId = req.params.id || req.body?.id || body?.data?.id;
        auditService.log({
          organizationId: user?.organizationId,
          actorId: user?.userId,
          action,
          entityType,
          entityId,
          payload: { method: req.method, path: req.path },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
};

export { auditService };
