# MentorHub Server

REST API backend for the MentorHub mentoring platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Session-based with HTTP-only cookies
- **AI**: Google Gemini API
- **Monitoring**: Sentry
- **Security**: Helmet, rate limiting, CORS

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm or npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables (see [Environment Variables](#environment-variables))

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm test` | Run all tests |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run migrations |

## API Documentation

In development mode, API documentation is available at:
- **Swagger UI**: http://localhost:5000/api/docs
- **OpenAPI JSON**: http://localhost:5000/api/docs.json

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `SESSION_SECRET` | Secret for session signing | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `SENTRY_DSN` | Sentry error tracking DSN | No |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret | No |
| `SMTP_HOST` | SMTP server host | No |
| `SMTP_PORT` | SMTP server port | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password | No |

## Project Structure

```
src/
├── config/          # Configuration (env, swagger)
├── lib/             # Shared utilities (prisma, logger, email, AI)
├── middleware/      # Express middleware (auth, rate limit, error handling)
├── routes/          # API route handlers
└── index.ts         # Application entry point

prisma/
├── schema.prisma    # Database schema
└── migrations/      # Database migrations

__tests__/
├── helpers/         # Test utilities and factories
└── integration/     # Integration tests
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/request-reset` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Users
- `GET /api/v1/users/:id` - Get user profile
- `PATCH /api/v1/users/profile` - Update profile
- `POST /api/v1/users/avatar` - Upload avatar

### Mentors
- `GET /api/v1/mentors` - List approved mentors
- `GET /api/v1/mentors/:id` - Get mentor profile

### Programs
- `GET /api/v1/programs` - List published programs
- `GET /api/v1/programs/:id` - Get program details
- `POST /api/v1/mentor/programs` - Create program (mentor)
- `PATCH /api/v1/mentor/programs/:id` - Update program (mentor)
- `DELETE /api/v1/mentor/programs/:id` - Delete program (mentor)

### Bookings
- `GET /api/v1/bookings` - List user bookings
- `POST /api/v1/bookings` - Create booking
- `PATCH /api/v1/bookings/:id` - Update booking status

### Sessions
- `GET /api/v1/sessions` - List sessions
- `POST /api/v1/sessions` - Schedule session
- `PATCH /api/v1/sessions/:id/complete` - Mark session complete
- `POST /api/v1/sessions/:id/cancel` - Cancel session

### Goals
- `GET /api/v1/goals` - List user goals
- `POST /api/v1/goals` - Create goal
- `PATCH /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal
- `POST /api/v1/goals/:id/milestones` - Add milestone
- `PATCH /api/v1/goals/:goalId/milestones/:id` - Toggle milestone

### Messages
- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/conversations/:id/messages` - Get messages
- `POST /api/v1/conversations/:id/messages` - Send message

### AI Features
- `GET /api/v1/ai/profile-quality` - Profile quality analysis
- `GET /api/v1/ai/mentor-recommendations` - AI mentor matching
- `GET /api/v1/ai/compatibility/:mentorId` - Mentor compatibility score
- `POST /api/v1/ai/micro-milestones` - Generate milestones for goal
- `GET /api/v1/ai/insights` - Mentee progress insights
- `POST /api/v1/ai/session-agenda` - Generate session agenda
- `POST /api/v1/ai/session-summary` - Generate session summary

### Admin
- `GET /api/v1/admin/stats` - Platform statistics
- `GET /api/v1/admin/users` - List users
- `PATCH /api/v1/admin/users/:id/ban` - Ban/unban user
- `GET /api/v1/admin/mentors/pending` - Pending mentor approvals
- `PATCH /api/v1/admin/mentors/:id/approve` - Approve mentor
- `GET /api/v1/admin/reports` - List reports
- `PATCH /api/v1/admin/reports/:id` - Update report status

## Testing

Run integration tests:
```bash
npm test
```

Tests use an isolated test database and mock external services (Gemini API, email).

## Security

- **Rate Limiting**: Auth endpoints (5 req/15min), general API (100 req/min)
- **CORS**: Configured for frontend origin only
- **Helmet**: Security headers enabled
- **Session**: HTTP-only cookies with secure flag in production
- **Audit Logging**: Admin actions logged for compliance
- **Input Validation**: Zod schemas on all endpoints

## License

Educational project - University dissertation.
