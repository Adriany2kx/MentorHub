# MentorHub UI Refinement

A design system approach focused on craft, restraint, and purposeful interaction.

---

## Design Philosophy

**Less, but better.** Every visual decision should earn its place. We favor:

- **Clarity** over decoration
- **Consistency** over novelty
- **Subtlety** over spectacle
- **Purpose** over polish
- **Accessibility** as default, not afterthought

---

## 1. Typography System

Typography is the skeleton of interface design. Get this right first.

### Type Scale (modular, base 16px)

```
--text-xs:    0.75rem   / 12px  — captions, timestamps
--text-sm:    0.875rem  / 14px  — secondary text, labels
--text-base:  1rem      / 16px  — body copy
--text-lg:    1.125rem  / 18px  — emphasized body
--text-xl:    1.25rem   / 20px  — card titles
--text-2xl:   1.5rem    / 24px  — section headers
--text-3xl:   1.875rem  / 30px  — page titles
--text-4xl:   2.25rem   / 36px  — hero headlines
```

### Line Heights

```
--leading-tight:  1.25  — headings
--leading-normal: 1.5   — body text
--leading-relaxed: 1.75 — long-form reading
```

### Font Weights

```
--font-normal:   400  — body
--font-medium:   500  — emphasis, labels
--font-semibold: 600  — headings, buttons
--font-bold:     700  — hero text only
```

### Implementation
- [ ] Audit all text styles, consolidate to scale
- [ ] Remove arbitrary font sizes (17px, 15px, etc.)
- [ ] Ensure heading hierarchy (h1 > h2 > h3) is visually clear
- [ ] Set max-width on prose (65-75 characters)

---

## 2. Spacing System

Consistent spacing creates visual rhythm and reduces cognitive load.

### 8px Grid

```
--space-1:   0.25rem  /  4px
--space-2:   0.5rem   /  8px
--space-3:   0.75rem  / 12px
--space-4:   1rem     / 16px
--space-5:   1.25rem  / 20px
--space-6:   1.5rem   / 24px
--space-8:   2rem     / 32px
--space-10:  2.5rem   / 40px
--space-12:  3rem     / 48px
--space-16:  4rem     / 64px
--space-20:  5rem     / 80px
```

### Application

| Context | Spacing |
|---------|---------|
| Between related elements | space-2 to space-3 |
| Between groups | space-6 to space-8 |
| Section padding | space-8 to space-12 |
| Page margins | space-6 (mobile), space-12 (desktop) |
| Card padding | space-5 to space-6 |

### Implementation
- [ ] Replace arbitrary margins/padding with scale values
- [ ] Audit card layouts for consistent internal spacing
- [ ] Ensure vertical rhythm in forms (consistent gaps)
- [ ] Add generous whitespace between page sections

---

## 3. Color Refinement

Color should guide, not distract. Reduce palette, increase intention.

### Semantic Colors

```css
/* Ink hierarchy — text and icons */
--ink-1:   hsl(220 20% 14%)   /* Primary text */
--ink-2:   hsl(220 12% 40%)   /* Secondary text */
--ink-3:   hsl(220 8% 56%)    /* Tertiary, placeholders */

/* Surface hierarchy — backgrounds */
--bg:      hsl(40 20% 98%)    /* Page background */
--paper:   hsl(0 0% 100%)     /* Cards, elevated surfaces */
--raised:  hsl(40 15% 96%)    /* Subtle distinction */

/* Border */
--border:  hsl(220 10% 88%)   /* Default borders */
--border-subtle: hsl(220 8% 92%) /* Dividers */

/* Interactive */
--blue:    hsl(210 90% 42%)   /* Primary actions */
--blue-hover: hsl(210 90% 36%)
--blue-subtle: hsl(210 80% 96%) /* Blue tinted backgrounds */

/* Feedback */
--success: hsl(152 60% 36%)
--warning: hsl(38 92% 50%)
--error:   hsl(0 72% 51%)
```

### Principles
- **3:1 minimum** contrast for large text
- **4.5:1 minimum** contrast for body text
- Use opacity for disabled states, not gray
- Limit accent color usage — blue for primary CTAs only

