# Easy Portainer Stack Deployment

This is the shortest path to deploy ablaut from Portainer.

The stack includes:

- ablaut app
- PostgreSQL database
- LiveKit server
- persistent uploads volume
- optional Maildev for testing email

## 1. Create The Stack

1. Open Portainer.
2. Go to **Stacks**.
3. Click **Add stack**.
4. Name it:

```text
ablaut-studio
```

5. Paste the contents of `PORTAINER_STACK_COPY_PASTE.yml` into the Web editor.
6. Replace every `CHANGE_ME` value and example domain.
7. For rollback-friendly deployments, paste `PORTAINER_STACK_PINNED.yml` instead and update only the Git tag when upgrading.
8. If you prefer using `docker-compose.yml`, paste that file instead and add the environment variables below in Portainer's **Environment variables** section.
9. Click **Deploy the stack**.

## 2. Copy-Paste Environment Variables

For local/LAN testing:

```env
PAYLOAD_SECRET=replace-with-a-long-random-string-min-32-chars
POSTGRES_USER=ablaut
POSTGRES_PASSWORD=replace-with-a-strong-db-password
POSTGRES_DB=ablaut
PAYLOAD_DB_PUSH=false
PAYLOAD_RUN_MIGRATIONS=true
PAYLOAD_WAIT_FOR_DB=true

NEXT_PUBLIC_APP_URL=http://YOUR_SERVER_LAN_IP:3000
PUBLIC_BASE_URL=http://YOUR_SERVER_LAN_IP:3000

LIVEKIT_API_KEY=ablaut
LIVEKIT_API_SECRET=replace-with-a-long-random-livekit-secret
LIVEKIT_URL=ws://YOUR_SERVER_LAN_IP:7880
LIVEKIT_USE_EXTERNAL_IP=false
LIVEKIT_PUBLIC_URL=

FEATURE_HLS_EGRESS=false
LIVEKIT_EGRESS_ENABLED=false
HLS_PUBLIC_BASE_URL=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com
INVITE_LINK_TTL_HOURS=168
RESET_LINK_TTL_MINUTES=60

INITIAL_SUPER_ADMIN_EMAIL=admin@example.com
INITIAL_SUPER_ADMIN_PASSWORD=replace-with-a-strong-first-password
```

For cloud/production:

```env
PAYLOAD_SECRET=replace-with-a-long-random-string-min-32-chars
POSTGRES_USER=ablaut
POSTGRES_PASSWORD=replace-with-a-strong-db-password
POSTGRES_DB=ablaut
PAYLOAD_DB_PUSH=false
PAYLOAD_RUN_MIGRATIONS=true
PAYLOAD_WAIT_FOR_DB=true

NEXT_PUBLIC_APP_URL=https://ablaut.example.com
PUBLIC_BASE_URL=https://ablaut.example.com

LIVEKIT_API_KEY=ablaut
LIVEKIT_API_SECRET=replace-with-a-long-random-livekit-secret
LIVEKIT_URL=wss://livekit.example.com
LIVEKIT_USE_EXTERNAL_IP=true
LIVEKIT_PUBLIC_URL=

FEATURE_HLS_EGRESS=false
LIVEKIT_EGRESS_ENABLED=false
HLS_PUBLIC_BASE_URL=https://ablaut.example.com/hls

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=smtp-user
SMTP_PASS=smtp-password
SMTP_FROM=noreply@example.com
INVITE_LINK_TTL_HOURS=168
RESET_LINK_TTL_MINUTES=60

INITIAL_SUPER_ADMIN_EMAIL=admin@example.com
INITIAL_SUPER_ADMIN_PASSWORD=replace-with-a-strong-first-password
```

`INVITE_LINK_TTL_HOURS` (1 to 720, default 168) and `RESET_LINK_TTL_MINUTES` (5 to 1440, default 60) set how long emailed invitation and password-reset links stay valid. Both are optional; links always work only once.

Generate good secrets on a Linux/macOS host with:

```bash
openssl rand -hex 32
```

In PowerShell:

