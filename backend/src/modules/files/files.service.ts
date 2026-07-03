import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface UploadFileData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  organizationId: string;
  entityType?: string; // 'task', 'document', 'comment', 'drive', etc.
  entityId?: string;
  folderId?: string | null;
  uploaderId: string;
}

export interface FileWithRelations {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  organizationId: string;
  entityType: string | null;
  entityId: string | null;
  folderId: string | null;
  uploaderId: string;
  createdAt: Date;
  uploader?: any;
}

export class FilesService {
  async upload(data: UploadFileData) {
    const { organizationId, uploaderId } = data;

    // Проверить организацию
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError('Организация не найдена', 404);

    // Проверить пользователя
    const uploader = await prisma.employee.findFirst({
      where: { id: uploaderId, organizationId },
    });
    if (!uploader) throw new AppError('Пользователь не найден', 404);

    // Ограничение на размер файла (100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (data.fileSize > MAX_FILE_SIZE) {
      throw new AppError('Файл слишком большой. Максимум 100MB', 400);
    }

    // Создать запись о файле
    const file = await prisma.document.create({
      data: {
        title: data.fileName || 'File',
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        documentType: 'internal',
        organizationId,
        entityType: data.entityType || 'general',
        entityId: data.entityId,
        folderId: data.folderId || null,
        ownerId: uploaderId,
        uploaderId,
        status: 'draft',
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return this.mapFile(file);
  }

  async findById(id: string, organizationId: string) {
    const file = await prisma.document.findFirst({
      where: { id, organizationId },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!file) throw new AppError('Файл не найден', 404);

    return this.mapFile(file);
  }

  async findAll(organizationId: string, filters?: {
    entityType?: string;
    uploadedBy?: string;
    folderId?: string | null;
    page?: number;
    limit?: number;
  }) {
    const { entityType, uploadedBy, folderId, page = 1, limit = 50 } = filters || {};

    const where: any = { organizationId };

    if (entityType) {
      where.entityType = entityType;
    }

    if (uploadedBy) {
      where.uploadedBy = uploadedBy;
    }

    // folderId: строка — конкретная папка, null — корень, undefined — без фильтра
    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    const total = await prisma.document.count({ where });

    const files = await prisma.document.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: files.map(f => this.mapFile(f)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string, organizationId: string, userId: string) {
    const file = await prisma.document.findFirst({
      where: { id, organizationId },
    });

    if (!file) throw new AppError('Файл не найден', 404);

    // Только владелец или админ может удалить
    if (file.uploaderId !== userId) {
      const user = await prisma.employee.findFirst({
        where: { id: userId, organizationId },
        include: { employeeRoles: { include: { role: true } } },
      });

      const isAdmin = user?.employeeRoles?.some(er => er.role.name === 'admin');
      if (!isAdmin) {
        throw new AppError('Только владелец файла может его удалить', 403);
      }
    }

    await prisma.document.delete({ where: { id } });

    return { success: true, message: 'Файл удалён' };
  }

  async getFilesByEntity(entityType: string, entityId: string, organizationId: string) {
    const files = await prisma.document.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return files.map(f => this.mapFile(f));
  }

  async getStatistics(organizationId: string) {
    const totalFiles = await prisma.document.count({
      where: { organizationId },
    });

    const totalSize = await prisma.document.aggregate({
      where: { organizationId },
      _sum: { fileSize: true },
    });

    const byType = await prisma.document.groupBy({
      by: ['entityType'],
      where: { organizationId },
      _count: { entityType: true },
      _sum: { fileSize: true },
    });

    const byUploader = await prisma.document.groupBy({
      by: ['uploaderId'],
      where: { organizationId },
      _count: { uploaderId: true },
      _sum: { fileSize: true },
    });

    return {
      totalFiles,
      totalSize: totalSize._sum.fileSize || 0,
      totalSizeMB: Math.round((Number(totalSize._sum.fileSize) / (1024 * 1024)) * 100) / 100,
      byType: byType.map(t => ({
        type: t.entityType,
        count: t._count.entityType,
        sizeMB: Math.round((Number(t._sum.fileSize) / (1024 * 1024)) * 100) / 100,
      })),
      byUploader: byUploader.slice(0, 10).map(u => ({
        uploaderId: u.uploaderId,
        count: u._count.uploaderId,
        sizeMB: Math.round((Number(u._sum.fileSize) / (1024 * 1024)) * 100) / 100,
      })),
    };
  }

  private mapFile(file: any): FileWithRelations {
    return {
      id: file.id,
      fileName: file.title,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      organizationId: file.organizationId,
      entityType: file.entityType,
      entityId: file.entityId,
      folderId: file.folderId ?? null,
      uploaderId: file.uploaderId,
      createdAt: file.createdAt,
      uploader: file.uploader,
    };
  }
}

export default new FilesService();
