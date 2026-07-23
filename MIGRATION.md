# MongoDB → Supabase Postgres Migration

This document covers exactly what changed in this migration and the steps
to get the project running against Supabase.

## What changed

**Only the database and file storage layer.** No UI, routes, API contracts,
JSON response shapes, business logic, validation, or auth flow changed.

| Before | After |
|---|---|
| MongoDB Atlas + Mongoose | Supabase Postgres + `@supabase/supabase-js` |
| `backend/src/config/db.js` | `backend/src/config/supabase.js` |
| `backend/src/models/*.js` (Mongoose schemas) | `backend/src/models/*.js` (same file names, same exported API — now backed by Postgres via `backend/src/lib/queryModel.js`) |
| Local disk storage (`backend/uploads/`, served at `/uploads/...`) | Supabase Storage buckets (public URLs) |
| `err.code === 11000` / `ValidationError` (Mongoose error shapes) | Postgres SQLSTATE codes `23505` / `23514` / `23502`, translated in `middleware/errorHandler.js` to the same JSON responses |

Every controller, route, and frontend file is untouched, with two narrow,
storage-specific exceptions required by "replace every uploaded file with
Supabase Storage":
- `controllers/submissionController.js` — the `fileUrl()` helper now reads
  `file.publicUrl` (an absolute Supabase Storage URL) instead of building a
  `${host}/uploads/...` path from a disk-saved filename.
- `routes/adminRoutes.js` — the five upload endpoints (cover, editorial
  photo, news image, logo, hero image) read `req.file.publicUrl` instead of
  constructing a local `/uploads/...` path.

Both are one-line-per-call-site changes; see the inline comments at each
site for why.

### How the model layer works

`backend/src/lib/queryModel.js` gives every Postgres table a small object
implementing the same method names Mongoose controllers already call:
`find`, `findOne`, `findById`, `create`, `findByIdAndUpdate`,
`findOneAndUpdate`, `findByIdAndDelete`, `countDocuments`, `updateMany`,
chainable `.sort()/.skip()/.limit()/.populate()`, and the Mongo operators
actually used in this codebase (`$ne`, `$lt`, `$gt`, `$gte`, `$in`,
`$regex`, `$text`/`$search`, `$inc`, `$push`, `$pull`). This is why every
controller file needed zero changes — they're calling the exact same API
surface, now backed by Postgres.

A few Mongoose-specific behaviors are reproduced exactly:
- **Slugs** (`Article`, `News`) auto-generate the same way the old
  `pre('validate')` hooks did.
- **`Issue.articles`** (an ordered list of article references) is stored in
  a join table (`issue_articles`, with a `position` column) and
  hydrated back into a full array of Article objects on `.populate('articles')`,
  exactly matching the frontend's `Issue.articles: Article[]` type.
- **`NavItem.children`** (Mongoose embedded sub-documents, each with their
  own `_id`) is stored in a `nav_children` table. `navController.js`'s use
  of `item.children.push()`, `item.children.id(childId)`,
  `child.deleteOne()`, and `item.save()` all keep working unmodified.
- **`Admin.comparePassword()` / password hiding** from JSON responses work
  exactly as before.

## Setup steps

### 1. Create a Supabase project
Create a project at [supabase.com](https://supabase.com) if you don't have
one already.

### 2. Run the SQL migration
In the Supabase dashboard, go to **SQL Editor → New query** and run, in
order:
1. `supabase/001_schema.sql` — all tables, indexes, constraints, triggers
2. `supabase/002_storage.sql` — storage buckets
3. `supabase/003_rls.sql` — Row Level Security policies

All three are safe to re-run (every statement is `IF NOT EXISTS`/`OR
REPLACE`/`ON CONFLICT DO NOTHING`).

### 3. Configure environment variables
Copy `backend/.env.example` to `backend/.env` and fill in:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` —
  from your Supabase project's **Settings → API** page
- `JWT_SECRET` — any long random string (used for admin auth, unrelated to
  Supabase)
- The existing Razorpay/SMTP variables, unchanged from before

The backend uses the **service role key** for all database access (see
`config/supabase.js`) — the app's own JWT-based admin auth handles
authorization at the route layer, exactly like the old Mongoose backend
did. Never expose the service role key to the frontend.

### 4. Install dependencies and seed
```bash
cd backend
npm install
npm run seed   # creates the default admin account + starter content
```

### 5. Re-upload existing files
Local files previously in `backend/uploads/` are **not** automatically
migrated (there's no source to copy them from in this environment). After
going live, re-upload logos, hero images, cover images, editorial photos,
and news images through the admin panel — each upload now goes straight to
the matching Supabase Storage bucket.

### 6. Run it
```bash
npm run dev     # local development
npm start       # production (traditional Node hosting)
```

## Deploying to Vercel

The backend now includes a Vercel serverless entrypoint
(`backend/api/index.js`) and `backend/vercel.json`. Deploy the `backend/`
directory as its own Vercel project, with the same environment variables
as `.env.example`. The frontend deploys the same way it always did (see
`docs/DEPLOYMENT.md`), pointed at whichever backend URL you deploy to.

## What to verify after migration

Every page/flow listed in the original spec should behave identically:
Home, About, News, Submission, Current Issue, Archives, Editorial Board,
FAQ, Contact, Admin Login, Dashboard, Uploads, Downloads, Search, CRUD,
Authentication, Settings, Payment. Since no frontend code changed and the
API contracts are byte-identical, this is primarily about confirming the
Supabase project is configured correctly (SQL ran cleanly, env vars are
set, storage buckets exist).