### Implementation
- [ ] Audit color usage, map to semantic tokens
- [ ] Check all text/background combinations for WCAG AA
- [ ] Remove one-off hex values
- [ ] Ensure dark mode uses same semantic structure

---

## 4. Elevation & Shadow

Shadows communicate hierarchy. Use sparingly, consistently.

### Shadow Scale

```css
--shadow-sm:   0 1px 2px hsl(220 20% 20% / 0.04);
--shadow-md:   0 2px 4px hsl(220 20% 20% / 0.06),
               0 1px 2px hsl(220 20% 20% / 0.04);
--shadow-lg:   0 4px 12px hsl(220 20% 20% / 0.08),
               0 2px 4px hsl(220 20% 20% / 0.04);
--shadow-xl:   0 8px 24px hsl(220 20% 20% / 0.12),
               0 4px 8px hsl(220 20% 20% / 0.06);
```

### Application

| Element | Shadow |
|---------|--------|
| Cards (resting) | shadow-sm or border only |
| Cards (hover) | shadow-md |
| Dropdowns, popovers | shadow-lg |
| Modals | shadow-xl |

### Implementation
- [ ] Standardize card shadows
- [ ] Remove harsh shadows (solid colors, high opacity)
- [ ] Ensure shadows scale proportionally on hover

---

## 5. Motion & Interaction

Motion should feel inevitable, not added. Guide attention, confirm actions.

### Principles

1. **Respond instantly** — interactions should acknowledge within 50ms
2. **Move naturally** — ease-out for entering, ease-in for exiting
3. **Be quick** — most transitions 150-200ms, never over 300ms
4. **Have purpose** — if you can't explain why it animates, don't animate it

### Timing Functions

```css
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);    /* Elements entering */
--ease-in:     cubic-bezier(0.4, 0, 1, 1);       /* Elements exiting */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Moving elements */
--spring:      cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful bounce */
```

### Durations

```css
--duration-fast:   100ms   /* Hovers, focus rings */
--duration-normal: 150ms   /* Most transitions */
--duration-slow:   250ms   /* Page transitions, modals */
```

### What to Animate

| Interaction | Animation |
|-------------|-----------|
| Button hover | Background color, subtle lift (translateY -1px) |
| Button press | Scale 0.98, shadow reduce |
| Card hover | Shadow increase, subtle lift (translateY -2px) |
| Focus states | Ring expansion with fade-in |
| Page transitions | Fade + subtle slide (opacity, translateY 8px) |
| Toast enter | Slide up + fade in |
| Modal enter | Fade + scale from 0.96 |
| Progress bar | Width with ease-out |

### What NOT to Animate

- ❌ Confetti (feels juvenile)
- ❌ Shake/wobble (annoying)
- ❌ Continuous loops (distracting)
- ❌ Parallax (often nauseating)
- ❌ Bounce on every click (exhausting)
- ❌ Typewriter text (slows users down)

### Implementation
- [ ] Add consistent hover states to all interactive elements
- [ ] Implement page transitions (fade, 150ms)
- [ ] Add focus-visible ring to all focusable elements
- [ ] Ensure all transitions use approved timing functions
- [ ] Test with prefers-reduced-motion (disable non-essential)

---

## 6. Component Refinements

### Cards

