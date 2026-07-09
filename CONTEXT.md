# ablaut-studio — user-facing terms

Use these labels in admin UI, share surfaces, and help text. Technical names stay in code and Payload fields.

| User-facing term | Meaning | Avoid in UI |
|------------------|---------|-------------|
| **Listener QR** | QR that opens the public listen page for a channel (or event directory) | “Route cluster”, “listener route” |
| **Speaker / translator QR** | QR that opens the speaker page for publishing audio | “Speaker route”, “publish URL” |
| **One QR for all languages** | Event unified listener QR — one code, listener picks channel after scan | `unifiedListenerQrEnabled` |
| **URL name** | Slug used in `/listen/...` and `/speak/...` paths | “Slug” alone without explanation |
| **Share & print** | Event hub: all QRs, copy links, download PNGs | Scattered icon-only QR buttons |
| **Listen now** | Primary action on public listener page (WebRTC first) | “Connect with WebRTC” as primary |
| **Having trouble?** | Collapsed advanced transport (LL-HLS, reconnect, Safari hints) | Exposing HLS/WebRTC jargon upfront |
| **Share listener QR** | In-app QR on speaker/listener screens encoding `/listen/{event}/{channel}` for phone-to-phone sharing | Speaker URL in share QR |
| **Channel enabled** | Channel can be used when live | `enabled` field name |
| **Listener page** | Public page at `/listen/{event}/{channel}` | `listenerPageEnabled` |
| **Speaker page** | Public page at `/speak/{event}/{channel}` | `speakerPageEnabled` |

## Personas

- **Org manager** — sets up events, channels, passwords, team access before the day.
- **Event-day operator** — prints QRs, tests a listener phone, helps speakers connect; needs fast share actions without hunting icons.

Both personas are first-class for slice 1 share and status flows.
