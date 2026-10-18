# UI restructure plan

Status: approved direction, phase 1 in progress. Decisions made with the owner:

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

## Phases (each ships and can be tagged on its own)

1. Design tokens and primitives (radius, border, surface; flat `us-panel`, buttons, chips, inputs).
2. Component sweep: replace hard-coded `rounded-2xl/3xl` utilities with token classes.
3. App shell: sidebar, org switcher, breadcrumbs, mobile drawer, remove hover submenus.
4. Org-scoped routes (`/o/<orgKey>/...`) with redirects, event workspace tabs, channel drawer.
5. People page and the Platform group.
6. Polish: empty states, density, Cmd-K jump-to-event.
