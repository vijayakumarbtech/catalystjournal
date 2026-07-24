-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 006_call_for_papers.sql: Call for Papers CMS
-- ============================================================================

create table if not exists call_for_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  scope text,
  topics text[] not null default '{}',
  submission_deadline text,
  acceptance_date text,
  publication_date text,
  instructions text,
  poster_url text,
  pdf_url text,
  brochure_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- We don't add a unique partial index for is_active=true because the
-- controller handles deactivating others. However, we could.

drop trigger if exists trg_call_for_papers_updated_at on call_for_papers;
create trigger trg_call_for_papers_updated_at before update on call_for_papers
  for each row execute function set_updated_at();
