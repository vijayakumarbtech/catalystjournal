-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 010_drop_submission_guidelines.sql: Remove Submission Guidelines DMS table
-- ============================================================================

-- Drop the table entirely as we are switching back to Rich Text CMS stored in cms_pages
drop table if exists submission_guideline_documents cascade;
