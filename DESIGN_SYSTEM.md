# FloatChat Design System

## 1. Purpose
A lightweight, ocean-inspired UI kit for conversational exploration of ARGO float data. Priorities:
- Clarity over ornament
- Oceanic atmosphere without impairing contrast
- Progressive disclosure of analytical tools
- Accessibility (WCAG AA target) & reduced-motion compliance

## 2. Visual Language
### 2.1 Core Concepts
- Layered depth: dark bathymetric background gradients + translucent glass panels
- Luminosity: bright accent gradients for focus, subtle inner glows for interactive controls
- Motion = buoyancy: slow drift (bubbles, horizontal shimmer, wave edges) — never distracting

### 2.2 Color Tokens (Tailwind Extensions)
Semantic naming sits on top of `ocean`, `coral`, and supporting neutrals.

| Semantic Token | Tailwind Mapping / Example | Usage |
|----------------|---------------------------|-------|
| `bg-ocean-bg` | `bg-[radial/linear gradients]` layer | Page background wrapper
| `floatchat-accent` | Accent gradient pair (from/to) | Primary call-to-action, active states
| `ocean-900..100` | Deep → light scale | Backgrounds, headings, subtle dividers
| `coral-*` | Warm highlight ramp | Secondary emphasis, error / risk, stats
| `glass-surface` (concept) | `bg-white/70 backdrop-blur` | Panels over dark ocean bg

Guidelines:
- Primary interactive surface: light glass card (`bg-white/70` + border `ocean-200/60`)
- Dark sections (hero): high-contrast gradient (e.g., `from-ocean-900 via-ocean-800 to-ocean-900`)
- Accent usage limit: 1 primary element per viewport (button or key stat highlight)

### 2.3 Gradients
- Accent CTA: `bg-gradient-to-b from-floatchat-gradientFrom to-floatchat-gradientTo`
- Header backgrounds: vertical deep ocean gradient
- Decorative wave overlays: translucent white → transparent linear gradient masks

### 2.4 Elevation & Shadows
Custom utilities (examples):
- `shadow-ocean-sm`: Soft ambient (used on buttons/cards)
- `shadow-ocean-md`: Hover elevation
Maintain ≤2 elevation levels to keep focus anchored.

## 3. Typography
- Headings: Tight leading, tracking-tight, weight 700–800
- Body: Base 14–16px, relaxed for descriptive copy
- Mono (`font-mono`): Query hints, examples, diagnostic readouts
- Avoid using accent gradients on long-form body text (reserve for headings + numeric KPIs)

## 4. Components
### 4.1 NavigationHeader
- Responsive; mobile sheet slides under blurred backdrop
- Active link: subtle accent underline / color shift
- Includes skip link (#main) for keyboard users

### 4.2 PageHeader
- Gradient block + optional breadcrumb + wave divider
- Always followed by a negative-margin main container where appropriate

### 4.3 Hero
- Stacked radial gradients + BubbleBackground + wave divider
- Query input: glass field, accent ring on focus
- Secondary actions: subtle pill buttons (white or translucent) vs primary accent button

### 4.4 BubbleBackground
- Decorative only; suppressed under `prefers-reduced-motion: reduce`
- Randomized bubble seeds to avoid visible repetition

### 4.5 WaveDivider
- SVG path with optional animation (`wave-horizontal` / masked gradients)
- Used at major section transitions (hero → body)

### 4.6 Panels
Pattern:
```html
<div class="rounded-2xl p-6 bg-white/80 backdrop-blur border border-ocean-200/60 shadow-ocean-sm">
  <!-- content -->
</div>
```
Variants: darker analytics blocks may invert text color; keep contrast ≥ 4.5:1.

### 4.7 Buttons
| Variant | Classes | Use |
|---------|---------|-----|
| Primary | `bg-floatchat-accent text-white hover:brightness-110` | Single most important action
| Secondary Light | `bg-white text-ocean-900 hover:bg-ocean-50` | Route links, docs
| Ghost / Translucent | `bg-white/10 text-white hover:bg-white/15` | On dark hero surfaces
| Destructive / Alert | `bg-coral-600 hover:bg-coral-500` | Error remediation (future)

All buttons: `focus-visible:ring-2 focus-visible:ring-floatchat-accent/60` for accessibility.

### 4.8 Upload Module
- Drag zone: dashed border shifts to accent + mild scale transform on dragenter
- Format cards: gradient ring wrapper + glass interior
- Progress: gradient bar + stat triplet (completed/errors/total)

### 4.9 Error Boundaries
- `global-error.tsx`: Full-screen fallback; provides digest and recovery button
- `error.tsx`: Route-level fallback; lighter card pattern inside existing layout
- `not-found.tsx`: Themed 404 with dual CTA (home + explorer)

## 5. Motion & Animation
| Animation | Intent | Notes |
|-----------|--------|-------|
| `bubble-rise` | Ambient depth | Disabled with reduced motion
| `wave-horizontal` | Soft shimmer | Slow (≥20s) cycle
| Accent hover transitions | Discoverability | Duration 150–220ms, ease-out

Reduced Motion Handling:
```ts
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
if (media.matches) disableDecorative();
```
Never gate core affordances behind animation.

## 6. Accessibility Guidelines
- Skip link present & focusable
- All interactive elements: visible focus outline (accent ring)
- Color contrast: test primary text on gradients; avoid placing pure white over light segments without subtle shadow
- `aria-hidden` on purely decorative SVGs/background layers
- Input placeholders are examples, not instructions — pair with `aria-describedby` where context needed

## 7. Error Handling Strategy
Immediate: human-readable fallback + reset pathway
Future Options:
- External logging (SaaS like Sentry) or custom ingestion endpoint
- User-triggered diagnostics export (digest + reproduction context)

## 8. Theming Extension Process
1. Add raw palette in `tailwind.config.js` under `extend.colors`
2. Create semantic tokens (e.g., `floatchat-accent`) mapping to gradient or palette pairs
3. Build minimal usage example in `/components/design/` (optional style lab)
4. Apply to one feature page; verify contrast & states
5. Refactor other components → remove obsolete token names

## 9. Implementation Checklist (Applied)
- [x] Palette & animations
- [x] Navigation + Footer
- [x] Hero + Query CTA
- [x] Landing secondary sections
- [x] Upload redesign
- [x] About redesign
- [x] Error boundaries & 404
- [x] Reduced motion compliance
- [ ] Documentation publication (this file) → now delivered

## 10. Future Enhancements
- Theming hook for dynamic scheme (night/day ocean)
- High-contrast mode toggle (increase surface opacity + border intensity)
- Chart theming integration (align Plotly traces with semantic scale)
- Live stats shimmer skeleton states

## 11. Maintenance Notes
- Keep accent usage scarcity: no more than 2 high-saturation gradient elements per viewport
- Re-test contrast after any palette shift (run automated axe or pa11y)
- Deduplicate bespoke utility classes into Tailwind plugin if repetition >3 occurrences

---
Questions or changes: Update this document alongside structural or palette modifications to prevent drift.
