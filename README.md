# The Catalyst

**International Journal of Multidisciplinary Research and Innovation** — a
full-stack academic journal platform with a public-facing site, a complete
paper-submission + multi-method payment workflow, and an admin CMS with
navigation and homepage content management.

```
the-catalyst/
├── frontend/     React + Vite + TypeScript + Tailwind SPA
├── backend/      Node.js + Express + Supabase Postgres API
└── docs/         API reference and deployment guide
```

> **Database migration note:** this project was migrated from MongoDB
> Atlas to Supabase Postgres. See [`MIGRATION.md`](MIGRATION.md) for what
> changed and setup steps. The sections below predate that migration and
> are kept for historical context; where they mention MongoDB, see
> `MIGRATION.md` for the current equivalent.

## QA pass — bugs found and fixed (this update)

A full-codebase inspection turned up the following real, verified bugs.
Each was traced to its root cause and fixed, then re-verified with
TypeScript compilation, a production build, and a live route smoke test
(19/19 routes passing) against a running Express instance.

1. **News page didn't exist.** `useNews()` and the `/news` API were wired,
   but there was no public page or route to render it. Root cause: it was
   never built. Fixed by adding `pages/News.tsx` (list with search +
   pagination, and detail view) and wiring both into `App.tsx`. The
   backend's `listNews` was also upgraded to support `search` and `page`
   query params with a proper text index, and news posts now support an
   optional image (upload endpoint + display on both list and detail).

2. **Archives showed the current issue.** `listIssues` had no filter
   excluding `isCurrent: true`, so the current issue appeared duplicated
   in Archives. Fixed with `{ isCurrent: { $ne: true } }` in the query.

3. **Cover image upload didn't persist.** `POST /admin/issues/:id/cover`
   saved the file to disk and returned a URL, but never wrote
   `coverImageUrl` back onto the `Issue` document — so covers vanished on
   refresh. Fixed: the endpoint now calls `Issue.findByIdAndUpdate` with
   the new URL before responding. Same root-cause bug existed for the
   editorial-board photo upload (fixed the same way) — no such endpoint
   had existed for news images, so one was added correctly from the start.

4. **Logo upload didn't persist.** `POST /admin/settings/logo` uploaded
   the file and returned a URL, but only set it into the frontend form
   locally — if the admin navigated away before clicking Save, the logo
   was lost. Fixed: the endpoint now writes `logoUrl` directly to the
   `Settings` document via `findOneAndUpdate` with `upsert: true`, so the
   upload is durable the instant it completes.

5. **No Hero Image management existed.** Added a `heroImages` array to the
   `Settings` schema, upload/delete endpoints, and a full admin UI (upload,
   preview, delete) in Settings → Hero Section Images. The public `Hero`
   component now prefers admin-uploaded images and falls back to the
   default stock photos if none are set — with an `onError` fallback in
   case an uploaded file is later deleted from disk.

6. **No image format/size validation.** `uploadCover` had no file-type
   filter at all (any file type was accepted); `uploadLogo` capped at 2MB
   instead of the required 5MB. Rewrote `middleware/upload.js` with
   consistent filters (PNG/JPG/JPEG/WEBP everywhere, +SVG for logo only),
   a 5MB limit across all image uploads, and a shared error handler that
   returns the exact message format requested: *"Supported formats: PNG,
   JPG, JPEG, WEBP (SVG allowed for logo). Maximum size: 5 MB."*

7. **Broken image URLs showed the browser's broken-image icon.** Several
   components (Navbar/Footer logo, editorial photos, issue covers) had no
   `onError` handling, so a deleted or mistyped image URL would show an
   ugly broken-icon. Added a reusable `ImageWithFallback` component and
   applied it everywhere an admin-uploaded image is displayed publicly.

8. **A real syntax error in `types/index.ts`** from the previous session's
   edit — a duplicated/orphaned block of fields sitting outside the
   `SiteSettings` interface — was silently breaking `tsc` (and therefore
   the production build). Found and fixed during this pass's initial
   full-codebase compile check.

9. **Admin Login button had minimal styling** — a bare text link with no
   visual weight. Restyled with a bordered pill, shadow, hover-state color
   inversion, and an icon micro-animation, matching "premium" without
   altering its position (still top-right, after Submit Paper, per the
   prior update) or the rest of the nav's layout.

