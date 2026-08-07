<a id="readme-top"></a>

<div align="center">
  <h1>MentorHub</h1>
  <p><strong>Final Year Project — BSc Computer Science</strong></p>
  <p>An AI-powered mentorship platform connecting mentees with professional mentors.</p>
  <br/>
  <p>
    <a href="https://mentor-hub.app">Live Demo</a> •
    <a href="https://api.mentor-hub.app/api/health">API Status</a>
  </p>
</div>

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend | Express.js, Node.js 20, TypeScript, Prisma ORM |
| Database | PostgreSQL 15 |
| Auth | Clerk |
| AI | Google Gemini |
| Payments | Stripe |
| Email | Resend |
| Hosting | AWS ECS Fargate, RDS, S3, ALB |
| IaC | Terraform |
| CI/CD | GitHub Actions |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Local Development

```bash
# 1. Clone
git clone https://github.com/your-username/mentorhub.git
cd mentorhub

# 2. Install dependencies
npm install

# 3. Configure environment
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
# Edit both .env files with your keys

# 4. Start database
docker compose up -d db

# 5. Run migrations
cd apps/server && npx prisma migrate dev

# 6. Start development servers
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

### Production (Docker)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Express   │────▶│ PostgreSQL  │
│   (Vite)    │     │   (Node)    │     │  (Prisma)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Gemini    │
                    │     AI      │
                    └─────────────┘
```

**Frontend** → React SPA with Clerk auth, served via Vercel
**Backend** → Express API on AWS ECS Fargate
**Database** → PostgreSQL on AWS RDS
**Storage** → AWS S3 for file uploads
**AI** → Google Gemini for recommendations, summaries, and insights

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Features

### Authentication & Security
- Clerk-based authentication (email/password, OAuth)
- Session management with secure cookies
- Rate limiting on sensitive endpoints
- reCAPTCHA protection

### User Profiles
- Mentee profiles: goals, skills, interests, career targets
- Mentor profiles: expertise, rates, experience, availability
- Avatar uploads to S3
- Public profile pages

### Mentor Programs
- Create/edit programs with pricing, duration, topics
- Publish/unpublish controls
- Browse and filter by category

### Booking System
- Program booking workflow: PENDING → CONFIRMED → ACTIVE → COMPLETED
- Session scheduling with timezone support
- Session notes and meeting URLs

### AI Features (Gemini)
- **Mentor Matching** — ranked recommendations based on mentee profile
- **Compatibility Scores** — per-mentor match explanations
- **Session Agendas** — auto-generated from goals and history
- **Session Summaries** — key points, action items, follow-ups
- **Learning Paths** — staged roadmaps toward career goals
- **Progress Insights** — highlights, stalled areas, trajectory
- **Goal Predictions** — likelihood scores and risk indicators

### Messaging
- Direct messaging between mentees and mentors
- Read receipts and conversation history

### Goals & Milestones
- Goal tracking linked to bookings
- Milestone creation and completion

### Payments
- Stripe integration for program payments
- Payment history tracking

### Admin Dashboard
- User management and mentor approval
- Content moderation and reporting

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## API Endpoints

**93 endpoints** across 12 route modules:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `/api/auth` | 4 | Authentication sync, user info |
| `/api/users` | 8 | User CRUD, profiles, avatars |
| `/api/mentors` | 6 | Mentor listings, search, availability |
| `/api/programs` | 10 | Program CRUD, publishing |
| `/api/bookings` | 12 | Booking lifecycle, sessions |
| `/api/goals` | 8 | Goal and milestone management |
| `/api/messages` | 6 | Conversations, messaging |
| `/api/reviews` | 5 | Ratings and feedback |
| `/api/resources` | 7 | File uploads, resource sharing |
| `/api/payments` | 6 | Stripe integration |
| `/api/ai` | 15 | Gemini-powered features |
| `/api/admin` | 6 | Admin operations |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Testing

### Test Coverage

| Type | Framework | Status |
|------|-----------|--------|
| Type Safety | TypeScript strict mode | ✅ Passing |
| Linting | ESLint | ✅ Passing |
| API Testing | Manual + Postman | ✅ Documented |
| E2E | Manual QA | ✅ Core flows verified |

### Running Checks

```bash
# TypeScript
npm run type-check

# Lint
npm run lint

# All checks
npm run check
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Deployment

### Infrastructure (Terraform)

All AWS resources defined in `infra/terraform/`:

| Resource | Purpose |
|----------|---------|
| ECS Fargate | API container hosting |
| RDS PostgreSQL | Database |
| S3 | File uploads |
| ALB | Load balancer + HTTPS |
| Secrets Manager | Environment variables |
| ECR | Docker image registry |

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

### CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Build Docker image
2. Push to ECR
3. Update ECS service

### Manual Deploy

```bash
# Build and push
docker build -t mentorhub-api apps/server
aws ecr get-login-password | docker login --username AWS --password-stdin <ECR_URL>
docker push <ECR_URL>/mentorhub-api:latest

# ECS auto-deploys on new image
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Environment Variables

See `.env.example` files in `apps/server/` and `apps/web/` for required variables.

**Key variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk authentication |
| `GEMINI_API_KEY` | Google AI features |
| `RESEND_API_KEY` | Transactional email |
| `STRIPE_SECRET_KEY` | Payment processing |
| `SENTRY_DSN` | Error tracking |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Todo / Future Work

- [ ] **Real-time notifications** — WebSocket integration for instant updates
- [ ] **Video calls** — Integrated video sessions (Daily.co / Twilio)
- [ ] **Mobile app** — React Native companion app
- [ ] **AI micro-milestones** — Auto-generate sub-tasks for goals (backend ready)
- [ ] **Calendar sync** — Google Calendar / Outlook integration
- [ ] **Advanced analytics** — Mentor performance dashboards

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

For educational purposes — Final Year Project, BSc Computer Science.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

[![React][react-shield]][react-url] [![TypeScript][ts-shield]][ts-url] [![Node.js][node-shield]][node-url] [![Express][express-shield]][express-url] [![Prisma][prisma-shield]][prisma-url] [![PostgreSQL][postgres-shield]][postgres-url] [![Docker][docker-shield]][docker-url] [![AWS][aws-shield]][aws-url]

[react-shield]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev
[ts-shield]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org
[node-shield]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org
[express-shield]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
[express-url]: https://expressjs.com
[prisma-shield]: https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white
[prisma-url]: https://prisma.io
[postgres-shield]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[postgres-url]: https://postgresql.org
[docker-shield]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[docker-url]: https://docker.com
[aws-shield]: https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white
[aws-url]: https://aws.amazon.com
