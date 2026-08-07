# MentorHub Project Handoff

**Date:** 2026-08-07
**Project:** MentorHub - AI-powered mentorship platform
**Status:** MVP complete, UI/UX overhaul done, Clerk auth integrated, AWS infra deployed

---

## This Session's Work

### AWS Infrastructure Deployed
All infrastructure provisioned via Terraform in `eu-west-1`:

| Resource | Value |
|----------|-------|
| ALB DNS | `mentorhub-alb-1133644741.eu-west-1.elb.amazonaws.com` |
| API URL | `https://api.mentor-hub.app` |
| ECR | `415221799707.dkr.ecr.eu-west-1.amazonaws.com/mentorhub-api` |
| S3 Bucket | `mentorhub-uploads-415221799707` |
| RDS Endpoint | `mentorhub-db.cfoc2kawg30n.eu-west-1.rds.amazonaws.com:5432` |
| GitHub OIDC Role | `arn:aws:iam::415221799707:role/mentorhub-github-actions` |
| Secrets Manager | `mentorhub/app-secrets` |

**Completed:**
- VPC with public/private subnets, NAT gateway
- ECS Fargate cluster + service
- RDS PostgreSQL (t3.micro, 1-day backup retention)
- ALB with HTTP→HTTPS redirect
- ACM certificate for `*.mentor-hub.app` (validated)
- S3 uploads bucket with CORS
- Secrets Manager with app env vars
- IAM roles for ECS + GitHub Actions OIDC

**DNS records added (name.com):**
- ACM validation CNAMEs (validated)
- `api` CNAME → ALB DNS (pending)

---

## Next Steps

| Priority | Task | Notes |
|----------|------|-------|
| 1 | **Add DNS CNAME** | `api.mentor-hub.app` → `mentorhub-alb-1133644741.eu-west-1.elb.amazonaws.com` |
| 2 | **Add GitHub secret** | `AWS_ROLE_ARN` = `arn:aws:iam::415221799707:role/mentorhub-github-actions` |
| 3 | **Push Docker image** | Build & push to ECR, ECS will auto-deploy |
| 4 | **Run Prisma migrations** | Connect to RDS and run `prisma migrate deploy` |
| 5 | **Update Clerk keys** | Get production keys from Clerk dashboard |
| 6 | **Configure SMTP** | Add Resend/SES credentials to Secrets Manager |

---

## Previous Work

### Clerk Migration (Complete)
- Removed Auth0, added Clerk
- Frontend: ClerkProvider, `<SignIn>` / `<SignUp>` components
- Backend: `clerkMiddleware()`, `getAuth()` for JWT
- Sync endpoint: `/auth/sync` links Clerk users to Prisma DB

### UI/UX Overhaul (Complete)
| Phase | Status |
|-------|--------|
| 1. Design System | ✅ |
| 2. Component Library | ✅ |
| 3. Public Pages | ✅ |
| 4. Auth Pages | ✅ |
| 5. Discovery Pages | ✅ |
| 6. Dashboard | ✅ |

---

## Quick Start

```bash
npm install
npm run dev          # Start all services

# Or separately
npm run dev:web      # Frontend http://localhost:5173
npm run dev:server   # Backend http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI |
| Backend | Express.js, Node.js 20, TypeScript |
| Database | PostgreSQL 15, Prisma ORM |
| Auth | Clerk |
| Payments | Stripe |
| Email | Resend |
| AI | Google Gemini |
| Hosting | AWS ECS Fargate, RDS, S3, ALB, Secrets Manager |
| IaC | Terraform |
| CI/CD | GitHub Actions (OIDC) |

---

## Project Structure

```
apps/
├── web/src/
│   ├── components/   # UI components
│   ├── pages/        # Route pages
│   ├── context/      # Auth, Theme, Toast
│   ├── hooks/        # Custom hooks
│   ├── lib/api.ts    # API client
│   └── index.css     # Design tokens
│
└── server/src/
    ├── routes/       # API handlers
    ├── services/     # Business logic
    ├── middleware/   # Auth, validation
    └── prisma/       # Schema + migrations

infra/
└── terraform/        # AWS IaC
    ├── main.tf, variables.tf, outputs.tf
    ├── vpc.tf, rds.tf, ecs.tf, alb.tf
    ├── s3.tf, ecr.tf, secrets.tf, iam.tf
    └── terraform.tfvars  # (gitignored)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/main.tsx` | ClerkProvider, app entry |
| `apps/web/src/context/AuthContext.tsx` | Clerk hooks, sync logic |
| `apps/server/src/middleware/auth.ts` | Clerk JWT verification |
| `apps/server/src/routes/auth.ts` | /auth/sync, /auth/me |
| `apps/server/src/lib/s3.ts` | S3 upload helper |
| `apps/server/Dockerfile` | Production container build |
| `infra/terraform/*.tf` | AWS infrastructure |
| `.github/workflows/deploy.yml` | CD pipeline to ECS |

---

## Environment Variables

### Frontend (`apps/web/.env`)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Backend (`apps/server/.env`)
```
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Production (AWS Secrets Manager)
All env vars stored in `mentorhub/app-secrets`:
- DATABASE_URL (RDS connection string)
- CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY
- GEMINI_API_KEY
- SESSION_SECRET
- SMTP_* (empty, needs config)

---

## Commands

```bash
npm run dev              # All services
npm run test             # All tests
npm run type-check       # TypeScript
npx prisma studio        # DB GUI
npx prisma db seed       # Seed data

# AWS Deployment
cd infra/terraform
terraform init
terraform plan
terraform apply

# Docker build & push
docker build -t mentorhub-api apps/server
aws ecr get-login-password | docker login --username AWS --password-stdin 415221799707.dkr.ecr.eu-west-1.amazonaws.com
docker tag mentorhub-api:latest 415221799707.dkr.ecr.eu-west-1.amazonaws.com/mentorhub-api:latest
docker push 415221799707.dkr.ecr.eu-west-1.amazonaws.com/mentorhub-api:latest
```

---

*Last updated: 2026-08-07*
