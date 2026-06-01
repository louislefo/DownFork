---
name: High-Precision Dark
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e4e1e6'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#e4e1e6'
  inverse-on-surface: '#303033'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#bf0f3c'
  on-tertiary-container: '#ffd0d2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#131316'
  on-background: '#e4e1e6'
  surface-variant: '#353438'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  code:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin: 24px
---

## Brand & Style

The design system is engineered for high-performance SaaS environments, drawing inspiration from the technical precision of modern developer tools. It targets a professional audience that values speed, clarity, and visual quietude.

The style is **Modern Corporate Minimalism** with a focus on functional aesthetics. It utilizes deep blacks and zinc-toned surfaces to minimize eye strain while highlighting critical data through selective indigo accents. The interface relies on structural integrity—crisp borders, generous whitespace, and meticulous typography—rather than decorative elements. The emotional response should be one of focused control, reliability, and technical sophistication.

## Colors

The palette is rooted in a pure black (#000000) foundation to maximize contrast and visual depth. 

- **Foundation:** The background utilizes pure black, while primary containers use Zinc-900 (#18181b) and secondary borders use Zinc-800 (#27272a).
- **Accents:** Indigo Blue (#4f46e5) is reserved for primary actions, focus states, and progress indicators.
- **Status:** Functional colors are high-chroma but used sparingly. Emerald-500 is used for success and active states, Rose-500 for errors and destructive actions, and Indigo for processing or neutral info states.
- **Text:** Primary text is Zinc-50 (#fafafa), secondary text is Zinc-400 (#a1a1aa), and disabled text is Zinc-600 (#52525b).

## Typography

This design system uses Geist for its technical, precision-oriented feel. The typographic hierarchy is strictly enforced to ensure scanability in data-dense views.

- **Headlines:** Use tighter letter spacing and semi-bold weights to create a strong visual anchor.
- **Body:** Standardized at 14px or 16px for optimal readability in dark mode.
- **Monospace:** JetBrains Mono is used for IDs, code snippets, and technical values to differentiate them from prose.
- **Contrast:** Ensure a clear distinction between primary (White) and secondary (Zinc-400) text to guide the user's eye toward the most important information first.

## Layout & Spacing

The layout follows a strict 4px baseline grid to ensure mathematical alignment across all components.

- **Grid:** A 12-column fluid grid for desktop (1280px+) with 24px gutters. For mobile, a single-column layout with 16px margins.
- **Density:** High-density spacing is preferred for dashboards. Use `md` (16px) for standard component padding and `sm` (8px) for internal element grouping.
- **Sectioning:** Vertical spacing between major sections should use `2xl` (48px) or `3xl` (64px) to create breathing room in the dark interface.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** and **Subtle Outlines** rather than heavy shadows.

- **Level 0 (Base):** Pure Black (#000000). Used for the main application background.
- **Level 1 (Surface):** Zinc-900 (#18181b). Used for sidebars, cards, and primary containers.
- **Level 2 (Overlay):** Zinc-800 (#27272a). Used for modals, popovers, and tooltips.
- **Outlines:** Every elevated surface must have a 1px solid border using Zinc-800 (#27272a). This provides the necessary definition between layers in a dark environment.
- **Shadows:** Only used for floating overlays (modals/menus). Use a 25% opacity black shadow with a large blur (20px+) to suggest height without adding visual noise.

## Shapes

The shape language is modern and approachable but retains a professional structure.

- **Base Radius:** 0.5rem (8px) for buttons, inputs, and small components.
- **Large Radius:** 1rem (16px) for cards and main content containers.
- **Extra Large Radius:** 1.5rem (24px) for modals and promotional hero elements.
- **Full Radius:** Use pill shapes only for status tags (chips) and toggle switches.

## Components

- **Buttons:** Primary buttons use Indigo Blue with white text. Secondary buttons use a Zinc-900 background with a Zinc-800 border and Zinc-50 text. Hover states should lighten the background by 10%.
- **Inputs:** Background should be pure black or Zinc-950, with a Zinc-800 border. On focus, the border transitions to Indigo Blue with a subtle 2px indigo outer glow (0.2 opacity).
- **Chips/Tags:** Small font size (12px), semi-bold. Success tags use a subtle emerald tint for the background (10% opacity) with emerald text.
- **Lists:** Rows should be separated by a 1px border (#27272a). Hover states on list items should use a Zinc-900 background.
- **Cards:** Use a Zinc-900 background and Zinc-800 border. Do not use shadows unless the card is draggable or interactive.
- **Progress Bars:** Background is Zinc-800, fill is Indigo Blue. For successful completion, the fill transitions to Emerald.