# UI restructure plan

Status: all six phases implemented on the local `ui-restructure` branch (not pushed). Decisions made with the owner:

1. Navigation: **left sidebar** replaces the top bar and its hover submenus.
2. **Organization in every admin URL**, using a scrambled key (not the readable slug).
3. Corners: **2px chips, 4px controls, 6px panels**. Round only for status dots.

## Structure

```
Organization  ->  Event  ->  Channel
   |                |
   |                +-- EventAssignments (user <-> event)
   +-- OrganizationMemberships (owner | manager | moderator)
```

### Shell

- Sidebar header: organization switcher (plain label when the user has one org).
- Sidebar nav: Events, People, Settings. "Live now" and "Recent" event lists replace hover submenus.
- "Platform" group (Organizations, Server health, Audit) for super admins only.
- Footer: profile, feedback.
- Breadcrumb on every page: Organization / Events / Event / Channel.
- Mobile: sidebar becomes a drawer.

### Event workspace

Tabs: Channels, People, Share, Settings. Channels are table rows with an edit drawer. The separate
channel new/edit pages go away (old URLs redirect).

### People

One People page per organization: members, pending invites, event assignments. The platform-wide
user list lives under Platform.

## URLs

Admin app (new):

```
/o/<orgKey>/events
/o/<orgKey>/events/<eventSlug>/{channels|people|share|settings}
/o/<orgKey>/people
/o/<orgKey>/settings
/platform/{organizations|server|audit}
```

- `orgKey`: short random base36 key stored on the organization (`publicKey`), generated once, never
  changes, unique. Existing organizations are backfilled by a migration.
- Old URLs (`/events/...`, `/organizations/...`, `/users/...`) redirect to the new ones.

Public listener and speaker URLs stay exactly as they are (`/listen/<event>/<channel>`,
`/speak/...`, private `publicId` links). They are printed on QR codes and saved in the mobile app,
so they must never break. Consequence: the event URL name (slug) stays unique across the server;
a colliding name gets an automatic suffix (`sunday-service-2`). The event **title** and channel
names can repeat freely between organizations.

Production schema changes need a migration in `src/migrations/` registered in `index.ts`.

## Visual language

- Corners: 2px chips, 4px controls, 6px panels. Pills only for status dots.
- Flat panels: 1px border, no gradient backgrounds, almost no shadow.
- Tables: hairline-divided rows instead of card-per-row; tabular numerals, right-aligned numbers.
- Colour: green for brand and "live"; neutral otherwise.
- One shared `us-input` / `us-label` instead of hand-styled fields.

## How it was built

- Pages did **not** move. `src/middleware.ts` rewrites `/o/<key>/...` and `/platform/...` onto the existing
  `/events`, `/users`, `/settings`, `/organizations` folders (mapping in `src/lib/org-paths.ts`) and passes the
  organization key to server code in request headers (`src/lib/org-headers.ts`, `src/lib/org-context.ts`).
- `@/components/OrgLink` replaces `next/link` everywhere and rewrites `/events/x` to `/o/<key>/events/x`
  automatically. Use it (not `next/link`) for any admin link.
- Old unscoped URLs (`/events/x`, bookmarks, server-action redirects) are redirected by `Layout` to the owning
  organization (event-aware), else the last visited one (cookie `ablaut_org`), else the first.
- Event, channel, organization and People queries follow the organization in the URL
  (`getScopedOrganizationId`). `/platform/users` keeps the all-organizations view.
- `Organization.publicKey`: migration `20261101_120000_organization_public_key` plus a startup backfill.
- `/platform/server` (super admins): CPU, memory, network, LiveKit rooms, database; API at `/api/app/server-stats`.
- Jump-to palette (Ctrl/Cmd+K) in the sidebar: events, sections, organizations.

## Phases (each ships and can be tagged on its own)

1. Design tokens and primitives (radius, border, surface; flat `us-panel`, buttons, chips, inputs).
2. Component sweep: replace hard-coded `rounded-2xl/3xl` utilities with token classes.
3. App shell: sidebar, org switcher, breadcrumbs, mobile drawer, remove hover submenus.
4. Org-scoped routes (`/o/<orgKey>/...`) with redirects, event workspace tabs, channel drawer.
5. People page and the Platform group.
6. Polish: empty states, density, Cmd-K jump-to-event.
