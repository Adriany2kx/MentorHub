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

## Sprint 6: Tooling Consolidation

### Scope

This sprint consolidates the project toolchain around local and self-managed workflows for testing, quality checks, and operational observability.

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
3. Confirm CI workflow includes lint, build, and unit-tests

### Edge Cases

- Vitest should not discover Playwright tests (`e2e/**` excluded)
- Logs directory should auto-create if absent before writing server logs

### Verified Results (2026-04-19)

| Test | Command | Expected | Result |
|------|---------|----------|--------|
| Web unit tests | `npm run test:web` | Vitest passes | PASS |
| Server unit tests | `npm run test:server` | Vitest passes | PASS |
| CI workflow structure | CI pipeline file | lint/build/unit jobs present | PASS |
| Structured file logging | Server logger module | JSON file logging configured | PASS |

### Dissertation Evidence Checklist

- [ ] Capture screenshot of GitHub Actions workflow run with all non-optional jobs passing
- [ ] Capture screenshot of web coverage summary in terminal
- [ ] Capture screenshot of server coverage summary in terminal
- [ ] Capture screenshot of Playwright multi-browser pass output
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

---

## Sprint 8: Mentor Payments & Admin Account Management

### Scope
- **Mentor Payments Panel**: Mentors can view earnings from completed bookings/sessions
- **Admin Account Creation**: Admins can create new admin accounts with permissions
- **Earnings Dashboard**: Summary of total earnings and completed sessions

### API Tests

#### Mentor Payments Endpoint
```bash
# Login as a mentor first
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor@test.com","password":"Test1234!"}'

# Get mentor earnings (page 1)
curl -s -b /tmp/cookies.txt http://localhost:3000/api/payments/mentor?page=1
# Expected: 200 { payments: [...], totalEarnings: number, pagination: {...} }

# Non-mentor tries to access → 404 Mentor profile not found
curl -s -b /tmp/cookies.txt http://localhost:3000/api/payments/mentor
# Expected: 404 { error: "Mentor profile not found" }

# Unauthenticated access → 401
curl -s http://localhost:3000/api/payments/mentor
# Expected: 401 Unauthorized
```

#### Admin Account Creation
```bash
# Login as admin first
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin1234!"}'

# Create new admin account
curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newadmin@test.com",
    "password":"NewAdmin123",
    "firstName":"New",
    "lastName":"Admin"
  }'
# Expected: 201 { user: { id, email, role: "ADMIN", firstName, lastName, createdAt } }

# Duplicate email → 409
curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newadmin@test.com",
    "password":"AnotherPass123",
    "firstName":"Another",
    "lastName":"Admin"
  }'
# Expected: 409 { error: "Email already registered" }

# Missing fields → 400
curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
# Expected: 400 { error: "validation error message" }

# Password too short → 400
curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin2@test.com",
    "password":"abc",
    "firstName":"Test",
    "lastName":"User"
  }'
# Expected: 400 validation error

# Non-admin tries to create → 403
curl -s -b /tmp/cookies_mentee.txt -X POST http://localhost:3000/api/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin3@test.com",
    "password":"Admin1234",
    "firstName":"Test",
    "lastName":"Admin"
  }'
# Expected: 403 Unauthorized
```

### Frontend Tests

#### Mentor Payments Page (`/mentor/payments`)
- [ ] Navigate to `/mentor/payments` as a mentor
- [ ] Page shows "Earnings" header
- [ ] Summary cards display: "Total Earned" and "Completed Sessions" with correct values
- [ ] List displays completed bookings with: program title, mentee name, amount, status, date
- [ ] Status badge shows "COMPLETED" in green
- [ ] Empty state displays when no completed bookings
- [ ] Pagination controls appear when total > 20
- [ ] Click "Prev/Next" buttons to navigate pages
- [ ] Page resets to 1 when amount changes

#### Admin Create Account Page (`/admin/users/create`)
- [ ] Navigate to `/admin/users/create` as admin
- [ ] Page shows "Create Admin Account" header
- [ ] Form displays fields: email, firstName, lastName, password
- [ ] Password placeholder shows "Min. 6 characters"
- [ ] Submit with valid data → success message and redirect to `/admin/users`
- [ ] Submit with empty email → error: "All fields are required"
- [ ] Submit with invalid email format → browser validation (HTML5)
- [ ] Submit with password < 6 chars → error: "Password must be at least 6 characters"
- [ ] Submit with duplicate email → error: "Email already registered" (from API)
- [ ] Permissions info box displays on page with admin capabilities listed
- [ ] Cancel button returns to `/admin/users`
- [ ] Buttons disabled while submission in progress
- [ ] Form clears after successful creation

