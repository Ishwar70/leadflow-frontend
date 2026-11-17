# LeadFlow CRM — Frontend

A multi-tenant sales CRM for growing teams: capture leads, assign ownership, schedule follow-ups, run a drag-and-drop deal pipeline and report on revenue — all inside isolated workspaces with role-based access.

This repository is the **web app** (Next.js). The API lives in [`leadflow-backend`](https://github.com/Ishwar70/leadflow-backend).

## Features

- **Dashboard & reports** — pipeline value, weighted forecast, win/conversion rates, revenue by month, leads by source and a sales leaderboard, all computed from live data.
- **Leads** — filters, sorting, bulk assign/status/archive, duplicate detection, CSV import (column mapping + error report) and export, one-click conversion to contact + company + deal.
- **Deals** — Kanban board with drag-and-drop (won requires a final amount, lost requires a reason), stale-deal indicators, multiple pipelines, stage history.
- **Contacts & companies** — account roll-ups with open pipeline value, related records and a shared activity timeline.
- **Tasks** — today / overdue / upcoming views, priorities, assignees, linked records.
- **Team & settings** — invitations, role changes, deactivate-with-transfer, pipeline stage editor, API keys for website lead capture, audit log.
- **Workspace switching**, global search (`Ctrl + K`), notifications and quick-add everywhere.

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query · React Hook Form + Zod · dnd-kit · Recharts · Radix UI · Sonner.

**Theme — "Midnight Indigo":** deep navy chrome (`#0b1124`), indigo/violet brand accents (`#5b4ae4`), cool slate surfaces and Inter typography.

## How it talks to the API

The browser only ever calls `/api/*` on the frontend's own domain. `next.config.ts` rewrites those requests to `BACKEND_URL`, so the httpOnly session cookie is first-party (no third-party-cookie or CORS issues). `src/proxy.ts` redirects signed-out visitors away from app routes.

## Getting started

```bash
npm install
cp .env.example .env.local   # set BACKEND_URL (default http://localhost:4000)
npm run dev                  # http://localhost:3000
```

Run the backend alongside it (see the backend README). For a zero-setup local API with demo data, run `npm run dev:memory` in `leadflow-backend`.

## Demo accounts

All demo data is fictional. Use the role buttons on the login page, or sign in with any of these (password `Demo@12345`):

| Role | Email |
| --- | --- |
| Owner | owner@demo.leadflow.app |
| Admin | admin@demo.leadflow.app |
| Manager | manager@demo.leadflow.app |
| Sales rep | salesrep@demo.leadflow.app |
| Viewer | viewer@demo.leadflow.app |

## Deploying to Vercel

1. Deploy the backend first and note its URL.
2. Import this repo in Vercel (framework preset: Next.js).
3. Add the environment variable `BACKEND_URL=https://<your-backend>.vercel.app` **before** the first build (rewrites are resolved at build time).
4. Deploy, then add the frontend URL to the backend's `FRONTEND_URL` and redeploy the backend.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
