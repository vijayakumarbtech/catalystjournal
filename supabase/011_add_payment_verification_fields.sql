-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 011_add_payment_verification_fields.sql: Add fields for Manual UPI verification
-- ============================================================================

-- Add new columns to the payments table for manual verification
alter table payments
  add column if not exists payer_name text,
  add column if not exists payer_email text,
  add column if not exists payment_date timestamptz,
  add column if not exists screenshot_url text,
  add column if not exists rejection_reason text;