### Edge Cases

- **Mentor with no earnings**: Mentor has never completed a session → empty state displays
- **Mentor pagination**: Mentor with >20 completed sessions → pagination works correctly
- **Admin role verification**: New admin can immediately login and create more admins
- **Password hashing**: Verify new admin password is hashed (check DB, not in plaintext)
- **Non-mentors**: Mentee/admin try to access `/mentor/payments` → page still renders but API returns error
- **Non-admin**: Mentee tries to access `/admin/users/create` → redirected to `/dashboard`

### Verified Results Table

| Test | Expected Result | Status |
|------|-----------------|--------|
| GET /api/payments/mentor | Returns mentor earnings with pagination | ✅ PASS |
| Mentor earnings calculation | totalEarnings matches sum of COMPLETED payments | ✅ PASS |
| Non-mentor accessing mentor endpoint | 404 Mentor profile not found | ✅ PASS |
| POST /api/admin/users/create | Creates new admin account with hashed password | ✅ PASS |
| Duplicate admin email | 409 Email already registered | ✅ PASS |
| New admin can login | Created admin logs in successfully | ✅ PASS |
| New admin has full permissions | Can create more admins, access all admin routes | ✅ PASS |
| MentorPayments page loads | Fetches data, displays summary and list | ✅ PASS |
| AdminCreateAccount page loads | Form renders with validation and submission | ✅ PASS |
| Empty state on no earnings | Mentor with 0 completed sessions shows empty state | ✅ PASS |
| Pagination on earnings list | Multiple pages work correctly | ✅ PASS |
| Form validation (email) | HTML5 validation prevents invalid email submission | ✅ PASS |
| Form validation (password) | Error message shown for passwords < 6 chars | ✅ PASS |
| Success message & redirect | Admin creation shows success and redirects to users list | ✅ PASS |
| Linting | MentorPayments.tsx and AdminCreateAccount.tsx pass eslint | ✅ PASS |

---

## Final Sprint Summary: Requirements Analysis

### Overview

A comprehensive analysis comparing the MentorHub implementation against the original project wireframes and sitemap has been completed. This documents feature coverage, implementation gaps, and design decisions made during development.

### Analysis Document

**File**: `docs/REQUIREMENTS_ANALYSIS.md`

**Contents**:

- Executive Summary: 71% overall feature completion (39 of 55 wireframed pages implemented)
- Feature Coverage Matrix: 40+ features tracked across public, authenticated, admin, and legal sections
- Detailed Feature Analysis: 10 subsections covering auth, mentor discovery, bookings, messaging, reviews, goals, payments, admin tools, mobile responsiveness, and design system
- Security Posture: Implemented security measures vs. standard requirements
- Technical Decisions: Documented deviations from wireframes with justifications (mock Stripe, seed-based admin, deferred community features)
- Implementation Statistics: 39 pages built, 60+ API endpoints, 15+ database tables
- Gap Analysis: Critical, medium, and nice-to-have features not yet implemented
- Conclusion: Production-ready MVP with clear roadmap for future enhancements

### Test Results

| Area | Coverage | Status |
| --- | --- | --- |
| Feature Coverage Matrix | All 55 wireframed pages documented | ✅ PASS |
| Public Pages | 14 of 20 implemented (70%) | ✅ PASS |
| Authenticated Pages | 16 of 24 implemented (67%) | ✅ PASS |
| Admin Pages | 7 of 5 implemented (140%) | ✅ PASS |
| Legal Pages | 2 of 6 implemented (33%) | ⚠️ PARTIAL |
| Security Implementation | 9 of 10 core measures in place | ✅ PASS |
| Mobile Responsiveness | Fully responsive design implemented | ✅ PASS |
| API Endpoint Coverage | 60+ endpoints for implemented features | ✅ PASS |

### Key Findings

- **Implementation Completeness**: 39 pages across public landing, authenticated user workflows, and admin tools
- **Critical Features Implemented**: User registration & auth, mentor discovery, program booking, session management, messaging, payments (mock), admin tools, goal tracking, resource management
- **Intentional Gaps**: Video conferencing (deferred), real Stripe integration (mock only), community features (deferred), marketing pages (deferred for launch readiness)
- **Mobile Strategy**: Full responsive design on all implemented pages; tested on mobile viewports

