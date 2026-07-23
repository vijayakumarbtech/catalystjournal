-- ============================================================================
-- The Catalyst — Supabase Storage buckets
-- Run after 001_schema.sql.
--
-- All buckets are public-read (journal content is public by nature — articles,
-- logos, hero images, news images, editorial photos, and manuscripts are all
-- served as public URLs today via /uploads/... on the old Express server).
-- Write access is locked down in 003_rls.sql to the service role only.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('logos',     'logos',     true),
  ('hero',      'hero',      true),
  ('covers',    'covers',    true),
  ('papers',    'papers',    true),
  ('gallery',   'gallery',   true),
  ('news',      'news',      true),
  ('documents', 'documents', true),
  ('avatars',   'avatars',   true)
on conflict (id) do nothing;

-- Bucket usage reference (matches the old backend/uploads/<kind>/ folders):
--   logos      -> Settings.logoUrl, Settings.faviconUrl
--   hero       -> Settings.heroImages[].url
--   covers     -> Issue.coverImageUrl
--   papers     -> Article.pdfUrl
--   gallery    -> News.imageUrl
--   news       -> (reserved; News.imageUrl also accepted here — see storage.js)
--   documents  -> Submission.manuscriptUrl, Submission.copyrightFormUrl
--   avatars    -> EditorialMember.photoUrl
