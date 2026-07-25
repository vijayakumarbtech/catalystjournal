-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 013_form_fields.sql
-- Add submission form fields CMS and custom fields to submissions table.
-- ============================================================================

create table if not exists form_fields (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  type text not null,
  placeholder text default '',
  help_text text default '',
  is_required boolean not null default false,
  is_system boolean not null default false,
  is_enabled boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  conditional_logic jsonb,
  width text not null default 'full' check (width in ('half', 'full')),
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_form_fields_order on form_fields ("order");
create index if not exists idx_form_fields_is_enabled on form_fields (is_enabled);

create or replace trigger trg_form_fields_updated_at 
  before update on form_fields
  for each row execute function set_updated_at();

-- Add custom_fields column to submissions
alter table submissions add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- Seed the initial system fields based on the existing hardcoded form.
insert into form_fields (name, label, type, is_required, is_system, width, "order", options, validation) values
  ('authorName', 'Author Name', 'text', true, true, 'half', 10, '[]'::jsonb, '{}'::jsonb),
  ('coAuthors', 'Co-Author(s)', 'text', false, true, 'half', 20, '[]'::jsonb, '{}'::jsonb),
  ('email', 'Email Address', 'email', true, true, 'half', 30, '[]'::jsonb, '{}'::jsonb),
  ('phone', 'Mobile Number', 'phone', true, true, 'half', 40, '[]'::jsonb, '{}'::jsonb),
  ('institution', 'Institution / Organization', 'text', true, true, 'half', 50, '[]'::jsonb, '{}'::jsonb),
  ('department', 'Department', 'text', false, true, 'half', 60, '[]'::jsonb, '{}'::jsonb),
  ('country', 'Country', 'text', true, true, 'half', 70, '[]'::jsonb, '{}'::jsonb),
  ('orcid', 'ORCID iD', 'text', false, true, 'half', 80, '[]'::jsonb, '{}'::jsonb),
  ('subject', 'Subject Area', 'select', true, true, 'full', 90, 
    '["Computer Science & Engineering", "Artificial Intelligence & Machine Learning", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Biomedical Sciences", "Management & Commerce", "Social Sciences & Humanities", "Environmental Sciences", "Other"]'::jsonb, 
    '{}'::jsonb),
  ('paperTitle', 'Paper Title', 'text', true, true, 'full', 100, '[]'::jsonb, '{}'::jsonb),
  ('abstract', 'Abstract', 'textarea', true, true, 'full', 110, '[]'::jsonb, '{}'::jsonb),
  ('keywords', 'Keywords', 'text', true, true, 'full', 120, '[]'::jsonb, '{}'::jsonb),
  ('message', 'Additional Comments', 'textarea', false, true, 'full', 130, '[]'::jsonb, '{}'::jsonb),
  ('manuscript', 'Upload Manuscript (PDF/DOC/DOCX)', 'file_upload', true, true, 'full', 140, '[]'::jsonb, '{"allowedTypes": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], "maxSize": 15}'::jsonb),
  ('copyrightForm', 'Upload Copyright Form (optional at this stage)', 'file_upload', false, true, 'full', 150, '[]'::jsonb, '{"allowedTypes": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], "maxSize": 15}'::jsonb)
on conflict (name) do update set 
  label = excluded.label,
  type = excluded.type,
  is_required = excluded.is_required,
  is_system = excluded.is_system,
  width = excluded.width,
  "order" = excluded."order",
  options = excluded.options,
  validation = excluded.validation;
