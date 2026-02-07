#!/bin/bash

# Verify Docker builds compile correctly before deploying.
# Run this locally before pushing to confirm images build without errors.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Verifying Docker builds...${NC}"
echo ""

echo -e "${YELLOW}[1/2] Building backend image...${NC}"
if docker build -f apps/server/Dockerfile -t mentorhub-backend-test . --quiet; then
  echo -e "${GREEN}✓ Backend build passed${NC}"
  docker rmi mentorhub-backend-test --force > /dev/null 2>&1
else
  echo -e "${RED}✗ Backend build failed${NC}"
  exit 1
fi

echo -e "${YELLOW}[2/2] Building frontend image...${NC}"
if docker build -f apps/web/Dockerfile -t mentorhub-frontend-test . --quiet; then
  echo -e "${GREEN}✓ Frontend build passed${NC}"
  docker rmi mentorhub-frontend-test --force > /dev/null 2>&1
else
  echo -e "${RED}✗ Frontend build failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Both images build successfully. Ready to deploy.${NC}"
