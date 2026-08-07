# MentorHub Frontend Revamp Plan

**Design Direction:** Sanctuary — warm, calm, premium editorial
**Core Principles:** Simplicity, effortless onboarding, guided discovery

---

## Design DNA (Extracted from Sanctuary Concept)

### Typography
```css
--font-display: 'Newsreader', serif;     /* Headlines — elegant, editorial */
--font-sans: 'Hanken Grotesk', sans-serif; /* Body — clean, modern */
--font-mono: 'IBM Plex Mono', monospace;   /* Labels, eyebrows */
```

### Color Palette
```css
/* Warm sanctuary palette */
--color-bg:         #F3EEE6;    /* Warm paper */
--color-surface:    #FBF8F3;    /* Elevated sections */
--color-ink:        #221f1b;    /* Primary text */
--color-ink-2:      #3a352e;    /* Secondary text */
--color-ink-3:      #6b6459;    /* Tertiary text */
--color-muted:      #8a8378;    /* Captions, timestamps */
--color-faint:      #a39a8c;    /* Placeholders */
--color-border:     #e4ddd0;    /* Borders, dividers */
--color-border-soft:#ece5d9;    /* Subtle dividers */

/* Brand accent */
--color-teal:       #2E6A64;    /* Primary CTA */
--color-teal-hover: #255952;    /* Hover state */
--color-teal-soft:  #cfe0dc;    /* Teal tinted backgrounds */

/* Status */
--color-live:       #5FA078;    /* Available, success */
--color-gold:       #E0A93B;    /* Stars, premium */
```

### Spacing & Radius
```css
/* Generous spacing */
--space-section: 76px;   /* Between major sections */
--space-card: 22px;      /* Card padding */
--space-gap: 18px;       /* Grid gaps */

/* Soft, inviting corners */
--radius-sm: 10px;   /* Buttons */
--radius-md: 16px;   /* Cards */
--radius-lg: 24px;   /* Hero sections */
--radius-full: 30px; /* Pills, avatars */
```

### Shadows (warm-tinted)
```css
--shadow-card: 0 4px 18px rgba(40,38,34,.06);
--shadow-hover: 0 10px 30px rgba(40,38,34,.10);
```

---

## Phase 1: Onboarding Revolution

### 1.1 New User Welcome Flow
**Goal:** Zero-friction signup → personalized dashboard in under 2 minutes

```
Step 1: "What brings you here?"
┌─────────────────────────────────────────────────┐
│                                                 │
│  "What brings you here?"                        │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ 🎯          │  │ 🧭          │               │
│  │ I want to   │  │ I want to   │               │
│  │ find a      │  │ become a    │               │
│  │ mentor      │  │ mentor      │               │
│  └─────────────┘  └─────────────┘               │
│                                                 │
│  [ Skip for now → ]                             │
└─────────────────────────────────────────────────┘

Step 2: "What do you want to grow in?"
- Show industry/skill chips (max 3 selections)
- Engineering, Product, Design, Leadership, Founders...
- Pre-fill search on dashboard

Step 3: "Where are you now?"
- Current role (dropdown or free text)
- Years of experience (slider: 0-2, 2-5, 5-10, 10+)

Step 4: "Where do you want to be?"
- Target role or goal (open text, AI-assisted suggestions)
- "Staff Engineer", "First PM role", "Launch my startup"

Step 5: Welcome Dashboard
- Personalized mentor recommendations based on answers
- "Based on your goals, here are 3 mentors who've been there"
```

### 1.2 Onboarding Component Structure
```
ProfileSetup.tsx (rewrite)
├── OnboardingShell.tsx (progress, skip, back)
├── steps/
│   ├── RoleSelectionStep.tsx (mentee/mentor)
│   ├── InterestsStep.tsx (skill chips)
│   ├── ExperienceStep.tsx (level slider)
│   ├── GoalStep.tsx (target role input)
│   └── WelcomeStep.tsx (personalized recs)
└── OnboardingProgress.tsx (thin bar, not intrusive)
```

### 1.3 Design Details
- **No form labels above inputs** — use placeholder text
- **Large click targets** — min 48px touch targets
- **Progress is optional** — "Skip for now" always visible
- **Celebrate completion** — subtle confetti-free animation (fade + scale)

---

## Phase 2: Dashboard Guided Experience

