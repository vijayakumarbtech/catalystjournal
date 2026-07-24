-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 007_submission_guidelines.sql: Submission Guidelines Document Management System
-- ============================================================================

create table if not exists submission_guideline_documents (
  id uuid primary key default gen_random_uuid(),
  document_name text not null,
  file_type text not null,
  file_url text not null,
  extracted_html text,
  is_active boolean not null default false,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_submission_guideline_documents_updated_at on submission_guideline_documents;
create trigger trg_submission_guideline_documents_updated_at before update on submission_guideline_documents
  for each row execute function set_updated_at();

-- Set RLS for submission guideline documents
alter table submission_guideline_documents enable row level security;

drop policy if exists "submission_guideline_documents public read" on submission_guideline_documents;
create policy "submission_guideline_documents public read" on submission_guideline_documents
  for select using (true);

drop policy if exists "submission_guideline_documents admin all" on submission_guideline_documents;
create policy "submission_guideline_documents admin all" on submission_guideline_documents
  for all using (
    (select role from admins where id = auth.uid()) in ('super-admin', 'editor')
  );
