FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev

# Build
FROM base AS build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built app and prod dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./

# Generate Prisma client
RUN npx prisma generate

# Create directories for node user
RUN mkdir -p /app/logs /app/uploads/avatars /app/uploads/resources && chown -R node:node /app/logs /app/uploads

USER node
EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
