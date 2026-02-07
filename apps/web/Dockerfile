# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/web ./apps/web

RUN npm install

# Write reCAPTCHA site key into .env.production so Vite picks it up
ARG VITE_RECAPTCHA_SITE_KEY
RUN echo "VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}" > apps/web/.env.production

# Build the React app
RUN npm run build:web

# Runtime stage - use lightweight nginx
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