### Requirements vs. Implementation

**Exceeds Requirements**:

- Admin tools: Created 7 pages vs. 5 wireframed (Reports, Dashboard, User Management, Mentor Management, Program Management, Payment History, Create Account)
- Messaging: Real-time message delivery and read status tracking

**Meets Requirements**:

- Authentication: Full email verification, password reset, session management
- Mentor Directory: Search, filter, public profiles with ratings
- Booking System: Program selection, session scheduling, cancellation handling
- User Roles: MENTEE, MENTOR, ADMIN with proper access control

**Deferred to Future**:

- Video conferencing for live sessions
- Real Stripe integration (currently mocked)
- Community/group features
- Marketing pages (pricing, how-it-works)
- Expanded legal pages (cookies, refund policy, community guidelines)

### Documentation Location

---

## Sprint: Email Verification & Cloudflare Turnstile CAPTCHA

### Features

- Email sending with Ethereal auto-setup for development
- Cloudflare Turnstile CAPTCHA on registration (always visible)
- Cloudflare Turnstile CAPTCHA on login (after 4 failed attempts)

### Setup
```bash
# Configure environment variables
# apps/web/.env
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# apps/server/.env (add to existing file)
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Start dev servers
npm run dev:server
npm run dev:web
```

### API Tests

#### Email Verification

```bash
# Register with valid turnstile token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify-test@example.com",
    "password": "TestPassword123",
    "turnstileToken": "test-token"
  }'
# Expected: 201 { user: { id, email, isVerified: false } }
# Server logs should show Ethereal preview URL for email verification

# Register without turnstile token (should fail)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify-fail@example.com",
    "password": "TestPassword123"
  }'
# Expected: 400 { error: "CAPTCHA verification failed. Please try again." }
```

#### Login with Turnstile After Failed Attempts
```bash
# First login attempt with wrong password (no CAPTCHA needed yet)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify-test@example.com",
    "password": "WrongPassword"
  }'
# Expected: 401 { error: "Invalid email or password" }

# After 4 failed attempts, next login requires Turnstile token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify-test@example.com",
    "password": "TestPassword123",
    "turnstileToken": "test-token"
  }'
# Expected: 200 { user: { ... } } + session cookie
```

### Frontend Tests

#### Registration Page
- [ ] Navigate to `/register`
- [ ] Verify Turnstile CAPTCHA widget is visible
- [ ] Verify "Create Account" button is **disabled** until CAPTCHA is solved
- [ ] Fill in email and password fields
- [ ] Solve Turnstile CAPTCHA (test key auto-passes)
- [ ] Verify "Create Account" button becomes **enabled**
- [ ] Submit form — should succeed and redirect to home
- [ ] Check server logs for Ethereal preview URL for verification email
- [ ] Enter incorrect Turnstile solution — button should stay disabled

#### Login Page - CAPTCHA After Failed Attempts
- [ ] Navigate to `/login`
- [ ] Verify Turnstile widget is **not visible** initially
- [ ] Enter valid email and wrong password, submit 4 times
- [ ] Verify Turnstile widget appears after 4th failed attempt
- [ ] Verify "Log In" button is **disabled** until CAPTCHA is solved
- [ ] Solve CAPTCHA
- [ ] Verify "Log In" button becomes **enabled**
- [ ] Submit with correct password — should succeed
- [ ] Verify failed attempts counter resets on successful login
- [ ] Log out and log back in — CAPTCHA should not appear (counter reset)

#### Email Flow Verification (Server Logs)
- [ ] Register account
- [ ] Check server terminal for Ethereal preview log line like:
  ```
  [timestamp] INFO: Verification email sent (preview available)
    previewUrl: https://ethereal.email/message/...
  ```
- [ ] Click preview URL in logs
- [ ] Verify email shows correct verification link with token
- [ ] Copy token and test `/verify-email` endpoint

### Edge Cases

#### Email
- [ ] Register with multiple accounts — each should get unique Ethereal preview URL
- [ ] Check that Ethereal account is created once and reused (same test user in logs)

#### CAPTCHA
- [ ] Solve CAPTCHA on Register, clear field, re-solve — button should stay enabled
- [ ] On Login, after 4 failures, close and reopen page — counter persists in session
- [ ] CAPTCHA error (network failure) — button should disable again
- [ ] Test with empty turnstileToken field — backend rejects

### Verified Results

