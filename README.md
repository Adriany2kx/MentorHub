<a id="readme-top"></a>

<div align="center">
  <h1>MentorHub</h1>
  <p><em>Final Year Project — BSc Computer Science</em></p>
  <p>An AI-powered mentorship platform connecting mentees with professional mentors.</p>
  <p><a href="https://mentor-hub.app">mentor-hub.app</a></p>
</div>

---

## Built With

[![React][react-shield]][react-url] [![TypeScript][ts-shield]][ts-url] [![Node.js][node-shield]][node-url] [![Express][express-shield]][express-url] [![Prisma][prisma-shield]][prisma-url] [![PostgreSQL][postgres-shield]][postgres-url] [![Docker][docker-shield]][docker-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Features

### Authentication & Security
- Email/password registration with reCAPTCHA v2
- Email verification with exponential-backoff resend (30s → 60s → 120s…)
- Password reset via secure token email
- Session-based auth with HTTP-only cookies
- Rate limiting on auth endpoints
- User suspension and ban system

### Profiles
- Mentee profile — goals, current role, target role, interests, skill levels
- Mentor profile — headline, expertise tags, hourly rate, years of experience
- Avatar upload
- Public profile pages

### Mentor Programs
- Mentors create programs with title, description, duration, session count, price, topic tags
- Publish / unpublish controls
- Mentee browsing and filtering by topic

### Booking & Scheduling
- Mentees book mentor programs
- Status workflow: PENDING → CONFIRMED → ACTIVE → COMPLETED / CANCELLED
- Mentor availability calendar with timezone support
- Session notes, meeting URL, mentee feedback, star rating

### AI Features (Gemini)
- Mentor recommendations — ranked matches based on mentee profile and skill gaps
- Compatibility score — per-mentor match explanation shown on mentor profile pages
- Profile quality score — suggestions to improve profile completeness for better matches
- Progress insights — highlights, stalled areas, session frequency (24 h cached)
- Session agenda — personalised agenda generated from goals, skills, and previous sessions
- Session summaries — key points, decisions, action items, and follow-up questions
- Action item extraction — automatically creates goal milestones from session notes
- Learning path generation — staged roadmap from current skills toward target role
- Goal achievement prediction — algorithmic likelihood score and on-track / at-risk trajectory
- Resource recommendations — suggests learning resource types and search topics based on goal progress
- Goal-based mentor suggestions — surfaces relevant mentors when viewing a specific goal

### Messaging
- Direct one-to-one messaging between mentee and mentor
- Read receipts and conversation history
- Message reporting

### Goals & Milestones
- Goal creation linked to bookings with status and progress tracking
- Milestone creation and completion

### Resources
- File uploads (documents, videos, links, images)
- Resources linked to programs or bookings
- Public and private visibility

### Reviews & Ratings
- Post-session reviews with star rating and text
- Mentor responses to reviews

### Payments
- Stripe payment integration
- Payment history for mentees and mentors

### Admin Dashboard
- User management and account creation
- Mentor approval workflow
- Program and payment oversight
- User report management with admin notes
- Account suspension

### Email
- Transactional emails via Resend
- Branded HTML templates matching app theme
- Verification and password reset flows

### Deployment
- Fully Dockerised with Docker Compose
- Nginx reverse proxy with HTTPS (Let's Encrypt)
- Target: AWS (ECS Fargate + RDS + S3)
- Prisma migrations run automatically on container start

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### Installation

1. Clone the repository
```bash
git clone https://github.com/Adriany2kx/MentorHub.git
cd MentorHub
```

2. Install dependencies
```bash
npm install
```

3. Copy and fill in environment variables
```bash
cp .env.prod.example .env
```

4. Start with Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

> **Never commit your `.env` file.**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Min 32-char secret for session signing |
| `FRONTEND_URL` | Public URL of the frontend |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v2 secret key |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Verified sender address |
| `GEMINI_API_KEY` | Google Gemini API key for AI features |
| `NGINX_HOST` | Domain name for Nginx |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## With More Time

Features that were designed and partially built but not surfaced in the UI within the project timeline:

- **AI micro-milestones** — break a goal into 5–8 specific, ordered sub-tasks generated by Gemini. The backend endpoint and API client are complete; a UI trigger on the goal creation / edit page was not implemented.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

For educational purposes.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

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
