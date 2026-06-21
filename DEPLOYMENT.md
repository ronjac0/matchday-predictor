# Deployment Guide

This guide walks you through setting up your sports betting app with Supabase.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **New Project**
4. Choose a name, database password, and region
5. Wait for the project to be created

## 2. Get Your Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Create `.env.local` in your project root:

```bash
cp .env.local.example .env.local
```

4. Paste your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Deploy the Database Schema

### Option A: Supabase Dashboard (Easiest)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open `database/schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

### Option B: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## 4. Load Sample Data (Optional)

For testing purposes, you can load sample data:

1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Open `database/sample-data.sql`
4. Copy and paste
5. Click **Run**

This creates:
- 4 sample users with different wallet balances
- 4 sample matches (World Cup style)
- 8 sample bets in different statuses

## 5. Enable Authentication (Recommended)

To use the RLS policies with user authentication:

1. Go to **Authentication** in Supabase
2. Click **Providers**
3. Enable your desired auth method (Email, Google, GitHub, etc.)
4. Configure the sign-up and sign-in settings

## 6. Set Up Environment Variables

Your `.env.local` file should now contain:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
DATABASE_URL=postgresql://...  # For direct DB access (if needed)
```

## 7. Test the Connection

Run your development server:

```bash
npm run dev
```

Visit http://localhost:3000 to test your app.

## Verify Everything Works

### Test RLS Policies

1. Create two different user accounts
2. User A places a bet
3. Log in as User B
4. Try to query bets:
   ```typescript
   const { data: bets } = await supabase.from('bets').select('*');
   // User B should see NO bets (RLS blocks access)
   ```
5. User A should see their bets

### Check Database

In Supabase Dashboard:

1. **Table Editor** → See all your tables
2. **SQL Editor** → Run test queries
3. **Logs** → Monitor API activity

## Production Checklist

- [ ] Authentication is properly configured
- [ ] RLS policies are tested with multiple users
- [ ] Environment variables are secured
- [ ] Database backups are enabled
- [ ] Rate limiting is configured
- [ ] Monitoring/logging is enabled
- [ ] API keys are rotated regularly

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL not found"

Make sure your `.env.local` file:
- Is in the project root
- Has the correct variable names (case-sensitive)
- Is not in `.gitignore` (local only)

### "Permission denied" errors

Check your RLS policies in Supabase:
1. **Authentication** → **RLS** → Verify policies are enabled
2. Ensure you're authenticated before making requests

### Bets visible to other users

The RLS policy might not be active:
1. Go to **SQL Editor**
2. Run:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'bets';
   ```
3. Verify policies exist and are correct

### Connection timeout

1. Check your Supabase project is running
2. Verify your URL and API key are correct
3. Check your network connection

## Support

- Supabase Docs: https://supabase.com/docs
- GitHub Issues: https://github.com/supabase/supabase
- Discord Community: https://discord.supabase.com
