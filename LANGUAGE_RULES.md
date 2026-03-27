# StarWayGRUDA-WebClient — Language Rules & Coding Conventions

---

## 1. Auth — Single Token

`grudge_auth_token` in `localStorage` is the canonical JWT.
Identity provider: `https://id.grudge-studio.com`

The old `auth-gateway-otb8qmmyd-grudgenexus.vercel.app` deployment is **retired**.
`GATEWAY_URL` in `src/utils/grudgeGateway.js` now points to `id.grudge-studio.com`.

| Key | Purpose |
|---|---|
| `grudge_auth_token` | Bearer JWT |
| `grudge_id` | Grudge ID |
| `grudge_username` | Display name |
| `grudge_user_id` | Numeric account ID |

All auth helpers in `src/utils/grudgeGateway.js`:
- `getGatewayToken()` — read token
- `getGatewayUser()` — read user object
- `redirectToGateway(url)` — redirect to `id.grudge-studio.com/auth/sso-check?return=...`
- `gatewaySignOut()` — server-side logout + clears all keys
- `checkGatewayOnBoot()` — captures SSO return token from URL, returns user or null

All game API calls in `src/api/APIClient.js` use `grudge_auth_token` as Bearer.

**Never write `grudge_session_token`.** Never pass tokens in navigation URLs.

---

## 2. API Client

`src/api/APIClient.js` is the single source for all backend calls.
- Auth: calls `id.grudge-studio.com` directly
- Game data: calls `api.grudge-studio.com`
- Offline fallbacks built in (`data.offline` flag)

---

## 3. JavaScript

- Frontend: JavaScript (`.jsx`, `.js`) — not TypeScript
- Backend: `server/` directory
- No class instantiation patterns in new code — prefer functional

---

## 4. Git

- Branch: `main` is production
- Commit prefixes: `feat:`, `fix:`, `security:`, `docs:`, `chore:`
- Never commit `.env`
