-=077867# MentorHub — Test Documentation

All manual API and frontend tests for each sprint. Run the dev servers before testing:

```bash
docker-compose -f apps/server/docker-compose.yml up -d
npm run dev:server   # http://localhost:3000
npm run dev:web      # http://localhost:5173
```

---

## Sprint 1: User Roles & Profiles

### Setup
```bash
npm run db:migrate -w apps/server
npm run db:generate -w apps/server
```

### API Tests

#### Auth — Register & Login
```bash
# Register new user
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test1234!"}'
# Expected: 201 { user: { id, email, role: "MENTEE", isVerified: false } }

# Duplicate email
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test1234!"}'
# Expected: 400 { error: "Email already in use" }

# Weak password
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"abc"}'
# Expected: 400 validation error

# Login
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test1234!"}'
# Expected: 200 { user: { ... } } + session cookie set

# Wrong password
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"wrongpassword"}'
# Expected: 401 { error: "Invalid credentials" }

# Get current user
curl -s -b /tmp/cookies.txt http://localhost:3000/api/auth/me
# Expected: 200 { user: { id, email, role, ... } }

# Unauthenticated /me
curl -s http://localhost:3000/api/auth/me
# Expected: 401 { error: "Not authenticated" }

# Logout
curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/auth/logout
# Expected: 200 { message: "Logged out" }
```

#### User Profile
```bash
# Update profile
curl -s -b /tmp/cookies.txt -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Smith","bio":"Hello world","timezone":"Europe/London"}'
# Expected: 200 { user: { firstName: "Alice", ... } }

# Get own profile (with mentor/mentee sub-profiles)
curl -s -b /tmp/cookies.txt http://localhost:3000/api/users/me/profile
# Expected: 200 { user: { ..., mentorProfile: null, menteeProfile: null } }

# Get public profile
curl -s http://localhost:3000/api/users/<USER_ID>
# Expected: 200 { user: { id, role, firstName, lastName, ... } }
```

#### Mentor Profile
```bash
# Create mentor profile (user must have MENTOR role)
# First set role via DB, then:
curl -s -b /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/mentor/profile \
  -H "Content-Type: application/json" \
  -d '{"headline":"Senior Dev","expertise":["React","Node.js"],"hourlyRate":80,"yearsExperience":5}'
# Expected: 201 { mentorProfile: { isApproved: false, ... }, message: "...Pending admin approval" }

# Duplicate mentor profile
curl -s -b /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/mentor/profile \
  -H "Content-Type: application/json" \
  -d '{"headline":"Another"}'
# Expected: 409 { error: "Mentor profile already exists" }

# Update mentor profile
curl -s -b /tmp/mentor_cookies.txt -X PATCH http://localhost:3000/api/mentor/profile \
  -H "Content-Type: application/json" \
  -d '{"headline":"Lead Engineer","hourlyRate":100}'
# Expected: 200 { mentorProfile: { headline: "Lead Engineer", ... } }
```

#### Mentee Profile
```bash
curl -s -b /tmp/mentee_cookies.txt -X POST http://localhost:3000/api/mentee/profile \
  -H "Content-Type: application/json" \
  -d '{"goals":"Become a fullstack dev","interests":["React","Python"],"currentRole":"Student","targetRole":"Software Engineer"}'
# Expected: 201 { menteeProfile: { ... } }
```

### Frontend Tests
- [ ] `/register` — form renders; submitting with valid data creates account and redirects
- [ ] `/register` — submitting duplicate email shows inline error
- [ ] `/login` — valid credentials redirect to `/dashboard`
- [ ] `/login` — invalid credentials show error message
- [ ] `/dashboard` — redirects to `/profile/setup` if `firstName` is null
- [ ] `/profile/setup` — fills in name, bio, timezone; save updates profile
- [ ] `/profile/edit` — pre-fills existing data; changes save correctly
- [ ] `/become-mentor` — form submits and creates mentor profile; success message shown
- [ ] `/users/:id` — public profile renders for a valid user ID
- [ ] Navbar — shows Login/Sign Up when logged out; shows avatar when logged in
- [ ] Role badge — MENTOR badge visible on dashboard after becoming mentor

### End-to-End Flow
1. Register → receive verification email → verify at `/verify-email?token=...`
2. Login → redirected to `/profile/setup` → fill details → land on `/dashboard`
3. From dashboard → "Become a Mentor" → fill form → profile pending approval
4. Admin sets `isApproved = true` in DB → mentor appears in `/mentors` directory

---

## Sprint 2: Mentor Directory & Programs

### API Tests

#### Mentor Directory
```bash
# List approved mentors
curl -s "http://localhost:3000/api/mentors"
# Expected: 200 { mentors: [...], pagination: { page, limit, total, totalPages } }

# Search by name/headline
curl -s "http://localhost:3000/api/mentors?search=Alice"
# Expected: filtered results

# Filter by expertise
curl -s "http://localhost:3000/api/mentors?expertise=React"
# Expected: mentors with React in expertise[]

# Filter by rate range
curl -s "http://localhost:3000/api/mentors?minRate=50&maxRate=100"
# Expected: mentors with hourlyRate between 50–100

# Pagination
curl -s "http://localhost:3000/api/mentors?page=2&limit=5"
# Expected: page 2 results

# Get mentor detail
curl -s "http://localhost:3000/api/mentors/<MENTOR_ID>"
# Expected: 200 { mentor: { id, user, programs[], availability[], ... } }

# Non-existent mentor
curl -s "http://localhost:3000/api/mentors/fakeid"
# Expected: 404 { error: "Mentor not found" }

# Unapproved mentor not visible
# (set isApproved=false in DB, then):
curl -s "http://localhost:3000/api/mentors/<UNAPPROVED_ID>"
# Expected: 404

# Get mentor availability
curl -s "http://localhost:3000/api/mentors/<MENTOR_ID>/availability"
# Expected: 200 { availability: [...] } sorted by dayOfWeek then startTime
```

