# MentorHub Technical Roadmap

Consolidated roadmap for platform maturity: authentication, observability, analytics, and infrastructure improvements.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed

---

## 1. Authentication: Auth0 Migration

**Current:** Session-based auth with cookies, manual email verification, bcrypt passwords
**Target:** Auth0 with PKCE flow, social login, MFA support

### 1.1 Auth0 Setup
- [ ] Create Auth0 tenant (production + development)
- [ ] Configure application (SPA for web, M2M for server)
- [ ] Set up custom domain (auth.mentor-hub.app)
- [ ] Configure social connections (Google, GitHub, LinkedIn)
- [ ] Design login/signup branding to match Sanctuary aesthetic

### 1.2 Frontend Integration
- [ ] Install `@auth0/auth0-react`
- [ ] Create `Auth0Provider` wrapper in App.tsx
- [ ] Replace `useAuth` hook to use Auth0 SDK
- [ ] Update Login/Register pages to redirect to Auth0 Universal Login
- [ ] Update Navbar to use Auth0 user object
- [ ] Handle token refresh with `getAccessTokenSilently()`
- [ ] Store tokens in memory only (never localStorage)

### 1.3 Backend Integration
- [ ] Install `express-oauth2-jwt-bearer`
- [ ] Create JWKS-based token validation middleware
- [ ] Migrate `/api/auth/*` endpoints to validate Auth0 JWTs
- [ ] Map Auth0 `sub` claim to internal `userId`
- [ ] Create user on first login (Auth0 Action or backend hook)
- [ ] Handle logout (revoke refresh tokens via Management API)

### 1.4 Database Migration
- [ ] Add `auth0Id` column to `User` table
- [ ] Create migration to populate `auth0Id` for existing users
- [ ] Remove `passwordHash` column (keep backup for rollback)
- [ ] Update `isVerified` to sync with Auth0 email verification

### 1.5 Cleanup
- [ ] Remove password reset flow (Auth0 handles)
- [ ] Remove email verification flow (Auth0 handles)
- [ ] Remove reCAPTCHA (Auth0 has bot detection)
- [ ] Remove session middleware from server
- [ ] Archive old auth endpoints

---

## 2. Observability: Error Tracking & Monitoring

**Current:** Console logging, no centralized error tracking
**Target:** Sentry for errors, structured logging, health checks

### 2.1 Sentry Setup (Backend)
- [ ] Install `@sentry/node` and `@sentry/profiling-node`
- [ ] Initialize Sentry in server entry point
- [ ] Configure environment (production/staging/development)
- [ ] Add Sentry error handler middleware (after routes)
- [ ] Capture exceptions in all catch blocks
- [ ] Add user context (`Sentry.setUser({ id, email })`)
- [ ] Configure sampling rates (errors: 1.0, traces: 0.2)

### 2.2 Sentry Setup (Frontend)
- [ ] Install `@sentry/react`
- [ ] Initialize Sentry in main.tsx
- [ ] Wrap App with `Sentry.ErrorBoundary`
- [ ] Add React Router instrumentation
- [ ] Capture API errors from fetch wrapper
- [ ] Add user context after login

### 2.3 Structured Logging
- [ ] Install `pino` for JSON logging
- [ ] Create logger utility with request context
- [ ] Log all API requests with duration, status, userId
- [ ] Redact sensitive fields (password, tokens)
- [ ] Configure log levels per environment

### 2.4 Health Checks
- [ ] Add `/health` endpoint (basic liveness)
- [ ] Add `/health/ready` endpoint (database connection)
- [ ] Configure AWS ECS health checks
- [ ] Add uptime monitoring (UptimeRobot or similar)

### 2.5 Performance Monitoring
- [ ] Enable Sentry Performance (traces)
- [ ] Add custom spans for Prisma queries
- [ ] Track API response times
- [ ] Set up alerts for slow endpoints (>2s p95)

---

## 3. Product Analytics

**Current:** No user behavior tracking
**Target:** Privacy-respecting analytics for product decisions

### 3.1 Analytics Provider Selection
Choose one (not both):

**Option A: Plausible (Privacy-focused)**
- [ ] Set up Plausible Cloud or self-hosted
- [ ] Add script to index.html
- [ ] Configure custom events for key actions
- [ ] Set up goals (signup, first booking, first session)

**Option B: Mixpanel (Full product analytics)**
- [ ] Create Mixpanel project
- [ ] Install `mixpanel-browser`
- [ ] Create analytics service wrapper
- [ ] Track user identity after login
- [ ] Create event taxonomy document

### 3.2 Key Events to Track
```typescript
// User lifecycle
track('User Signed Up', { method: 'email' | 'google' | 'github' })
track('Profile Completed', { role: 'mentee' | 'mentor' })
track('Onboarding Finished', { steps_completed: number })

// Core actions
track('Mentor Viewed', { mentor_id, source: 'search' | 'recommendation' })
track('Program Booked', { program_id, price, mentor_id })
track('Session Completed', { booking_id, duration_minutes })
track('Goal Created', { booking_id })
track('Message Sent', { conversation_id, is_first: boolean })

// Engagement
track('Search Performed', { query, results_count })
track('Filter Applied', { filter_type, filter_value })
track('Page Viewed', { page_name, referrer })
```