| Test | Status | Notes |
|------|--------|-------|
| Register endpoint accepts turnstileToken | ✅ PASS | Returns 201 with user data |
| Register endpoint rejects without token | ✅ PASS | Returns 400 CAPTCHA error |
| Login endpoint accepts turnstileToken | ✅ PASS | Returns 200 with user data |
| Ethereal test account auto-setup | ✅ PASS | Account created at startup, logged with credentials |
| Email preview URL logging | ⏳ PENDING | Will log on next registration test |
| Register page Turnstile widget renders | ⏳ PENDING | Visual verification needed |
| Register page submit button disabled until solved | ⏳ PENDING | Visual verification needed |
| Login page failed attempt counter | ⏳ PENDING | Visual verification needed |
| Login page Turnstile appears after 4 failures | ⏳ PENDING | Visual verification needed |

### Next Steps
1. Test email preview URL by registering new account and checking server logs
2. Verify Turnstile widget renders correctly on both pages
3. Confirm failed attempt counter increments properly
4. Validate CAPTCHA requirement blocks form submission until solved

See [REQUIREMENTS_ANALYSIS.md](./REQUIREMENTS_ANALYSIS.md) for the full requirements analysis with detailed feature breakdowns, gap justifications, and roadmap for future work.

---

## Sprint 13: AI Foundation + Smart Matching

### Overview
Introduces Anthropic SDK integration (Claude Haiku), a `callClaude` helper with prompt caching, and four AI/rule-based endpoints. Frontend gains AI recommendations panel on Dashboard, compatibility score on MentorDetail, goal-mentor suggestions on GoalDetail, and profile quality score card on Dashboard.

### New Files
- `apps/server/src/lib/ai.ts` — Anthropic singleton + callClaude helper
- `apps/server/src/routes/ai.ts` — AI endpoints, mounted at `/api/ai`

### API Tests

| Endpoint | Method | Test | Expected |
|----------|--------|------|----------|
| `/api/ai/profile-quality` | GET | Authenticated user with incomplete profile | 200 + score < 100 + suggestions array |
| `/api/ai/profile-quality` | GET | Unauthenticated | 401 |
| `/api/ai/mentor-recommendations` | GET | Mentee with full profile | 200 + recommendations array (≤5 items) |
| `/api/ai/mentor-recommendations` | GET | User with no mentee profile | 200 + empty or generic list |
| `/api/ai/mentor-recommendations` | GET | Unauthenticated | 401 |
| `/api/ai/compatibility/:mentorId` | GET | Valid mentor ID + MENTEE user | 200 + score + breakdown + explanation |
| `/api/ai/compatibility/:mentorId` | GET | Non-existent mentorId | 404 |
| `/api/ai/goal-mentors/:goalId` | GET | Own goal | 200 + mentors array |
| `/api/ai/goal-mentors/:goalId` | GET | Another user's goal | 404 |
| `/api/ai/goal-mentors/:goalId` | GET | Non-existent goal | 404 |
| Any `/api/ai/*` | GET | 21+ rapid requests | 429 (rate limit) |

### curl Test Commands

```bash
# Profile quality (replace COOKIE with actual session cookie)
curl -s -H "Cookie: sessionToken=COOKIE" http://localhost:3000/api/ai/profile-quality | jq .

# Mentor recommendations
curl -s -H "Cookie: sessionToken=COOKIE" http://localhost:3000/api/ai/mentor-recommendations | jq .

# Compatibility score (replace MENTOR_PROFILE_ID)
curl -s -H "Cookie: sessionToken=COOKIE" http://localhost:3000/api/ai/compatibility/MENTOR_PROFILE_ID | jq .

# Goal mentor suggestions (replace GOAL_ID)
curl -s -H "Cookie: sessionToken=COOKIE" http://localhost:3000/api/ai/goal-mentors/GOAL_ID | jq .
```

### Frontend Tests

- [ ] `/dashboard` as MENTEE — AI Mentor Recommendations panel renders (loading state, then list or empty state)
- [ ] `/dashboard` as MENTEE — Profile Quality card renders with score bar and suggestions
- [ ] `/dashboard` as MENTOR — AI panels do NOT render (MENTOR role excluded)
- [ ] `/mentors/:id` as MENTEE — Compatibility score badge + explanation appears below headline
- [ ] `/mentors/:id` as MENTOR/unauthenticated — No compatibility score shown
- [ ] `/goals/:id` as MENTEE — "Mentors Suggested for this Goal" section appears at bottom when mentors are found
- [ ] Compatibility score colours: ≥70 green, 45–69 amber, <45 red

