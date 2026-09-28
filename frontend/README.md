# TicketFlow frontend

React 19, strict TypeScript, Vite, TanStack Query, React Hook Form, Zod.

## Development

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The backend must be available at http://localhost:3000. Vite proxies `/api` to it; set `API_PROXY_TARGET` to override this target.

## Checks

```sh
npm run build
npm run lint
npm test
```

Run the complete application with Docker Compose from the repository root. See the [main README](../README.md) for setup, demo accounts, role rules and API details.

## Structure

- `src/api.ts`: HTTP client, bearer tokens, API errors and session expiry.
- `src/auth.tsx`: authenticated user and query-cache lifecycle.
- `src/schemas.ts`: Zod form validation.
- `src/pages`: login/register, dashboard, tickets, conversation and user management.
- `src/components`: shared layout and UI primitives.
- `nginx.conf`: SPA route fallback and API reverse proxy for Docker.

JWT is scoped to a browser tab using sessionStorage. Backend policies remain authoritative. No UI-only permission is treated as an authorization boundary.