```powershell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 3. Proxy Manager Setup

Use any reverse proxy manager you like, such as Nginx Proxy Manager, Traefik, Caddy, SWAG, or a cloud load balancer.

### App Website

Forward this domain:

```text
ablaut.example.com
```

To:

```text
http://APP_CONTAINER_OR_HOST:3000
```

Enable:

- HTTPS
- WebSocket support
- forwarded host headers
- `X-Forwarded-Proto`

If the proxy runs in the same Docker network as the stack, point it to:

```text
http://app:3000
```

If the proxy runs outside the stack, point it to the Docker host IP and published port:

```text
http://YOUR_SERVER_IP:3000
```

### LiveKit WebSocket

Forward this domain:

```text
livekit.example.com
```

To:

```text
http://LIVEKIT_CONTAINER_OR_HOST:7880
```

Enable:

- HTTPS
- WebSocket support

If the proxy runs in the same Docker network as the stack, point it to:

```text
http://livekit:7880
```

If the proxy runs outside the stack, point it to:

```text
http://YOUR_SERVER_IP:7880
```

Set:

```env
LIVEKIT_URL=wss://livekit.example.com
```

## 4. Ports To Open Or Forward

For normal cloud production behind a proxy:

| Port | Protocol | Goes To | Purpose |
| --- | --- | --- | --- |
| `80` | TCP | reverse proxy | HTTP certificate challenge / redirect |
| `443` | TCP | reverse proxy | HTTPS app and LiveKit WebSocket |
| `7881` | TCP | Docker host / LiveKit | LiveKit RTC over TCP |
| `50000-50100` | UDP | Docker host / LiveKit | LiveKit RTC media |

The app port `3000` and LiveKit HTTP port `7880` can stay private if your reverse proxy can reach the Docker services. If your proxy is outside Docker, publish/allow them only between the proxy and Docker host.

For LAN testing without a proxy:

| Port | Protocol | Purpose |
| --- | --- | --- |
| `3000` | TCP | ablaut app |
| `7880` | TCP | LiveKit WebSocket/API |
| `7881` | TCP | LiveKit RTC over TCP |
| `50000-50100` | UDP | LiveKit RTC media |

Do not expose PostgreSQL `5432` publicly.

Maildev ports `1080` and `1025` are only for local/staging email testing and should not be public in production.

## 5. First Login

After the stack starts, open:

```text
https://ablaut.example.com
```

or for LAN:

```text
http://YOUR_SERVER_LAN_IP:3000
```

Log in with:

```env
INITIAL_SUPER_ADMIN_EMAIL=admin@example.com
INITIAL_SUPER_ADMIN_PASSWORD=your-first-password
```

The initial super admin is only created when no users exist yet.

## 6. QR Codes And Phone Testing

QR links use the host you opened the dashboard with.

- If you open `http://localhost:3000`, QR codes will use `localhost` and phones will not reach them.
- If you open `http://192.168.1.50:3000`, QR codes will use the LAN IP and phones on the same Wi-Fi can reach them.
- If you open `https://ablaut.example.com`, QR codes will use the public cloud domain.

## 7. Updating Later

### Safe redeploy checklist

1. **Back up first** (see [`docs/MIGRATION.md`](docs/MIGRATION.md)):
   - `docker compose exec db pg_dump -U ablaut ablaut > ablaut-backup.sql`
   - Archive the `ablaut_uploads` volume
2. **Keep volumes** — never delete `ablaut_db` or `ablaut_uploads` on routine updates.
3. **Update the stack** — pin a Git tag in `PORTAINER_STACK_PINNED.yml` when possible.
4. **Keep migration env vars**:
   - `PAYLOAD_DB_PUSH=false`
   - `PAYLOAD_RUN_MIGRATIONS=true`
   - `PAYLOAD_WAIT_FOR_DB=true`
5. **Redeploy** and watch app logs for migration completion messages.
6. **Verify** — open `/api/health?deep=1`, log in, and spot-check events/channels.
7. **Rollback** — revert the Git tag and redeploy. Restore the database backup only if a migration corrupted data.

### Database schema on redeploy

Production Docker runs **registered Payload migrations automatically** on startup. `PAYLOAD_DB_PUSH=true` does **not** sync production schema — schema push is development-only.

Every schema change must include:

1. A migration file in `src/migrations/`
2. A matching entry in `src/migrations/index.ts`

The build runs `npm run verify:migrations` to catch missing registrations before deploy.

### Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Missing column after deploy | Migration not registered in `index.ts` | Fix code, redeploy, or apply SQL manually if urgent |
| App health check fails briefly on first boot | Migrations still running | Wait for `start_period`; check logs |
| Login works but new fields missing | Old image still deployed | Confirm Portainer rebuilt/pulled the latest tag |
| 500 errors after deploy | Migration failed mid-start | Restore backup, fix migration, redeploy |

Do not remove the volumes unless you want to erase users, events, channels, settings, and uploads.

For safer rollback, use `PORTAINER_STACK_PINNED.yml` and pin a Git tag:

```yaml
build:
  context: https://github.com/silvansan/ablaut-Studio.git#ablaut-v0.2.0
```

To roll back, change the tag back to the previous known-good tag and redeploy without changing the stack name or volumes.

## 8. Data safety on updates

Do not delete the `ablaut_db` or `ablaut_uploads` volumes when updating the stack.

Before major upgrades:

1. Back up Postgres: `pg_dump -U ablaut ablaut`
2. Back up the `ablaut_uploads` volume

See `docs/MIGRATION.md` for copy-paste backup and restore commands.