### Verified Results

| Test | Result | Notes |
|------|--------|-------|
| Profile quality endpoint | ✅ PASS | Returns score + suggestions |
| Mentor recommendations endpoint | ✅ PASS | Returns ranked list from LLM |
| Compatibility score endpoint | ✅ PASS | Algorithm + LLM explanation |
| Goal mentor suggestions endpoint | ✅ PASS | LLM-matched mentors |
| Rate limiter (21 requests) | ✅ PASS | 429 returned correctly |
| Dashboard AI panel (MENTEE) | ✅ PASS | Panel renders with recommendations |
| Dashboard AI panel (MENTOR) | ✅ PASS | Panel not shown for MENTOR role |
| MentorDetail compatibility badge | ✅ PASS | Badge + explanation renders |
| GoalDetail suggested mentors | ✅ PASS | Mentor list renders for goal |
| Unauthenticated access | ✅ PASS | 401 returned for all AI endpoints |

---

## Sprint 13.5: AI Data Enrichment + Onboarding Wizard

### Overview
Enriches the MenteeProfile data layer with structured AI signals (skills with proficiency, target industry, current blocker, learning style) and replaces the single-form ProfileSetup with a 4-step onboarding wizard. All subsequent AI features (recommendations, compatibility, session agendas, milestones, insights) benefit from richer inputs.

### Schema Changes
- Added to `MenteeProfile`: `skills Json?`, `targetIndustry String?`, `currentBlocker String?`, `learningStyle String?`
- Prisma client regenerated

### API Changes
- `POST /api/mentee/profile` — accepts new fields
- `PATCH /api/mentee/profile` — accepts new fields
- AI routes updated: recommendations prompt includes skill gaps + blocker; compatibility score uses skills in overlap calculation

### Frontend Changes
- `ProfileSetup.tsx` — rewritten as 4-step wizard (About You → Skills → Focus → Finish)
- `api.ts` — `SkillEntry` type, `MenteeProfileInput` interface, updated `createMenteeProfile`/`updateMenteeProfile`

### Onboarding Steps
| Step | Fields | Required? | Est. Time |
|------|--------|-----------|-----------|
| 1 — About You | firstName, currentRole, targetRole, timezone (auto) | Yes | 30s |
| 2 — Skills | skills[] with proficiency levels (max 8) | Skip available | 45s |
| 3 — Focus | targetIndustry, currentBlocker, learningStyle | Skip available | 30s |
| 4 — Finish | Avatar upload | Fully optional | 15s |

### Frontend Tests
- [ ] Register new user → redirected to ProfileSetup step 1
- [ ] Step 1 with empty firstName → error shown, cannot proceed
- [ ] Step 1 with empty currentRole or targetRole → error shown
- [ ] Step 1 valid → saves to DB, advances to step 2
- [ ] Step 2 — select skills, rate proficiency levels
- [ ] Step 2 — cannot select more than 8 skills
- [ ] Step 2 — add custom skill via text input
- [ ] Step 2 "Skip" → advances without saving skills
- [ ] Step 3 — select industry, enter blocker, select learning style
- [ ] Step 3 "Skip" → advances without saving
- [ ] Step 4 — avatar upload works
- [ ] Step 4 "Go to dashboard" → navigates to /dashboard?welcome=1
- [ ] After full completion — profile quality score reflects skills/blocker

### API Tests
| Endpoint | Test | Expected |
|----------|------|----------|
| `PATCH /api/mentee/profile` | `{ skills: [{skill:"SQL",level:"intermediate"}] }` | 200 + skills stored |
| `PATCH /api/mentee/profile` | `{ targetIndustry: "FinTech", currentBlocker: "..." }` | 200 + fields stored |
| `PATCH /api/mentee/profile` | `{ skills: [{skill:"x",level:"invalid"}] }` | 400 validation error |
| `GET /api/ai/profile-quality` | After adding 5 skills + blocker | Score ≥65 |
| `GET /api/ai/mentor-recommendations` | After adding skills | Reasons reference skill gaps |

### Verified Results
| Test | Result |
|------|--------|
| Schema migration applied | ✅ PASS |
| PATCH mentee profile with skills | ✅ PASS |
| ProfileSetup step 1 validation | ✅ PASS |
| Skill picker (select/deselect/rate) | ✅ PASS |
| Step skip flow | ✅ PASS |
| Timezone auto-detection | ✅ PASS |
| AI recommendations enriched with skills | ✅ PASS |

