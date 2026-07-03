import logger from './logger';

/**
 * Проверка критичных переменных окружения при старте.
 * В production сервер отказывается стартовать с дефолтными/слабыми секретами —
 * это защита от выката плейсхолдеров из .env.example в бой.
 */

const PLACEHOLDER_MARKERS = ['your-super-secret', 'change-me', 'changeme', 'example', 'secret-key'];

interface SecretRule {
  name: string;
  minLength: number;
  forbiddenValues?: string[];
}

const SECRET_RULES: SecretRule[] = [
  { name: 'JWT_ACCESS_SECRET', minLength: 32 },
  { name: 'JWT_REFRESH_SECRET', minLength: 32 },
  { name: 'MINIO_ACCESS_KEY', minLength: 3, forbiddenValues: ['minioadmin'] },
  { name: 'MINIO_SECRET_KEY', minLength: 8, forbiddenValues: ['minioadmin'] },
];

function findProblems(): string[] {
  const problems: string[] = [];

  for (const rule of SECRET_RULES) {
    const value = process.env[rule.name];
    if (!value) {
      problems.push(`${rule.name} не задан`);
      continue;
    }
    if (value.length < rule.minLength) {
      problems.push(`${rule.name} короче ${rule.minLength} символов`);
    }
    const lower = value.toLowerCase();
    if (PLACEHOLDER_MARKERS.some((m) => lower.includes(m))) {
      problems.push(`${rule.name} похож на плейсхолдер из .env.example`);
    }
    if (rule.forbiddenValues?.some((f) => lower === f)) {
      problems.push(`${rule.name} использует дефолтное значение`);
    }
  }

  if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET и JWT_REFRESH_SECRET совпадают — используйте разные секреты');
  }

  return problems;
}

export function assertSecureEnvironment(): void {
  const problems = findProblems();
  if (problems.length === 0) return;

  const isProduction = process.env.NODE_ENV === 'production';
  const header = isProduction
    ? 'Небезопасная конфигурация окружения — запуск в production остановлен:'
    : 'Небезопасная конфигурация окружения (в production запуск будет заблокирован):';

  const message = [header, ...problems.map((p) => `  - ${p}`)].join('\n');

  if (isProduction) {
    logger.error(message);
    process.exit(1);
  } else {
    logger.warn(message);
  }
}
