# MentorHub UI Enhancement Plan

Comprehensive plan for premium micro-interactions, animations, and UI patterns.

**Design Philosophy:** Sanctuary — warm, calm, premium editorial
**References:** Design Spells, Viewport UI, Poetic, Bridge.surf

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed

---

## 1. Modal Transitions (Luma-style)

**Reference:** [Design Spells — Luma Modal Transitions](https://designspells.com/spells/modal-transitions-and-animations-in-luma)

### Implementation
- [ ] Create `AnimatedModal` wrapper component
- [ ] Backdrop fade with blur (`backdrop-filter: blur(8px)`)
- [ ] Content scales from 0.95 → 1.0 with spring easing
- [ ] Exit animation: fade out + slight scale down
- [ ] Staggered content reveal inside modal (title → body → actions)
- [ ] Support `prefers-reduced-motion`

### CSS Variables
```css
--modal-enter-duration: 250ms;
--modal-exit-duration: 180ms;
--modal-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Apply To
- [ ] All confirmation dialogs
- [ ] Booking confirmation modal
- [ ] Report user modal
- [ ] Goal creation modal
- [ ] Session details modal

---

## 2. Pull-to-Refresh / Reload Animation (Snapchat-style)

**Reference:** [Design Spells — Snapchat Pull-to-Refresh](https://designspells.com/spells/pull-to-refresh-animation-in-snapchat)

### Mobile Implementation
- [ ] Create `PullToRefresh` wrapper component
- [ ] Elastic pull indicator with Lottie/CSS animation
- [ ] Rotation on threshold reached
- [ ] Haptic feedback trigger point (if supported)
- [ ] Smooth snap-back animation

### Desktop Implementation
- [ ] "Refresh" button with spinning icon on click
- [ ] Subtle shimmer effect across content during reload
- [ ] Skeleton fade-in for new content

### Apply To
- [ ] Messages page (conversation list)
- [ ] Notifications panel
- [ ] Dashboard activity feed
- [ ] Mentor directory (search results)

---

## 3. File Upload Animation (Dropbox-style)

**Reference:** [Design Spells — Dropbox File Upload](https://designspells.com/spells/file-upload-animation-in-dropbox)

### Stages
1. **Idle:** Dashed border, upload icon, "Drop files here" text
2. **Dragover:** Border pulses teal, background lightens
3. **Dropped:** File thumbnail appears with progress ring
4. **Uploading:** Circular progress indicator around thumbnail
5. **Complete:** Checkmark animation, thumbnail settles
6. **Error:** Red pulse, shake animation, retry button

### Implementation
- [ ] Create `FileDropzone` component with all states
- [ ] Integrate with UploadThing
- [ ] Support multiple file uploads with staggered animations
- [ ] Show file type icons (PDF, image, doc)
- [ ] Animated progress ring (SVG stroke-dashoffset)

### Apply To
- [ ] Avatar upload (profile edit)
- [ ] Program cover image upload
- [ ] Resource file attachments
- [ ] Message attachments

---

## 4. Icon Micro-Animations (Discord-style)

**Reference:** [Design Spells — Discord Icon Animations](https://designspells.com/spells/icon-micro-animations-when-hovered-or-clicked-in-discord)

### Patterns
| Interaction | Animation |
|-------------|-----------|
| Hover | Scale 1.1 + slight rotation (±3°) |
| Click | Quick scale pulse (1.0 → 0.9 → 1.0) |
| Active state | Color shift + subtle bounce |
| Loading | Pulse opacity 0.5 → 1.0 |

### Implementation
- [ ] Create `AnimatedIcon` wrapper component
- [ ] Add hover/click animations via CSS
- [ ] Support Lucide icon components
- [ ] Configurable animation intensity

### Apply To
- [ ] Navbar icons
- [ ] Action buttons (bookmark, share, like)
- [ ] Goal milestone checkboxes
- [ ] Star rating interaction
- [ ] Message reactions

---

## 5. Animated Number Transitions (dub.co-style)

**Reference:** [Design Spells — dub.co Number Animation](https://designspells.com/spells/animation-when-numbers-change-in-dub-co)

### Implementation
- [ ] Create `AnimatedNumber` component
- [ ] Count-up animation from previous value
- [ ] Slot machine effect for digit changes
- [ ] Color flash on increase (green) / decrease (red)
- [ ] Support currency formatting ($X,XXX.XX)
- [ ] Support compact notation (12.5K, 1.2M)

### Apply To
- [ ] Dashboard stats (total bookings, earnings, goals)
- [ ] Admin analytics (revenue, user counts)
- [ ] Mentor earnings display
- [ ] Session counter
- [ ] Progress percentages

---

## 6. Password Field Animations

**Reference:** [Design Spells — Column Password Reveal](https://designspells.com/spells/reveal-password-animation-on-column)

### Implementation
- [ ] Eye icon with smooth morph (closed → open)
- [ ] Character reveal: dots morph into letters sequentially
- [ ] Subtle field background color shift during reveal
- [ ] Password strength indicator with animated bar

### Apply To
- [ ] Login form
- [ ] Register form
- [ ] Change password settings
- [ ] API key reveal (admin)

---

## 7. OTP Input Animation (Family-style)

**Reference:** [Design Spells — Family OTP Input](https://designspells.com/spells/one-time-password-input-animations-on-family)

### Implementation
- [ ] Create `OTPInput` component
- [ ] Auto-focus next field on digit entry
- [ ] Scale pulse on digit entry
- [ ] Shake animation on invalid code
- [ ] Success animation: all boxes flash green → fade
- [ ] Paste support with staggered fill animation

### Apply To
- [ ] Email verification (Auth0 callback enhancement)
- [ ] Two-factor authentication
- [ ] Payment confirmation codes

---

## 8. Achievements Carousel (AllTrails-style)

**Reference:** [Design Spells — AllTrails Achievements](https://designspells.com/spells/achievements-carousel-in-alltrails)

### Mobile
- [ ] Horizontal swipeable carousel
- [ ] Card snap-to-center behavior
- [ ] Badge unlock animation (scale + glow)
- [ ] Progress ring around locked badges

### Desktop
- [ ] Grid layout with hover effects
- [ ] Click to expand badge details
- [ ] Share achievement button

### Achievement Types
- [ ] First session completed
- [ ] 5 sessions milestone
- [ ] Goal completed
- [ ] 100% profile completion
- [ ] First review left
- [ ] Referred a friend

### Apply To
- [ ] Dashboard achievements section
- [ ] Profile public view
- [ ] Onboarding completion celebration

---

## 9. Onboarding Flow (Abode-style)

**Reference:** [Design Spells — Abode Welcome Intro](https://designspells.com/spells/welcome-intro-animations-in-abode)

### Implementation
- [ ] Multi-step wizard with progress indicator
- [ ] Each step slides in from right
- [ ] Animated illustrations per step
- [ ] Skip option with confirmation
- [ ] Completion celebration animation

### Steps (Mentee)
1. Welcome + name input
2. Role/industry selection
3. Goals selection (multi-select)
4. Mentor preferences (budget, expertise)
5. Profile photo (optional)
6. Completion + first recommendation

### Steps (Mentor)
1. Welcome + headline input
2. Expertise tags selection
3. Hourly rate setting
4. Availability setup
5. Bio + photo
6. Program creation prompt

### Personalization
- [ ] Store preferences for AI matching
- [ ] Tailor dashboard layout based on role
- [ ] Show relevant empty states

---

## 10. Sliding Sidebars (Typefully-style)

**Reference:** [Design Spells — Typefully Sidebars](https://designspells.com/spells/smooth-sliding-sidebars-in-typefully)

### Implementation
- [ ] Slide from edge with spring easing
- [ ] Backdrop overlay with click-to-close
- [ ] Content push (not overlay) option
- [ ] Nested sidebar support (admin)
- [ ] Keyboard navigation (Escape to close)

### Apply To
- [ ] Admin panel navigation
- [ ] Mobile menu
- [ ] Filters panel (mentor directory)
- [ ] Settings sidebar

---

## 11. Landing Page Features Section (Viewport-style)

**Reference:** [Viewport UI — Features Section](https://viewport-ui.design/posts/290-features-section-on-landing-page/)

### Implementation
- [ ] Bento grid layout (2×2 + 1 wide)
- [ ] Icon + headline + description per card
- [ ] Hover: subtle lift + border highlight
- [ ] Staggered reveal on scroll
- [ ] Optional: animated icons on hover

### Features to Highlight
1. AI-Powered Matching
2. Flexible Scheduling
3. Goal Tracking
4. Session Summaries
5. Secure Payments

---

## 12. Dashboard Cards (Viewport-style)

**Reference:** [Viewport UI — Growth Dashboard](https://viewport-ui.design/posts/162-growth-dashboard-cards-or-no-cards/)

### Admin Dashboard
- [ ] Simple View: 4 key metrics, large numbers
- [ ] Advanced View: Charts, tables, filters
- [ ] Toggle between views (user preference)
- [ ] Period selector (7d, 30d, 90d, custom)

### Metrics (Admin)
- Total revenue (animated number)
- Active users (with trend arrow)
- Sessions completed (with graph)
- Pending payouts

### Mentor Dashboard
- [ ] Earnings this period
- [ ] Upcoming sessions
- [ ] Pending bookings
- [ ] Average rating

### Tax Calculations
- [ ] Show net earnings (after platform fee)
- [ ] Tax withholding estimate toggle
- [ ] Export for accounting (CSV/PDF)

---

## 13. Calendar UI (Viewport-style)

**Reference:** [Viewport UI — Calendar Exploration](https://viewport-ui.design/posts/122-calendar-ui-exploration/)

### Implementation
- [ ] Month view with availability indicators
- [ ] Week view with time slots
- [ ] Day view for booking flow
- [ ] Drag to select availability (mentor)
- [ ] Color coding: available, busy, pending

### Apply To
- [ ] Mentor availability management
- [ ] Booking slot selection
- [ ] Session history view
- [ ] Admin scheduling conflicts

---

## 14. Account Menu Dropdown (Viewport-style)

**Reference:** [Viewport UI — Account Menu](https://viewport-ui.design/posts/336-account-menu-dropdown/)

### Implementation
- [ ] Avatar + name + role badge
- [ ] Quick stats (bookings, earnings)
- [ ] Theme toggle inline
- [ ] Settings shortcut
- [ ] Sign out with confirmation
- [ ] Slide-up animation on open

---

## 15. Compact Goal Cards (Viewport-style)

**Reference:** [Viewport UI — Compact Card](https://viewport-ui.design/posts/294-compact-card/)

### Implementation
- [ ] Progress bar with percentage
- [ ] Milestone count (3/5 completed)
- [ ] Due date indicator
- [ ] Quick actions (expand, edit)
- [ ] Color coding by status

---

## 16. Notification Panel (Viewport-style)

**Reference:** [Viewport UI — Notification Panel](https://viewport-ui.design/posts/295-notification-panel/)

### Implementation
- [ ] Slide-down from navbar
- [ ] Grouped by type (bookings, messages, system)
- [ ] Mark all as read
- [ ] Click to navigate + dismiss
- [ ] Real-time updates (WebSocket)
- [ ] Badge count on bell icon

### Notification Types
- New booking request
- Session reminder (1 hour before)
- Message received
- Goal milestone completed
- Payment received
- Review received

---

## 17. Page Transitions (Viewport-style)

**Reference:** [Viewport UI — Smooth Transitions](https://viewport-ui.design/posts/218-smooth-transitions-on-website/)

### Implementation
- [ ] Use View Transitions API (with fallback)
- [ ] Fade + slide for page changes
- [ ] Shared element transitions (mentor card → mentor page)
- [ ] Loading state during route change
- [ ] Prefetch on hover (React Router)

---

## 18. Checkout & Confirmation (Viewport-style)

**Reference:** [Viewport UI — Order Details with Invoice](https://viewport-ui.design/posts/150-order-details-with-invoice/)

### Implementation
- [ ] Step indicator (1. Review → 2. Pay → 3. Confirm)
- [ ] Animated price breakdown reveal
- [ ] Stripe Elements integration
- [ ] Success animation (confetti or checkmark burst)
- [ ] Downloadable invoice/receipt
- [ ] Calendar add buttons (Google, Apple)

---

## 19. Frosted Filter Menu (Viewport-style)

**Reference:** [Viewport UI — Frosted Filter Menu](https://viewport-ui.design/posts/186-frosted-filter-menu/)

### Implementation
- [ ] Glass morphism effect (`backdrop-filter: blur`)
- [ ] Filter chips with remove animation
- [ ] Clear all button
- [ ] Apply button with loading state
- [ ] Mobile: bottom sheet version

### Apply To
- [ ] Mentor directory filters
- [ ] Admin user filters
- [ ] Search results filters

---

## 20. Style & Typography (Poetic-inspired)

**Reference:** [Poetic.com](https://poetic.com/?ref=seesaw)

### Typography Enhancements
- [ ] Suisse Intl evaluation (vs current Hanken Grotesk)
- [ ] Numbered section labels (/1, /2, /3)
- [ ] Blue accent marks for visual breaks
- [ ] 63px border-radius for primary CTAs
- [ ] Generous whitespace (80px+ section padding)

### Apply To
- [ ] Landing page
- [ ] About page
- [ ] Mentor profiles

---

## 21. Home Page Features (Bridge-inspired)

**Reference:** [Bridge.surf](https://bridge.surf/?ref=seesaw)

### Implementation
- [ ] Hero with rotating prompt showcase
- [ ] Three-column image grid for features
- [ ] Platform integration badges
- [ ] Subtle rotation jitter on grid items
- [ ] Smooth scroll-triggered animations
- [ ] SVG-based visual distortion effects (optional)

---

## Implementation Priority

| Priority | Category | Complexity | Impact |
|----------|----------|------------|--------|
| P0 | Modal transitions | Medium | High |
| P0 | Animated numbers | Low | High |
| P0 | Icon micro-animations | Low | High |
| P1 | File upload animation | Medium | Medium |
| P1 | Notification panel | High | High |
| P1 | Page transitions | High | High |
| P1 | Dashboard cards | Medium | High |
| P2 | Onboarding flow | High | High |
| P2 | Calendar UI | High | Medium |
| P2 | Achievements carousel | Medium | Medium |
| P2 | OTP input | Low | Low |
| P3 | Pull-to-refresh | Medium | Low |
| P3 | Password animations | Low | Low |
| P3 | Sliding sidebars | Medium | Medium |

---

## Technical Requirements

### Animation Library
- Framer Motion for complex animations
- CSS transitions for simple interactions
- Lottie for illustrated animations

### Performance
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`
- Lazy load heavy animations
- Use CSS containment

### Testing
- Visual regression tests for animations
- Motion-reduced mode testing
- Cross-browser testing (View Transitions API)

---

## Component Hierarchy

```
src/components/
├── animations/
│   ├── AnimatedModal.tsx
│   ├── AnimatedNumber.tsx
│   ├── AnimatedIcon.tsx
│   ├── PageTransition.tsx
│   ├── PullToRefresh.tsx
│   └── index.ts
├── inputs/
│   ├── OTPInput.tsx
│   ├── PasswordInput.tsx
│   ├── FileDropzone.tsx
│   └── index.ts
├── feedback/
│   ├── NotificationPanel.tsx
│   ├── AchievementCarousel.tsx
│   ├── Toast.tsx
│   └── index.ts
├── layout/
│   ├── SlidingSidebar.tsx
│   ├── FrostedFilter.tsx
│   └── index.ts
```

---

## Next Steps

1. **Audit current components** — identify where animations can be added
2. **Create animation primitives** — reusable hooks and components
3. **Implement P0 items** — modal, numbers, icons
4. **User test** — validate animations feel natural
5. **Performance audit** — ensure 60fps on target devices

---

*Created: 2024-06-24*
*Last updated: 2024-06-24*