---

## Sprint 14: AI Session Intelligence

### Overview
Adds AI to the full session lifecycle. Before a session: AI-generated agenda based on mentee goals, skills, blocker, and past session history. After a session: structured AI summary (key points, decisions, action items, follow-ups) and one-click extraction of action items as goal milestones.

### Schema Changes
- Added `aiSummary Json?` to `MentoringSession`
- Prisma client regenerated

### New AI Endpoints

| Endpoint | Method | Auth | Feature |
|----------|--------|------|---------|
| `/api/ai/sessions/:id/agenda` | GET | requireAuth | Pre-session agenda (SCHEDULED only) |
| `/api/ai/sessions/:id/summary` | POST | requireAuth | Post-session structured summary |
| `/api/ai/sessions/:id/action-items` | POST | requireAuth | Extract action items → create milestones |

### API Tests

```bash
# Generate agenda for a scheduled session
curl -s -X GET -H "Cookie: sessionToken=COOKIE" \
  http://localhost:3000/api/ai/sessions/SESSION_ID/agenda | jq .

# Generate AI summary (session must have notes)
curl -s -X POST -H "Cookie: sessionToken=COOKIE" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/ai/sessions/SESSION_ID/summary | jq .

# Extract action items as milestones
curl -s -X POST -H "Cookie: sessionToken=COOKIE" \
  http://localhost:3000/api/ai/sessions/SESSION_ID/action-items | jq .
```

| Test | Expected |
|------|----------|
| GET agenda — SCHEDULED session | 200 + array of 4-6 agenda items with estimatedMinutes |
| GET agenda — COMPLETED session | 400 — not available for completed sessions |
| GET agenda — unrelated session | 404 |
| POST summary — session with notes | 200 + keyPoints/decisions/actionItems/followUpQuestions |
| POST summary — session with no notes | 400 |
| POST action-items — after summary generated | 200 + milestones created in DB |
| POST action-items — no active goal | 200 + created:0 + note explaining no goal |
| Verify milestones appear on GoalDetail | Goal milestones list updated |

### Frontend Tests

- [ ] `/sessions/:id` (SCHEDULED) — "Session Agenda" card renders with "Generate with AI" button
- [ ] Click "Generate with AI" on agenda — loading state shown, then numbered agenda list renders
- [ ] Agenda items show: title, rationale, estimated minutes
- [ ] `/sessions/:id` (COMPLETED with notes) — "AI Summary" card renders with "Generate with AI" button
- [ ] Click "Generate with AI" on summary — loading state, then sections appear
- [ ] Summary sections: Key Points, Decisions Made, Action Items, Follow-up Questions
- [ ] "Add to my goals as milestones" button in Action Items section
- [ ] Click action items button — toast shows count of milestones created, button disabled afterwards
- [ ] Navigate to Goals → GoalDetail — new milestones visible

### Verified Results

| Test | Result |
|------|--------|
| Schema migration (aiSummary field) | ✅ PASS |
| Agenda endpoint — SCHEDULED session | ✅ PASS |
| Agenda endpoint — COMPLETED session | ✅ PASS (400 returned) |
| Summary endpoint with notes | ✅ PASS |
| Summary stored in DB (aiSummary field) | ✅ PASS |
| Action items endpoint | ✅ PASS |
| Milestones created on goal | ✅ PASS |
| SessionDetail agenda panel renders | ✅ PASS |
| SessionDetail summary panel renders | ✅ PASS |
| Action items button creates milestones | ✅ PASS |

---

## Sprint 15: AI Goal Intelligence

### Overview
Adds AI intelligence across the entire goal lifecycle. New goal creation gains AI micro-milestone generation. Existing goals gain a learning path, achievement prediction (algorithmic), resource recommendations, and the dashboard gains a 24h-cached weekly progress insights card.

### Schema Changes
- Added `insightsCache Json?` and `insightsCachedAt DateTime?` to `MenteeProfile`

### New AI Endpoints

| Endpoint | Method | Feature |
|----------|--------|---------|
| `POST /api/ai/goals/micro-milestones` | POST | Break goal into 5-8 ordered milestones |
| `GET /api/ai/goals/:id/learning-path` | GET | Ordered learning stages calibrated to skill level |
| `GET /api/ai/goals/:id/prediction` | GET | Algorithmic likelihood + predicted completion date |
| `GET /api/ai/goals/:id/resources` | GET | Contextual resource search topics |
| `GET /api/ai/insights` | GET | Weekly progress insights (24h cached) |

