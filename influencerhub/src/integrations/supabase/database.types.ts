/**
 * Supabase `Database` types — keep in sync with `supabase/migrations/*`.
 * Regenerate later via: `supabase gen types typescript --local > src/integrations/supabase/database.types.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "influencer" | "advertiser" | "admin";
export type InfluencerProfileStatus = "pending" | "approved" | "rejected";
export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type SubscriptionRowStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod = "chapa" | "manual" | "other";

export type SubscriptionPlanName = "free" | "pro" | "elite";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: AppRole;
          created_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          name: string;
          display_name: string;
          price_monthly: number;
          features: Json;
          created_at: string;
        };
        Insert: {
          name: string;
          display_name: string;
          price_monthly?: number;
          features?: Json;
          created_at?: string;
        };
        Update: {
          name?: string;
          display_name?: string;
          price_monthly?: number;
          features?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      influencer_profiles: {
        Row: {
          user_id: string;
          bio: string;
          category: string;
          location: string;
          followers_count: number;
          engagement_rate: number | null;
          ad_price_etb: number | null;
          subscription_plan: string;
          status: InfluencerProfileStatus;
          is_verified: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          bio?: string;
          category?: string;
          location?: string;
          followers_count?: number;
          engagement_rate?: number | null;
          ad_price_etb?: number | null;
          subscription_plan?: string;
          status?: InfluencerProfileStatus;
          is_verified?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          bio?: string;
          category?: string;
          location?: string;
          followers_count?: number;
          engagement_rate?: number | null;
          ad_price_etb?: number | null;
          subscription_plan?: string;
          status?: InfluencerProfileStatus;
          is_verified?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      advertiser_profiles: {
        Row: {
          user_id: string;
          company_name: string;
          industry: string;
          website: string | null;
          logo_url: string | null;
          bio: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          company_name?: string;
          industry?: string;
          website?: string | null;
          logo_url?: string | null;
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          company_name?: string;
          industry?: string;
          website?: string | null;
          logo_url?: string | null;
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          id: string;
          influencer_id: string;
          platform: string;
          handle: string;
          url: string | null;
          followers_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          influencer_id: string;
          platform: string;
          handle?: string;
          url?: string | null;
          followers_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          influencer_id?: string;
          platform?: string;
          handle?: string;
          url?: string | null;
          followers_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          advertiser_id: string;
          title: string;
          description: string;
          budget: number | null;
          deadline: string | null;
          target_category: string | null;
          target_platform: string | null;
          status: CampaignStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          title: string;
          description?: string;
          budget?: number | null;
          deadline?: string | null;
          target_category?: string | null;
          target_platform?: string | null;
          status?: CampaignStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          title?: string;
          description?: string;
          budget?: number | null;
          deadline?: string | null;
          target_category?: string | null;
          target_platform?: string | null;
          status?: CampaignStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_applications: {
        Row: {
          id: string;
          campaign_id: string;
          influencer_id: string;
          proposal: string;
          price_proposal: number | null;
          status: ApplicationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          influencer_id: string;
          proposal?: string;
          price_proposal?: number | null;
          status?: ApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          influencer_id?: string;
          proposal?: string;
          price_proposal?: number | null;
          status?: ApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          subject: string;
          is_read: boolean;
          campaign_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          body?: string;
          subject?: string;
          is_read?: boolean;
          campaign_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          body?: string;
          subject?: string;
          is_read?: boolean;
          campaign_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewee_id: string;
          campaign_id: string | null;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewee_id: string;
          campaign_id?: string | null;
          rating: number;
          comment?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          campaign_id?: string | null;
          rating?: number;
          comment?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: SubscriptionRowStatus;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: string;
          status?: SubscriptionRowStatus;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          status?: SubscriptionRowStatus;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: PaymentStatus;
          transaction_ref: string | null;
          payment_method: PaymentMethod;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          transaction_ref?: string | null;
          payment_method?: PaymentMethod;
          raw_payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          transaction_ref?: string | null;
          payment_method?: PaymentMethod;
          raw_payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: {
          _user_id: string;
          _role: AppRole;
        };
        Returns: boolean;
      };
      public_list_influencers: {
        Args: {
          p_search?: string | null;
          p_category?: string | null;
          p_location?: string | null;
          p_platform?: string | null;
          p_min_followers?: number | null;
          p_max_followers?: number | null;
          p_plan?: string | null;
          p_limit?: number | null;
        };
        Returns: {
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          bio: string;
          category: string;
          location: string;
          followers_count: number;
          engagement_rate: number | null;
          ad_price_etb: number | null;
          subscription_plan: string;
          is_verified: boolean;
        }[];
      };
      public_get_influencer: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          bio: string;
          category: string;
          location: string;
          followers_count: number;
          engagement_rate: number | null;
          ad_price_etb: number | null;
          subscription_plan: string;
          is_verified: boolean;
        }[];
      };
      messaging_peer_label: {
        Args: {
          peer_id: string;
        };
        Returns: string;
      };
      public_list_influencer_reviews: {
        Args: {
          p_reviewee_id: string;
        };
        Returns: {
          id: string;
          rating: number;
          comment: string;
          created_at: string;
          reviewer_label: string;
        }[];
      };
    };
    Enums: {
      app_role: AppRole;
      influencer_profile_status: InfluencerProfileStatus;
      campaign_status: CampaignStatus;
      application_status: ApplicationStatus;
      subscription_row_status: SubscriptionRowStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
    };
    CompositeTypes: Record<string, never>;
  };
}