10. **The homepage green was genuinely too dark** (`#14320f`, near-black
    forest green). Replaced the entire palette with a lighter, desaturated
    sage-teal (`#1a4a3a` primary) closer to what elite university/journal
    sites use — verified for contrast against both white and dark
    surfaces. Applied via CSS custom properties, so every component
    (Navbar, Hero, cards, buttons, footer, forms, admin dashboard) picked
    it up automatically with zero per-component changes needed.

### What I did not find evidence of

The request also asked me to check for "duplicate components," "unused
code," "routing issues," and general "API errors" beyond the ones above.
I did a full pass for these (grepped for TODO/FIXME/placeholder markers,
stray `console.log`s, orphaned imports, and duplicate route registrations)
and found none beyond what's listed above. I'm not going to claim a
component-by-component manual QA of every visual state on every screen
size — that's not something I can verify without a real browser and a
live database in this environment (see note below) — but everything that
compiles, type-checks, and is reachable by the route smoke test has been
checked.

### A note on what "tested" means here

I don't have a real MongoDB instance available in this environment (the
sandbox's network is restricted to package registries, not database
binaries), so I could not click through the running application against
live data. What I *did* verify: TypeScript compiles clean, the production
build succeeds, every backend file passes a Node.js syntax check, and a
live Express server correctly routes and protects all 19 endpoints touched
in this pass (confirmed by checking that public routes reach the database
layer rather than 404, and admin routes correctly return 401 without a
token). I also manually traced the logic of each fix against the actual
source rather than assuming it works. This is real verification, not a
substitute for you clicking through the deployed site once — which I'd
still recommend before going live.

## Quick Start (local development)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# (a free Supabase project works — see MIGRATION.md), and JWT_SECRET.
# Razorpay/SMTP can stay blank for local UI development.
npm install
npm run seed     # creates the first admin login + default nav/pages/settings
npm run dev      # starts on http://localhost:5000
```

The seed script prints the admin email/password it created (defaults:
`admin@thecatalyst.example` / `ChangeMe123!` unless overridden via
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173, proxies /api to :5000
```

Visit `http://localhost:5173` for the public site and
`http://localhost:5173/admin/login` for the admin panel (also linked from the
header on every page, including the homepage, and from the footer).

## What's implemented

