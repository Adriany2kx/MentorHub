# Final Project

Monorepo with a React frontend and Express backend.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/)

## Setup

### 1. Install dependencies

```bash
# Final Project

Monorepo with a React frontend and Express backend.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `apps/server/.env` with:


### 3. Start the database

```bash
docker-compose -f apps/server/docker-compose.yml up -d
```

### 4. Run database migrations

```bash
npm run db:migrate -w apps/server
```

### 5. Generate Prisma client

```bash
npm run db:generate -w apps/server
```

## Running the app

Start both the frontend and backend in separate terminals:

```bash
# Terminal 1 - backend (http://localhost:3000)
npm run dev:server

# Terminal 2 - frontend (http://localhost:5173)
npm run dev:web
```

## Useful commands

| Command | Description |
|---|---|
| `npm run dev:web` | Start frontend dev server |
| `npm run dev:server` | Start backend dev server |
| `npm run build:web` | Build frontend for production |
| `npm run build:server` | Build backend for production |
| `npm run db:migrate -w apps/server` | Run database migrations |
| `npm run db:generate -w apps/server` | Regenerate Prisma client |
| `npm run db:push -w apps/server` | Push schema changes without migration |
| `docker-compose -f apps/server/docker-compose.yml up -d` | Start database |
| `docker-compose -f apps/server/docker-compose.yml down` | Stop database 

Testing 

Testing Stack:
Unit Tests: Jest

Backend logic, utilities, helpers
Commands: npm test
Coverage target: 80%+

Integration Tests: Supertest

API endpoints
Database operations
External service mocks (Stripe, email)

E2E Tests: Cypress

Critical user flows (booking, payment, login)
UI interactions
Browser compatibility

Test Data/Fixtures: Faker.js

Generate realistic test data
User profiles, bookings, payments

Mocking: Jest Mock + MSW (Mock Service Worker)

Mock Stripe API responses
Mock external APIs without real API calls

Database Testing: Test database (separate PostgreSQL instance)

Use transactions to rollback after each test
Seed data between tests

Load Testing: K6 or Apache JMeter

Test concurrent bookings
API rate limiting
Session reminders at scale

## Tooling Alternatives Implemented

The following replacements are now configured in this repository:

- Travis CI -> GitHub Actions in .github/workflows/ci.yml
- Codecov -> Local/CI Vitest coverage reports in apps/web/coverage and apps/server/coverage
- Sentry/New Relic -> Pino-based structured file logging in apps/server/src/lib/logger.ts
- BrowserStack -> Playwright cross-browser tests in apps/web/e2e
- CodeScene -> ESLint plus self-hosted SonarQube config via sonar-project.properties and sonarqube-compose.yml

Heroku is intentionally retained for deployment in this phase.

### Commands

```bash
# Unit tests
npm run test:web
npm run test:server

# Coverage (replaces Codecov reporting)
npm run test:coverage

# Cross-browser e2e (replaces BrowserStack)
npx playwright install chromium firefox webkit
npm run e2e -w apps/web

# Local SonarQube (replaces CodeScene SaaS)
npm run sonar:up
npm run sonar:scan
npm run sonar:down
```

## Local Fake Data Framework

Use the local fake-data framework before deployment demos to generate deterministic mentors, skills, resources, conversations, and messages.

Safety defaults:
- Local-only guard: seeding fails in `NODE_ENV=production`
- CI guard: seeding fails in CI unless `ALLOW_FAKE_DATA_IN_CI=true`
- Reset-first behavior: existing records are cleared before each seed run

### Fake Data Commands

```bash
# Default small profile (recommended for daily dev)
npm run seed:local

# Larger profiles (optional)
npm run seed:local:medium
npm run seed:local:large

# Legacy seed pipeline (previous implementation)
npm run seed:legacy

# Direct server-level commands
npm run db:seed:small -w apps/server
npm run db:seed:medium -w apps/server
npm run db:seed:large -w apps/server

# Include optional entities (goals/milestones, payments)
npm run db:seed:small -w apps/server -- --include-goals --include-payments
```

All seeded users use password: `TestPassword123!`

Deterministic QA accounts created on every seed:
- Mentor: `test.mentor@mentorhub.test`
- Mentee: `test.mentee@mentorhub.test`
- Admin: `test.admin@mentorhub.test`

These fixtures include linked program/bookings/sessions, goals, payment, resources, and two-way conversation messages so you can test full user journeys immediately.