#### Programs
```bash
# List published programs (public)
curl -s "http://localhost:3000/api/programs"
# Expected: 200 { programs: [...], pagination: {...} }

# Filter by topic
curl -s "http://localhost:3000/api/programs?topic=React"
# Expected: programs with React in topics[]

# Filter by price
curl -s "http://localhost:3000/api/programs?minPrice=0&maxPrice=100"
# Expected: filtered programs

# Get program detail
curl -s "http://localhost:3000/api/programs/<PROGRAM_ID>"
# Expected: 200 { program: { ..., mentor: { user: {...} } } }

# Unpublished program not visible publicly
curl -s "http://localhost:3000/api/programs/<UNPUBLISHED_ID>"
# Expected: 404

# Create program (mentor auth)
curl -s -b /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/programs \
  -H "Content-Type: application/json" \
  -d '{"title":"React Mastery","duration":60,"sessionCount":3,"price":150,"topics":["React"],"isPublished":true}'
# Expected: 201 { program: { id, title, isPublished: true, ... } }

# Create program without auth
curl -s -X POST http://localhost:3000/api/programs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
# Expected: 401

# Create program as MENTEE (403)
curl -s -b /tmp/mentee_cookies.txt -X POST http://localhost:3000/api/programs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","duration":60,"price":0}'
# Expected: 403

# Update program (owner only)
curl -s -b /tmp/mentor_cookies.txt -X PATCH \
  "http://localhost:3000/api/programs/<PROGRAM_ID>" \
  -H "Content-Type: application/json" \
  -d '{"isPublished":false}'
# Expected: 200 { program: { isPublished: false, ... } }

# Delete program
curl -s -b /tmp/mentor_cookies.txt -X DELETE \
  "http://localhost:3000/api/programs/<PROGRAM_ID>"
# Expected: 200 { message: "Program deleted" }

# Get own programs (mentor)
curl -s -b /tmp/mentor_cookies.txt "http://localhost:3000/api/programs/my"
# Expected: 200 { programs: [...] } (includes unpublished)
```

#### Availability
```bash
# Set bulk availability (replaces all slots atomically)
curl -s -b /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/availability/bulk \
  -H "Content-Type: application/json" \
  -d '{"slots":[{"dayOfWeek":1,"startTime":"09:00","endTime":"11:00"},{"dayOfWeek":3,"startTime":"14:00","endTime":"16:00"}],"timezone":"Europe/London"}'
# Expected: 200 { availability: [...], message: "Availability updated" }

# Get own availability
curl -s -b /tmp/mentor_cookies.txt http://localhost:3000/api/availability
# Expected: 200 { availability: [...] } sorted by day then time

# Invalid slot (end before start)
curl -s -b /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/availability \
  -H "Content-Type: application/json" \
  -d '{"dayOfWeek":1,"startTime":"11:00","endTime":"09:00"}'
# Expected: 400 { error: "End time must be after start time" }

# Overlapping slot
curl -s -b /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/availability \
  -H "Content-Type: application/json" \
  -d '{"dayOfWeek":1,"startTime":"10:00","endTime":"12:00"}'
# Expected: 409 { error: "Time slot overlaps with existing availability" }

# Delete availability slot
curl -s -b /tmp/mentor_cookies.txt -X DELETE \
  "http://localhost:3000/api/availability/<SLOT_ID>"
# Expected: 200 { message: "Availability slot deleted" }
```

### Frontend Tests
- [ ] `/mentors` — lists approved mentors with cards; search bar filters results
- [ ] `/mentors` — expertise filter chips narrow results; clear resets
- [ ] `/mentors` — pagination controls work; URL updates with page param
- [ ] `/mentors/:id` — mentor detail page shows bio, expertise, programs, availability grid
- [ ] `/programs` — lists published programs with topic/price filters
- [ ] `/programs/:id` — detail shows sessions count, duration, total time, mentor link
- [ ] `/programs/:id` — "Book Program" visible when logged in; "Sign Up to Book" when not
- [ ] `/mentor/programs` — only accessible to MENTOR/ADMIN; shows 403/redirect for MENTEE
- [ ] `/mentor/programs` — create program form; new program appears in list
- [ ] `/mentor/programs` — edit program pre-fills form; publish/unpublish toggle works
- [ ] `/mentor/programs` — delete with confirm dialog removes program
- [ ] `/mentor/availability` — timezone selector + day slots; save calls bulk endpoint
- [ ] `/mentor/availability` — adding slot with end before start shows validation error

### End-to-End Flow
1. Admin approves mentor → mentor appears in `/mentors` directory
2. Mentor navigates to `/mentor/programs` → creates program → publishes it → visible at `/programs`
3. Mentor sets weekly availability at `/mentor/availability` → visible on `/mentors/:id`
4. Visitor searches `/mentors?search=React` → finds mentor → views profile → clicks a program

---

## Sprint 3: Booking & Sessions

### API Tests

#### Bookings
```bash
# --- SETUP ---
# Register + login as mentee
curl -s -c /tmp/mentee_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentee@test.com","password":"Test1234!"}'

# Register + login as mentor
curl -s -c /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor@test.com","password":"Test1234!"}'

# --- BOOKING TESTS ---

# Create booking (mentee)
curl -s -b /tmp/mentee_cookies.txt -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"programId":"<PROGRAM_ID>","note":"Looking forward to learning!"}'
# Expected: 201 { booking: { id, status: "PENDING", totalPrice, note, program, mentor } }

# Duplicate active booking (409)
curl -s -b /tmp/mentee_cookies.txt -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"programId":"<PROGRAM_ID>"}'
# Expected: 409 { error: "You already have an active booking for this program" }

# Mentor tries to book (403)
curl -s -b /tmp/mentor_cookies.txt -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"programId":"<PROGRAM_ID>"}'
# Expected: 403 { error: "Mentors cannot book programs" }

# List own bookings (mentee sees sent; mentor sees received)
curl -s -b /tmp/mentee_cookies.txt http://localhost:3000/api/bookings
# Expected: 200 { bookings: [{ id, status, program, mentor, mentee, sessions }] }

# Get booking detail (own)
curl -s -b /tmp/mentee_cookies.txt "http://localhost:3000/api/bookings/<BOOKING_ID>"
# Expected: 200 { booking: { ..., program, mentor, mentee, sessions: [] } }

# Get another user's booking (404)
curl -s -b /tmp/mentor_cookies.txt "http://localhost:3000/api/bookings/fakeid"
# Expected: 404 { error: "Booking not found" }

# Mentor confirms booking
curl -s -b /tmp/mentor_cookies.txt -X PATCH \
  "http://localhost:3000/api/bookings/<BOOKING_ID>/confirm"
# Expected: 200 { booking: { status: "CONFIRMED", ... } }

# Confirm already-confirmed (400)
curl -s -b /tmp/mentor_cookies.txt -X PATCH \
  "http://localhost:3000/api/bookings/<BOOKING_ID>/confirm"
# Expected: 400 { error: "Cannot confirm a booking with status CONFIRMED" }

# Schedule a session (mentor)
curl -s -b /tmp/mentor_cookies.txt -X POST \
  "http://localhost:3000/api/bookings/<BOOKING_ID>/sessions" \
  -H "Content-Type: application/json" \
  -d '{"scheduledAt":"2026-05-01T10:00:00Z","meetingUrl":"https://meet.google.com/abc-def"}'
# Expected: 201 { session: { id, status: "SCHEDULED", duration, meetingUrl, ... } }

# Booking auto-moves to ACTIVE after first session scheduled
curl -s -b /tmp/mentee_cookies.txt "http://localhost:3000/api/bookings/<BOOKING_ID>"
# Expected: { booking: { status: "ACTIVE", ... } }

# Cancel booking (mentee)
curl -s -b /tmp/mentee_cookies.txt -X PATCH \
  "http://localhost:3000/api/bookings/<OTHER_BOOKING_ID>/cancel"
# Expected: 200 { booking: { status: "CANCELLED", ... } }

# Cancel already-cancelled (400)
curl -s -b /tmp/mentee_cookies.txt -X PATCH \
  "http://localhost:3000/api/bookings/<CANCELLED_BOOKING_ID>/cancel"
# Expected: 400 { error: "Booking is already cancelled" }
```

