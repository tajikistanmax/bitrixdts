import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import logger from '../config/logger';

/**
 * Storage Service — загрузка файлов в MinIO/S3.
 * При недоступности MinIO работает в graceful-degraded режиме
 * (возвращает локальный псевдо-URL и логирует предупреждение).
 */
class StorageService {
  private client: Minio.Client | null = null;
  private bucket: string;
  private available = false;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET || 'documents';
    this.init();
  }

  private async init() {
    const endpoint = process.env.MINIO_ENDPOINT;
    if (!endpoint) {
      logger.warn('[Storage] MINIO_ENDPOINT not set — file upload runs in metadata-only mode');
      return;
    }

    try {
      this.client = new Minio.Client({
        endPoint: endpoint,
        port: parseInt(process.env.MINIO_PORT || '9000'),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      });

      // Проверить/создать бакет
      const exists = await this.client.bucketExists(this.bucket).catch(() => false);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        logger.info(`[Storage] Created bucket: ${this.bucket}`);
      }
      this.available = true;
      logger.info('[Storage] MinIO connected');
    } catch (err: any) {
      logger.warn(`[Storage] MinIO unavailable (${err.message}) — file upload runs in metadata-only mode`);
      this.client = null;
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Загрузить буфер файла. Возвращает объект с URL и метаданными.
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'general'
  ): Promise<{ fileUrl: string; objectName: string; size: number }> {
    const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
    const objectName = `${folder}/${randomUUID()}${ext ? '.' + ext : ''}`;

    if (this.client && this.available) {
      await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
        'Content-Type': mimeType,
      });
      return {
        fileUrl: `/api/v1/files/download/${encodeURIComponent(objectName)}`,
        objectName,
        size: buffer.length,
      };
    }

    // Degraded mode — нет хранилища
    logger.warn(`[Storage] Saved metadata only for "${originalName}" (MinIO unavailable)`);
    return {
      fileUrl: `/uploads/${objectName}`,
      objectName,
      size: buffer.length,
    };
  }

  /**
   * Получить файл как поток для скачивания.
   */
  async getObjectStream(objectName: string): Promise<NodeJS.ReadableStream> {
    if (!this.client || !this.available) {
      throw new Error('Storage недоступен');
    }
    return this.client.getObject(this.bucket, objectName);
  }

  /**
   * Удалить файл.
   */
  async removeObject(objectName: string): Promise<void> {
    if (this.client && this.available) {
      await this.client.removeObject(this.bucket, objectName).catch(() => {});
    }
  }

  /**
   * Сгенерировать временную ссылку на скачивание (presigned URL).
   */
  async getPresignedUrl(objectName: string, expirySeconds = 3600): Promise<string | null> {
    if (!this.client || !this.available) return null;
    return this.client.presignedGetObject(this.bucket, objectName, expirySeconds).catch(() => null);
  }
}

export default new StorageService();
