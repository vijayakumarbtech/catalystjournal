-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 014_article_publication.sql
-- Add subtitle, thumbnail, and publication_date to articles table.
-- ============================================================================

alter table articles
  add column if not exists subtitle text,
  add column if not exists thumbnail text,
  add column if not exists publication_date date;

-- Add index on publication_date
create index if not exists idx_articles_publication_date on articles (publication_date desc);
