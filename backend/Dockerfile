# ═══════════════════════════════════════════════════════════════
# CMR-DTS Backend — Multi-stage build
# ═══════════════════════════════════════════════════════════════

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Установить зависимости
COPY package.json package-lock.json ./
RUN npm ci

# Копировать исходники
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Генерировать Prisma Client и собрать TypeScript
RUN npx prisma generate
RUN npx tsc

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Установить только production зависимости
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Копировать Prisma schema и сгенерированный клиент
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Копировать скомпилированный код
COPY --from=builder /app/dist ./dist

# Применить миграции и запустить
EXPOSE 3000

# Скрипт запуска: миграции → сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
