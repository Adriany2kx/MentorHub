# Design System Master File — MentorHub

> **LOGIC:** When building a specific page, first check `design-system/mentorhub/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** MentorHub
**Style:** Warm Editorial Studio
**Updated:** 2026-04-10

---

## Brand Personality

**Three words:** Warm · Trustworthy · Energising

**Emotional target:** Users should feel *confident and relieved* — like paying off a huge debt.  
Every design decision must reduce cognitive load and build trust.

---

## Color Palette

| Role | Light Mode | Dark Mode | Notes |
|------|-----------|-----------|-------|
| Background | `#F7F8FF` | `#0C0D1E` | Barely-indigo white / very dark indigo |
| Surface (cards) | `#FFFFFF` | `#151628` | Clean white / elevated dark indigo |
| Border | `#E2E6F4` | `#2A2C4A` | Soft indigo-tinted edge |
| Text primary | `#1A1B2E` | `#E8EAFF` | Deep indigo-navy / near-white with indigo tint |
| Text secondary | `#474D7A` | `#9BA3D0` | 5.2:1 contrast ✓ |
| Text muted | `#6B7499` | `#6068A0` | Captions only |
| Primary / CTA | `#4F46E5` | `#818CF8` | Indigo — 6.2:1 on white ✓ |
| Hero bg | `#13143C` | `#07080F` | Deep indigo — stays dark in both modes |

**CSS token name:** `--color-blue` carries the primary/CTA colour for historical compatibility.  
**Dark mode:** `[data-theme="dark"]` on `<html>` element.

---

## Typography

| Role | Font | Usage |
|------|------|-------|
| Display / Editorial | **Fraunces** (variable serif) | Hero headlines, pull quotes, milestone moments |
| Body / UI | **DM Sans** | All functional UI text, labels, body copy |

**Key rule:** Use Fraunces *sparingly* — italic weight for emotional emphasis only.  
Fraunces italic on a single key word in a heading > entire heading in Fraunces.

**CSS import:**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,600;1,9..144,700&display=swap');
```

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding |

---

## Radius & Shadows

| Token | Value | Notes |
|-------|-------|-------|
| `--radius-sm` | `6px` | Inputs, tags |
| `--radius-md` | `12px` | Cards, buttons |
| `--radius-lg` | `16px` | Modals, large panels |
| `--radius-full` | `9999px` | Pills, avatars |
| `--shadow-card` | `0 2px 8px rgba(44,20,10,0.07)` | Warm-tinted — never grey |
| `--shadow-dropdown` | `0 6px 24px rgba(44,20,10,0.13)` | |
| `--shadow-modal` | `0 12px 40px rgba(44,20,10,0.18)` | |

---

## Style Guidelines

**Style:** Warm Editorial Studio
- Soft depth via warm-tinted shadows (never cool grey)
- Generous white space — breathing room = trustworthiness signal
- Natural easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)
- Radius: organic (12–16px) but not childish (not 24px+)
- Grain textures are allowed subtly for Nature Distilled warmth

**Landing page structure** (Hero + Testimonials + CTA pattern):
1. Hero (warm dark bg, terracotta blob accent)
2. Trust stats
3. Value props / how it works
4. Featured mentors (social proof before CTA)
5. Testimonials
6. Bottom CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ **AI slop aesthetic** — cyan-on-dark, purple→blue gradients, neon glows, glassmorphism wallpaper
- ❌ **Flashy = scammy** — oversaturated palettes, fake urgency, aggressive pop-ups, rainbow gradients
- ❌ **Corporate cold** — pure grey/blue, stock-photo feel, soulless enterprise aesthetic
- ❌ **Childish playful** — rounded bubbly fonts (Fredoka, Nunito), claymorphism, emoji icons
- ❌ **Emojis as icons** — use SVG only (Heroicons / Lucide style)
- ❌ **Missing cursor:pointer** — every clickable element must have it
- ❌ **Instant state changes** — always transition (150–300ms)
- ❌ **Low contrast** — 4.5:1 minimum for all text

---

## Accessibility

- Target: **WCAG AA**
- Colour contrast: all tokens verified ≥4.5:1
- Touch targets: ≥44×44px
- `prefers-reduced-motion` respected (overrides in `index.css`)
- Focus states: `outline: 2px solid var(--color-blue)` with `outline-offset: 2px`

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (SVG only)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Text contrast ≥4.5:1 in both light and dark mode
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind fixed navbar
- [ ] Dark mode tested — all surfaces readable
