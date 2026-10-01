---
name: ablaut-ui
description: >-
  ablaut-Studio design system — the --us-* CSS tokens, the us-panel / us-chip /
  us-button-* / us-data-row component classes, the active-status.ts status-chip
  helpers, the shared overlay primitives, and the user-facing copy rules from
  CONTEXT.md. Use whenever creating or editing any React/Tailwind UI under
  ablaut-studio/src (.tsx components or app pages), or editing
  ablaut-studio/src/styles/globals.css, so changes land on the existing system
  instead of generic AI styling.
---

# ablaut-Studio UI

The studio already has a design system. Your job on any UI change is to **use it**, not
re-invent it. The source of truth is [`src/styles/globals.css`](../../src/styles/globals.css)
(tokens + component classes) and [`CONTEXT.md`](../../CONTEXT.md) (user-facing copy).

## Color — tokens only, never raw hex

Every color in a component comes from a `--us-*` token, applied via a `us-*` class or
`style={{ color: 'var(--us-…)' }}`. Inline `style` for **applying a token** is the house
style here and is fine. Raw hex or ad-hoc `rgba()` in a `.tsx` file is not.

| Token | Use |
|---|---|
| `--us-green-dark` `#163f35` | headings, primary text emphasis |
| `--us-green` `#2f8f63` | success / active accents, primary button gradient start |
| `--us-blue-dark` `#126bb6` | links, eyebrow labels, secondary button text, primary button gradient end |
| `--us-blue` `#26a7f2` | focus ring, blue chip accent |
| `--us-text` `#15313a` | body text |
| `--us-muted` `#5d7680` | help text, secondary/meta text |
| `--us-danger` `#c74848` | destructive actions, inactive state |
| `--us-warning` `#e8b84d` | warnings |
| `--us-border` | every 1px border |
| `--us-bg` / `--us-card` | page ground / card ground (usually via `us-panel`, not by hand) |
| `--us-shadow` / `--us-shadow-soft` | the only shadow values — never write a bespoke `box-shadow` |

## Component classes — reach for these first

- **`us-panel`** — every card / section surface. Border + `1.25rem` radius + gradient card
  ground + soft shadow. If you're drawing a box, it's a `us-panel` (add padding with
  `px-5 py-5` / `px-6 py-6`).
- **`us-button-primary`** / **`us-button-secondary`** — all buttons and button-styled links.
  Add sizing with `px-5 py-3 text-sm font-medium`. Do not restyle their color/shadow.
- **`us-chip`** + one of `us-chip-muted` / `us-chip-blue` / `us-chip-warning` /
  `us-chip-active` / `us-chip-inactive` — labels, tags, counts, statuses.
- **`us-data-row`** with `__lead` / `__chips` / `__detail` / `__actions`, plus
  `us-data-row-header` and `us-data-row--cols-{2,3,4}` — the list-row layout used by every
  hub table. Reuse it for new lists; don't hand-roll a flex row.
- **`us-row-tint-green` / `-blue` / `-white`** — group tinting (assigned by
  `src/lib/list-group-tints.ts`).
- **`us-hero-glow`** — decorative gradient glow (sidebar, hero panels only).
- **`us-neu-toggle`** — the toggle switch. **`us-toast`** — toasts, via `AppToastProvider`.

## Status — use the helpers

Never hand-roll a status pill. Import from [`src/lib/active-status.ts`](../../src/lib/active-status.ts):

```ts
import { eventStatusChip, channelEnabledChip } from '@/lib/active-status'
const s = eventStatusChip(event.status)   // → { className, label }
// <span className={`us-chip ${s.className}`}>{s.label}</span>
```

## Overlays — reuse the primitives

- **`CollapsiblePanel`** ([component](../../src/components/CollapsiblePanel.tsx)) — inline
  disclosure / accordion (title + optional description, slides open). This is the default
  for "show a form / details on demand" inside a page.
- **`Drawer`** ([component](../../src/components/Drawer.tsx)) — slide-over sheet, built on
  **`ModalPortal`**. For focused create/edit flows.
- **`ModalPortal`** — portal + scroll-lock, the base for any true overlay.

Do **not** add a new `*Drawer` / `*Panel` / modal primitive. Compose these.

## Layout & scale

- Section rhythm: `space-y-4`. Gaps: `gap-2` / `gap-3` / `gap-4`.
- Radius: `rounded-2xl` (inputs, inner cards), `rounded-3xl` (large cards), `rounded-full`
  (chips, dots). Panels get their radius from `us-panel`.
- Inputs: `mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none` with
  `style={{ borderColor: 'var(--us-border)' }}`.
- Use Tailwind flex/grid for **layout**. Inline `style` is for **tokens only**, not for
  margins/padding/width.

## Typography

- Eyebrow label: `text-xs font-semibold uppercase tracking-[0.16em]` +
  `style={{ color: 'var(--us-blue-dark)' }}`.
- Section heading: `text-2xl font-semibold tracking-tight` +
  `style={{ color: 'var(--us-green-dark)' }}`.
- Body / help: `text-sm leading-7` + `style={{ color: 'var(--us-muted)' }}`.
- Page metadata: `pageMetadata('Title')` from [`src/lib/branding.ts`](../../src/lib/branding.ts).
  Product/name strings come from the `APP_*` constants there — never hard-code "ablaut".

## Copy — user-facing terms (from CONTEXT.md)

Use: **Listener QR**, **Speaker / translator QR**, **One QR for all languages**,
**URL name** (not bare "slug"), **Share & print**, **Listen now**, **Having trouble?**,
**Channel enabled**, **Listener page**, **Speaker page**.

Avoid in UI: "Route cluster", "listener route", "publish URL", bare "slug", and exposing
HLS / WebRTC / LL-HLS jargon as primary labels. Two personas both matter: the **org
manager** (pre-event setup) and the **event-day operator** (fast share actions, no
icon-only hunting).

## Reject list — these are the slop tells

- Raw hex or one-off `rgba()` in a `.tsx` → a `--us-*` token.
- Bespoke `box-shadow` → `--us-shadow` / `--us-shadow-soft` or just `us-panel`.
- Arbitrary Tailwind values (`w-[347px]`, `mt-[13px]`, `text-[13px]`) → the scale.
- Re-implementing `us-panel` / `us-chip` / `us-data-row` with raw Tailwind.
- Hand-rolled status pills instead of `active-status.ts`.
- A new overlay/drawer/modal primitive instead of `CollapsiblePanel` / `Drawer` / `ModalPortal`.
- Icon-only buttons with no visible label and no `aria-label`.
- Emoji used as UI icons (use the SVGs in `src/components/ActionIcons.tsx`).
- Wrapper `<div>`s that only forward a className.
- Inline `style` doing layout (margin/padding/width/flex) rather than applying a token.

## Before you finish a UI change

1. Every surface is `us-panel` (or nested in one).
2. Zero raw hex / ad-hoc rgba in the diff; colors are `--us-*`.
3. Buttons are `us-button-primary` / `us-button-secondary` + sizing utilities.
4. Status is `us-chip-*` or an `active-status.ts` helper.
5. Copy uses the CONTEXT.md terms; no HLS/WebRTC jargon as a primary label.
6. No new overlay primitive — reused `CollapsiblePanel` / `Drawer`.
7. Every interactive control has a visible label or `aria-label`.
8. `npm run lint` is clean. New `style={{…}}` blocks only set `--us-*` values.