#### Sessions
```bash
# List own sessions
curl -s -b /tmp/mentee_cookies.txt http://localhost:3000/api/sessions
# Expected: 200 { sessions: [{ id, status, scheduledAt, duration, booking: { program, mentor, mentee } }] }

# Get session detail
curl -s -b /tmp/mentee_cookies.txt "http://localhost:3000/api/sessions/<SESSION_ID>"
# Expected: 200 { session: { ..., booking: { program, mentor, mentee } } }

# Complete session with feedback and rating (mentee)
curl -s -b /tmp/mentee_cookies.txt -X PATCH \
  "http://localhost:3000/api/sessions/<SESSION_ID>/complete" \
  -H "Content-Type: application/json" \
  -d '{"menteeFeedback":"Really helpful session!","rating":5}'
# Expected: 200 { session: { status: "COMPLETED", rating: 5, menteeFeedback: "...", ... } }

# Complete session with notes (mentor)
curl -s -b /tmp/mentor_cookies.txt -X PATCH \
  "http://localhost:3000/api/sessions/<SESSION_ID>/complete" \
  -H "Content-Type: application/json" \
  -d '{"mentorNotes":"Covered hooks and context API"}'
# Expected: 200 { session: { status: "COMPLETED", mentorNotes: "...", ... } }

# Booking auto-COMPLETED when all sessions in terminal state
curl -s -b /tmp/mentee_cookies.txt "http://localhost:3000/api/bookings/<BOOKING_ID>"
# Expected: { booking: { status: "COMPLETED", ... } }

# Double-complete (400)
curl -s -b /tmp/mentee_cookies.txt -X PATCH \
  "http://localhost:3000/api/sessions/<SESSION_ID>/complete" \
  -H "Content-Type: application/json" \
  -d '{"rating":3}'
# Expected: 400 { error: "Session is already completed" }

# Rating out of range (400)
curl -s -b /tmp/mentee_cookies.txt -X PATCH \
  "http://localhost:3000/api/sessions/<SESSION_ID>/complete" \
  -H "Content-Type: application/json" \
  -d '{"rating":6}'
# Expected: 400 { error: "Number must be less than or equal to 5" }

# Cancel session
curl -s -b /tmp/mentor_cookies.txt -X PATCH \
  "http://localhost:3000/api/sessions/<SESSION_ID>/cancel"
# Expected: 200 { session: { status: "CANCELLED", ... } }

# Unauthenticated access (401)
curl -s http://localhost:3000/api/bookings
# Expected: 401 { error: "Not authenticated" }
```

### Verified Test Results (2026-04-06)

| # | Endpoint | Test | Result |
|---|----------|------|--------|
| 1 | `POST /api/bookings` | Valid booking (mentee) | ✅ 201 status=PENDING |
| 2 | `POST /api/bookings` | Duplicate active booking | ✅ 409 error |
| 3 | `POST /api/bookings` | Mentor tries to book | ✅ 403 Forbidden |
| 4 | `GET /api/bookings` | Mentee lists own bookings | ✅ 200 with bookings |
| 5 | `GET /api/bookings/:id` | Own booking detail | ✅ 200 with program/mentor nested |
| 6 | `GET /api/bookings/:id` | Other user's booking | ✅ 404 |
| 7 | `PATCH /bookings/:id/confirm` | Mentor confirms | ✅ status=CONFIRMED |
| 8 | `PATCH /bookings/:id/confirm` | Double-confirm | ✅ 400 error |
| 9 | `POST /bookings/:id/sessions` | Schedule session | ✅ 201 session created |
| 10 | Booking status | Auto-ACTIVE on first session | ✅ status=ACTIVE |
| 11 | `GET /api/sessions` | Mentee lists sessions | ✅ 200 |
| 12 | `GET /api/sessions/:id` | Session detail | ✅ 200 with booking/program |
| 13 | `PATCH /sessions/:id/complete` | Complete with feedback + rating=5 | ✅ status=COMPLETED |
| 14 | `PATCH /sessions/:id/complete` | Double-complete | ✅ 400 error |
| 15 | `PATCH /bookings/:id/cancel` | Cancel booking | ✅ status=CANCELLED |
| 16 | `PATCH /bookings/:id/cancel` | Cancel already-cancelled | ✅ 400 error |
| 17 | `PATCH /sessions/:id/complete` | Rating=6 (out of range) | ✅ 400 validation error |
| 18 | Booking status | Auto-COMPLETED when all sessions terminal | ✅ status=COMPLETED |
| 19 | `POST /bookings/:id/sessions` | Schedule on completed booking | ✅ 400 blocked |
| 20 | `GET /api/bookings` | Unauthenticated | ✅ 401 |
| 21 | `GET /api/sessions` | Mentor sees their sessions | ✅ 200 |

### Frontend Tests
- [ ] `/programs/:id` — "Book Program" button visible when logged in; "Sign Up to Book" when not
- [ ] `/programs/:id/book` — renders program summary (sessions, duration, price)
- [ ] `/programs/:id/book` — submitting request redirects to `/bookings/:id`
- [ ] `/programs/:id/book` — note field accepts up to 1000 chars; counter shown
- [ ] `/bookings` — lists active and past bookings in separate sections
- [ ] `/bookings` — empty state shown with "Browse programs" link when no bookings
- [ ] `/bookings` — mentor sees incoming requests; mentee sees sent requests
- [ ] `/bookings/:id` — shows program, mentor/mentee, status badge, note
- [ ] `/bookings/:id` — mentor sees "Confirm Booking" when PENDING; button disappears after confirm
- [ ] `/bookings/:id` — mentor sees "Schedule Session" form (date/time + meeting URL)
- [ ] `/bookings/:id` — both parties see "Cancel Booking" for non-terminal bookings
- [ ] `/bookings/:id` — sessions list updates after scheduling
- [ ] `/sessions/:id` — shows date, time, duration, meeting URL as clickable link
- [ ] `/sessions/:id` — "Mark Complete" opens form; mentee sees feedback + star rating
- [ ] `/sessions/:id` — mentor "Mark Complete" shows notes textarea only
- [ ] `/sessions/:id` — "Cancel Session" with confirm prompt
- [ ] `/sessions/:id` — completed session shows feedback, rating stars, notes
- [ ] `/dashboard` — stats cards show total/active/pending booking counts
- [ ] `/dashboard` — upcoming sessions widget lists next 3 sessions with date/time
- [ ] Navbar — "My Bookings" link visible for authenticated users

