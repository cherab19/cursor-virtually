# Apply database schema in Supabase SQL Editor

I cannot sign in to your Supabase account from this environment. Use the steps below (about 2 minutes).

## Steps

1. Open the SQL Editor for your project:
   **https://supabase.com/dashboard/project/sqapdmmczjlrwuibbtsr/sql/new**

2. Open this file in your repo and copy **all** of it:
   **`supabase/APPLY_IN_SQL_EDITOR.sql`** (~1,100 lines)

3. Paste into the SQL Editor.

4. Click **Run** (or `Ctrl+Enter`).

5. Wait until it finishes — you should see “Success” with no red errors.

## What this creates

- All tables (`profiles`, `user_roles`, `influencer_profiles`, `campaigns`, `messages`, etc.)
- RLS policies and `has_role()` function
- Signup trigger (`handle_new_user`)
- Directory RPCs (`public_list_influencers`, `public_get_influencer`)
- Storage bucket for avatars
- Realtime on `messages`
- Seed data for subscription plans (Free / Pro / Elite)

## After running SQL

1. **Auth → URL configuration**: add `http://localhost:5173` (and your Vercel URL) to Site URL / Redirect URLs.

2. Restart the app:
   ```bash
   cd influencerhub && npm run dev
   ```

3. Sign up at `/auth` as influencer or advertiser.

## Optional: CLI instead of paste

If you have the **database password** (Settings → Database):

```bash
export SUPABASE_DB_PASSWORD='your-password'
chmod +x scripts/apply-migrations.sh
./scripts/apply-migrations.sh
```

If the pooler region differs, use the connection string from the dashboard instead of the script default.
