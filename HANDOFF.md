# MentorHub Project Handoff

**Date:** 2026-08-06
**Project:** MentorHub - AI-powered mentorship platform
**Status:** MVP complete, UI/UX overhaul done, Clerk auth integrated, AWS infra ready

---

## This Session's Work

### AWS Infrastructure (Complete)
- **Terraform** — Full IaC in `infra/terraform/`
- **ECS Fargate** — Serverless container cluster for backend
- **RDS PostgreSQL** — t3.micro, single-AZ, 20GB storage
- **ALB** — HTTPS termination with ACM certificate
- **S3** — Uploads bucket with presigned URLs
- **Secrets Manager** — Environment variables injection
- **GitHub Actions** — OIDC deploy workflow (no long-lived credentials)
- **Server Dockerfile** — Multi-stage build for production

**Files created:**
```
infra/
├── terraform/
│   ├── main.tf, variables.tf, outputs.tf
│   ├── vpc.tf, rds.tf, ecs.tf, alb.tf
│   ├── s3.tf, ecr.tf, secrets.tf, iam.tf
├── terraform.tfvars.example
└── README.md

apps/server/
├── Dockerfile
├── .dockerignore
└── src/lib/s3.ts

.github/workflows/deploy.yml
```

### Clerk Migration (Complete)
- **Removed Auth0** — `@auth0/auth0-react`, `express-oauth2-jwt-bearer`
- **Added Clerk** — `@clerk/react`, `@clerk/express`
- **Frontend:** ClerkProvider wraps app, `<SignIn>` / `<SignUp>` components
- **Backend:** `clerkMiddleware()`, `getAuth()` for JWT verification
- **Sync endpoint:** `/auth/sync` links Clerk users to Prisma DB (uses `auth0Id` field for Clerk ID)

### UI/UX Overhaul Progress
| Phase | Status |
|-------|--------|
| 1. Design System | ✅ Complete |
| 2. Component Library | ✅ Complete |
| 3. Public Pages | ✅ Complete |
| 4. Auth Pages | ✅ Complete |
| 5. Discovery Pages | ✅ Complete |
| 6. Dashboard | ✅ Complete |

### Phase 6 Changes
- **Dashboard.tsx** — Removed profile widget, removed profile quality widget
- Quick links moved to top with icons (CalendarCheck, MessageSquare, Flag, etc.)
- Stats cards with animated numbers and hover effects
- AI insights and recommendations for mentees
- Cleaner layout inspired by Coursera/Codecademy dashboards

### Phase 5 Changes
- **MentorFilters.tsx** — Frosted glass sidebar, auto-apply with debounce
- **ProgramList.tsx** — Category tabs (Career, Leadership, Technical, etc.)
- **Navbar.tsx** — Dark mode fixed, logo added, teal accent color

### Preference Added
- **Server restart confirmation** — Ask before restarting dev servers

---

## Next Steps

| Priority | Task | Notes |
|----------|------|-------|
| 1 | **Deploy to AWS** | `terraform apply`, set secrets, validate ACM cert |
| 2 | **Test Clerk auth flow** | Sign up, sign in, sync to DB |
| 3 | **Fix "Not authenticated" on bookings** | Verify user sync, token handling |
| 4 | **Configure GitHub Actions** | Add `AWS_ROLE_ARN` secret to repo |

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
```

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/main.tsx` | ClerkProvider, app entry |
| `apps/web/src/context/AuthContext.tsx` | Clerk hooks, sync logic |
| `apps/web/src/pages/Login.tsx` | Clerk SignIn component |
| `apps/web/src/pages/Register.tsx` | Clerk SignUp + role selection |
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

# AWS (production only)
AWS_REGION=eu-west-1
S3_UPLOADS_BUCKET=mentorhub-uploads-123456789
```

---

## Design Direction

**Sanctuary** — warm, calm, premium editorial

```css
--color-bg:      #F3EEE6   /* Warm paper */
--color-surface: #FBF8F3   /* Cards */
--color-ink:     #221f1b   /* Text */
--color-teal:    #2E6A64   /* Primary CTA */
```

**Fonts:** Newsreader (display), Hanken Grotesk (body), IBM Plex Mono (labels)

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
```

---

*Last updated: 2026-08-06*
