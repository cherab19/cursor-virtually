-- InfluencerHub: core schema, RLS, auth hook, validation triggers, plan seed, realtime
-- Requires: Supabase Postgres (auth schema present)

--------------------------------------------------------------------------------
-- Extensions
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

--------------------------------------------------------------------------------
-- Enums
--------------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('influencer', 'advertiser', 'admin');

CREATE TYPE public.influencer_profile_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

CREATE TYPE public.subscription_row_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
);

CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TYPE public.payment_method AS ENUM ('chapa', 'manual', 'other');

--------------------------------------------------------------------------------
-- Role helper (SECURITY DEFINER) — ALL admin checks in RLS use this function
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

--------------------------------------------------------------------------------
-- Tables
--------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE public.subscription_plans (
  name text PRIMARY KEY,
  display_name text NOT NULL,
  price_monthly numeric(12, 2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.influencer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  followers_count integer NOT NULL DEFAULT 0,
  engagement_rate numeric(6, 3),
  ad_price_etb numeric(12, 2),
  subscription_plan text NOT NULL DEFAULT 'free' REFERENCES public.subscription_plans (name),
  status public.influencer_profile_status NOT NULL DEFAULT 'pending',
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.advertiser_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  website text,
  logo_url text,
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.influencer_profiles (user_id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text NOT NULL DEFAULT '',
  url text,
  followers_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  budget numeric(14, 2),
  deadline timestamptz,
  target_category text,
  target_platform text,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES public.influencer_profiles (user_id) ON DELETE CASCADE,
  proposal text NOT NULL DEFAULT '',
  price_proposal numeric(12, 2),
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_applications_unique_application UNIQUE (campaign_id, influencer_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  campaign_id uuid REFERENCES public.campaigns (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns (id) ON DELETE SET NULL,
  rating smallint NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_range CHECK (
    rating >= 1
    AND rating <= 5
  )
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  plan text NOT NULL REFERENCES public.subscription_plans (name),
  status public.subscription_row_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'ETB',
  status public.payment_status NOT NULL DEFAULT 'pending',
  transaction_ref text,
  payment_method public.payment_method NOT NULL DEFAULT 'chapa',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Time-based validation triggers (spec: triggers, not CHECK, for time rules)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_subscriptions_time_range()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.started_at IS NOT NULL
     AND NEW.expires_at IS NOT NULL
     AND NEW.expires_at <= NEW.started_at THEN
    RAISE EXCEPTION 'subscriptions: expires_at must be after started_at';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_validate_times
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscriptions_time_range();

CREATE OR REPLACE FUNCTION public.validate_campaigns_deadline_vs_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_ts timestamptz;
BEGIN
  IF tg_op = 'INSERT' THEN
    base_ts := COALESCE(NEW.created_at, now());
  ELSE
    base_ts := COALESCE(NEW.created_at, OLD.created_at, now());
  END IF;

  IF NEW.deadline IS NOT NULL AND NEW.deadline < base_ts THEN
    RAISE EXCEPTION 'campaigns: deadline must be on or after created_at';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER campaigns_validate_deadline
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_campaigns_deadline_vs_created();

--------------------------------------------------------------------------------
-- Auth hook: profile + role from raw_user_meta_data (NEVER store role on profiles)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen_role public.app_role;
  meta_role text;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  );

  meta_role := lower(COALESCE(NEW.raw_user_meta_data ->> 'role', 'influencer'));

  IF meta_role = 'advertiser' THEN
    chosen_role := 'advertiser'::public.app_role;
  ELSIF meta_role = 'admin' THEN
    chosen_role := 'admin'::public.app_role;
  ELSE
    chosen_role := 'influencer'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- Helpful indexes
--------------------------------------------------------------------------------
CREATE INDEX idx_campaigns_status_created ON public.campaigns (status, created_at DESC);
CREATE INDEX idx_campaigns_advertiser ON public.campaigns (advertiser_id);
CREATE INDEX idx_messages_recipient_created ON public.messages (recipient_id, created_at DESC);
CREATE INDEX idx_messages_recipient_unread ON public.messages (recipient_id)
  WHERE is_read IS false;
CREATE INDEX idx_influencer_profiles_directory
  ON public.influencer_profiles (status, subscription_plan, followers_count DESC);
CREATE INDEX idx_payments_user_created ON public.payments (user_id, created_at DESC);

--------------------------------------------------------------------------------
-- Seed subscription plans (ETB)
--------------------------------------------------------------------------------
INSERT INTO public.subscription_plans (name, display_name, price_monthly, features)
VALUES
  (
    'free',
    'Free',
    0,
    jsonb_build_object(
      'directory_listing', true,
      'rank_boost', 0,
      'verified_badge', false
    )
  ),
  (
    'pro',
    'Pro',
    299,
    jsonb_build_object(
      'directory_listing', true,
      'rank_boost', 1,
      'analytics', true,
      'monthly_price_etb', 299
    )
  ),
  (
    'elite',
    'Elite',
    699,
    jsonb_build_object(
      'directory_listing', true,
      'rank_boost', 2,
      'analytics', true,
      'priority_placement', true,
      'monthly_price_etb', 699
    )
  )
ON CONFLICT (name) DO NOTHING;

--------------------------------------------------------------------------------
-- Row Level Security
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own_or_admin
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_update_own_or_admin
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY user_roles_select_own_or_admin
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_manage_admin_only
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- subscription_plans: public read
CREATE POLICY subscription_plans_select_public
  ON public.subscription_plans
  FOR SELECT
  USING (true);

CREATE POLICY subscription_plans_write_admin
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- influencer_profiles
CREATE POLICY influencer_profiles_select_directory_or_own_or_admin
  ON public.influencer_profiles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
    OR status = 'approved'
  );

CREATE POLICY influencer_profiles_insert_self_influencer
  ON public.influencer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_role(auth.uid(), 'influencer')
  );

CREATE POLICY influencer_profiles_update_own_or_admin
  ON public.influencer_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- advertiser_profiles
CREATE POLICY advertiser_profiles_select_own_or_admin
  ON public.advertiser_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY advertiser_profiles_insert_self_advertiser
  ON public.advertiser_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_role(auth.uid(), 'advertiser')
  );

CREATE POLICY advertiser_profiles_update_own_or_admin
  ON public.advertiser_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- social_links
CREATE POLICY social_links_select_visible_influencer
  ON public.social_links
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR influencer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.influencer_profiles ip
      WHERE ip.user_id = social_links.influencer_id
        AND ip.status = 'approved'
    )
  );

