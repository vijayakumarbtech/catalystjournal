-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 005_editorial_board.sql: Editorial board schema updates
--
-- Changes:
--   1. Drop NOT NULL constraints on name, qualification, university,
--      country, designation so all fields become optional.
--   2. Add 'managing-director' to the role CHECK constraint.
-- ============================================================================

-- 1. Make previously-required text columns optional.
alter table editorial_members
  alter column name        drop not null,
  alter column qualification drop not null,
  alter column university  drop not null,
  alter column country     drop not null,
  alter column designation drop not null;

-- 2. Extend the role enum to include 'managing-director'.
--    Postgres does not support adding a value to a CHECK constraint
--    in-place, so we drop the old constraint and recreate it.
alter table editorial_members
  drop constraint if exists editorial_members_role_check;

alter table editorial_members
  add constraint editorial_members_role_check
  check (role in (
    'editor-in-chief',
    'associate-editor',
    'editorial-board',
    'reviewer',
    'managing-director'
  ));

-- Make role itself optional too (consistent with "all fields optional").
alter table editorial_members
  alter column role drop not null;