### 2.1 First-Time Dashboard
**Problem:** New users land on dashboard and don't know what to do.
**Solution:** Progressive disclosure with contextual guidance.

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👋 Welcome, Sarah                                       │ │
│ │                                                         │ │
│ │ You're looking for help with "becoming a staff eng"    │ │
│ │ Here's how MentorHub works:                             │ │
│ │                                                         │ │
│ │ ① Browse → ② Book → ③ Grow                              │ │
│ │                                                         │ │
│ │ [ Find your first mentor → ]        [ Dismiss ]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Recommended for you                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ Mentor 1 │ │ Mentor 2 │ │ Mentor 3 │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
│                                                             │
│ ┌─ Empty state (no bookings) ─────────────────────────────┐ │
│ │ 📅 No sessions yet                                      │ │
│ │ Book your first session to get started                  │ │
│ │ [ Browse mentors ]                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Dashboard Cards (Redesign)

**Stat Cards** — softer, more editorial
```tsx
<div className="stat-card">
  <span className="stat-eyebrow">Active bookings</span>
  <span className="stat-value">3</span>
  <span className="stat-caption">2 sessions this week</span>
</div>
```

**Session Cards** — scannable, action-oriented
```tsx
<div className="session-card">
  <div className="session-avatar">SC</div>
  <div className="session-info">
    <span className="session-mentor">Sarah Chen</span>
    <span className="session-time">Tomorrow, 3:00 PM</span>
  </div>
  <button className="session-action">Join →</button>
</div>
```

### 2.3 Contextual Tooltips (First Visit Only)
Use `localStorage` flag: `mentorhub_dashboard_toured`

```tsx
// Highlight important elements on first visit
<Tooltip
  show={!hasToured && step === 1}
  anchor="sessions-section"
  position="bottom"
>
  <p>Your upcoming sessions appear here</p>
  <button onClick={nextStep}>Got it</button>
</Tooltip>
```

**Tour Steps:**
1. "Upcoming sessions" section
2. "Mentor recommendations" section
3. "Goals" sidebar link
4. "Messages" icon

---

## Phase 3: Landing Page (Sanctuary Style)

### 3.1 Hero Section
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ● 1,412 mentors available this week                        │
│                                                             │
│  Find a mentor who has                                      │
│  walked your path.                                          │
│                                                             │
│  Match with industry leaders for 1:1 guidance...            │
│                                                             │
│  ┌──────────────────────────────────────────────┐           │
│  │ 🔍 What do you want to grow in?              │ [Search]  │
│  │    Product design, engineering, leadership...│           │
│  └──────────────────────────────────────────────┘           │
│                                                             │
│  Popular: [Engineering] [Product] [Design] [Leadership]    │
│                                                             │
│  ⭐ 4.9 average from 38,000+ reviews                        │
│                                                             │
│  Mentors from: Stripe  Figma  Airbnb  Notion  Linear        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Key Sections
1. **Live pill** — "X mentors available this week" with pulse dot
2. **Hero** — Newsreader serif headline, Hanken Grotesk body
3. **Search bar** — Prominent, category-aware
4. **Category chips** — Quick filters
5. **Social proof** — Avatar stack + rating
6. **Logo cloud** — "Mentors from" (faded, trust signal)
7. **Featured mentors** — 4-card rail with hover lift
8. **How it works** — 3-step with dashed connector line
9. **Stats band** — Teal background, large numbers
10. **Testimonial** — Single powerful quote
11. **CTA section** — Rounded teal card with dual buttons
12. **Footer** — 4-column grid

### 3.3 Animations
```css
/* Entrance — staggered fade up */
@keyframes mh-fadeup {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Live pulse — availability indicator */
@keyframes mh-pulse {
  0% { box-shadow: 0 0 0 0 rgba(95,160,120,.5); }
  70% { box-shadow: 0 0 0 6px rgba(95,160,120,0); }
  100% { box-shadow: 0 0 0 0 rgba(95,160,120,0); }
}

/* Card hover */
.mentor-card:hover {
  box-shadow: 0 10px 30px rgba(40,38,34,.10);
  transform: translateY(-3px);
}
```

---

## Phase 4: Component Library Updates

### 4.1 Button Variants
```tsx
// Primary — teal solid
<button className="btn-primary">Get started</button>

// Secondary — white with border
<button className="btn-secondary">Learn more</button>

// Ghost — text only with hover underline
<button className="btn-ghost">Skip for now →</button>
```

