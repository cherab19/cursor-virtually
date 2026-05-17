-- Public read paths for marketing / directory (no direct profiles access for anon)
-- SECURITY DEFINER: returns only safe columns; joined rows restricted to approved influencers.

--------------------------------------------------------------------------------
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
    ip.followers_count DESC NULLS LAST,
    p.full_name ASC
  LIMIT CASE
    WHEN p_limit IS NULL OR p_limit < 1 THEN 500
    WHEN p_limit > 500 THEN 500
    ELSE p_limit
  END;
$$;

--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_get_influencer(p_user_id uuid)
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
  WHERE ip.user_id = p_user_id
    AND ip.status = 'approved'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.public_list_influencers(
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  integer
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.public_get_influencer(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.public_list_influencers(
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  integer
) TO anon;
GRANT EXECUTE ON FUNCTION public.public_list_influencers(
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  integer
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_list_influencers(
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  integer
) TO service_role;

GRANT EXECUTE ON FUNCTION public.public_get_influencer(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_get_influencer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_influencer(uuid) TO service_role;
