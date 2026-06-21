# Authentication Setup Guide

This guide covers the Supabase authentication setup for login and signup functionality.

## Overview

The auth system includes:
- **Sign Up** - Create new user accounts with validation
- **Sign In** - Login with email and password
- **Protected Routes** - Middleware protects `/dashboard` route
- **Form Validation** - Client and server-side validation
- **Automatic Redirects** - Authenticated users → dashboard, Unauthenticated users → auth page

## File Structure

```
app/
├── auth/
│   ├── page.tsx          # Login/Signup form component (Client)
│   └── actions.ts        # Server actions for auth (Server)
├── dashboard/
│   └── page.tsx          # Protected dashboard page (Client)
└── page.tsx              # Root redirect
lib/
├── supabase.ts           # Supabase client
├── auth.ts               # Auth helper functions
└── types.ts              # TypeScript types
middleware.ts            # Route protection middleware
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Enable Authentication in Supabase

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider (it's enabled by default)
4. Configure **Email Templates** if desired
5. Set **Site URL** and **Redirect URLs** in **Settings**:
   - Site URL: `http://localhost:3000` (development)
   - Redirect URLs: `http://localhost:3000/auth/callback` (add this if using magic links)

### 4. Create Users Table (if not done already)

Run the schema from `database/schema.sql` in Supabase SQL Editor.

### 5. Start Your App

```bash
npm run dev
```

Visit `http://localhost:3000` - you'll be redirected to `/auth`

## How It Works

### Authentication Flow

```
User visits app
    ↓
Middleware checks auth status
    ↓
├─ Authenticated? → Redirect to /dashboard
└─ Not authenticated? → Redirect to /auth
    ↓
User fills form (Login or Signup)
    ↓
Form submitted to Server Action
    ↓
├─ Validation errors? → Show errors
├─ Email already exists? → Show error
└─ Success? → Create auth user + user profile
    ↓
Redirect to /dashboard
    ↓
Dashboard fetches user profile
    ↓
Display user data
```

## Form Validation

### Server-Side Validation (app/auth/actions.ts)

All validation happens on the server for security:

```typescript
validateEmail(email)        // RFC email format
validatePassword(password)  // Min 8 chars, 1 uppercase, 1 number
validateUsername(username)  // 3-50 chars, alphanumeric + _ -
```

### Client-Side Validation (app/auth/page.tsx)

Error messages shown in real-time:

```typescript
{errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
{errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
```

## Key Features

### Server Actions

**`signUp(formData)`**
- Validates email, password, username
- Creates Supabase auth user
- Creates user profile with 1000 wallet balance
- Returns: success status, errors, or message

**`signIn(formData)`**
- Validates email and password
- Authenticates with Supabase
- Redirects to `/dashboard` on success
- Returns: success status or error message

**`signOut()`**
- Signs out from Supabase Auth
- Clears session
- Redirects to `/auth`

### Middleware (middleware.ts)

Protects routes using Supabase session:

```typescript
// Protected routes
/dashboard/*  → Requires authentication
/auth         → Redirects to /dashboard if authenticated
/             → Redirects to /auth or /dashboard based on auth
```

### Protected Dashboard

The dashboard page:
1. Checks authentication status
2. Fetches user profile from database
3. Displays user info and statistics
4. Shows sign-out button

## Code Examples

### Sign Up

```typescript
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('password', 'SecurePass123');
formData.append('confirmPassword', 'SecurePass123');
formData.append('username', 'john_doe');
formData.append('fullName', 'John Doe');

const result = await signUp(formData);

if (result.success) {
  console.log('Account created!');
} else {
  console.error(result.errors);
}
```

### Sign In

```typescript
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('password', 'SecurePass123');

const result = await signIn(formData);
// Redirects to /dashboard on success
```

### Get Current User

```typescript
import { supabase } from '@/lib/supabase';

const { data: { user } } = await supabase.auth.getUser();
console.log(user?.email);
```

## Password Requirements

Passwords must contain:
- ✅ At least 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 number (0-9)

Example: `MyPassword123` ✅, `mypassword` ❌

## Email Confirmation

**Development Mode:**
- Supabase skips email confirmation by default
- Users can log in immediately

**Production Mode:**
1. Enable **Email Confirmations** in Supabase
2. Users receive confirmation email
3. They must click link before accessing account
4. Configure email template in Supabase Dashboard

## Error Handling

### Authentication Errors

```typescript
// Server returns user-friendly messages
"Invalid email or password"
"This email is already registered"
"Account created, but profile setup failed"
```

### Validation Errors

```typescript
// Field-specific errors shown in red
{
  email: "Please enter a valid email address",
  password: "Password must be at least 8 characters long"
}
```

## Troubleshooting

### "Missing Supabase environment variables"

**Solution:** Check your `.env.local` file:
- Variable names are case-sensitive
- Paste URL without trailing slash
- Use PUBLIC key (not SERVICE_ROLE key)

```bash
# ✅ Correct
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# ❌ Wrong
SUPABASE_URL=...  (missing NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_KEY=...  (wrong key name)
```

### "User already exists"

**Solution:** This email is registered. User should:
1. Try signing in instead
2. Use "Forgot Password" to reset
3. Use a different email

### Infinite redirect loop

**Solution:** Check middleware.ts configuration:
1. Verify NEXT_PUBLIC variables are set
2. Check Supabase project is active
3. Try clearing cookies:
   ```bash
   # In browser DevTools → Application → Cookies
   # Delete any cookies for localhost
   ```

### "Can't signup" or "Can't login"

**Solution:**
1. Check Network tab in DevTools for errors
2. Verify Supabase project status
3. Check email format
4. Try different browser (clear cache)

## Security Best Practices

✅ **Do:**
- Validate on both client and server
- Use HTTPS in production
- Store sensitive data in `.env.local` (never commit)
- Use Supabase Row Level Security (RLS) policies
- Implement rate limiting for auth endpoints

❌ **Don't:**
- Expose SECRET/SERVICE_ROLE keys in client code
- Store passwords in plaintext
- Use weak passwords
- Skip server-side validation
- Store auth tokens in localStorage (use secure cookies)

## Advanced Features

### Magic Link Authentication

To add passwordless login:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: { emailRedirectTo: 'http://localhost:3000/auth/callback' }
});
```

### Social Authentication

Supabase supports Google, GitHub, Apple, etc:

```typescript
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'http://localhost:3000/auth/callback' }
});
```

### Two-Factor Authentication

Available via Supabase MFA options.

## Support & Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Next.js Docs: https://nextjs.org/docs
- GitHub Issues: https://github.com/supabase/supabase
- Discord: https://discord.supabase.com

## Related Files

- `database/schema.sql` - Users table setup
- `lib/supabase.ts` - Supabase client initialization
- `lib/auth.ts` - Helper functions
- `app/api/bets/route.ts` - Example API using auth