### End-to-End Flow
1. Mentee logs in → `/programs` → opens program → "Book Program" → fills note → submits → redirected to `/bookings/:id` with status PENDING
2. Mentor logs in → `/bookings` → sees incoming request → clicks "Confirm" → status becomes CONFIRMED
3. Mentor opens booking → clicks "Schedule Session" → picks date/time → adds Zoom URL → submits → session appears in list → booking status becomes ACTIVE
4. Mentee opens `/sessions/:id` → clicks "Mark Complete" → adds feedback → selects 5-star rating → confirms → session status becomes COMPLETED
5. Both users visit `/dashboard` → stats show updated counts, upcoming sessions widget reflects state

### Edge Cases
- Booking a program where you are the mentor → 400 blocked
- Scheduling a session on a CANCELLED booking → 400 blocked
- Session `scheduledAt` in the past → allowed (no restriction on past dates)
- `totalPrice` frozen at booking creation — changing program price does not update existing bookings

---

## Appendix: Common curl Setup

```bash
# Register and get session cookies for a user
curl -s -c /tmp/<role>_cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"Test1234!"}'

# Login (refreshes session cookie)
curl -s -c /tmp/<role>_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"Test1234!"}'

# Promote user to MENTOR role directly in DB
npx prisma db execute \
  --url "postgresql://final_project:Abuchi123@localhost:5433/final_project?schema=public" \
  --stdin <<'SQL'
UPDATE users SET role = 'MENTOR' WHERE email = '<email>';
SQL

# Approve a mentor profile
npx prisma db execute \
  --url "postgresql://final_project:Abuchi123@localhost:5433/final_project?schema=public" \
  --stdin <<'SQL'
UPDATE mentor_profiles SET "isApproved" = true WHERE id = '<mentor_profile_id>';
SQL
```

---

## Sprint 4: Messaging & Reviews

### API Tests

#### Conversations

```bash
# Start a conversation (replace USER_ID with a real user id)
curl -s -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"recipientId":"<USER_ID>"}' | jq .

# List conversations
curl -s http://localhost:3000/api/conversations \
  -b cookies.txt | jq .

# Get messages (replace CONV_ID)
curl -s "http://localhost:3000/api/conversations/<CONV_ID>/messages" \
  -b cookies.txt | jq .

# Send a message
curl -s -X POST "http://localhost:3000/api/conversations/<CONV_ID>/messages" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"content":"Hello from the API test!"}' | jq .

# Error: missing content
curl -s -X POST "http://localhost:3000/api/conversations/<CONV_ID>/messages" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{}' | jq .
# Expected: 400 Bad Request

# Error: unauthenticated
curl -s http://localhost:3000/api/conversations | jq .
# Expected: 401 Unauthorized
```

#### Reviews

```bash
# Get reviews for a mentor (public)
curl -s "http://localhost:3000/api/reviews/mentor/<MENTOR_USER_ID>" | jq .

# Create a review (mentee auth, COMPLETED booking)
curl -s -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"bookingId":"<BOOKING_ID>","rating":5,"title":"Great mentor!","content":"Very helpful and knowledgeable."}' | jq .

# Error: booking not COMPLETED
# Expected: 400

# Error: duplicate review (same booking)
# Expected: 409 Conflict

# Error: mentor trying to review
# Expected: 403 Forbidden

# Mentor responds to a review
curl -s -X PATCH "http://localhost:3000/api/reviews/<REVIEW_ID>/response" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"response":"Thank you for the kind words!"}' | jq .
```

### Verified Results

| Test | Expected | Result |
|------|----------|--------|
| `POST /api/conversations` with valid recipientId | 201 `{ conversation }` | PASS |
| `POST /api/conversations` unauthenticated | 401 | PASS |
| `POST /api/conversations` with self | 400 "Cannot message yourself" | PASS |
| `GET /api/conversations` | 200 `{ conversations: [...] }` with unreadCount | PASS |
| `POST /api/conversations/:id/messages` valid content | 201 `{ message }` | PASS |
| `POST /api/conversations/:id/messages` whitespace-only content | 400 "Message cannot be empty" | PASS (bug found + fixed: `.trim().min(1)`) |
| `POST /api/conversations/:id/messages` missing content | 400 "Required" | PASS |
| `GET /api/conversations/:id/messages` | 200 `{ messages, pagination }` | PASS |
| `GET /api/conversations` unread count updates after read | mentor sees count=0 after reading | PASS |
| `GET /api/reviews/mentor/:profileId` public | 200 `{ reviews, averageRating: 5, totalReviews: 1 }` | PASS |
| `GET /api/reviews/mentor/:userId` public | 200 (same as above) | PASS (bug found + fixed: added userId lookup) |
| `POST /api/reviews` valid (mentee, completed booking) | 201 `{ review }` with rating/title/content | PASS |
| `POST /api/reviews` duplicate booking | 409 "You have already reviewed this booking" | PASS |
| `POST /api/reviews` invalid rating (6) | 400 "Number must be less than or equal to 5" | PASS |
| `POST /api/reviews` missing content | 400 "Required" | PASS |
| `PATCH /api/reviews/:id/response` mentor owns review | 200 `{ review }` with response field | PASS |
| `PATCH /api/reviews/:id/response` wrong mentor | 403 "Not your review to respond to" | PASS |
| `PATCH /api/reviews/:id/response` mentee | 403 "Not your review to respond to" | PASS |

### Frontend Tests

- [ ] Navigate to `/messages` — shows inbox with conversation list and search bar
- [ ] `/messages` with no conversations — shows empty state
- [ ] Click a conversation — opens chat in center panel; shows message history
- [ ] Mobile: tapping a conversation navigates to `/messages/:id`; back button returns to list
- [ ] Type and send a message — appears immediately in chat
- [ ] Right panel visible on desktop (≥1024px) — shows contact name, rating, View Profile + Book Session buttons
- [ ] Navigate to `/mentors/:id` — reviews section visible with star rating and average
- [ ] Navigate to completed booking `/bookings/:id` as mentee — "Leave a Review" button visible
- [ ] Click "Leave a Review" — navigates to `/bookings/:id/review`
- [ ] `/bookings/:id/review` — star rating interactive; submit creates review; redirects to booking
- [ ] `/bookings/:id/review` — mentor can see review; "Respond to this review" button visible
- [ ] Mentor submits response — response rendered inline in ReviewCard

### End-to-End Flows

#### Messaging Flow
1. Log in as Mentee
2. Navigate to a mentor's profile → start a conversation (or use direct URL `/messages`)
3. Go to `/messages` → conversation appears in list
4. Click conversation → type and send a message
5. Log in as Mentor in another tab → go to `/messages` → unread badge visible
6. Click conversation → see message → reply
7. Return to Mentee tab → reply appears

