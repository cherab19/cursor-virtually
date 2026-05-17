You are an elite full-stack engineer building a production-grade SaaS platform end-to-end.
Your output must be shippable, secure, beautiful, and demo-ready within the hackathon window.

# PROJECT: InfluencerHub
A two-sided SaaS marketplace connecting Ethiopian social media influencers with
advertisers running marketing campaigns. Influencers subscribe for visibility;
advertisers discover, message, and hire creators; admins moderate the ecosystem.

# CORE VALUE PROPOSITION
Solve Ethiopia's fragmented influencer market by providing:
- A verified, searchable directory of local creators
- Tiered subscriptions (Free/Pro/Elite) that gate visibility & ranking
- Campaign posting + application workflow
- Real-time messaging between brands and creators
- Local payments via Chapa (ETB)
- Admin moderation + verification badges + reviews

# TECH STACK (non-negotiable)
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Routing: react-router-dom v6
- State/Data: @tanstack/react-query
- Backend: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- Charts: recharts
- Animation: framer-motion
- Payments: Chapa (Ethiopian gateway) via Supabase Edge Function
- Fonts: Plus Jakarta Sans (display) + Inter (body)
- Deploy: Vercel (frontend) + Supabase (backend)

# USER ROLES
1. INFLUENCER — creates profile, subscribes, receives campaign requests
2. ADVERTISER — browses directory, posts campaigns, messages influencers
3. ADMIN — approves profiles, verifies creators, monitors platform

CRITICAL: Store roles in a SEPARATE `user_roles` table with an `app_role` enum
and a `has_role(user_id, role)` SECURITY DEFINER function. NEVER store roles
on the profiles table (privilege escalation risk). All RLS policies that check
admin status MUST use this function.

# DATABASE SCHEMA (Supabase / Postgres)
Create these tables with RLS enabled on every one:
- profiles (user_id, full_name, email, avatar_url, created_at)
- user_roles (user_id, role: 'influencer'|'advertiser'|'admin')
- influencer_profiles (user_id, bio, category, location, followers_count,
  engagement_rate, ad_price ETB, subscription_plan, status, is_verified)
- advertiser_profiles (user_id, company_name, industry, website, logo_url, bio)
- social_links (influencer_id, platform, handle, url, followers_count)
- campaigns (advertiser_id, title, description, budget, deadline,
  target_category, target_platform, status)
- campaign_applications (campaign_id, influencer_id, proposal, price_proposal, status)
- messages (sender_id, recipient_id, subject, body, is_read, campaign_id) — REALTIME ENABLED
- reviews (reviewer_id, reviewee_id, campaign_id, rating, comment)
- subscriptions (user_id, plan, status, started_at, expires_at)
- subscription_plans (name, display_name, price_monthly, features jsonb)
- payments (user_id, amount, currency 'ETB', status, transaction_ref, payment_method)

Add a `handle_new_user()` trigger that auto-creates the profile + role row
on signup based on `raw_user_meta_data.role`.

Use validation TRIGGERS not CHECK constraints for time-based rules.

# DESIGN SYSTEM
- Palette: Primary Blue #2563EB, Navy #0C4A6E, Amber accent #F59E0B
- All colors as HSL semantic tokens in index.css (--primary, --accent, etc.)
- NEVER use raw Tailwind color classes (text-blue-600) in components — only tokens
- Card-based directory, sidebar dashboard layout, recharts analytics
- Mobile-first responsive, 60fps animations, generous whitespace
- Modern SaaS feel: subtle gradients, soft shadows, rounded-xl cards

# PUBLIC PAGES
1. Landing (/) — hero, value prop, featured Elite influencers, CTA
2. Directory (/directory) — searchable grid, filters (category, platform,
   followers range, location), Elite plan ranks first
3. Influencer Profile (/influencer/:id) — bio, social links, stats,
   reviews, Contact button (opens message modal)
4. Pricing (/pricing) — Free / Pro (299 ETB/mo) / Elite (699 ETB/mo)
5. Auth (/auth) — sign up with role selector + sign in

# INFLUENCER DASHBOARD (/dashboard/influencer)
- Sidebar: Overview, Profile, Campaigns, Messages (with unread badge),
  Subscription, Analytics
- 5-step Onboarding Wizard auto-triggers if profile incomplete:
  1) bio + category, 2) location + ad price, 3) social links,
  4) avatar upload, 5) subscription plan selection
- Real analytics from DB (followers over time, earnings, engagement)
- Campaign marketplace with one-click apply
- Real-time messaging thread UI

# ADVERTISER DASHBOARD (/dashboard/advertiser)
- Sidebar: Overview, Discover Influencers, My Campaigns, Applications,
  Messages, Billing
- Campaign creator (title, brief, budget, target category/platform, deadline)
- Application review (accept/reject with one click)
- Messaging inbox with influencers

# ADMIN DASHBOARD (/dashboard/admin)
- Pending influencer approvals queue
- Verification badge toggle
- User management, payment logs, platform KPIs (MRR, active users, GMV)

# AUTH & SECURITY (CRITICAL)
- Email/password signup with role chosen at signup
- Use Supabase onAuthStateChange listener BEFORE getSession()
- ProtectedRoute component enforces allowedRoles per dashboard
- ALL tables have RLS — users only access their own rows
- Admin checks server-side via has_role() function only
- Never trust client-side role checks for sensitive ops

# CHAPA PAYMENT INTEGRATION
- Edge function `chapa-initialize` → returns checkout URL
- Edge function `chapa-verify` → webhook handler, updates subscription
- Store CHAPA_SECRET_KEY as Supabase secret (never in frontend)
- On successful payment: insert into payments + update subscriptions table

# REAL-TIME FEATURES
- Enable realtime on `messages` table
- useUnreadMessages hook subscribes to inserts → live badge counts
- Toast notification on new incoming message

# QUALITY BAR
- Zero TypeScript errors, zero console errors
- All forms have loading + error + empty states
- Lighthouse > 90 on landing page
- Every interactive element has hover/focus/disabled states
- Optimistic updates with react-query where appropriate
- Use semantic HTML, alt text, ARIA labels

# DEMO SCRIPT (must work end-to-end)
1. Sign up as influencer → complete onboarding wizard → appear in directory
2. Sign up as advertiser → browse directory → message influencer
3. Influencer receives message in real-time → replies
4. Advertiser posts campaign → influencer applies → advertiser accepts
5. Influencer upgrades to Pro via Chapa checkout (test mode)
6. Admin logs in → verifies the influencer → badge appears publicly

Work autonomously, make smart defaults, and DO NOT stop to ask questions on routine choices.
Only pause if a decision would materially change the product direction.
Ship it.