### API Tests

| Test | Expected |
|------|----------|
| `POST /ai/goals/micro-milestones` with "become a PM" | 200 + 5-8 ordered milestones |
| `POST /ai/goals/micro-milestones` with no title | 400 |
| `GET /ai/goals/:id/learning-path` own goal | 200 + ordered stages array |
| `GET /ai/goals/:id/prediction` 0 sessions 0% | trajectory: "off-track", likelihood < 35 |
| `GET /ai/goals/:id/prediction` 100% progress | trajectory: "completed" or likelihood high |
| `GET /ai/goals/:id/resources` | 200 + 4-5 resource suggestions |
| `GET /ai/insights` first call | 200 + insights + cached: false |
| `GET /ai/insights` within 24h | 200 + same insights + cached: true |

### Frontend Tests

- [ ] `/goals/new` — "Generate with AI" button appears after title is typed
- [ ] Generate milestones — loading state, then checklist of 5-8 milestones with week estimates
- [ ] Toggle milestone checkboxes to deselect unwanted ones
- [ ] Create goal — selected milestones appear on GoalDetail immediately
- [ ] `/goals/:id` — Prediction card shows likelihood %, trajectory badge, estimated date
- [ ] `/goals/:id` — "Learning Path" card with "Generate with AI" button
- [ ] Generate learning path — numbered stages with focus, resource types, duration
- [ ] `/goals/:id` — "Suggested Resources" card with "Suggest with AI" button
- [ ] Generate resources — list of topics with resource type tags and search queries
- [ ] `/dashboard` (MENTEE) — Weekly Progress Insights card appears with highlights/recommendations
- [ ] Insights cache: second page load within 24h returns same content instantly

### Verified Results

| Test | Result |
|------|--------|
| Micro-milestones endpoint | ✅ PASS |
| Milestones created on goal after form submission | ✅ PASS |
| Learning path endpoint | ✅ PASS |
| Prediction endpoint — off-track scenario | ✅ PASS |
| Prediction endpoint — on-track scenario | ✅ PASS |
| Resource recommendations endpoint | ✅ PASS |
| Insights endpoint — fresh | ✅ PASS |
| Insights endpoint — cached | ✅ PASS |
| GoalNew milestone generation UI | ✅ PASS |
| GoalDetail prediction card | ✅ PASS |
| GoalDetail learning path | ✅ PASS |
| GoalDetail resource suggestions | ✅ PASS |
| Dashboard insights card | ✅ PASS |

---

## Sprint 16: Admin Dashboard Enhancement

### Overview
Completes and enhances all 6 admin pages. Adds Reports to the sidebar nav (it was missing), adds pending reports banner to the dashboard alongside the existing pending mentors banner, adds filter tabs to AdminMentors (pending/approved/all), adds publish toggle and delete to AdminPrograms, adds status filter to AdminPayments, and fixes pre-existing TypeScript bugs in AdminReports.

### Backend Changes
- `GET /api/admin/stats` — added `pendingReports` count
- `GET /api/admin/mentors` — new endpoint: all mentor profiles with optional `?filter=pending|approved`
- `PATCH /api/admin/programs/:id` — toggle `isPublished`
- `DELETE /api/admin/programs/:id` — remove program

### Frontend Changes
- `AdminDashboard` — Reports in sidebar nav; dual alert banners (pending mentors + pending reports)
- `AdminMentors` — 3-tab filter (Pending / Approved / All); approve/remove works for all states
- `AdminPrograms` — Publish/Unpublish toggle; Delete with 2-click confirmation
- `AdminPayments` — Client-side status filter (All / Pending / Completed / Failed / Refunded)
- `AdminReports` — Fixed pre-existing bugs: correct API call signature, ReportStatus type, optional chaining on reporter/reported

### API Tests

| Test | Expected |
|------|----------|
| `GET /api/admin/stats` | 200 + includes `pendingReports` field |
| `GET /api/admin/mentors` | 200 + all mentors |
| `GET /api/admin/mentors?filter=pending` | 200 + unapproved only |
| `GET /api/admin/mentors?filter=approved` | 200 + approved only |
| `PATCH /api/admin/programs/:id` `{ isPublished: false }` | 200 + program unpublished |
| `DELETE /api/admin/programs/:id` | 200 + program removed |
| `DELETE /api/admin/programs/:id` non-existent | 404 |

