# Quick Start Guide - Authentication

Get your login/signup system up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free at https://supabase.com)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **Create a new project**
3. Name it "fifa-predictions"
4. Choose a password and region
5. Click **Create new project** and wait 2-3 minutes

## Step 2: Get Your API Keys

1. Open your project dashboard
2. Go to **Settings** → **API**
3. Copy the values:
   - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon/Public key` → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Configure Environment Variables

1. Create `.env.local` in your project root
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

**Never commit `.env.local` to GitHub!**

## Step 4: Deploy Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL Editor
5. Click **Run**

## Step 5: Start Your App

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the login page!

## Test It Out

### Sign Up
1. Click **"Sign Up"** tab
2. Enter details:
   - Full Name: John Doe
   - Username: john_doe
   - Email: john@example.com
   - Password: MyPassword123
   - Confirm: MyPassword123
3. Click **Sign Up**
4. You should see "Account created successfully!"

### Sign In
1. Click **"Sign In"** tab
2. Enter your email and password
3. Click **Sign In**
4. You should be redirected to **Dashboard** ✅

### Dashboard Features
- View your profile information
- See wallet balance ($1000.00 for new users)
- View betting statistics
- Sign out button

## Password Requirements

Your password MUST have:
- ✅ At least 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 number

Examples:
- ✅ `MyPassword123` - Good!
- ✅ `SecurePass2024` - Good!
- ❌ `password` - Missing uppercase & number
- ❌ `MyPass1` - Too short

## Folder Structure

```
app/
├── auth/
│   ├── page.tsx          # Login/Signup form
│   └── actions.ts        # Server actions
└── dashboard/
    └── page.tsx          # Protected dashboard
```

## Common Issues

### "Missing Supabase environment variables"

**Check your `.env.local` file:**
- Variable names must be exact
- Make sure you copied the full URL and key
- No quotes needed around values

```env
# ✅ Correct
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# ❌ Wrong
SUPABASE_URL=...  (missing NEXT_PUBLIC_ prefix)
```

### "Email already registered"

This email is already in the system. Try:
- Using a different email
- Signing in instead

### "Infinite redirect loop"

Try:
1. Clear browser cookies
2. Restart development server
3. Check `.env.local` is correct

### Build fails with "Missing environment variables"

This is expected. Just ensure `.env.local` is in place before running:

```bash
npm run dev
```

## What's Next?

After authentication is working:

1. **Create a matches page** to browse betting opportunities
2. **Create a bets page** to place and view bets
3. **Add wallet functions** to deposit/withdraw
4. **Build API endpoints** for game logic

See `AUTH_SETUP.md` for advanced configuration!

## File Reference

| File | Purpose |
|------|---------|
| `app/auth/page.tsx` | Login/Signup UI |
| `app/auth/actions.ts` | Form submission handlers |
| `app/dashboard/page.tsx` | Protected user dashboard |
| `lib/supabase.ts` | Supabase client setup |
| `middleware.ts` | Route protection |
| `lib/validation.ts` | Form validation rules |

## Testing with Sample Data

To load test users and matches:

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy `database/sample-data.sql`
4. Click **Run**

You now have 4 test users and 8 sample bets!

## Support

- 📖 [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- 🚀 [Next.js Docs](https://nextjs.org/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)

---

**You're all set!** 🎉 Your authentication system is ready to go.
