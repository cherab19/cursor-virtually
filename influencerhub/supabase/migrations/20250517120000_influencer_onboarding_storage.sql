-- Influencer onboarding flag + public avatar storage (per-user folder)

ALTER TABLE public.influencer_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.influencer_profiles.onboarding_completed IS
  'Set true after the creator finishes all onboarding steps in the dashboard.';

UPDATE public.influencer_profiles ip
SET onboarding_completed = true
WHERE ip.onboarding_completed = false
  AND length(trim(ip.bio)) > 0
  AND length(trim(ip.category)) > 0
  AND length(trim(ip.location)) > 0
  AND ip.ad_price_etb IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.social_links sl
    WHERE sl.influencer_id = ip.user_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = ip.user_id
      AND p.avatar_url IS NOT NULL
      AND length(trim(p.avatar_url)) > 0
  );

--------------------------------------------------------------------------------
-- Storage: avatars bucket (public read for directory cards)
--------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

--------------------------------------------------------------------------------
-- Storage policies (first path segment must match auth.uid())
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
DROP POLICY IF EXISTS avatars_insert_own_folder ON storage.objects;
DROP POLICY IF EXISTS avatars_update_own_folder ON storage.objects;
DROP POLICY IF EXISTS avatars_delete_own_folder ON storage.objects;

CREATE POLICY avatars_public_read
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY avatars_insert_own_folder
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND coalesce((storage.foldername(name))[1], '') = auth.uid()::text
  );

CREATE POLICY avatars_update_own_folder
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND coalesce((storage.foldername(name))[1], '') = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND coalesce((storage.foldername(name))[1], '') = auth.uid()::text
  );

CREATE POLICY avatars_delete_own_folder
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND coalesce((storage.foldername(name))[1], '') = auth.uid()::text
  );
