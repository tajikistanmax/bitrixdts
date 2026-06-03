import { PrismaClient } from '@prisma/client';
import logger from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

(prisma.$on as any)('query', (e: { query: string; duration: number; params: string }) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Prisma Query: ${e.query}`, { duration: e.duration, params: e.params });
  }
});
(prisma.$on as any)('error', (e: { message: string; target: string }) => {
  logger.error('Prisma Error', { message: e.message, target: e.target });
});
(prisma.$on as any)('warn', (e: { message: string; target: string }) => {
  logger.warn('Prisma Warn', { message: e.message, target: e.target });
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
