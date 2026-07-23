-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- Migrated from MongoDB Atlas / Mongoose.
--
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";        -- ILIKE / partial-text search helper

-- ── updated_at trigger helper (mirrors Mongoose `timestamps: true`) ────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- admins  (was: Admin)
-- ============================================================================
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'super-admin' check (role in ('super-admin', 'editor')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_admins_email on admins (email);

drop trigger if exists trg_admins_updated_at on admins;
create trigger trg_admins_updated_at before update on admins
  for each row execute function set_updated_at();

-- ============================================================================
-- articles  (was: Article)
-- authors[] kept as JSONB array (was an embedded Mongoose sub-schema array,
-- never queried by author fields individually — safe to keep denormalized).
-- ============================================================================
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  authors jsonb not null default '[]'::jsonb, -- [{ name, email, institution, country }]
  abstract text not null,
  keywords text[] not null default '{}',
  subject text not null,
  doi text,
  paper_id text not null unique, -- e.g. TC-2026-0042
  volume integer not null,
  issue integer not null,
  year integer not null,
  pdf_url text not null,
  pages text,
  download_count integer not null default 0,
  view_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz not null default now(),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Full-text search column, replaces Mongoose's { title, abstract, keywords }
  -- text index. Generated + stored so PostgREST's .textSearch('fts', ...)
  -- can query it directly like a normal column.
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(abstract, '') || ' ' || array_to_string(keywords, ' '))
  ) stored
);
create index if not exists idx_articles_slug on articles (slug);
create index if not exists idx_articles_status on articles (status);
create index if not exists idx_articles_published_at on articles (published_at desc);
create index if not exists idx_articles_subject on articles (subject);
create index if not exists idx_articles_volume_issue_year on articles (volume, issue, year);
create index if not exists idx_articles_fts on articles using gin (fts);

drop trigger if exists trg_articles_updated_at on articles;
create trigger trg_articles_updated_at before update on articles
  for each row execute function set_updated_at();

-- ============================================================================
-- issues  (was: Issue)
-- The Mongoose model stored `articles: [ObjectId]` (a manual, ordered list of
-- article references). Represented here via a join table issue_articles that
-- preserves order, plus a helper view/RPC to fetch them populated in order.
-- ============================================================================
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  volume integer not null,
  issue integer not null,
  year integer not null,
  title text,
  description text,
  cover_image_url text,
  is_current boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_issues_volume_issue unique (volume, issue)
);
create index if not exists idx_issues_is_current on issues (is_current);
create index if not exists idx_issues_sort on issues (year desc, volume desc, issue desc);

drop trigger if exists trg_issues_updated_at on issues;
create trigger trg_issues_updated_at before update on issues
  for each row execute function set_updated_at();

create table if not exists issue_articles (
  issue_id uuid not null references issues(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  position integer not null default 0, -- preserves the original array order
  primary key (issue_id, article_id)
);
create index if not exists idx_issue_articles_issue on issue_articles (issue_id, position);

-- ============================================================================
-- editorial_members  (was: EditorialMember)
-- ============================================================================
create table if not exists editorial_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  qualification text not null,
  university text not null,
  country text not null,
  designation text not null,
  role text not null default 'editorial-board'
    check (role in ('editor-in-chief', 'associate-editor', 'editorial-board', 'reviewer')),
  linkedin text,
  email text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_editorial_members_sort on editorial_members (role, "order");

drop trigger if exists trg_editorial_members_updated_at on editorial_members;
create trigger trg_editorial_members_updated_at before update on editorial_members
  for each row execute function set_updated_at();

-- ============================================================================
-- faqs  (was: Faq)
-- ============================================================================
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_faqs_order on faqs ("order");

drop trigger if exists trg_faqs_updated_at on faqs;
create trigger trg_faqs_updated_at before update on faqs
  for each row execute function set_updated_at();

-- ============================================================================
-- news  (was: News)
-- ============================================================================
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null,
  image_url text default '',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);
create index if not exists idx_news_slug on news (slug);
create index if not exists idx_news_published_at on news (published_at desc);
create index if not exists idx_news_fts on news using gin (fts);

drop trigger if exists trg_news_updated_at on news;
create trigger trg_news_updated_at before update on news
  for each row execute function set_updated_at();

-- ============================================================================
-- cms_pages  (was: CmsPage)
-- ============================================================================
create table if not exists cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content_html text default '',
  meta_description text default '' check (char_length(meta_description) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cms_pages_slug on cms_pages (slug);

drop trigger if exists trg_cms_pages_updated_at on cms_pages;
create trigger trg_cms_pages_updated_at before update on cms_pages
  for each row execute function set_updated_at();

-- ============================================================================
-- contact_messages  (was: ContactMessage)
-- ============================================================================
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_contact_messages_created_at on contact_messages (created_at desc);

drop trigger if exists trg_contact_messages_updated_at on contact_messages;
create trigger trg_contact_messages_updated_at before update on contact_messages
  for each row execute function set_updated_at();

-- ============================================================================
-- newsletters  (was: Newsletter)
-- ============================================================================
create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_newsletters_email on newsletters (email);

drop trigger if exists trg_newsletters_updated_at on newsletters;
create trigger trg_newsletters_updated_at before update on newsletters
  for each row execute function set_updated_at();

-- ============================================================================
-- page_views  (was: PageView)
-- ============================================================================
create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  ip text,
  country text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_page_views_created_at on page_views (created_at);

drop trigger if exists trg_page_views_updated_at on page_views;
create trigger trg_page_views_updated_at before update on page_views
  for each row execute function set_updated_at();

-- ============================================================================
-- submissions  (was: Submission)
-- ============================================================================
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null unique, -- e.g. TC-SUB-2026-000123
  author_name text not null,
  co_authors text,
  email text not null,
  phone text not null,
  institution text not null,
  department text,
  country text not null,
  orcid text,
  paper_title text not null,
  abstract text not null,
  keywords text not null,
  subject text not null,
  message text,

  manuscript_url text not null,
  manuscript_file_name text,
  copyright_form_url text,
  copyright_form_file_name text,

  status text not null default 'pending'
    check (status in ('pending', 'under-review', 'accepted', 'rejected', 'revision-requested')),
  revision_note text,

  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'under-verification')),
  order_id text,
  payment_id text,
  amount integer,
  currency text default 'INR',
  paid_at timestamptz,

  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(author_name, '') || ' ' || coalesce(paper_title, '') || ' ' || coalesce(tracking_id, ''))
  ) stored
);
create index if not exists idx_submissions_tracking_id on submissions (tracking_id);
create index if not exists idx_submissions_status on submissions (status);
create index if not exists idx_submissions_payment_status on submissions (payment_status);
create index if not exists idx_submissions_submitted_at on submissions (submitted_at desc);
create index if not exists idx_submissions_fts on submissions using gin (fts);