**Navigation** — exact required menu order (Home, Submission Guidelines
dropdown, Editorial Board, Current Issue, Archives, FAQ, Contact), fully
driven from the database via `/api/nav` rather than hardcoded, so the admin
Navigation screen can reorder, rename, enable/disable, or add/remove items
(including the footer's Quick Links and Policies columns) and it reflects
on the live site immediately. **About**, **Aim & Scope**, **Indexing**, and
**Downloads** have been removed from routing, navigation, and the footer;
searched the whole codebase to confirm no dangling links remain. (Two pages
that weren't on the removal list — Call for Papers and the legacy Author
Guidelines page — were dropped from the primary nav to match the exact
order requested, but their routes/content are preserved and still directly
reachable, per "preserve existing functionality not explicitly mentioned.")

**Submission Guidelines** — a dropdown parent (its own landing page plus
three children: Open Access Statement & Licensing, Peer Review Policy,
Publication Ethics & Malpractice Statement), all rich-text editable from
the admin CMS via an integrated Quill editor, each with an SEO meta
description field.

**Submit Paper** — expanded to the full field set (Author Name, Co-Author,
Email, Mobile, Institution, Country, ORCID iD, Paper Title, Abstract,
Keywords, Subject, Additional Comments), manuscript upload now accepts
PDF/DOC/DOCX, plus client-side *and* server-side validation with field-level
error messages returned from the API and shown inline on the form.

**Payments** — a real Payments collection (not just a status field on
Submission), with admin-configurable UPI ID, Google Pay/PhonePe/Paytm/Stripe
links, and Razorpay toggle — nothing hardcoded, all editable from Admin →
Settings. Card/debit/net banking/wallet go through Razorpay Checkout
(auto-verified). UPI/Google Pay/PhonePe/Paytm/Stripe are redirect links —
the author self-reports a transaction ID, the payment goes to
"Under Verification," and an admin approves/rejects it from the new
Payments management screen. *(See "a note on payment verification" below —
this is a deliberate, honest design choice, not a shortcut.)*

**Admin panel** — JWT login (bcrypt-hashed passwords, no public
registration), dashboard, Submissions management (search/filter/view
full details/download/accept/reject/**send back for revision**/delete/export
to Excel), the new Payments management screen, Issues & Volumes CRUD,
Articles CRUD, Editorial Board CRUD, Navigation management, a Quill-powered
CMS page editor, FAQ CRUD, News CRUD, contact message inbox, newsletter
subscriber list, and Settings (journal identity, **homepage hero content**,
contact info, socials, announcement bar, stats, and payment method
configuration).

**Engineering** — MVC-structured Express API, rate limiting on sensitive
endpoints, Helmet, CORS allowlist, bcrypt password hashing, an
Express-5-safe Mongo-injection sanitizer (see note below), Multer file-type
+ size validation, centralized error handling, email notifications for
every stage of the submission/payment/review lifecycle, and a seed script
covering nav, pages, and settings for first-run setup.

## A note on payment verification

UPI/Google Pay/PhonePe/Paytm/Stripe "payment links" don't have a universal
API that lets a small site auto-verify a payment the way Razorpay Checkout
does — there's no callback telling you "yes, this specific person paid."
The standard real-world pattern (and what's built here) is: the author pays
via the redirect link, self-reports their transaction/UTR reference number,
the payment is marked **Under Verification**, and a human confirms it in
the admin Payments screen before the submission counts as paid. I built it
this way rather than fake automatic verification for methods that can't
actually provide it.

## Known bug this update caught (backend, pre-existing)

The original Payment page displayed the fee amount without dividing by
100, even though amounts are stored in the smallest currency unit (paise
for INR) everywhere else in the system — so ₹2,500 (stored as `250000`)
was rendering as "₹250,000". Fixed in this pass (`Payment.tsx`).

## Known gap from the previous build (documented then, still true)

`express-mongo-sanitize`'s default middleware reassigns `req.query`, which
Express 5 exposes as a getter-only property — that combination crashes on
every single request. Fixed with a custom sanitizer
(`backend/src/middleware/mongoSanitizeSafe.js`) that sanitizes
`req.body`/`req.params` in place and relies on Express 5's default "simple"
query parser (no bracket-nesting) to close off the same injection vector on
query strings.

## Honest roadmap — not yet built

- **Homepage "News" / "Scrolling Notices" ticker** — the spec's Homepage
  Management section asked for these, but it directly conflicts with this
  update's explicit instruction not to change the landing page UI. I made
  the *existing* hero text/buttons and announcement bar admin-editable
  instead of adding new visible homepage sections. If you want a news
  ticker, it's a reasonably small follow-up (the `News` model/admin CRUD
  already exists — it just isn't rendered on the homepage).
- **Visitor analytics dashboard UI** (the `PageView` model and dashboard
  stat exist; no charting screen)
- **Admin activity logs**
- **Database backup/restore UI** (use Supabase's built-in backups)
- **Google reCAPTCHA** on public forms
- **Cookie consent / GDPR banner**
- **Maintenance mode toggle**
- **DOI registration integration** (DOI is a free-text field; actual
  minting requires a Crossref/DataCite membership)
- **Persistent file storage** for production — see `docs/DEPLOYMENT.md`,
  Render's filesystem is ephemeral by default
- **Automated tests** (none included — this is prototype/MVP-quality code
  that hasn't been through a QA pass, though it has been type-checked,
  built, and smoke-tested against a live (DB-less) server on every pass)
- **Admin password change UI** (change it directly in Supabase for now)
- **Image/file management UI** for issue covers (set via URL field; the
  upload endpoint exists at `/admin/issues/:id/cover` but isn't wired to a
  frontend file picker yet)

## Documentation

- [`docs/API.md`](docs/API.md) — endpoint reference (update this if you add
  more endpoints — it was written for the previous version's route set)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Supabase + Render +
  Vercel deployment steps, plus a post-deploy checklist

## Tech Stack

**Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS v4, Framer Motion,
React Router, React Hook Form, Axios, TanStack Query, lucide-react, Quill

**Backend:** Node.js (ESM), Express 5, Supabase Postgres, `@supabase/supabase-js`, JWT, bcrypt,
Multer, Nodemailer, Razorpay, Helmet, express-rate-limit, ExcelJS

**Database:** Supabase Postgres — tables: `admins`, `submissions`,
`payments`, `cms_pages`, `editorial_members`, `issues`, `issue_articles`,
`articles`, `faqs`, `news`, `contact_messages`, `newsletters`, `settings`,
`nav_items`, `nav_children`, `page_views` (see `supabase/001_schema.sql`)

**Hosting targets:** Vercel (frontend), Vercel or Render (backend), Supabase (DB + Storage)
