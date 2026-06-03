import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { DocumentStatus } from '@prisma/client';

export interface CreateDocumentData {
  title: string;
  documentType: 'incoming' | 'outgoing' | 'internal' | 'order' | 'letter';
  folderId?: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  ownerId: string;
  executorId?: string;
  organizationId: string;
}

export interface DocumentFilters {
  documentType?: string;
  status?: string;
  ownerId?: string;
  folderId?: string;
  page?: number;
  limit?: number;
}

export class DocumentsService {
  async create(data: CreateDocumentData) {
    const { organizationId, ownerId } = data;

    const employee = await prisma.employee.findFirst({
      where: { id: ownerId, organizationId },
    });

    if (!employee) {
      throw new AppError('Сотрудник не найден', 404);
    }

    const document = await prisma.document.create({
      data: {
        title: data.title,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        fileType: data.fileType || 'application/octet-stream',
        fileSize: data.fileSize || 0,
        folderId: data.folderId,
        ownerId: data.ownerId,
        executorId: data.executorId,
        organizationId: data.organizationId,
        status: 'draft',
      },
      include: {
        owner: {
          select: { id: true, fullName: true, position: true },
        },
        executor: {
          select: { id: true, fullName: true, position: true },
        },
      },
    });

    return document;
  }

  async findAll(organizationId: string, filters: DocumentFilters) {
    const {
      documentType,
      status,
      ownerId,
      folderId,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (documentType) where.documentType = documentType;
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (folderId) where.folderId = folderId;

    const total = await prisma.document.count({ where });

    const documents = await prisma.document.findMany({
      where,
      include: {
        owner: {
          select: { id: true, fullName: true, position: true },
        },
        executor: {
          select: { id: true, fullName: true, position: true },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: documents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async startApproval(documentId: string, organizationId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new AppError('Документ не найден', 404);
    }

    if (document.status !== 'draft') {
      throw new AppError(`Документ имеет статус ${document.status}`, 400);
    }

    // Создать цепочку согласования
    const owner = await prisma.employee.findFirst({
      where: { id: document.ownerId, organizationId },
      include: { manager: true },
    });

    if (!owner?.manager) {
      throw new AppError('У владельца нет руководителя для согласования', 400);
    }

    const approval = await prisma.documentApproval.create({
      data: {
        documentId,
        approverId: owner.managerId!,
        step: 1,
        status: 'pending',
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.pending_approval },
    });

    return approval;
  }

  async approveApproval(approvalId: string, comment?: string) {
    const approval = await prisma.documentApproval.findUnique({
      where: { id: approvalId },
      include: { document: true },
    });

    if (!approval) {
      throw new AppError('Заявка на согласование не найдена', 404);
    }

    if (approval.status !== 'pending') {
      throw new AppError(`Согласование уже имеет статус ${approval.status}`, 400);
    }

    await prisma.documentApproval.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        comment,
        decidedAt: new Date(),
      },
    });

    // Проверить, все ли согласования пройдены
    const allApprovals = await prisma.documentApproval.findMany({
      where: { documentId: approval.documentId },
    });

    const allApproved = allApprovals.every(a => a.status === 'approved');

    if (allApproved) {
      await prisma.document.update({
        where: { id: approval.documentId },
        data: { status: 'signing' as DocumentStatus },
      });
    }

    return approval;
  }

  async signDocument(documentId: string, organizationId: string, ecSignatureUrl: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new AppError('Документ не найден', 404);
    }

    if (document.status !== ('signing' as DocumentStatus)) {
      throw new AppError(`Документ имеет статус ${document.status}`, 400);
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'signed' as DocumentStatus,
        ecSignatureUrl,
      },
      include: {
        owner: true,
        executor: true,
      },
    });

    return updated;
  }
}

export default new DocumentsService();
