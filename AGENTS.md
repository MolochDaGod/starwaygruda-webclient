# Grudge Studio — System Reference (AGENTS.md)

## Single Backend — Always Use These

### Auth (ALL apps must use)
Primary gateway: `https://auth-gateway-otb8qmmyd-grudgenexus.vercel.app`
- Redirect with `?return=<app_url>` — redirects back after login
- localStorage keys: `grudge_auth_token` (JWT), `grudge_user_id`, `grudge_id`, `grudge_username`

VPS Auth: `https://id.grudge-studio.com`
Client utility: `grudge-auth.js` (in this repo)

### VPS Services
- Auth: `https://id.grudge-studio.com`
- Game API: `https://api.grudge-studio.com`
- Accounts: `https://account.grudge-studio.com`
- Assets: `https://assets-api.grudge-studio.com`
- WebSocket: `https://ws.grudge-studio.com`

### Grudge UUID
`PREFIX-YYYYMMDDHHMMSS-XXXXXX-YYYYYYYY` — never use uuidv4()

### CDN
`https://assets.grudge-studio.com` → `{CDN}/{category}/{GRUDGE-UUID}.{ext}`
Fallback: `https://molochdagod.github.io/ObjectStore`

### Do NOT: create new auth, use uuidv4(), hardcode asset URLs, use Replit