drop trigger if exists trg_submissions_updated_at on submissions;
create trigger trg_submissions_updated_at before update on submissions
  for each row execute function set_updated_at();

-- ============================================================================
-- payments  (was: Payment)
-- ============================================================================
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  tracking_id text not null, -- denormalized for quick display/search

  method text not null check (method in (
    'razorpay', 'upi', 'googlepay', 'phonepe', 'paytm', 'stripe', 'bank-transfer'
  )),

  transaction_id text,
  order_id text,

  amount integer not null,
  currency text not null default 'INR',

  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'under-verification')),

  author_note text,

  verified_by uuid references admins(id),
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(tracking_id, '') || ' ' || coalesce(transaction_id, ''))
  ) stored
);
create index if not exists idx_payments_submission_id on payments (submission_id);
create index if not exists idx_payments_status on payments (status);
create index if not exists idx_payments_created_at on payments (created_at desc);
create index if not exists idx_payments_fts on payments using gin (fts);

drop trigger if exists trg_payments_updated_at on payments;
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- ============================================================================
-- settings  (was: Settings — singleton document, singletonKey: 'main')
-- Kept as a single-row table with a unique singleton_key, matching the
-- original singleton pattern exactly (getOrCreateSettings() upserts on it).
-- ============================================================================
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null unique default 'main',

  journal_name text not null default 'The Catalyst',
  subtitle text default '',
  tagline text not null default 'International Journal of Multidisciplinary Research and Innovation',
  logo_url text,
  logo_text text,
  favicon_url text,
  issn text,
  frequency text default 'Quarterly',
  language text default 'English',

  footer_copyright_text text default '',

  email text default '',
  phone text default '',
  whatsapp_number text default '',
  address text default '',

  socials jsonb not null default '{}'::jsonb, -- { facebook, twitter, linkedin, instagram }

  announcement_bar jsonb not null default '{"enabled": false, "text": "", "linkUrl": null}'::jsonb,

  stats jsonb not null default '{
    "yearsOfPublication": 0,
    "totalArticles": 0,
    "totalAuthors": 0,
    "countriesReached": 0,
    "totalDownloads": 0
  }'::jsonb,

  publication_fee_amount integer not null default 250000,
  publication_fee_currency text not null default 'INR',

  hero jsonb not null default '{
    "title": "", "subtitle": "", "eyebrow": "",
    "primaryButtonText": "", "primaryButtonUrl": "",
    "secondaryButtonText": "", "secondaryButtonUrl": ""
  }'::jsonb,

  payment_methods jsonb not null default '{
    "upiId": "", "googlePayLink": "", "phonePeLink": "", "paytmLink": "", "stripeLink": "",
    "razorpayEnabled": true,
    "bankDetails": { "accountName": "", "accountNumber": "", "ifscCode": "", "bankName": "" }
  }'::jsonb,

  hero_images jsonb not null default '[]'::jsonb, -- [{ url, alt, createdAt, _id }]

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_settings_singleton_key on settings (singleton_key);

drop trigger if exists trg_settings_updated_at on settings;
create trigger trg_settings_updated_at before update on settings
  for each row execute function set_updated_at();

-- ============================================================================
-- nav_items + nav_children  (was: NavItem, with embedded `children` sub-docs)
-- Mongoose sub-documents each have their own _id, which the frontend types
-- (NavChild._id) rely on — represented as a proper child table with its own
-- UUID primary key.
-- ============================================================================
create table if not exists nav_items (
  id uuid primary key default gen_random_uuid(),
  location text not null check (location in ('header', 'footer-quick', 'footer-policies')),
  label text not null,
  path text,
  "order" integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_nav_items_location on nav_items (location);
create index if not exists idx_nav_items_sort on nav_items (location, "order");

drop trigger if exists trg_nav_items_updated_at on nav_items;
create trigger trg_nav_items_updated_at before update on nav_items
  for each row execute function set_updated_at();

create table if not exists nav_children (
  id uuid primary key default gen_random_uuid(),
  nav_item_id uuid not null references nav_items(id) on delete cascade,
  label text not null,
  path text not null,
  "order" integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_nav_children_nav_item on nav_children (nav_item_id, "order");

drop trigger if exists trg_nav_children_updated_at on nav_children;
create trigger trg_nav_children_updated_at before update on nav_children
  for each row execute function set_updated_at();

-- ============================================================================
-- Done. Next: run 002_storage.sql, then 003_rls.sql.
-- ============================================================================
