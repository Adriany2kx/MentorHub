<a id="readme-top"></a>

<div align="center">

# MentorHub

**A full-stack mentoring platform built as a university dissertation project.**  
Connecting mentors and mentees through intelligent matching, structured session booking, and goal-driven progress tracking.

[![Contributors][contributors-shield]][contributors-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#skills-learned">Skills Learned</a></li>
    <li><a href="#whats-to-come">What's To Come</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

---

## About The Project

MentorHub is a production-grade mentoring platform built end-to-end as a university dissertation. The goal was to design and implement a system that mirrors the complexity of a real-world SaaS product — covering authentication, role-based access control, scheduling, payments, real-time messaging, AI-powered matching, and a full admin panel.

The project follows a clean monorepo structure with a React 19 frontend and an Express 5 REST API backend, backed by PostgreSQL via Prisma ORM.

> **Never commit your `.env` file.**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Built With

**Frontend**

[![React][React-badge]][React-url]
[![TypeScript][TypeScript-badge]][TypeScript-url]
[![Tailwind CSS][Tailwind-badge]][Tailwind-url]
[![Vite][Vite-badge]][Vite-url]
[![React Router][ReactRouter-badge]][ReactRouter-url]
[![Zod][Zod-badge]][Zod-url]

**Backend**

[![Node.js][Node-badge]][Node-url]
[![Express][Express-badge]][Express-url]
[![Prisma][Prisma-badge]][Prisma-url]
[![PostgreSQL][Postgres-badge]][Postgres-url]
[![Google Gemini][Gemini-badge]][Gemini-url]

**Testing**

[![Vitest][Vitest-badge]][Vitest-url]
[![Playwright][Playwright-badge]][Playwright-url]
[![Testing Library][TestingLib-badge]][TestingLib-url]

**Infrastructure & Tooling**

[![Docker][Docker-badge]][Docker-url]
[![npm Workspaces][npm-badge]][npm-url]
[![Argon2][Argon2-badge]][Argon2-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Architecture

```
final-project/
├── apps/
│   ├── web/          # React 19 + Vite + Tailwind CSS frontend
│   └── server/       # Express 5 REST API + Prisma ORM
├── docker-compose.yml
└── package.json      # npm workspaces root
```

The backend exposes a RESTful API consumed exclusively by the frontend. All database access goes through Prisma — no raw SQL. Authentication uses secure HTTP-only session cookies with Argon2-hashed passwords. Rate limiting and security headers (Helmet) are applied at the middleware layer.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adriany2kx/Final-project.git
   cd Final-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create `apps/server/.env` using the example file as a reference:
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```

4. **Start the database**
   ```bash
   docker-compose -f apps/server/docker-compose.yml up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate -w apps/server
   ```

6. **Generate the Prisma client**
   ```bash
   npm run db:generate -w apps/server
   ```

7. **Seed with local test data** *(optional)*
   ```bash
   npm run seed:local
   ```
   All seeded users share the password `TestPassword123!`. Fixed QA accounts:
   | Role | Email |
   |------|-------|
   | Mentor | `test.mentor@mentorhub.test` |
   | Mentee | `test.mentee@mentorhub.test` |
   | Admin | `test.admin@mentorhub.test` |

8. **Start the development servers** *(two terminals)*
   ```bash
   # Terminal 1 — backend (http://localhost:3000)
   npm run dev:server

   # Terminal 2 — frontend (http://localhost:5173)
   npm run dev:web
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Features

| Area | Details |
|---|---|
| **Authentication** | Secure session-based auth, Argon2 password hashing, Google reCAPTCHA v2, role-based access (mentor / mentee / admin) |
| **Mentor Discovery** | Search and filter mentors by skill, availability, and rating |
| **AI Matching** | Google Gemini-powered mentor recommendations based on mentee goals |
| **Session Booking** | Calendar-based scheduling with conflict detection |
| **Payments** | Simulated payment flow with order history |
| **Messaging** | Threaded conversations between mentors and mentees |
| **Goal Tracking** | Mentees create goals; mentors track progress through milestones |
| **Resource Sharing** | Mentors attach files and links to sessions |
| **Email Notifications** | Nodemailer-driven transactional emails for bookings and reminders |
| **Admin Panel** | User management, platform analytics, and moderation tools |
| **Security** | Helmet headers, CORS, express-rate-limit, input validation via Zod |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Testing

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Business logic, utilities, hooks |
| Integration | Vitest + Supertest | API endpoints, database operations |
| E2E | Playwright | Critical user flows (login, booking, payment) |

```bash
# Run all tests
npm test

# Frontend tests only
npm run test:web

# Backend tests only
npm run test:server
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Skills Learned

Building this project end-to-end covered a broad range of engineering skills:

- **Full-stack TypeScript** — shared type discipline across frontend and backend, strict compiler settings throughout
- **REST API design** — resource-oriented routing, middleware composition, request/response lifecycle in Express 5
- **Relational database modelling** — schema design, migrations, and ORM querying with Prisma + PostgreSQL
- **Authentication & security** — session management, password hashing, CSRF considerations, security headers, rate limiting
- **React 19 patterns** — hooks, context, code splitting, form validation with Zod, client-side routing with React Router v7
- **AI integration** — prompt engineering and calling the Gemini API to power feature recommendations
- **Monorepo tooling** — npm workspaces, shared scripts, coordinating two independent apps in one repo
- **Containerisation** — Docker Compose for reproducible local database setup
- **Testing strategy** — designing a layered test suite (unit → integration → E2E), test data seeding, and fixture management
- **Software architecture** — separating concerns across controllers, services, and data layers; designing for maintainability

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## What's To Come

The following features are planned for future iterations of MentorHub:

- [ ] **Real payment integration** — replace the simulated flow with Stripe, including webhooks and refund handling
- [ ] **Live video sessions** — embedded video calls via WebRTC or a provider such as Daily/Agora directly within the platform
- [ ] **Real-time notifications** — WebSocket-based push notifications for messages, booking confirmations, and reminders
- [ ] **Mobile application** — React Native client sharing business logic with the web frontend
- [ ] **Enhanced AI matching** — fine-tuned recommendation model trained on session outcome data
- [ ] **Public mentor profiles** — SEO-friendly public pages with verified reviews and ratings
- [ ] **Calendar sync** — two-way Google Calendar and Outlook integration for availability management
- [ ] **Analytics dashboard** — session completion rates, goal progress trends, and platform health metrics for admins
- [ ] **Multi-language support** — i18n across the UI to broaden accessibility

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contact

**Adrian** — [adrian2000.crafter@gmail.com](mailto:adrian2000.crafter@gmail.com)

GitHub: [@Adriany2kx](https://github.com/Adriany2kx)

Project Link: [https://github.com/Adriany2kx/Final-project](https://github.com/Adriany2kx/Final-project)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

Built for academic purposes as a university dissertation. Not licensed for commercial use.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

[contributors-shield]: https://img.shields.io/github/contributors/Adriany2kx/Final-project.svg?style=for-the-badge
[contributors-url]: https://github.com/Adriany2kx/Final-project/graphs/contributors
[issues-shield]: https://img.shields.io/github/issues/Adriany2kx/Final-project.svg?style=for-the-badge
[issues-url]: https://github.com/Adriany2kx/Final-project/issues
[license-shield]: https://img.shields.io/badge/license-academic-blue?style=for-the-badge
[license-url]: https://github.com/Adriany2kx/Final-project

[React-badge]: https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Tailwind-badge]: https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Vite-badge]: https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E
[Vite-url]: https://vite.dev/
[ReactRouter-badge]: https://img.shields.io/badge/React_Router_7-CA4245?style=for-the-badge&logo=react-router&logoColor=white
[ReactRouter-url]: https://reactrouter.com/
[Zod-badge]: https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white
[Zod-url]: https://zod.dev/

[Node-badge]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[Node-url]: https://nodejs.org/
[Express-badge]: https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[Prisma-badge]: https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white
[Prisma-url]: https://www.prisma.io/
[Postgres-badge]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[Postgres-url]: https://www.postgresql.org/
[Gemini-badge]: https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white
[Gemini-url]: https://ai.google.dev/

[Vitest-badge]: https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white
[Vitest-url]: https://vitest.dev/
[Playwright-badge]: https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white
[Playwright-url]: https://playwright.dev/
[TestingLib-badge]: https://img.shields.io/badge/Testing_Library-E33332?style=for-the-badge&logo=testing-library&logoColor=white
[TestingLib-url]: https://testing-library.com/

[Docker-badge]: https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
[npm-badge]: https://img.shields.io/badge/npm_workspaces-CB3837?style=for-the-badge&logo=npm&logoColor=white
[npm-url]: https://docs.npmjs.com/cli/using-npm/workspaces
[Argon2-badge]: https://img.shields.io/badge/Argon2-FF6B6B?style=for-the-badge&logo=security&logoColor=white
[Argon2-url]: https://github.com/ranisalt/node-argon2