#### Review Flow
1. Ensure a booking exists with status = COMPLETED (complete all sessions)
2. Log in as Mentee → navigate to `/bookings/:id`
3. Click "Leave a Review" → `/bookings/:id/review` page loads
4. Select star rating (1–5), enter title and content → submit
5. Redirected to booking detail
6. Navigate to `/mentors/:mentorId` → review visible in reviews section with average
7. Log in as Mentor → navigate to same mentor detail page → click "Respond to this review"
8. Enter response → submit → response appears under review

### Edge Cases

- Starting a conversation with yourself → 400 Bad Request
- Sending an empty message → 400 Bad Request
- Accessing another user's conversation → 404 Not Found
- Leaving a review on a non-COMPLETED booking → 400
- Leaving a second review on the same booking → 409 Conflict
- Mentor responding to a review they don't own → 403/404
- `getMentorReviews` on a user with no mentor profile → 404 or empty result

---

## Sprint 5: Goals, Resources & Files

### API Tests

#### Goals

```bash
SESSION="<your-session-token>"

# Create goal
curl -s -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=$SESSION" \
  -d '{"title":"Master React Hooks","description":"Deep dive","targetDate":"2026-06-30T00:00:00.000Z"}'

# List goals
curl -s http://localhost:3000/api/goals -H "Cookie: sessionToken=$SESSION"

# List goals filtered by status
curl -s "http://localhost:3000/api/goals?status=IN_PROGRESS" -H "Cookie: sessionToken=$SESSION"

# Add milestone
curl -s -X POST http://localhost:3000/api/goals/<GOAL_ID>/milestones \
  -H "Content-Type: application/json" -H "Cookie: sessionToken=$SESSION" \
  -d '{"title":"Complete tutorial"}'

# Toggle milestone
curl -s -X PATCH http://localhost:3000/api/goals/<GOAL_ID>/milestones/<MS_ID> \
  -H "Cookie: sessionToken=$SESSION"

# Update goal status and progress
curl -s -X PATCH http://localhost:3000/api/goals/<GOAL_ID> \
  -H "Content-Type: application/json" -H "Cookie: sessionToken=$SESSION" \
  -d '{"status":"IN_PROGRESS","progress":50}'

# Delete goal
curl -s -X DELETE http://localhost:3000/api/goals/<GOAL_ID> -H "Cookie: sessionToken=$SESSION"

# Error: unauthenticated
curl -s http://localhost:3000/api/goals  # expect 401

# Error: empty title
curl -s -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" -H "Cookie: sessionToken=$SESSION" \
  -d '{"title":"  "}'  # expect 400
```

#### Resources

```bash
# Upload a file
curl -s -X POST http://localhost:3000/api/resources \
  -H "Cookie: sessionToken=$SESSION" \
  -F "file=@/path/to/file.txt;type=text/plain" \
  -F "title=My Resource" -F "isPublic=false"

# List resources
curl -s http://localhost:3000/api/resources -H "Cookie: sessionToken=$SESSION"

# Download file
curl -s http://localhost:3000/api/resources/<ID>/download \
  -H "Cookie: sessionToken=$SESSION" -O

# Delete resource
curl -s -X DELETE http://localhost:3000/api/resources/<ID> -H "Cookie: sessionToken=$SESSION"

# Error: no file uploaded (expect 400)
# Error: unauthenticated (expect 401)
```

### Verified Results

| Test | Expected | Result |
|------|----------|--------|
| `POST /api/goals` valid | 201 `{ goal }` with status=NOT_STARTED, progress=0 | PASS |
| `POST /api/goals` empty title | 400 | PASS |
| `GET /api/goals` | 200 `{ goals: [...] }` | PASS |
| `GET /api/goals?status=IN_PROGRESS` | 200 filtered list | PASS |
| `POST /api/goals/:id/milestones` | 201 `{ milestone }` | PASS |
| `PATCH /api/goals/:id/milestones/:id` (toggle) | 200 `{ milestone, progress: 50 }` | PASS |
| Progress auto-updates on milestone toggle | 1/2 = 50% | PASS |
| `PATCH /api/goals/:id` status update | 200 `{ goal }` with new status | PASS |
| `DELETE /api/goals/:id` | 200 `{ message }` | PASS |
| `GET /api/goals/:id` after delete | 404 | PASS |
| `GET /api/goals` unauthenticated | 401 | PASS |
| `POST /api/resources` file upload | 201 `{ resource }` with fileType=DOCUMENT | PASS |
| `GET /api/resources` | 200 `{ resources: [...] }` | PASS |
| `GET /api/resources/:id/download` | 200 with Content-Disposition header | PASS |
| `DELETE /api/resources/:id` | 200 `{ message }` | PASS |
| `POST /api/resources` no file | 400 "No file uploaded" | PASS |

### Frontend Tests

- [ ] Navigate to `/goals` — shows goal list with stats (total, in progress, completed, avg progress)
- [ ] `/goals` empty state — shows "No goals yet" + "Create your first goal" link
- [ ] Filter buttons — clicking a status filters the list
- [ ] `/goals/new` — form renders; submit creates goal; redirects to `/goals/:id`
- [ ] `/goals/new` — optional fields (description, target date, linked booking) work
- [ ] `/goals/:id` — shows title, description, progress bar, milestones
- [ ] `/goals/:id` — clicking edit shows inline form; save updates goal
- [ ] `/goals/:id` — checking a milestone toggles completion; progress bar updates
- [ ] `/goals/:id` — add milestone form appends to list
- [ ] `/goals/:id` — overdue target date shows in red
- [ ] `/goals/:id` — delete button navigates back to `/goals`
- [ ] `/resources` — shows "My Uploads" and "Shared Resources" sections
- [ ] `/resources` upload form — selecting file + title + submit uploads successfully
- [ ] `/resources` — download link triggers file download
- [ ] `/resources` — delete own resource removes it from list
- [ ] Dashboard quick links include "My Goals" and "Resources"

### End-to-End Flows

#### Goal Flow
1. Log in as Mentee → navigate to `/goals`
2. Click "New Goal" → fill title, description, target date → submit
3. Redirected to `/goals/:id` → goal shows with empty milestones
4. Add 3 milestones → they appear in list
5. Check 1 milestone → progress bar updates to 33%
6. Check all milestones → progress updates to 100%
7. Click Edit → change status to COMPLETED → save
8. Return to `/goals` — goal shows green "Completed" badge

#### Resource Flow
1. Log in as Mentee → navigate to `/resources`
2. Click "Upload File" → select a file, enter title, submit
3. File appears in "My Uploads" section
4. Click "Download" → file downloads
5. Log in as Mentor → go to `/resources` → uploaded file not visible (isPublic=false)
6. Upload a public resource (check "Make public") → both users can see it

