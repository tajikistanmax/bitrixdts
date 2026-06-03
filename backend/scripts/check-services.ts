import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

interface ServiceStatus {
  name: string;
  status: '✅' | '❌';
  message: string;
  critical: boolean;
}

async function checkPostgres(): Promise<ServiceStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);
    const tableCount = Number(tables[0].count);
    return {
      name: 'PostgreSQL',
      status: '✅',
      message: `Подключено (${tableCount} таблиц)`,
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'PostgreSQL',
      status: '❌',
      message: `Не удалось подключиться: ${error.message}`,
      critical: true,
    };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  let redis: Redis | null = null;
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: () => null,
      lazyConnect: true,
      enableReadyCheck: false,
    });
    await redis.connect();
    await redis.ping();
    return {
      name: 'Redis',
      status: '✅',
      message: 'Подключено',
      critical: false,
    };
  } catch (error: any) {
    return {
      name: 'Redis',
      status: '❌',
      message: 'Не запущен',
      critical: false,
    };
  } finally {
    try {
      if (redis && redis.status === 'ready') {
        await redis.quit();
      } else if (redis) {
        redis.disconnect();
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function checkMinio(): Promise<ServiceStatus> {
  try {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const url = `http://${endpoint}:${port}/minio/health/live`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return {
        name: 'MinIO',
        status: '✅',
        message: 'Подключено',
        critical: false,
      };
    } else {
      return {
        name: 'MinIO',
        status: '❌',
        message: `HTTP ${response.status}`,
        critical: false,
      };
    }
  } catch (error: any) {
    return {
      name: 'MinIO',
      status: '❌',
      message: 'Не удалось подключиться',
      critical: false,
    };
  }
}

async function main() {
  console.log('🔍 Проверка сервисов...\n');
  console.log('─'.repeat(60));

  const results: ServiceStatus[] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkMinio(),
  ]);

  const criticalFailed = results.filter((r) => r.critical && r.status === '❌');
  const allOk = results.every((r) => r.status === '✅');

  results.forEach((result) => {
    const critical = result.critical ? '🔴 Критично' : '⚪ Опционально';
    console.log(`${result.status} ${result.name.padEnd(15)} ${result.message.padEnd(30)} ${critical}`);
  });

  console.log('─'.repeat(60));

  if (allOk) {
    console.log('✅ Все сервисы работают!\n');
    process.exit(0);
  } else if (criticalFailed.length > 0) {
    console.log('❌ Критичные сервисы недоступны! Приложение не может работать.\n');
    process.exit(1);
  } else {
    console.log('⚠️ Некоторые опциональные сервисы недоступны.\n');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('❌ Ошибка проверки:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
