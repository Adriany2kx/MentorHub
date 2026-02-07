#!/bin/bash

# MentorHub → Digital Ocean Deployment Script
# Run on a fresh Ubuntu 24.04 Droplet with sudo privileges

set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
  echo "Please run this script with sudo."
  exit 1
fi

APP_DIR="/root/mentorhub"
REPO_URL="https://github.com/Adriany2kx/Final-project.git"
BRANCH="agents/deploy-website-to-digital-ocean"

echo " MentorHub Digital Ocean Deployment"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose --env-file .env.prod "$@"
  else
    docker compose --env-file .env.prod "$@"
  fi
}

echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

echo -e "${YELLOW}[2/7] Installing Docker and Docker Compose...${NC}"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
fi

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

echo -e "${GREEN}✓ Docker installed: $(docker --version)${NC}"
echo -e "${GREEN}✓ Docker Compose installed: $(compose version)${NC}"

echo -e "${YELLOW}[3/7] Installing Certbot for SSL certificates...${NC}"
apt-get install -y certbot python3-certbot-nginx

echo -e "${YELLOW}[4/7] Cloning or updating repository...${NC}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch --all --prune
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only
else
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"

echo -e "${GREEN}✓ Repository ready at ${APP_DIR}${NC}"

echo -e "${YELLOW}[5/7] Preparing environment file...${NC}"
if [ ! -f .env.prod ]; then
  cp .env.prod.example .env.prod
  echo -e "${YELLOW}Created .env.prod from template.${NC}"
fi

if [ -t 1 ]; then
  echo -e "${YELLOW}Opening .env.prod for editing...${NC}"
  "${EDITOR:-nano}" .env.prod
else
  echo -e "${YELLOW}Non-interactive shell detected. Please edit ${APP_DIR}/.env.prod manually.${NC}"
fi

set -a
. ./.env.prod
set +a

missing=()
for var in DB_PASSWORD FRONTEND_URL SESSION_SECRET EMAIL_FROM SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS NGINX_HOST; do
  if [ -z "${!var:-}" ]; then
    missing+=("${var}")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo -e "${RED}Missing required environment variables:${NC} ${missing[*]}"
  echo "Edit ${APP_DIR}/.env.prod and re-run this script."
  exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"

echo -e "${YELLOW}[6/7] Building Docker images...${NC}"
compose -f docker-compose.prod.yml build

echo -e "${YELLOW}[7/7] Starting services...${NC}"
compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
compose -f docker-compose.prod.yml ps

echo ""
echo "Next steps:"
echo "  1. Verify services: compose -f docker-compose.prod.yml ps"
echo "  2. View logs:       compose -f docker-compose.prod.yml logs -f"
echo "  3. Setup SSL:       certbot certonly --standalone -d ${NGINX_HOST}"
echo ""