### 4.2 Card Variants
```tsx
// Mentor card — avatar, name, role, bio, rating, price
// Session card — compact, action-oriented
// Stat card — eyebrow, value, caption
// Empty card — icon, title, description, CTA
```

### 4.3 Input Variants
```tsx
// Search input — large, prominent, with icon
// Form input — minimal label, focus ring
// Chip select — multi-select pills
// Slider — experience level
```

### 4.4 Status Indicators
```tsx
// Live dot — green pulse
<span className="live-dot" />

// Badge — "Open", "3 slots left", "Fully booked"
<span className="badge badge-open">Open</span>
<span className="badge badge-limited">3 slots left</span>
```

---

## Phase 5: Page-by-Page Refinements

### 5.1 High Priority (Week 1)
| Page | Changes |
|------|---------|
| Landing.tsx | Complete rewrite to Sanctuary style |
| ProfileSetup.tsx | New multi-step onboarding flow |
| Dashboard.tsx | First-time guide, card redesign |
| MentorDirectory.tsx | Search-first, card hover effects |

### 5.2 Medium Priority (Week 2)
| Page | Changes |
|------|---------|
| MentorDetail.tsx | Hero section, sticky booking sidebar |
| BookingDetail.tsx | Cleaner two-column, session timeline |
| Goals.tsx | Progress visualization, milestone cards |
| Messages.tsx | Conversation list polish |

### 5.3 Lower Priority (Week 3)
| Page | Changes |
|------|---------|
| Login/Register | Minimal, centered, illustration |
| ProfileEdit.tsx | Section cards, inline editing |
| Admin pages | Consistent table styling |
| Static pages | Typography, spacing |

---

## Phase 6: Personalization System

### 6.1 User Preferences (stored in DB + localStorage)
```ts
interface UserPreferences {
  interests: string[];        // ["engineering", "leadership"]
  currentRole: string;        // "Senior Engineer"
  targetRole: string;         // "Staff Engineer"
  experienceLevel: number;    // 5 (years)
  preferredSessionLength: number; // 60 (minutes)
  timezone: string;
  onboardingCompleted: boolean;
  dashboardTourCompleted: boolean;
}
```

### 6.2 Personalized Sections
- **Dashboard:** "Recommended for your goal: Staff Engineer"
- **Mentor Directory:** Pre-filled search from interests
- **Session booking:** Default to preferred session length
- **Emails:** Address by first name, reference goals

### 6.3 AI-Powered Touches
- Goal suggestions based on role + target
- Mentor match explanations ("Sarah was a Senior Eng at Stripe...")
- Session prep prompts ("Ask about navigating L5→L6 at Big Tech")

---

## Implementation Checklist

### Fonts
- [ ] Add Newsreader (serif) for headlines
- [ ] Add Hanken Grotesk (sans) for body
- [ ] Add IBM Plex Mono for labels/code

### CSS Tokens
- [ ] Update color palette in index.css
- [ ] Add new spacing tokens
- [ ] Add new shadow tokens
- [ ] Add animation keyframes

### Components
- [ ] LiveDot.tsx — pulsing availability indicator
- [ ] SearchBar.tsx — redesign with categories
- [ ] MentorCard.tsx — Sanctuary style
- [ ] StatCard.tsx — editorial style
- [ ] OnboardingStep.tsx — reusable step component
- [ ] Tooltip.tsx — contextual guidance

### Pages
- [ ] Landing.tsx — complete rewrite
- [ ] ProfileSetup.tsx — new flow
- [ ] Dashboard.tsx — first-time experience
- [ ] MentorDirectory.tsx — search-first

### Backend
- [ ] Add user_preferences table
- [ ] Onboarding completion endpoint
- [ ] Dashboard tour flag endpoint

---

## Success Metrics

1. **Time to first booking** — Target: < 5 minutes from signup
2. **Onboarding completion rate** — Target: > 80%
3. **Dashboard engagement** — Target: 3+ sections interacted
4. **Return visit rate** — Target: > 60% within 7 days

---

## What We're NOT Doing

- Complex animations or parallax
- Dark mode (warm paper aesthetic is core)
- Chatbot or AI assistant overlay
- Gamification badges
- Social features (follows, likes)
- Mobile app (PWA later)

---

*Plan created: 2025-06-24*
*Design reference: MentorHub Landing - Sanctuary.dc.html*
