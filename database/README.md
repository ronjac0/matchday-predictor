# Database Schema Documentation

## Overview

This is a PostgreSQL schema for a sports betting application with Row Level Security (RLS) policies to ensure users can only access and modify their own data.

## How to Deploy

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `schema.sql`
5. Click **Run**

### Option 2: Using Supabase CLI

```bash
supabase db push
```

(Requires setting up Supabase CLI and local development environment)

---

## Tables

### `users`
Stores user account information and wallet balance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `email` | VARCHAR(255) | User email (unique) |
| `username` | VARCHAR(50) | Username (unique) |
| `full_name` | VARCHAR(255) | User's full name |
| `avatar_url` | TEXT | URL to user's avatar |
| **`wallet_balance`** | DECIMAL(15,2) | **Default: 1000.00** ⭐ |
| `total_bets_placed` | INTEGER | Count of bets placed |
| `total_won` | INTEGER | Count of bets won |
| `total_lost` | INTEGER | Count of bets lost |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |

**RLS Policies:**
- Users can only view their own profile
- Users can only update their own profile

---

### `matches`
Stores sports match information with betting odds.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `league` | VARCHAR(100) | Sports league (e.g., "Premier League") |
| `home_team` | VARCHAR(100) | Home team name |
| `away_team` | VARCHAR(100) | Away team name |
| `match_date` | TIMESTAMP | When the match occurs |
| `status` | VARCHAR(50) | scheduled, live, completed, cancelled |
| `home_score` | INTEGER | Final home team score |
| `away_score` | INTEGER | Final away team score |
| `winner` | VARCHAR(100) | home, away, draw, or NULL |
| `odds_home` | DECIMAL(5,2) | Betting odds for home win |
| `odds_draw` | DECIMAL(5,2) | Betting odds for draw |
| `odds_away` | DECIMAL(5,2) | Betting odds for away win |
| `created_at` | TIMESTAMP | When match was added |
| `updated_at` | TIMESTAMP | Last update time |

**RLS Policies:**
- All authenticated users can view all matches

---

### `bets`
Stores user bets on matches. **This table has strict RLS policies.**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users (user who placed bet) |
| `match_id` | UUID | Foreign key to matches (match being bet on) |
| `prediction` | VARCHAR(100) | User's prediction: home, draw, away |
| `amount` | DECIMAL(15,2) | Amount bet (must be > 0) |
| `odds` | DECIMAL(5,2) | Odds at time of betting |
| `potential_winnings` | DECIMAL(15,2) | amount × odds |
| `status` | VARCHAR(50) | pending, won, lost, voided |
| `result` | VARCHAR(100) | Actual match result |
| `placed_at` | TIMESTAMP | When bet was placed |
| `settled_at` | TIMESTAMP | When bet was settled |

**RLS Policies (MOST RESTRICTIVE):**
- ✅ Users can **SELECT** only their own bets
- ✅ Users can **INSERT** bets only for themselves
- ✅ Users can **UPDATE** only their own pending bets (for cancellation)
- ❌ Users **CANNOT** DELETE bets (audit trail)

---

### `transactions`
Audit trail of all wallet transactions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `type` | VARCHAR(50) | deposit, withdrawal, bet_placed, bet_won, bet_lost |
| `amount` | DECIMAL(15,2) | Transaction amount |
| `description` | TEXT | Transaction description |
| `balance_before` | DECIMAL(15,2) | Balance before transaction |
| `balance_after` | DECIMAL(15,2) | Balance after transaction |
| `related_bet_id` | UUID | Reference to related bet (if applicable) |
| `created_at` | TIMESTAMP | Transaction timestamp |

**RLS Policies:**
- ✅ Users can **SELECT** only their own transactions
- ❌ Users **CANNOT** INSERT transactions (only system functions)
- ❌ Users **CANNOT** UPDATE or DELETE (audit security)

---

## Views

### `user_betting_stats`
Pre-calculated betting statistics for each user.

```sql
SELECT * FROM user_betting_stats WHERE username = 'john_doe';
```

Returns:
- Total bets placed
- Total wins/losses
- Total amount won/lost
- Win percentage

### `matches_with_stats`
Matches with betting volume statistics.

```sql
SELECT * FROM matches_with_stats WHERE status = 'scheduled';
```

Returns:
- Match details
- Total bets placed on match
- Total amount bet

---

## Security Features

### Row Level Security (RLS)

**Enabled on all tables** to ensure users can only access their own data:

```sql
-- Example: User can only see their own bets
SELECT * FROM bets; -- Only returns their bets due to RLS
```

### Key Constraints

- **Wallet Balance**: Must be >= 0 (can't go negative)
- **Odds**: Must be > 1.0
- **Bet Amount**: Must be > 0
- **Status Validation**: Only allowed values via CHECK constraints

### Indexes

Optimized for common queries:
- User lookups by email/username
- Bets by user and match
- Matches by date and status
- Transactions by user and type

---

## Example Queries

### 1. View Current User's Profile

```typescript
import { supabase } from '@/lib/supabase';

const { data } = await supabase
  .from('users')
  .select('*')
  .single();
```

### 2. Get User's Bets

```typescript
const { data: bets } = await supabase
  .from('bets')
  .select('*, matches:match_id(*)')
  .eq('user_id', userId)
  .order('placed_at', { ascending: false });
```

### 3. Get Upcoming Matches

```typescript
const { data: matches } = await supabase
  .from('matches')
  .select('*')
  .eq('status', 'scheduled')
  .gt('match_date', new Date().toISOString())
  .order('match_date', { ascending: true });
```

### 4. Place a Bet

```typescript
const { data: bet } = await supabase
  .from('bets')
  .insert([
    {
      user_id: userId,
      match_id: matchId,
      prediction: 'home',
      amount: 50,
      odds: 1.85,
      potential_winnings: 92.5,
      status: 'pending'
    }
  ]);
```

### 5. Get User's Betting Stats

```typescript
const { data: stats } = await supabase
  .from('user_betting_stats')
  .select('*')
  .eq('username', 'john_doe')
  .single();
```

---

## Authentication Integration

This schema is designed to work with **Supabase Auth**:

- RLS policies check `auth.uid()` for user verification
- Ensure authentication is set up in your Supabase project
- Users table should ideally have an `auth_id` linked to `auth.users`

### For Production

1. Link users table to Supabase auth:
```sql
ALTER TABLE users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

2. Create trigger to auto-create user on signup:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Notes

- All timestamps are UTC
- Wallet balance uses DECIMAL for financial accuracy (not FLOAT)
- Users start with **1000 currency units** in their wallet
- Bets are immutable once settled (for audit trail)
- No delete operations on settled transactions/bets