### Frontend Tests

- [ ] `/admin` sidebar — "Reports" link visible and navigates correctly
- [ ] `/admin` dashboard — pending mentors banner shows when mentors pending
- [ ] `/admin` dashboard — pending reports banner shows when reports pending
- [ ] `/admin/mentors` — "Pending" tab shows only unapproved mentors
- [ ] `/admin/mentors` — "Approved" tab shows only approved mentors
- [ ] `/admin/mentors` — "All" tab shows all mentors with status badge
- [ ] `/admin/mentors` — Approve button moves mentor to approved state
- [ ] `/admin/mentors` — Remove requires 2-click confirmation
- [ ] `/admin/programs` — Publish/Unpublish button toggles status immediately
- [ ] `/admin/programs` — Delete requires 2-click confirmation, removes from list
- [ ] `/admin/payments` — Status filter dropdown narrows displayed payments
- [ ] `/admin/reports` — Status update saves without error

### Verified Results

| Test | Result |
|------|--------|
| pendingReports in stats | ✅ PASS |
| GET /admin/mentors with filters | ✅ PASS |
| PATCH /admin/programs/:id (toggle publish) | ✅ PASS |
| DELETE /admin/programs/:id | ✅ PASS |
| Reports nav link in sidebar | ✅ PASS |
| Dual alert banners on dashboard | ✅ PASS |
| AdminMentors filter tabs | ✅ PASS |
| AdminPrograms publish toggle | ✅ PASS |
| AdminPrograms delete confirmation | ✅ PASS |
| AdminPayments status filter | ✅ PASS |
| AdminReports TypeScript fixes | ✅ PASS |

---

## Sprint 17: Code Quality & Optimisation

### Overview
Systematic code quality pass applying the 11 Aspects of Good Code. No new features — fixes security issues, removes pre-existing bugs, extracts schemas, adds DB indexes, and passes lint clean.

### Security Fixes (P0/P1)

| Issue | Fix | Severity |
|-------|-----|---------|
| `status as any` in admin reports filter | Replaced with typed `REPORT_STATUSES` const at module scope | P1 |
| `ReportReason`/`ReportStatus` enums with `erasableSyntaxOnly` | Converted to type unions | P1 |
| `payment.amount / 100` in MentorPayments + PaymentHistory | Fixed to `parseFloat(payment.amount)` (Decimal is in currency units, not pence) | P1 bug |
| Missing `requireId` guard on milestone creation | Added guard to prevent empty-string DB queries | P1 |

### Structural Changes

**New files:**
- `apps/server/src/lib/validate.ts` — `requireId()` helper that validates Express route params before Prisma queries
- `apps/server/src/schemas/goal.schema.ts` — Zod schemas for goal and milestone routes
- `apps/server/src/schemas/session.schema.ts` — Zod schemas for session routes
- `apps/server/src/schemas/booking.schema.ts` — Zod schemas for booking routes

**Modified routes:**
- `routes/goals.ts` — uses extracted schemas, `requireId` on all `/:id` handlers, `const id = req.params.id as string` pattern
- `routes/sessions.ts` — uses extracted schema, `requireId` on GET `/:id`
- `routes/admin.ts` — `REPORT_STATUSES` moved to module scope (not per-request)

**DB indexes added to Prisma schema:**
- `Goal`: `@@index([menteeId, status])`
- `MentoringSession`: `@@index([bookingId, status])`
- `Booking`: `@@index([menteeId, status])`, `@@index([mentorId, status])`

### Lint Fixes
- `Dashboard.tsx` — `setInsightsLoading(true)` moved from synchronous effect body into async helper function
- `GoalNew.tsx` — ternary-as-statement replaced with `if/else`
- Result: `npm run lint -w apps/web` → 0 errors (10 warnings, all pre-existing and non-critical)

### Verified Results

| Check | Result |
|-------|--------|
| `npm run lint -w apps/web` | ✅ 0 errors |
| `npx tsc --noEmit` (server) | ✅ 0 errors in modified files |
| `npx tsc -b` (frontend) | ✅ 0 errors in modified files |
| DB indexes pushed to PostgreSQL | ✅ PASS |
| Price display correct (£49.99 not £0.49) | ✅ PASS — fixed in MentorPayments + PaymentHistory |
| Empty-string param guard on goals routes | ✅ PASS |
| Report status filter type-safe | ✅ PASS |
