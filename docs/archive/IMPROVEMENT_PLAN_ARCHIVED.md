# MentorHub Combined Improvement Plan

Consolidated plan combining UI improvements and remaining testing work.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed

---

## Part A: Automated Testing (Priority: High)

### A1. Server Integration Tests
- [x] Auth integration tests (register, login, logout, /me)
- [ ] Booking integration tests
- [ ] Session integration tests
- [ ] Goals integration tests
- [ ] Messaging integration tests
- [ ] Reviews integration tests
- [ ] Payments integration tests
- [ ] Admin endpoints integration tests

### A2. Frontend Unit Tests
- [ ] Component tests for MentorCard, GoalCard, BookingCard
- [ ] Hook tests for useAuth, useGoals, useBookings
- [ ] Form validation tests
- [ ] Error boundary tests

### A3. E2E Tests (Playwright)
- [ ] Auth flow (register → verify → login → logout)
- [ ] Mentor discovery flow (search → filter → view profile)
- [ ] Booking flow (browse → book → confirm → schedule)
- [ ] Messaging flow (start conversation → send messages)
- [ ] Goal tracking flow (create → add milestones → complete)

---

## Part B: UI Improvements

### B1. Foundation (Phase 1)
- [ ] Add Framer Motion library
- [ ] Create animation constants (spring configs, timing)
- [ ] Add `prefers-reduced-motion` global support
- [ ] Button press feedback (scale 0.97 on tap)
- [ ] Card hover lift (2-4px rise with shadow)
- [ ] Page transitions (fade-slide 150-200ms)
- [ ] Loading skeletons for lists (mentors, sessions, goals)

### B2. Core Interactions (Phase 2)
- [ ] Progress bar animations (spring physics on mount/change)
- [ ] Message send animation (bubble slides up)
- [ ] Form field focus states (border glow, label float)
- [ ] Success confetti (goal completion, booking confirmation)
- [ ] Badge count animation (bounce on increment)

### B3. Delight (Phase 3)
- [ ] Pull-to-refresh on Messages and Goals pages
- [ ] Typing indicator (animated dots)
- [ ] Avatar hover effect (scale + ring)
- [ ] Star rating interaction (bounce fill)
- [ ] Animated counters on dashboard stats
- [ ] Command palette (Cmd+K)

### B4. Polish (Phase 4)
- [ ] Reduced motion audit
- [ ] Animation performance audit (60fps)
- [ ] Cross-browser testing
- [ ] Animation timing refinement

---

## Part C: Frontend Manual Test Checklist

### C1. Sprint 1: Auth & Profiles
- [ ] `/register` — form renders; valid data creates account
- [ ] `/register` — duplicate email shows inline error
- [ ] `/login` — valid credentials redirect to `/dashboard`
- [ ] `/login` — invalid credentials show error
- [ ] `/dashboard` — redirects to `/profile/setup` if firstName null
- [ ] `/profile/setup` — fills name, bio, timezone; save works
- [ ] `/become-mentor` — form submits, creates mentor profile
- [ ] Navbar — shows Login/Sign Up when logged out; avatar when logged in

### C2. Sprint 2: Mentor Directory
- [ ] `/mentors` — lists approved mentors; search filters results
- [ ] `/mentors` — expertise filter chips narrow results
- [ ] `/mentors` — pagination works; URL updates
- [ ] `/mentors/:id` — shows bio, expertise, programs, availability
- [ ] `/programs` — lists published programs with filters
- [ ] `/mentor/programs` — create/edit/delete programs works
- [ ] `/mentor/availability` — timezone + day slots; bulk save works

### C3. Sprint 3: Bookings & Sessions
- [ ] `/programs/:id` — "Book Program" visible when logged in
- [ ] `/bookings` — lists active and past bookings
- [ ] `/bookings/:id` — mentor sees "Confirm Booking" when PENDING
- [ ] `/bookings/:id` — "Schedule Session" form works
- [ ] `/sessions/:id` — "Mark Complete" with feedback + rating
- [ ] `/dashboard` — stats cards show booking counts

### C4. Sprint 4: Messaging & Reviews
- [ ] `/messages` — inbox with conversation list and search
- [ ] Click conversation — opens chat, shows history
- [ ] Mobile: tapping conversation navigates to `/messages/:id`
- [ ] `/mentors/:id` — reviews section with star rating
- [ ] `/bookings/:id/review` — star rating interactive; submit works

### C5. Sprint 5: Goals & Resources
- [ ] `/goals` — shows goal list with stats
- [ ] `/goals/new` — form creates goal; redirects to detail
- [ ] `/goals/:id` — checking milestone toggles completion
- [ ] `/resources` — shows uploads and shared sections
- [ ] `/resources` — upload form works; download triggers file

### C6. Sprint 7: Admin & Payments
- [ ] `/messages` — message bubbles show timestamps
- [ ] `/messages` — report button opens modal
- [ ] `/admin/users` — ban/suspend controls work
- [ ] `/admin/reports` — paginated list with filters
- [ ] `/checkout/:id` — mock payment form completes flow
- [ ] `/payments` — lists user payments with status badges
- [ ] `/mentor/payments` — shows earnings summary
- [ ] `/admin/users/create` — creates new admin account

---

## Part D: Technical Debt

### D1. Code Quality
- [ ] Remove vitest mock warnings (move vi.mock to top level)
- [ ] Add missing TypeScript strict mode fixes
- [ ] Consolidate duplicate form validation logic

### D2. Performance
- [ ] Implement React Query for data fetching
- [ ] Add virtualized lists for long message threads
- [ ] Lazy load route components

### D3. Accessibility
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation for modals
- [ ] Focus management on route changes

---

## Implementation Priority

| Priority | Area | Estimated Effort |
|----------|------|------------------|
| 1 | A1: Server Integration Tests | Medium |
| 2 | B1: UI Foundation | Medium |
| 3 | C1-C6: Manual Test Pass | Low |
| 4 | A3: E2E Tests | High |
| 5 | B2-B4: UI Animations | Medium |
| 6 | D1-D3: Tech Debt | Low |

---

## Quick Wins (Can do now)

1. **Loading skeletons** — replace spinners on list pages
2. **Card hover states** — CSS-only, no library needed
3. **Button press feedback** — CSS transform on active
4. **Fix mock warnings** — move vi.mock calls to setup.ts

---

*Last updated: 2026-06-24*
