-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 004_hero.sql: CMS Heroes
-- ============================================================================

create table if not exists heroes (
  id uuid primary key default gen_random_uuid(),
  heading text not null,
  subtitle text,
  description text,
  button_text text,
  button_url text,
  hero_image_url text,
  background_image_url text,
  is_enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_heroes_display_order on heroes (display_order);
create index if not exists idx_heroes_is_enabled on heroes (is_enabled);

drop trigger if exists trg_heroes_updated_at on heroes;
create trigger trg_heroes_updated_at before update on heroes
  for each row execute function set_updated_at();