### Edge Cases
- Goal progress auto-recalculates when milestones are toggled
- Linking a goal to a booking that doesn't belong to the mentee → 404
- Deleting a goal cascades to delete its milestones
- Uploading 50MB+ file → 400 (multer limit)
- Downloading a resource you don't own and isn't public → 404
- Deleting a resource removes the file from disk

---

## Design System: Loading Components

### Overview

Loading animations added to the MentorHub design system. These provide visual feedback during async operations while maintaining the warm, trustworthy, energizing brand personality.

**Demo Page:** `/loading-demo`

### Component Inventory

| Component | CSS Class(es) | Purpose |
|-----------|---------------|---------|
| Spinner | `.wf-loading-spinner`, `-xs`, `-sm`, `-lg`, `-xl` | Border-based spinning indicator |
| Spinner Colors | `.wf-loading-spinner-white`, `-accent` | Color variants |
| Circular Spinner | `.wf-loading-circular` | SVG-based smoother spinner |
| Loading Dots | `.wf-loading-dots`, `-sm`, `-lg`, `-white` | Three pulsing dots |
| Loading Bounce | `.wf-loading-bounce` | Three bouncing elements |
| Skeleton | `.wf-skeleton` | Pulsing placeholder |
| Shimmer | `.wf-shimmer`, `.wf-loading-bar` | Shimmer overlay effect |
| Skeleton Text | `.wf-skeleton-text` | Text line placeholder |
| Skeleton Title | `.wf-skeleton-title` | Heading placeholder |
| Skeleton Avatar | `.wf-skeleton-avatar-sm/md/lg` | Avatar placeholder |
| Skeleton Button | `.wf-skeleton-button` | Button placeholder |
| Skeleton Image | `.wf-skeleton-image` | Image placeholder with aspect ratio |
| Progress Bar | `.wf-progress`, `.wf-progress-bar` | Horizontal progress indicator |
| Progress Indeterminate | `.wf-progress-indeterminate` | Animated progress |
| Progress Variants | `.wf-progress-accent`, `-success`, `-sm`, `-lg` | Size and color variants |
| Button Loading | `.wf-btn-loading` | Button with spinner overlay |
| Page Loader | `.wf-page-loader` | Full-page loading overlay |
| Staggered Animation | `.wf-loading-stagger` | Staggered entrance for lists |

### React Components (`LoadingComponents.tsx`)

```tsx
import {
  Spinner, CircularSpinner, LoadingDots, LoadingBounce,
  Skeleton, SkeletonText, SkeletonTitle, SkeletonAvatar,
  SkeletonButton, SkeletonImage, SkeletonCard, SkeletonMentorCard,
  SkeletonTableRow, ProgressBar, PageLoader, InlineLoader,
  LoadingButton, LoadingStagger, ContentPlaceholder
} from '../components/LoadingComponents';
```

### Visual Verification Tests

- [ ] Navigate to `/loading-demo` — page renders without console errors
- [ ] **Spinners section** — all 5 sizes visible (xs, sm, md, lg, xl) with smooth rotation
- [ ] **Spinner colors** — accent variant uses teal; white variant visible on blue background
- [ ] **Circular SVG spinner** — 3 sizes render with smooth dash animation
- [ ] **Loading dots** — 3 sizes render; dots pulse with staggered timing
- [ ] **Loading bounce** — 3 elements bounce with staggered timing
- [ ] **Skeleton primitives** — skeleton, title, text (3 lines), avatars (3 sizes), button, image all render
- [ ] **Shimmer effect** — shimmer sweeps left-to-right on skeleton elements
- [ ] **Skeleton compositions** — Generic Card and Mentor Card skeletons render correctly
- [ ] **Table skeleton** — 3 rows render with column widths varying
- [ ] **Progress bar determinate** — shows 45% filled; +10%/-10% buttons update correctly
- [ ] **Progress bar indeterminate** — animated bar moves continuously
- [ ] **Progress sizes** — sm/md/lg heights visually distinct
- [ ] **Progress variants** — default (teal), accent (terracotta), success (green) colors correct
- [ ] **Button loading states** — clicking button shows spinner for 2s; primary/secondary/danger all show spinners
- [ ] **Inline loader** — spinner + text renders inline within paragraph
- [ ] **Staggered animation** — 5 items animate in sequence on page load
- [ ] **Page loader** — clicking button shows full-page overlay with spinner for 2.5s
- [ ] **Page loader backdrop** — background blur visible; content dimmed

### Accessibility Tests

- [ ] All loading elements have `role="status"` or `aria-busy="true"`
- [ ] Screen reader announces loading state (test with VoiceOver/NVDA)
- [ ] **Reduced motion test:** Enable `prefers-reduced-motion: reduce` in OS settings:
  - [ ] All spinners stop animating
  - [ ] Skeleton pulse stops; elements remain visible
  - [ ] Shimmer effect disappears
  - [ ] Progress indeterminate shows full bar (no animation)
  - [ ] Staggered items appear instantly
  - [ ] Page loader shows without backdrop blur animation

### Integration Tests

- [ ] `LoadingState` component at `/dashboard` (when loading) — uses `wf-loading-shell` and `wf-loading-spinner`
- [ ] Lazy-loaded pages show `<LoadingState>` during chunk load
- [ ] Button loading state in `/login` form — submit button shows spinner during API call
- [ ] Skeleton cards can replace real MentorCard during fetch

### Performance Tests

- [ ] No layout shift when skeleton replaced with real content (same dimensions)
- [ ] Animations maintain 60fps (check with Chrome DevTools Performance tab)
- [ ] `will-change` not causing excessive memory usage

### Verified Results (2026-04-19)

| Test | Expected | Result |
|------|----------|--------|
| `/loading-demo` renders | Page loads without errors | |
| Spinners (5 sizes) | All visible, rotating smoothly | |
| Spinner color variants | White on blue bg, accent teal | |
| Circular SVG spinner | Smooth dash animation | |
| Loading dots (3 sizes) | Staggered pulse animation | |
| Loading bounce | Staggered bounce animation | |
| Skeleton primitives | All render with pulse | |
| Shimmer effect | Left-to-right sweep | |
| Skeleton Card | Card layout with placeholders | |
| Skeleton Mentor Card | Avatar + info layout | |
| Table skeleton rows | Variable column widths | |
| Progress determinate | 45%, buttons update +/-10% | |
| Progress indeterminate | Continuous animation | |
| Progress sizes/variants | Visually distinct | |
| Button loading | Spinner overlay for 2s | |
| Inline loader | Spinner + text inline | |
| Staggered animation | Sequential fade-in | |
| Page loader | Full overlay with blur | |
| Reduced motion: spinners | Stop animating | |
| Reduced motion: skeletons | Static, no pulse | |
| Reduced motion: shimmer | Hidden | |
| Reduced motion: progress | Full bar, no anim | |
| a11y: role="status" | Present on loaders | |

### Edge Cases

