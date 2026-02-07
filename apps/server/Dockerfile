# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/server ./apps/server

RUN npm install

# Build TypeScript (includes Prisma generate)
RUN npm run build:server

# Runtime stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

# Copy package files and install production deps cleanly
COPY package*.json ./
COPY apps/server/package.json ./apps/server/package.json
RUN npm install --workspace=apps/server --omit=dev

# Copy compiled app, Prisma schema/migrations, and generated client
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user and writable directories
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/apps/server/uploads && \
    chown -R nodejs:nodejs /app/logs /app/apps/server/uploads
USER nodejs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=apps/server/prisma/schema.prisma && node apps/server/dist/index.js"]