CREATE POLICY social_links_insert_owner_or_admin
  ON public.social_links
  FOR INSERT
  TO authenticated
  WITH CHECK (influencer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY social_links_update_owner_or_admin
  ON public.social_links
  FOR UPDATE
  TO authenticated
  USING (influencer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (influencer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY social_links_delete_owner_or_admin
  ON public.social_links
  FOR DELETE
  TO authenticated
  USING (influencer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- campaigns
CREATE POLICY campaigns_select_marketplace_or_owner_or_admin
  ON public.campaigns
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR advertiser_id = auth.uid()
    OR status IN ('active', 'paused')
  );

CREATE POLICY campaigns_insert_advertiser
  ON public.campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    advertiser_id = auth.uid()
    AND public.has_role(auth.uid(), 'advertiser')
  );

CREATE POLICY campaigns_update_own_or_admin
  ON public.campaigns
  FOR UPDATE
  TO authenticated
  USING (advertiser_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (advertiser_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY campaigns_delete_own_or_admin
  ON public.campaigns
  FOR DELETE
  TO authenticated
  USING (advertiser_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- campaign_applications
CREATE POLICY campaign_applications_select_parties_or_admin
  ON public.campaign_applications
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR influencer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campaign_applications.campaign_id
        AND c.advertiser_id = auth.uid()
    )
  );

CREATE POLICY campaign_applications_insert_influencer_self
  ON public.campaign_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    influencer_id = auth.uid()
    AND public.has_role(auth.uid(), 'influencer')
  );

CREATE POLICY campaign_applications_update_advertiser_or_influencer_or_admin
  ON public.campaign_applications
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR influencer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campaign_applications.campaign_id
        AND c.advertiser_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR influencer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campaign_applications.campaign_id
        AND c.advertiser_id = auth.uid()
    )
  );

-- messages
CREATE POLICY messages_select_participants_or_admin
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR sender_id = auth.uid()
    OR recipient_id = auth.uid()
  );

CREATE POLICY messages_insert_as_sender
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY messages_update_participants_or_admin
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR sender_id = auth.uid()
    OR recipient_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR sender_id = auth.uid()
    OR recipient_id = auth.uid()
  );

-- reviews
CREATE POLICY reviews_select_public
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY reviews_insert_as_reviewer
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- subscriptions
CREATE POLICY subscriptions_select_own_or_admin
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY subscriptions_insert_own_or_admin
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY subscriptions_update_own_or_admin
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- payments
CREATE POLICY payments_select_own_or_admin
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY payments_insert_own_or_admin
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY payments_update_admin
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

--------------------------------------------------------------------------------
-- Realtime: messages
--------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

--------------------------------------------------------------------------------
-- Grants (client + service roles can exercise policies)
--------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