- Spinner inside flex container — centers correctly
- Skeleton inside grid — respects column width
- Progress value > 100 — capped at 100%
- Progress value < 0 — capped at 0%
- LoadingButton disabled while loading — pointer-events: none
- Page loader z-index — appears above navbar (z-index: 100)

---

## Sprint 7: Local Fake Data Framework

### Scope

Implemented a local-only, reset-before-seed fake data framework with CLI commands and profile presets.

Primary seeded entities:
- Mentors and expertise skills
- Mentees and profiles
- Programs, bookings, mentoring sessions
- Resources
- Conversations and messages

Optional seeded entities (via flags):
- Goals and milestones
- Payments

### API/Command Tests

```bash
# Small local seed profile
npm run seed:local

# Medium profile
npm run seed:local:medium

# Small profile with optional entities
npm run db:seed:small -w apps/server -- --include-goals --include-payments

# Production safety guard test
NODE_ENV=production npm run db:seed:small -w apps/server
# Expected: fails with production guard message
```

### Frontend Verification

- [ ] `/mentors` renders multiple seeded mentors with varied expertise
- [ ] Mentor cards show realistic profile data and rates
- [ ] `/resources` lists seeded resources and visibility mix
- [ ] `/messages` shows seeded conversations and message history
- [ ] `/bookings` and `/sessions` show seeded booking/session states

### End-to-End Flow

1. Run `npm run seed:local`.
2. Start app servers.
3. Log in with a seeded mentor and a seeded mentee account.
4. Verify mentor discovery, resources, and message flows are populated.
5. Re-run seed command and confirm deterministic reset behavior.

### Edge Cases

- Running seed in production mode should fail fast.
- Running seed in CI should fail unless explicitly allowed.
- Conversation participant ordering should avoid unique key conflicts.
- Reset order should avoid foreign key constraint failures.

### Verified Results Table

| Test | Expected Result | Status |
|------|------------------|--------|
| `npm run seed:local` | Completes and prints entity summary counts | ✅ |
| `npm run db:seed:small -w apps/server -- --include-goals --include-payments` | Completes with non-zero goals/payments | ✅ |
| `NODE_ENV=production npm run db:seed:small -w apps/server` | Fails with local-only guard | ✅ |

---

## Sprint 6: Student-Pack Tool Replacements

### Scope

This sprint replaces external student-pack dependencies with local or self-managed alternatives where requested:

- Travis CI -> GitHub Actions
- Codecov -> Local and CI coverage reports
- Sentry/New Relic -> Structured file logging with Pino
- BrowserStack -> Self-hosted Playwright cross-browser tests
- CodeScene -> ESLint + self-hosted SonarQube configuration
- Heroku retained by product decision (no VPS migration in this sprint)

### API Tests

```bash
# Health check after server bootstrap changes
curl -s http://localhost:3000/api/health
# Expected: 200 { "status": "ok" }

# Trigger auth error path (invalid credentials) and verify server returns JSON error
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"missing@example.com","password":"wrong"}'
# Expected: 401/400 with { error: "..." }
```

### Frontend Tests

- [x] Run unit tests in web workspace with Vitest
- [x] Run coverage generation in web workspace
- [x] Run Playwright smoke test across Chromium, Firefox, and WebKit
- [x] Verify Playwright HTML report is generated

### End-to-End Flows

1. Run `npm run test:web` and confirm spec execution in `apps/web/src/components/RoleBadge.spec.tsx`
2. Run `npm run test:server` and confirm spec execution in `apps/server/src/lib/hash.spec.ts`
3. Run `npm run test:coverage` and confirm reports are generated in `apps/web/coverage` and `apps/server/coverage`
4. Run `npm run e2e -w apps/web` and confirm all three browser projects pass
5. Confirm CI workflow includes lint, build, unit-tests, coverage artifacts, e2e, and optional SonarQube scan

### Edge Cases

- Missing `SONAR_HOST_URL` or `SONAR_TOKEN` secrets should skip SonarQube job instead of failing CI
- Missing Playwright browser binaries should fail with clear install guidance (`npx playwright install`)
- Vitest should not discover Playwright tests (`e2e/**` excluded)
- Logs directory should auto-create if absent before writing server logs

### Verified Results (2026-04-19)

| Test | Command | Expected | Result |
|------|---------|----------|--------|
| Web unit tests | `npm run test:web` | Vitest passes | PASS |
| Server unit tests | `npm run test:server` | Vitest passes | PASS |
| Coverage reports | `npm run test:coverage` | HTML + lcov output generated | PASS |
| E2E cross-browser | `npm run e2e -w apps/web` | Chromium/Firefox/WebKit all pass | PASS |
| CI workflow structure | `.github/workflows/ci.yml` | lint/build/unit/e2e/artifact jobs present | PASS |
| SonarQube local stack | `sonarqube-compose.yml` | Local self-hosted config available | PASS |
| Structured file logging | `apps/server/src/lib/logger.ts` | JSON file logging configured | PASS |

### Dissertation Evidence Checklist

- [ ] Capture screenshot of GitHub Actions workflow run with all non-optional jobs passing
- [ ] Capture screenshot of web coverage summary in terminal
- [ ] Capture screenshot of server coverage summary in terminal
- [ ] Capture screenshot of Playwright multi-browser pass output
- [ ] Capture screenshot of SonarQube dashboard for project scan
- [ ] Capture sample lines from `logs/server.log` showing request and error events

---

## Sprint 7: Admin Safeguarding, User Reporting, Enhanced Messaging & Dummy Payments

### Scope

Four interconnected features:
1. **Admin Safeguarding** — Ban/suspend users with enforcement in auth middleware
2. **User Reporting** — Report abusive messages/conversations with admin review queue
3. **Enhanced Messaging** — Timestamps on message bubbles + report button with modal
4. **Dummy Payments** — Mock Stripe checkout flow (not real Stripe integration yet)

### API Tests

#### Admin Ban/Suspend Users
```bash
# Ban a user
curl -s -b /tmp/admin_cookies.txt -X PATCH http://localhost:3000/api/admin/users/{userId}/ban \
  -H "Content-Type: application/json" \
  -d '{"isBanned":true}'
# Expected: 200 { user: { id, isBanned: true } }

# Verify banned user cannot login
curl -s -c /tmp/banned_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"banned@test.com","password":"Test1234!"}'
# Expected: 403 { error: "Account banned" }

# Suspend a user until date
curl -s -b /tmp/admin_cookies.txt -X PATCH http://localhost:3000/api/admin/users/{userId}/suspend \
  -H "Content-Type: application/json" \
  -d '{"suspendedUntil":"2026-04-25T12:00:00Z"}'
# Expected: 200 { user: { id, suspendedUntil: "2026-04-25T12:00:00Z" } }

# Verify suspended user cannot login during suspension
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"suspended@test.com","password":"Test1234!"}'
# Expected: 403 { error: "Account suspended until 2026-04-25T..." }
```

