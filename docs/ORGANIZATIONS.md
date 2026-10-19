# Organizations

ablaut-Studio supports multiple charities, teams, or groups on one server through **organizations**.

## Concepts

- **Organization** — tenant boundary for events and members.
- **Organization membership** — links a user to an organization with a role and status.
- **Platform role** (`Users.role`) — `super_admin`, `admin`, or `moderator`. `moderator` is the default and means no platform powers (shown as **Platform access: None**).
- **Organization role** — `owner`, `manager`, `moderator`, or `viewer` inside one organization. Platform admins and super admins already manage every organization, so their organization role is not shown.
- **Organization key** — a random 8-character key in every admin address (`/o/<key>/events`), so organizations can reuse event and channel names.

## Permissions

| Actor | Organizations | Users |
| --- | --- | --- |
| Super admin | All, including create and delete | All |
| Platform admin | Manage all (cannot create or delete) | All |
| Organization owner/manager | Manage their organizations | Users with membership in those organizations |
| Moderator | Request to join | Self only |

## Bootstrap

On startup, if no organization exists:

1. Creates **Default Organization** (`slug: default`).
2. Attaches existing events without an organization.
3. Creates active memberships for existing users (admins as owners, moderators as moderators).

## User flows

### Invite

1. An organization manager opens **People** and chooses **Invite user**.
2. Enters name and email and picks one **Role**: Moderator or Manager. Super admins can also pick **Platform admin**, which needs no organization and creates no membership.
3. The user receives an **Activate account and set password** email (`/reset-password/{token}`). The link works once and lasts `INVITE_LINK_TTL_HOURS` (default 7 days).
4. Setting a password marks the account verified, accepts the invitation and signs the user in.
5. Without SMTP, use **Copy invite link** on the person's page and share the link yourself.

### Request to join

1. User picks an organization under **Join an organization** on **My profile**.
2. Membership is created as `pending`.
3. Owners/managers receive email and can approve or reject in **People**.

### Password reset

Managers can use **Send password reset** or **Copy reset link** on a person's page. Anyone can also request a new link from the sign-in page (**Forgot your password, or invitation link expired?**). Reset links last `RESET_LINK_TTL_MINUTES` (default 60 minutes).

## Event assignments

Event assignments must reference users who are **active members** of the event's organization (super admins may override through Payload).

## App routes

- `/o/{key}/people` — people of one organization
- `/platform/users` — all users on the server (platform admins), with search, status and organization filters
- `/platform/users?organization={slug}` — filter by organization
- `/platform/users?organization=none` — users without an organization (platform admins are not counted)
- `?q={text}` — search by name or email
- `?status=pending|active|inactive|unassigned` — filter by account status
- Old addresses such as `/users` and `/events` redirect to the organization-scoped ones.

## API routes

- `POST /api/app/reset-password` — set password and complete activation
- `POST /api/app/login-failure` — clearer login errors (inactive / unverified)
- `POST /api/users/invite` — programmatic invite (Payload auth required)

## Config import / export

Full config (`GET /api/config/export?scope=full`, super admin only) includes:

- `organizations` — name, slug, description, active, support email
- `organizationMemberships` — organization slug, user email, org role, status
- `users` — platform role and profile (no password hashes)
- `events` — includes `organizationSlug` linking each event to its organization
- `channels`, `event-assignments`, and `site-settings` as before

Import order: organizations → users → memberships → events → channels → assignments → settings.

Older v1 exports without organizations still import; events may omit `organizationSlug` until you assign them in the app or re-export from a v2 deployment.
