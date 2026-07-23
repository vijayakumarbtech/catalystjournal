# Deployment Guide

This covers deploying The Catalyst to Supabase (database + file storage),
Render or Vercel (backend API), and Vercel (frontend SPA).

> This project was migrated from MongoDB Atlas to Supabase Postgres — see
> [`../MIGRATION.md`](../MIGRATION.md) for what changed. The steps below
> reflect the current Supabase-based setup.

## 1. Supabase

1. Create a free project at https://supabase.com.
2. In **SQL Editor → New query**, run the three files in `supabase/` at the
   repo root, in order: `001_schema.sql`, `002_storage.sql`, `003_rls.sql`.
   All three are safe to re-run.
3. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only —
     never expose this to the frontend)

## 2. Backend on Render (or Vercel)

### Option A — Render (traditional Node server)

1. Push the `backend/` folder to a GitHub repository.
2. In Render, create a **New Web Service**, connect the repo, and set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node version:** 18+ (set via `NODE_VERSION` env var if needed)
3. Add environment variables (copy from `backend/.env.example`):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `CORS_ORIGINS` — set this to your Vercel frontend URL once deployed
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `ADMIN_NOTIFICATION_EMAIL`
4. Deploy. Confirm `https://<your-app>.onrender.com/health` returns
   `{"success":true,"status":"ok"}`.
5. Run the seed script once to create your first admin login. Render's
   dashboard has a **Shell** tab for the running service — run:
   ```
   npm run seed
   ```
   Or set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars first if you
   don't want the defaults.

### Option B — Vercel (serverless)

The backend also includes `backend/api/index.js` and `backend/vercel.json`,
so it can deploy as a Vercel serverless project instead of a traditional
server:

1. Push the `backend/` folder to a GitHub repository (or the same repo as
   the frontend, as a separate Vercel project rooted at `backend/`).
2. In Vercel, **Import Project**, set **Root Directory:** `backend`.
3. Add the same environment variables listed under Option A.
4. Deploy. Confirm `https://<your-app>.vercel.app/health` returns
   `{"success":true,"status":"ok"}`.
5. Run `npm run seed` locally against the production Supabase project (with
   production env vars in `backend/.env`) to create the first admin login,
   since there's no persistent shell in a serverless deployment.

### File storage

Uploaded PDFs and images go directly to Supabase Storage (see
`supabase/002_storage.sql` for the bucket list), not the local filesystem —
this works identically whether the backend runs on Render or as Vercel
serverless functions, and isn't affected by either platform's ephemeral
filesystem.

## 3. Frontend on Vercel

1. Push the `frontend/` folder to the same (or another) GitHub repository.
2. In Vercel, **Import Project**, set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
3. Add environment variable:
   - `VITE_API_URL=https://<your-backend-app>.onrender.com/api` (or your
     Vercel backend URL if using Option B above)
4. Deploy. Once live, copy the Vercel URL back into the backend's
   `CORS_ORIGINS` env var and redeploy the backend so the browser is
   allowed to call it.

### SPA routing on Vercel

Vercel serves Vite SPAs correctly out of the box, but if you see 404s on
direct navigation to nested routes (e.g. `/current-issue`), add a
`vercel.json` in `frontend/`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 4. Razorpay

1. Sign up at https://dashboard.razorpay.com and generate **Test Mode** API
   keys under **Settings → API Keys** to start.
2. Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in Render's environment.
3. Switch to **Live Mode** keys only once you're ready to accept real
   payments — Razorpay requires business KYC verification for live mode.

## 5. Email (Nodemailer / SMTP)

Any SMTP provider works — Gmail (with an App Password), SendGrid, Mailgun,
Amazon SES, etc. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and
`SMTP_FROM` accordingly. If these are left blank, the backend logs a warning
and skips sending email rather than crashing — useful for local development.

## 6. Post-deploy checklist

- [ ] `/health` returns 200 on the deployed backend
- [ ] Admin login works at `https://<frontend>/admin/login`
- [ ] Change the seeded admin password immediately (via the admin panel's
      change-password screen, or directly in Supabase's Table Editor)
- [ ] Submit a test paper end-to-end, including a test-mode Razorpay payment
- [ ] Confirm confirmation emails arrive (check spam folder first)
- [ ] Set real journal settings, editorial board, and at least one issue via
      the admin panel so the public site isn't empty
