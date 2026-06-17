# CineCAST

A full-stack casting agency platform built for the Slovak film and television industry. CineCAST connects performers — extras, episodic talent, and actors — with productions across film, TV series, commercials, and live casting events.

---

## Overview

CineCAST is a production-ready web application that covers the full casting workflow: talent registers and builds a profile, admins create projects and open positions, talent applies, and admins manage selections through to confirmed shoots. The platform supports both standard project castings and live casting events with time-slot scheduling.

---

## Features

### For Performers
- Register and build a detailed profile — photos, gallery, physical attributes, skills, languages, and experience
- Browse open casting calls filtered by project type
- Apply to positions and track application status (pending, accepted, waitlist, rejected)
- Receive notifications on status changes
- Calendar view of upcoming confirmed shooting dates
- Multilingual interface (Slovak / English)

### For Admins
- Create and manage projects across all types: film, TV series, commercial, documentary, music video, live casting
- Define positions within each project with requirements (age range, gender, skills, compensation, spots available)
- Live casting support: time-slot management for precise event scheduling
- Review applications, accept/reject/waitlist candidates, leave notes
- Manage user profiles and gallery uploads
- Full audit log of admin actions
- Bulk application actions

---

## Tech Stack

### Frontend
- **React 18** + **Vite** (JSX, not TSX)
- **Tailwind CSS** with shadcn/ui component primitives
- **TanStack Query** for server state
- **Framer Motion** for animations
- **React Router v6**
- **next-themes** for dark/light mode
- Custom i18n (Slovak default, English)

### Backend
- **Node.js** + **Express** (ESM, `"type": "module"`)
- **Prisma ORM** with PostgreSQL via `@prisma/adapter-pg`
- **JWT** authentication (stored in `localStorage`)
- **Multer** for file uploads
- **nanoid** for string IDs (no auto-increment integers)

### Database
- **PostgreSQL**

---

## Local Development

Both the frontend and backend must run concurrently. Vite proxies `/api` and `/uploads` to the backend in development, so no CORS configuration is needed locally.

### Prerequisites
- Node.js v18+
- npm
- PostgreSQL database

### 1. Clone the repository

```bash
git clone <repo-url>
cd cinecastApp_react
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cinecast_db"
JWT_SECRET="your_secret_key"
PORT=5001
```

Run Prisma migrations and generate the client:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend:

```bash
npm run dev
# → http://localhost:5001
```

### 3. Frontend setup

```bash
# from the project root
npm install
npm run dev
# → http://localhost:5173
```

For production builds, create `.env.local` in the root and set:

```env
VITE_API_BASE_URL=https://your-backend-url.com
```

Leave it empty in development — Vite's proxy handles it.

---

## Available Scripts

### Frontend (root)
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint (errors only) |
| `npm run lint:fix` | ESLint auto-fix |

### Backend (`backend/`)
| Command | Description |
|---|---|
| `npm run dev` | Start Express server on port 5001 |

---

## Project Structure

```
/                        # React frontend (Vite)
├── src/
│   ├── api/             # Fetch wrapper (request, get, post, put, del, uploadFile)
│   ├── components/      # Shared components and UI primitives
│   ├── hooks/           # useLang, usePageMeta, etc.
│   ├── lib/             # AuthContext, i18n
│   └── pages/           # Route-level page components
├── backend/             # Express API
│   ├── index.js         # All routes (single file)
│   ├── schema.prisma    # Database schema
│   └── uploads/         # Served statically at /uploads
```

---

## Key Env Variables

| Variable | Location | Purpose |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `backend/.env` | JWT signing secret |
| `PORT` | `backend/.env` | Backend port (default: 5001) |
| `VITE_API_BASE_URL` | `.env.local` | API origin for production builds |

---

## License

MIT
