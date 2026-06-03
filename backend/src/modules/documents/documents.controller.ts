import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../../core/config/database';
import documentsService from './documents.service';
import { AuthRequest } from '../auth/auth.middleware';

export const uploadDocumentValidation = [
  body('title').isString().notEmpty().withMessage('Название документа обязательно'),
  body('documentType').isString().notEmpty().withMessage('Тип документа обязателен'),
  body('folderId').optional().isUUID().withMessage('Неверный ID папки'),
  body('entityType').optional().isString(),
  body('entityId').optional().isUUID().withMessage('Неверный ID сущности'),
];

export const documentIdValidation = [
  param('documentId').isUUID().withMessage('Неверный ID документа'),
];

export const approveDocumentValidation = [
  param('documentId').isUUID().withMessage('Неверный ID документа'),
  param('approvalId').isUUID().withMessage('Неверный ID согласования'),
  body('comment').optional().isString(),
];

class DocumentsController {
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, title, folderId, entityType, entityId } = req.body;
      const user = (req as AuthRequest).user!;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const document = await documentsService.create({
        title,
        documentType,
        folderId,
        fileUrl: req.file?.path || req.file?.filename || '',
        fileType: req.file?.mimetype,
        fileSize: req.file?.size,
        ownerId: user.userId,
        organizationId: employee.organizationId,
      });

      res.status(201).json({ success: true, data: document });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { folderId, documentType, status, entityType } = req.query;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const documents = await documentsService.findAll(employee.organizationId, {
        folderId: folderId as string,
        documentType: documentType as string,
        status: status as string,
      });

      res.json({ success: true, data: documents });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const user = (req as AuthRequest).user!;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const document = await prisma.document.findFirst({
        where: { id: documentId, organizationId: employee.organizationId },
        include: { owner: true, executor: true, approvals: true },
      });

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      res.json({ success: true, data: document });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const user = (req as AuthRequest).user!;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const document = await prisma.document.findFirst({
        where: { id: documentId, organizationId: employee.organizationId },
      });

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: req.body,
      });

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const user = (req as AuthRequest).user!;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const document = await prisma.document.findFirst({
        where: { id: documentId, organizationId: employee.organizationId },
      });

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      await prisma.document.delete({ where: { id: documentId } });

      res.json({ success: true, message: 'Document deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async initiateApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const user = (req as AuthRequest).user!;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const result = await documentsService.startApproval(documentId, employee.organizationId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async approveDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId, approvalId } = req.params;
      const { comment } = req.body;

      const result = await documentsService.approveApproval(approvalId, comment);

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const user = (req as AuthRequest).user!;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const document = await prisma.document.findFirst({
        where: { id: documentId, organizationId: employee.organizationId },
      });

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const version = await prisma.documentVersion.create({
        data: {
          documentId,
          version: document.version + 1,
          fileUrl: req.file?.path || req.file?.filename || '',
          changedBy: user.userId,
        },
      });

      await prisma.document.update({
        where: { id: documentId },
        data: { version: document.version + 1 },
      });

      res.json({ success: true, data: version });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;

      const versions = await prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: { version: 'desc' },
      });

      res.json({ success: true, data: versions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new DocumentsController();
