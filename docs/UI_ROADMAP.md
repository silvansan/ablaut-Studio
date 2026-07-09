# ablaut-studio UI roadmap

## Completion contract

**Slice 1 must ship fully working.** No placeholder UI, no `TODO` buttons, no half-wired server actions. Each slice is done when:

- All listed UI is functional in production-like flows
- Share/copy/download paths work end-to-end
- Stay-on-page actions show client toasts; create/delete flows still redirect as designed
- `npm run lint`, `npm run test:int`, and `npm run build` pass
- Changes are tagged for deploy (e.g. `ablaut-v0.3.3`)

**After slice 1, we continue with slice 2+ until the backlog below is empty.** Do not treat later slices as optional polish.

---

## Slice 1 — Share hub, toasts, plain language

| Area | Deliverable | Status |
|------|-------------|--------|
| A | Event **Share & print** hub + channel compact strip | Done |
| B | Client toasts via `useActionState` + `{ ok, message }` | Done |
| C | Plain language on admin share surfaces + public `/listen` | Done |
| D | Slim channel rows; **Share** on `/channels` hub | Done |

Personas: org managers **and** event-day operators equally.

---

## Slice 2 — Operator UX

| # | Item | Status |
|---|------|--------|
| 1 | Event-day **Go live** wizard | Done |
| 2 | **Mobile navigation** (menu + bottom tabs) | Done |
| 3 | **Production org** hides beta banner | Done |
| 4 | **Unify user management** (pending requests in hub/dashboard, org picker join) | Done |
| 5 | **Bulk actions** discoverability hint | Done |
| 6 | **Breadcrumbs** org → event → channel | Done |
| 7 | **Dashboard actionable cards** | Done |
| 8 | **Settings split** manager vs super-admin | Done |
| 9 | **Expert options collapse** in forms | Done |
| 10 | **Flutter speaker QR + in-app channel share QR** | Done (local `ablaut-app`; run `flutter pub get`) |
| 11 | **`defaultQrStyle`** wired to QR engine | Done |
| 12 | Print-friendly `/events/[slug]/share` + ZIP of PNGs | Done |

---

## Remaining

None for the studio UI roadmap. Commit/push `ablaut-app` speaker + share QR when ready.

---

## Reference

- Stable checkpoint before slice 1: tag `ablaut-v0.3.2`
- Glossary: [`CONTEXT.md`](../CONTEXT.md)
- Lean UI notes: [`LEAN_UI_PLAN.md`](./LEAN_UI_PLAN.md)
