-- Phase 10: reviews (advertiser/admin only, no self-reviews), one review per reviewer/reviewee pair,
-- directory ranking Elite > Pro > Free, then verified creators, then followers.

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_reviewer_reviewee_unique
  ON public.reviews (reviewer_id, reviewee_id);

DROP POLICY IF EXISTS reviews_insert_as_reviewer ON public.reviews;

CREATE POLICY reviews_insert_as_reviewer
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND reviewee_id <> auth.uid()
    AND (
      public.has_role(auth.uid(), 'advertiser')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.public_list_influencer_reviews(p_reviewee_id uuid)
RETURNS TABLE (
  id uuid,
  rating smallint,
  comment text,
  created_at timestamptz,
  reviewer_label text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    COALESCE(NULLIF(trim(p.full_name), ''), 'Brand partner') AS reviewer_label
  FROM public.reviews r
  LEFT JOIN public.profiles p ON p.user_id = r.reviewer_id
  WHERE r.reviewee_id = p_reviewee_id
  ORDER BY r.created_at DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.public_list_influencer_reviews(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_list_influencer_reviews(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_list_influencer_reviews(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_list_influencer_reviews(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.public_list_influencers(
  p_search text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_min_followers integer DEFAULT NULL,
  p_max_followers integer DEFAULT NULL,
  p_plan text DEFAULT NULL,
  p_limit integer DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  category text,
  location text,
  followers_count integer,
  engagement_rate numeric,
  ad_price_etb numeric,
  subscription_plan text,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ip.user_id,
    p.full_name,
    p.avatar_url,
    ip.bio,
    ip.category,
    ip.location,
    ip.followers_count,
    ip.engagement_rate,
    ip.ad_price_etb,
    ip.subscription_plan,
    ip.is_verified
  FROM public.influencer_profiles ip
  INNER JOIN public.profiles p ON p.user_id = ip.user_id
  WHERE ip.status = 'approved'
    AND (
      p_search IS NULL
      OR trim(p_search) = ''
      OR p.full_name ILIKE '%' || p_search || '%'
      OR ip.bio ILIKE '%' || p_search || '%'
      OR ip.category ILIKE '%' || p_search || '%'
      OR ip.location ILIKE '%' || p_search || '%'
    )
    AND (p_category IS NULL OR trim(p_category) = '' OR ip.category ILIKE '%' || p_category || '%')
    AND (p_location IS NULL OR trim(p_location) = '' OR ip.location ILIKE '%' || p_location || '%')
    AND (p_min_followers IS NULL OR ip.followers_count >= p_min_followers)
    AND (p_max_followers IS NULL OR ip.followers_count <= p_max_followers)
    AND (p_plan IS NULL OR trim(p_plan) = '' OR ip.subscription_plan = p_plan)
    AND (
      p_platform IS NULL
      OR trim(p_platform) = ''
      OR EXISTS (
        SELECT 1
        FROM public.social_links sl
        WHERE sl.influencer_id = ip.user_id
          AND sl.platform ILIKE '%' || p_platform || '%'
      )
    )
  ORDER BY
    CASE ip.subscription_plan
      WHEN 'elite' THEN 0
      WHEN 'pro' THEN 1
      ELSE 2
    END,
    ip.is_verified DESC,
    ip.followers_count DESC NULLS LAST,
    p.full_name ASC
  LIMIT CASE
    WHEN p_limit IS NULL OR p_limit < 1 THEN 500
    WHEN p_limit > 500 THEN 500
    ELSE p_limit
  END;
$$;