```css
.wf-card {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: var(--space-6);
  transition:
    box-shadow var(--duration-normal) var(--ease-out),
    transform var(--duration-normal) var(--ease-out);
}

.wf-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Only for clickable cards */
.wf-card[href]:active,
.wf-card[role="button"]:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

### Buttons

```css
.wf-btn {
  font-weight: var(--font-medium);
  padding: var(--space-2) var(--space-4);
  border-radius: 8px;
  transition:
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.wf-btn:active {
  transform: scale(0.98);
}

.wf-btn-primary {
  background: var(--blue);
  color: white;
}

.wf-btn-primary:hover {
  background: var(--blue-hover);
}
```

### Inputs

```css
.wf-input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--space-3) var(--space-4);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.wf-input:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-subtle);
}
```

### Implementation Checklist
- [ ] Update card hover states globally
- [ ] Add active states to all buttons
- [ ] Refine input focus states with ring
- [ ] Ensure consistent border-radius (8px small, 12px cards, 16px modals)

---

## 7. Loading States

Replace spinners with purposeful skeleton states.

### Skeleton Pattern

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--raised) 0%,
    var(--paper) 50%,
    var(--raised) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Where to Use
- [ ] Conversation list (Messages page)
- [ ] Mentor cards grid
- [ ] Session cards
- [ ] Goal cards
- [ ] Dashboard stats

### Skeleton Guidelines
- Match exact dimensions of real content
- Use rounded rectangles, not circles for text
- Keep animation subtle (1.5s cycle)
- Show 3-5 skeleton items max

---

## 8. Empty States

Empty states are opportunities, not dead ends.

### Structure
1. **Icon** — Simple, relevant, muted (ink-3)
2. **Headline** — What's missing, not what went wrong
3. **Description** — Why this matters, what to do next
4. **Action** — Clear CTA if applicable

### Examples

**No messages:**
> 💬 "No conversations yet"
> "Start a conversation with a mentor to get guidance on your goals."
> [Browse Mentors]

**No goals:**
> 🎯 "Set your first goal"
> "Goals help you and your mentor track progress together."
> [Create Goal]

### Implementation
- [ ] Audit all empty states for consistency
- [ ] Ensure each has icon, headline, description
- [ ] Add relevant CTA where applicable

---

## 9. Accessibility

Accessibility is not a feature. It's a requirement.

### Focus Management
- [ ] Visible focus ring on all interactive elements
- [ ] Skip-to-main link
- [ ] Focus trap in modals
- [ ] Restore focus when modals close

### Screen Readers
- [ ] All images have alt text (or alt="" if decorative)
- [ ] Form inputs have associated labels
- [ ] Error messages linked to inputs with aria-describedby
- [ ] Announce route changes

### Keyboard
- [ ] All interactive elements reachable via Tab
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate menus
- [ ] Enter activates buttons

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Implementation Sequence

### Week 1: Foundations ✓
1. ✓ Define CSS custom properties (typography, spacing, colors)
2. ✓ Update global styles with new tokens
3. ✓ Audit and fix color contrast issues
4. ✓ Add focus-visible states globally

### Week 2: Components ✓
1. ✓ Refine card hover/active states
2. ✓ Update button interactions
3. ✓ Polish input focus states
4. ✓ Standardize shadows

### Week 3: Motion ✓
1. ✓ Add page transitions (opacity + translateY)
2. ✓ Implement skeleton loaders
3. ✓ Progress bar animations
4. ✓ Toast animations

### Week 4: Polish ✓
1. ✓ Empty state audit — icons added to key empty states
2. ✓ Reduced motion testing — comprehensive `prefers-reduced-motion` coverage
3. ✓ Keyboard navigation audit — focus-visible states on all interactive elements
4. Cross-browser testing — manual testing recommended

---

## Technical Notes

### Required Dependencies
```bash
# Only if complex orchestrated animations needed
npm install framer-motion
```

### CSS Architecture
- Use CSS custom properties for all design tokens
- Keep animations in CSS where possible (simpler, more performant)
- Use Framer Motion only for orchestrated sequences or gestures

### Performance Budget
- No animation over 300ms
- Use `transform` and `opacity` only for animated properties
- Use `will-change` sparingly, remove after animation
- Test on low-end devices (throttle CPU in DevTools)

---

## What We're Not Doing

These are intentionally excluded:

- **Pull-to-refresh** — Not native to web, feels forced
- **Confetti** — Juvenile, distracting
- **Sound effects** — Unexpected, annoying
- **Haptic feedback** — Inconsistent browser support
- **Command palette** — Over-engineered for this use case
- **Parallax** — Often causes motion sickness
- **Auto-carousels** — Users hate them, accessibility nightmare
- **Glassmorphism** — Trendy but often illegible

---

## Success Metrics

A successful UI feels:

- **Fast** — Interactions respond instantly
- **Quiet** — No visual noise competing for attention
- **Clear** — Hierarchy guides the eye naturally
- **Consistent** — Patterns repeat, reducing learning curve
- **Accessible** — Works for everyone, on every device

---

*Refined: 2025-06-24*
