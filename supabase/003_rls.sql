-- ============================================================================
-- The Catalyst — Row Level Security policies
-- Run after 001_schema.sql and 002_storage.sql.
--
-- IMPORTANT — how auth works in this app:
-- The backend does NOT use Supabase Auth. Admin login is the app's own JWT
-- flow (backend/src/controllers/authController.js, unchanged by this
-- migration). The Express backend talks to Postgres using the Supabase
-- SERVICE ROLE KEY, which bypasses RLS entirely — this is what makes all
-- existing admin CRUD keep working with zero controller changes.
--
-- RLS below exists as defense-in-depth for the PUBLIC (anon) key only, in
-- case it is ever exposed to the browser: it allows read-only access to
-- published, public-facing content, and denies all writes. The frontend
-- currently never talks to Supabase directly — all requests go through the
-- Express API — so this is a safety net, not something the frontend depends
-- on today.
-- ============================================================================

-- ── enable RLS on every table ───────────────────────────────────────────────
alter table admins             enable row level security;
alter table articles           enable row level security;
alter table issues             enable row level security;
alter table issue_articles     enable row level security;
alter table editorial_members  enable row level security;
alter table faqs               enable row level security;
alter table news               enable row level security;
alter table cms_pages          enable row level security;
alter table contact_messages   enable row level security;
alter table newsletters        enable row level security;
alter table page_views         enable row level security;
alter table submissions        enable row level security;
alter table payments           enable row level security;
alter table settings           enable row level security;
alter table nav_items          enable row level security;
alter table nav_children       enable row level security;

-- ── admins: never readable/writable by anon or authenticated ──────────────
-- (service role bypasses RLS regardless; no policy needed for the backend)
drop policy if exists "admins no public access" on admins;
create policy "admins no public access" on admins
  for all to anon, authenticated using (false) with check (false);

-- ── articles: public can read published articles only ─────────────────────
drop policy if exists "articles public read" on articles;
create policy "articles public read" on articles
  for select to anon, authenticated
  using (status = 'published');

-- ── issues: public can read all (archive + current listing needs this) ────
drop policy if exists "issues public read" on issues;
create policy "issues public read" on issues
  for select to anon, authenticated using (true);

drop policy if exists "issue_articles public read" on issue_articles;
create policy "issue_articles public read" on issue_articles
  for select to anon, authenticated using (true);

-- ── editorial_members: public read ──────────────────────────────────────
drop policy if exists "editorial_members public read" on editorial_members;
create policy "editorial_members public read" on editorial_members
  for select to anon, authenticated using (true);

-- ── faqs: public read ───────────────────────────────────────────────────
drop policy if exists "faqs public read" on faqs;
create policy "faqs public read" on faqs
  for select to anon, authenticated using (true);

-- ── news: public read ───────────────────────────────────────────────────
drop policy if exists "news public read" on news;
create policy "news public read" on news
  for select to anon, authenticated using (true);

-- ── cms_pages: public read ──────────────────────────────────────────────
drop policy if exists "cms_pages public read" on cms_pages;
create policy "cms_pages public read" on cms_pages
  for select to anon, authenticated using (true);

-- ── contact_messages: write-only from public (submit form), no public read ─
drop policy if exists "contact_messages public insert" on contact_messages;
create policy "contact_messages public insert" on contact_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "contact_messages no public read" on contact_messages;
create policy "contact_messages no public read" on contact_messages
  for select to anon, authenticated using (false);

-- ── newsletters: write-only from public (subscribe), no public read ────────
drop policy if exists "newsletters public insert" on newsletters;
create policy "newsletters public insert" on newsletters
  for insert to anon, authenticated with check (true);

drop policy if exists "newsletters no public read" on newsletters;
create policy "newsletters no public read" on newsletters
  for select to anon, authenticated using (false);

-- ── page_views: write-only from public (analytics ping), no public read ────
drop policy if exists "page_views public insert" on page_views;
create policy "page_views public insert" on page_views
  for insert to anon, authenticated with check (true);

drop policy if exists "page_views no public read" on page_views;
create policy "page_views no public read" on page_views
  for select to anon, authenticated using (false);

-- ── submissions: write-only from public (submit paper), no public read ─────
-- (authors track status via the tracking ID through a dedicated admin-side
-- lookup today, not a direct table read — matches current behavior)
drop policy if exists "submissions public insert" on submissions;
create policy "submissions public insert" on submissions
  for insert to anon, authenticated with check (true);

drop policy if exists "submissions no public read" on submissions;
create policy "submissions no public read" on submissions
  for select to anon, authenticated using (false);

-- ── payments: no direct public read/write (created via backend only,
--    even the "manual payment" and Razorpay flows are backend-mediated) ────
drop policy if exists "payments no public access" on payments;
create policy "payments no public access" on payments
  for all to anon, authenticated using (false) with check (false);

-- ── settings: public read (site-wide config is public-facing) ──────────────
drop policy if exists "settings public read" on settings;
create policy "settings public read" on settings
  for select to anon, authenticated using (true);

-- ── nav_items / nav_children: public read of enabled items only ────────────
drop policy if exists "nav_items public read" on nav_items;
create policy "nav_items public read" on nav_items
  for select to anon, authenticated
  using (enabled = true);

drop policy if exists "nav_children public read" on nav_children;
create policy "nav_children public read" on nav_children
  for select to anon, authenticated
  using (enabled = true);

-- ============================================================================
-- Storage policies
-- All buckets are public-read (see 002_storage.sql, public = true), so anyone
-- can GET an object's public URL. Writes (upload/update/delete) are reserved
-- for the service role, which the Express backend uses for all admin
-- upload/delete endpoints — matching the original app's "only the server
-- writes files" behavior.
-- ============================================================================

drop policy if exists "public read all buckets" on storage.objects;
create policy "public read all buckets" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('logos', 'hero', 'covers', 'papers', 'gallery', 'news', 'documents', 'avatars'));

drop policy if exists "no public write" on storage.objects;
create policy "no public write" on storage.objects
  for insert to anon, authenticated with check (false);

drop policy if exists "no public update" on storage.objects;
create policy "no public update" on storage.objects
  for update to anon, authenticated using (false);

drop policy if exists "no public delete" on storage.objects;
create policy "no public delete" on storage.objects
  for delete to anon, authenticated using (false);

-- Note: the service_role key used by the backend bypasses RLS entirely
-- (both table RLS and storage.objects RLS), so all existing admin upload/
-- delete/CRUD flows continue to work unchanged.
