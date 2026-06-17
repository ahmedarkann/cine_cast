# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (root)
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # Production build to dist/
npm run lint         # ESLint (quiet mode — errors only)
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # TypeScript check via jsconfig.json

# Backend (backend/)
npm --prefix backend run dev   # Start Express server on http://localhost:5001
# OR from within backend/:
npm run dev
```

Both servers must run concurrently for local development. There is no single command that starts both. Vite proxies `/api` and `/uploads` to `http://localhost:5001` in dev, so the frontend never hits the backend directly by origin.

There are no tests.

## Architecture

### Monorepo structure

- **`/`** — React 18 + Vite frontend (JSX, not TSX; `jsconfig.json` drives type-checking)
- **`/backend/`** — Standalone Express app using ESM (`"type": "module"`); entry point is `index.js` (`server.js` is an unused stub)

### Frontend layers

**Routing** (`src/App.jsx`): React Router v6. All pages with chrome live inside `<Layout />` via `<Outlet />`. Auth pages (Login, Register, etc.) render without Layout. `<ProtectedRoute>` gates all `/dashboard`, `/profile`, `/calendar`, and `/admin/*` routes.

**Auth** (`src/lib/AuthContext.jsx`): JWT stored in `localStorage` under the key `cinecast_access_token`. `AuthContext` wraps a TanStack Query `useQuery(['user', 'me'])` to validate the token on load. The `user` object exposed by `useAuth()` is the full DB row (minus sensitive fields). Roles are `"user"` and `"admin"` — admin check is simply `user.role === "admin"`.

**API client** (`src/api/api.js`): Thin `fetch` wrapper. All requests go through `request()`, which attaches `Authorization: Bearer <token>` automatically (skipped for `FormData`). Exports `get`, `post`, `put`, `del`, and `uploadFile`. The base URL is `VITE_API_BASE_URL` env var (empty in dev, so Vite's proxy takes over).

**i18n** (`src/lib/i18n.js`): Custom, no library. Two locales: `sk` (default) and `en`. Language stored in `localStorage` as `cinecast_lang`. Call `t(section, key)` to get a translation string, or use the `useLang()` hook which re-renders on `langchange` events.

**UI components**: shadcn/ui pattern — Radix UI primitives wrapped in `src/components/ui/`. Brand gradient is `linear-gradient(135deg, #ef4136, #fbb040)` used throughout. Dark mode is forced on by default (`defaultTheme="dark"`, `enableSystem={false}`).

**Layout modes**: `Layout.jsx` renders two distinct UIs depending on `user` state:
- **Unauthenticated**: top navbar + footer, black background
- **Authenticated**: collapsible sidebar (`SidebarProvider`) + top bar with `SidebarTrigger`, no footer

### Backend

**`backend/index.js`** — all routes in a single file. Middleware chain: `cors` (allow `http://localhost:5173`), `express.json()`, static `/uploads`. Auth middleware reads `Authorization: Bearer` header and verifies JWT. Admin middleware checks `req.user.role === 'admin'`.

**`jsonRow()` / `jsonRows()`**: normalize Prisma rows before sending to client. Comma-separated DB strings (`skills`, `languages`, `gallery`, `project_gallery`, `required_skills`) are split into arrays. `DateTime` fields become ISO strings or `YYYY-MM-DD` strings depending on the field.

**Prisma**: PostgreSQL via `@prisma/adapter-pg` (driver adapter pattern with a `Pool`). Schema in `backend/schema.prisma`. IDs are `nanoid()` strings, not auto-increment integers. **There are no Prisma relations defined** — all cross-entity lookups (e.g., applications → positions) are done with separate queries in route handlers.

**`backend/server.js`** is a minimal legacy stub (`/api/movies` only). Do not add code there; use `index.js`.

### Key env vars

| Var | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `backend/.env` | JWT signing secret (defaults to `cinecast_local_secret`) |
| `PORT` | `backend/.env` | Backend port (defaults to `5001`) |
| `VITE_API_BASE_URL` | `.env.local` | API origin for prod; leave empty in dev (proxy handles it) |

### Application domain

CineCAST is a Slovak casting agency platform. Core entities: **User** (performer profiles with physical attributes, skills, gallery), **Project** (film/TV/commercial productions with statuses: `draft`, `open`, `closed`, `archived`), **Position** (roles within a project with `spots_total`/`spots_filled`), **Application** (user ↔ position link, statuses: `pending`, `accepted`, `rejected`, `waitlist`). Projects of type `live_casting` have time slot fields (`event_start_time`, `event_end_time`, `slot_duration_minutes`).
