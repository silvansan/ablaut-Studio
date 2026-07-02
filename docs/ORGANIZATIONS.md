# Organizations

ablaut-Studio supports multiple charities, teams, or groups on one server through **organizations**.

## Concepts

- **Organization** — tenant boundary for events and members.
- **Organization membership** — links a user to an organization with a role and status.
- **Platform role** (`Users.role`) — `super_admin`, `admin`, or `moderator` for Payload/app permissions.
- **Organization role** — `owner`, `manager`, `moderator`, or `viewer` inside one organization.

## Permissions

| Actor | Organizations | Users |
| --- | --- | --- |
| Super admin | All | All |
| Organization owner/manager | Manage their organizations | Users with membership in those organizations |
| Platform admin without org manager role | None until assigned | Self only |
| Moderator | Request to join | Self only |

## Bootstrap

On startup, if no organization exists:

1. Creates **Default Organization** (`slug: default`).
2. Attaches existing events without an organization.
3. Creates active memberships for existing users (admins as owners, moderators as moderators).

## User flows

### Invite

1. Organization manager opens **Users**.
2. Selects organization, enters name/email/roles.
3. User receives **Activate account and set password** email (`/reset-password/{token}`).
4. Setting a password marks the account verified and invitation accepted.

### Request to join

1. User submits organization slug on **Users**.
2. Membership is created as `pending`.
3. Owners/managers receive email and can approve or reject in **Users**.

### Password reset

Managers can send **Send password reset** from the user row. Uses the same app reset route as **Lost password**.

## Event assignments

Event assignments must reference users who are **active members** of the event's organization (super admins may override through Payload).

## App routes

- `/users` — organization-aware user management
- `/users` — global users hub with search, status, and organization filters
- `/users?organization={slug}` — filter by organization (stays on the hub)
- `/users?organization=none` — users without an organization
- `/users?q={text}` — search by name or email
- `/users?status=pending|active|inactive|unassigned` — filter by account status

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