### 3.3 Privacy Compliance
- [ ] Add cookie consent banner (if required)
- [ ] Document data collection in Privacy Policy
- [ ] Enable IP anonymization
- [ ] Add user opt-out mechanism in settings

---

## 4. Infrastructure Improvements

### 4.1 Environment Management
- [ ] Create `.env.example` with all required variables
- [ ] Document environment variables in README
- [ ] Add validation for required env vars at startup
- [ ] Set up secrets management (AWS Secrets Manager)

### 4.2 Database Improvements
- [ ] Enable Prisma query logging in development
- [ ] Add database connection pooling (PgBouncer)
- [ ] Set up automated daily backups
- [ ] Create read replica for analytics queries (future)

### 4.3 CI/CD Enhancements
- [ ] Add GitHub Actions workflow for tests
- [ ] Add type-check step to CI
- [ ] Add lint step to CI
- [ ] Block merge if tests fail
- [ ] Add preview deployments for PRs

### 4.4 Security Hardening
- [ ] Enable HTTPS strict transport security
- [ ] Add Content Security Policy headers
- [ ] Configure CORS properly (allow only production domain)
- [ ] Add rate limiting to all API endpoints
- [ ] Audit npm dependencies for vulnerabilities
- [ ] Set up Dependabot or Renovate

---

## 5. Stack Reference

### Current Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| UI Components | Radix UI, Lucide Icons |
| Backend | Express.js, Node.js 20, TypeScript |
| Database | PostgreSQL 15, Prisma ORM |
| Auth | Session-based (migrating to Auth0) |
| Payments | Stripe |
| Email | Resend |
| AI | Google Gemini |
| Hosting | AWS (ECS Fargate + RDS + S3) |

### Target Additions
| Category | Technology |
|----------|------------|
| Auth | Auth0 (PKCE, JWT, JWKS) |
| Error Tracking | Sentry |
| Logging | Pino |
| Analytics | Plausible or Mixpanel |
| Monitoring | UptimeRobot |

---

## 6. UI/UX Enhancements

**Full plan:** See [UI_ENHANCEMENT_PLAN.md](./UI_ENHANCEMENT_PLAN.md)

### 6.1 Animation System (P0)
- [ ] Modal transitions (Luma-style: spring scale + backdrop blur)
- [ ] Animated numbers (dub.co-style: count-up, slot machine)
- [ ] Icon micro-animations (Discord-style: hover scale, click pulse)
- [ ] Page transitions (View Transitions API)

### 6.2 Core Components (P1)
- [ ] Notification panel with real-time updates
- [ ] File upload with Dropbox-style progress animation
- [ ] Dashboard cards (simple/advanced views)
- [ ] Calendar UI for availability management

### 6.3 User Experience (P2)
- [ ] Multi-step onboardin    g flow (Abode-style)
- [ ] Achievements carousel (AllTrails-style)
- [ ] OTP input with auto-focus animation
- [ ] Password reveal animation

### 6.4 Admin Enhancements
- [ ] Simple vs Advanced dashboard toggle
- [ ] Animated revenue/stats cards
- [ ] Tax calculation estimates
- [ ] Sliding sidebar navigation
- [ ] Frosted glass filter menus

### 6.5 Design References
| Pattern | Source | Application |
|---------|--------|-------------|
| Modal transitions | Luma | All modals |
| Pull-to-refresh | Snapchat | Messages, feed |
| File upload | Dropbox | UploadThing integration |
| Icon animations | Discord | Nav, actions |
| Number animations | dub.co | Dashboard stats |
| Onboarding | Abode | New user flow |
| Sidebar | Typefully | Admin, filters |
| Dashboard | Viewport UI | Admin, mentor |
| Calendar | Viewport UI | Availability |
| Features section | Viewport UI | Landing page |
| Typography | Poetic | Headers, CTAs |

---

## 7. Implementation Priority

| Priority | Area | Rationale |
|----------|------|-----------|
| 1 | Sentry (backend + frontend) | Catch errors before users report them |
| 2 | Product analytics | Understand user behavior |
| 3 | UI animations (P0 items) | Premium feel, user delight |
| 4 | Auth0 migration | Security, social login, MFA |
| 5 | CI/CD improvements | Prevent regressions |
| 6 | Health checks | Faster incident response |

---

## 8. Migration Checklist

### Before Auth0 Migration
- [ ] Export all user emails (for import to Auth0)
- [ ] Document current auth flows
- [ ] Create feature flag for gradual rollout
- [ ] Set up Auth0 development tenant for testing
- [ ] Write migration runbook

### During Migration
- [ ] Deploy backend changes behind feature flag
- [ ] Test with internal users first
- [ ] Monitor error rates closely
- [ ] Have rollback plan ready

### After Migration
- [ ] Verify all users can log in
- [ ] Archive old auth code (don't delete immediately)
- [ ] Update documentation
- [ ] Remove feature flag after 2 weeks stable

---

*Created: 2024-06-24*
*Last updated: 2024-06-24*
