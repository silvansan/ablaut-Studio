# Portainer Deployment

This app is Portainer-friendly because it uses one Compose stack and named Docker volumes.

## Stack Install

1. In Portainer, open **Stacks**.
2. Create a new stack named `ablaut-studio`.
3. Paste the contents of `docker-compose.yml`.
4. Add environment variables from `.env.example` in the Portainer environment editor.
5. Change all production secrets:
   - `PAYLOAD_SECRET`
   - `PAYLOAD_DB_PUSH`
   - `POSTGRES_PASSWORD`
   - `INITIAL_SUPER_ADMIN_PASSWORD`
   - SMTP credentials
   - `LIVEKIT_API_SECRET`
6. Deploy the stack.

For rollback-friendly deploys, use `PORTAINER_STACK_PINNED.yml`. It pins the app source to a Git tag such as `ablaut-v0.2.0`; rollback is changing that tag back and redeploying while keeping the same stack name and volumes.

## Required Volumes

Portainer should create these named volumes:

- `ablaut_db`
- `ablaut_uploads`

Do not delete these volumes during redeploys.

## Included LiveKit

The stack includes a `livekit` service, so no separate LiveKit server is required.

Expose these ports or proxy them as needed:

- `7880/tcp`: LiveKit HTTP/WebSocket API
- `7881/tcp`: RTC over TCP
- `50000-50100/udp`: RTC UDP media range

For production, set:

```env
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=long-random-secret
LIVEKIT_URL=wss://livekit.example.com
```

`LIVEKIT_URL` must be reachable by the browser because speaker and listener pages connect directly to LiveKit.

## Database Schema

Use migration-first production settings:

```env
PAYLOAD_DB_PUSH=false
PAYLOAD_RUN_MIGRATIONS=true
PAYLOAD_WAIT_FOR_DB=true
```

Production Docker runs registered Payload migrations on startup. Schema push is for local development only.

## Safe Update

1. Back up the database.
2. Back up uploads if media changed.
3. Edit the stack or point it at the new image/source.
4. Redeploy the stack.
5. Confirm users, events, channels, uploads, and settings are still present.

## Backup Database From Portainer Host

Use the Portainer console for the `db` container:

```bash
pg_dump -U ablaut ablaut > /tmp/ablaut-backup.sql
```

Then copy the file from the container or run the backup from the Docker host with `docker compose exec`.

## Restore Database

1. Stop the `app` container.
2. Restore into the `db` container:

```bash
psql -U ablaut ablaut < /tmp/ablaut-backup.sql
```

3. Start the `app` container again.

## Uploads

Uploaded media is stored in the `ablaut_uploads` volume and mounted at `/app/media`.

Back up that volume before destructive maintenance or host migration.

## HTTPS

Use a reverse proxy or tunnel in front of the app. Set both URLs to the public HTTPS origin:

```env
NEXT_PUBLIC_APP_URL=https://ablaut.example.com
PUBLIC_BASE_URL=https://ablaut.example.com
```

## LAN And QR Links

QR codes use the host name/IP used to open the app.

- For local Docker Desktop testing, open the app from another-device-safe LAN URL such as `http://192.168.1.50:3000`, not `http://localhost:3000`.
- In cloud, open the app through the public domain. QR codes will use that public domain.
- If using a reverse proxy, forward `Host` and `X-Forwarded-Proto`.
- For OpenResty/Nginx in front of Next.js, disable response buffering on the app upstream so React Server Component (`?_rsc=`) streams do not fail with HTTP/2 protocol errors:

```nginx
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Connection "";
proxy_buffering off;
proxy_request_buffering off;
chunked_transfer_encoding on;
```

## Auth Rate Limits

Configure the reverse proxy in front of Portainer stacks to rate-limit Payload auth endpoints:

- `POST /api/users/login`: 5 requests per minute per IP, burst 10
- `POST /api/users/forgot-password`: 3 requests per 10 minutes per IP, burst 5
- `POST /api/users/reset-password`: 5 requests per 10 minutes per IP, burst 5

Return `429 Too Many Requests` when limits are exceeded.

## Maildev

Maildev is optional and disabled unless the `mail` profile is used. It is for local/staging email testing, not production email delivery.