#### User Reporting
```bash
# File a report against a user
curl -s -b /tmp/user_cookies.txt -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "reportedId":"{targetUserId}",
    "reason":"HARASSMENT",
    "description":"User sent abusive messages"
  }'
# Expected: 201 { report: { id, status: "PENDING", reason: "HARASSMENT" } }

# Cannot report yourself
curl -s -b /tmp/user_cookies.txt -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"reportedId":"{yourUserId}","reason":"SPAM"}'
# Expected: 400 { error: "Cannot report yourself" }

# Admin: List pending reports
curl -s -b /tmp/admin_cookies.txt "http://localhost:3000/api/admin/reports?status=PENDING"
# Expected: 200 { reports: [...], pagination: { page, limit, total, totalPages } }

# Admin: Update report status and add notes
curl -s -b /tmp/admin_cookies.txt -X PATCH http://localhost:3000/api/admin/reports/{reportId} \
  -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","adminNotes":"User warned and suspended"}'
# Expected: 200 { report: { id, status: "RESOLVED", adminNotes: "..." } }
```

#### Dummy Payment Flow
```bash
# Initiate checkout (creates PENDING payment)
curl -s -b /tmp/user_cookies.txt -X POST http://localhost:3000/api/payments/checkout \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"{bookingId}"}'
# Expected: 200 { payment: { id, status: "PENDING" }, checkoutSession: { id, url } }

# Confirm payment (simulates Stripe webhook)
curl -s -b /tmp/user_cookies.txt -X POST http://localhost:3000/api/payments/{paymentId}/confirm
# Expected: 200 { payment: { id, status: "COMPLETED", amount } }

# List own payments
curl -s -b /tmp/user_cookies.txt http://localhost:3000/api/payments
# Expected: 200 { payments: [{ id, status, amount, booking: { id, program: { title } } }] }

# Admin: List all payments with revenue
curl -s -b /tmp/admin_cookies.txt "http://localhost:3000/api/payments/admin?page=1&limit=20"
# Expected: 200 { payments: [...], totalRevenue: 1234.56, pagination: {...} }
```

### Frontend Tests

#### Messages Page
- [ ] Open `/messages` and select an active conversation
- [ ] Verify message bubbles show timestamps (HH:mm format) below content
- [ ] Find report button (⚑ icon) in chat header next to contact name
- [ ] Click report button and verify ReportModal opens
- [ ] Select "Harassment" reason from dropdown
- [ ] Add description: "User sent inappropriate messages"
- [ ] Click "Submit Report" and verify success message
- [ ] Verify modal closes after 1.5 seconds

#### Admin Users Page
- [ ] Navigate to `/admin/users`
- [ ] Find a user in the list
- [ ] Verify new "Safety" column shows status badge (ACTIVE, BANNED, SUSPENDED)
- [ ] Click "Ban" button, verify badge changes to "BANNED"
- [ ] Click "Unban" button, verify badge changes to "ACTIVE"
- [ ] Click "Suspend" button, verify date picker appears
- [ ] Select future date and click "Set", verify badge shows "SUSPENDED"
- [ ] Click "Clear Suspension", verify badge returns to "ACTIVE"
- [ ] Try logging in with banned/suspended user, verify 403 error

#### Admin Reports Page
- [ ] Navigate to `/admin/reports`
- [ ] Verify reports list shows: Reporter, Reported User, Reason, Date, Status
- [ ] Filter by status "PENDING" and verify only pending reports show
- [ ] Click "View" on a report to expand details
- [ ] Verify full report details display (description, message, admin notes)
- [ ] Change status dropdown from PENDING to REVIEWED
- [ ] Add admin notes: "Reviewed - user warned"
- [ ] Click "Save" and verify status updates
- [ ] Change filter to REVIEWED and verify updated report appears

#### Payment Checkout
- [ ] Navigate to booking and click "Complete Payment" button
- [ ] Verify redirected to `/checkout/{bookingId}`
- [ ] Verify order summary shows program title, mentor name, total amount
- [ ] Fill in test card number: 4242 4242 4242 4242
- [ ] Fill in expiry: 12/25 and CVC: 123
- [ ] Click "Pay £X.XX" button
- [ ] Verify redirected to `/bookings/{id}?paid=1`
- [ ] Verify green success banner shows: "Payment successful"
- [ ] Verify payment status badge on booking shows: "✓ Payment Received"

#### Payment History
- [ ] Navigate to `/payments`
- [ ] Verify table shows: Program, Mentor, Amount, Status, Date, Action
- [ ] Verify payment status badges display correctly (PENDING, COMPLETED)
- [ ] Click "View Booking" to navigate back to booking detail
- [ ] Verify empty state displays when user has no payments

#### Booking Detail Payment Integration
- [ ] Open a CONFIRMED booking (no payment yet)
- [ ] Verify payment status section shows: "Not Yet Paid" with "Complete Payment" button
- [ ] Complete payment flow (checkout → confirm)
- [ ] Return to booking detail
- [ ] Verify payment status updates to "✓ Payment Received"
- [ ] Verify "Complete Payment" button no longer appears

### Edge Cases

- **Ban on logged-in user**: User is logged in, admin bans them → next API call gets 403
- **Suspend expiry**: Create suspension with past date → user can login immediately
- **Report self**: Attempt to report own user → 400 error
- **Duplicate report**: Report same user multiple times → all reports create successfully
- **Payment cancel**: Start checkout, then navigate away before confirming → next attempt creates new payment
- **Admin actions**: Non-admin tries to access `/admin/reports` or ban endpoints → 403 Unauthorized

### Verified Results Table

| Test | Expected Result | Status |
|------|-----------------|--------|
| Ban user API | User receives 403 on next auth check | ✅ PASS |
| Suspend user API | User receives 403 with suspension date message | ✅ PASS |
| Report user API | Report created with PENDING status | ✅ PASS |
| Report self validation | 400 error with "Cannot report yourself" | ✅ PASS |
| Admin reports list | Paginated list returns with reporter/reported details | ✅ PASS |
| Checkout initiation | Creates PENDING payment and returns checkout URL | ✅ PASS |
| Payment confirmation | Marks payment as COMPLETED | ✅ PASS |
| Message timestamps | Timestamps display in HH:mm format on bubbles | ✅ PASS |
| Report modal | Modal opens, submits report, shows success | ✅ PASS |
| Admin users UI | Ban/suspend controls update badges correctly | ✅ PASS |
| Admin reports UI | Paginated reports display with expandable details | ✅ PASS |
| Payment checkout UI | Mock Stripe form renders and flow completes | ✅ PASS |
| Payment history UI | Lists user payments with correct status badges | ✅ PASS |
| Booking payment CTA | Shows payment status and button when needed | ✅ PASS |
| Linting | All new components pass eslint | ✅ PASS |
