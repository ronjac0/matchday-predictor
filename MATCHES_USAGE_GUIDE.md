# Matches & Leaderboard Components - Usage Guide

Complete guide with code examples for integrating the Match browsing and Leaderboard components into your FIFA betting application.

---

## 📋 What You Got

Two fully responsive React components for your betting app:

1. **MatchCard** - Individual match with betting interface
2. **MatchesList** - Grid of matches with filtering
3. **Leaderboard** - User rankings by wallet balance

Plus two ready-to-use pages:
- `/matches` - Browse and bet on FIFA matches
- `/leaderboard` - View top users

---

## 🎯 Component Overview

### MatchCard Component

Displays a single FIFA match with live odds and betting interface.

```
┌─────────────────────────────────┐
│ World Cup              Scheduled │
│ Jun 20, 2026 at 8:00 PM        │
├─────────────────────────────────┤
│   Brazil  vs  Germany           │
├─────────────────────────────────┤
│ [Home] [Draw] [Away]            │
│ 1.85   1.95   2.10              │
├─────────────────────────────────┤
│ Bet Amount: [_____]  $1500      │
│ Potential Winnings: $185        │
│ [Place Bet]                     │
└─────────────────────────────────┘
```

**Features:**
- Match info (teams, league, date)
- Status badge (scheduled/live/completed)
- Live odds for each prediction
- Bet amount input
- Real-time potential winnings
- Success/error messages
- Integration with placeBet action

**Usage:**

```typescript
import MatchCard from '@/components/MatchCard';

export default function MyComponent() {
  const match = {
    id: '123',
    league: 'World Cup',
    home_team: 'Brazil',
    away_team: 'Germany',
    match_date: '2026-06-20T20:00:00Z',
    status: 'scheduled',
    home_score: null,
    away_score: null,
    winner: null,
    odds_home: 1.85,
    odds_draw: 1.95,
    odds_away: 2.10,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  };

  return (
    <MatchCard
      match={match}
      userId={user.id}
      userBalance={1500}
      onBetPlaced={(result) => {
        console.log('Bet placed!');
        console.log('New balance:', result.wallet_balance);
        console.log('Bet details:', result.bet);
      }}
    />
  );
}
```

---

### MatchesList Component

Displays all matches in a responsive grid with filtering and balance tracking.

```
Upcoming Matches                [All] [Scheduled] [Live] [Completed]
Balance: $1,500

┌──────────────────┬──────────────────┬──────────────────┐
│  Match Card 1    │  Match Card 2    │  Match Card 3    │
├──────────────────┼──────────────────┼──────────────────┤
│  Match Card 4    │  Match Card 5    │  Match Card 6    │
└──────────────────┴──────────────────┴──────────────────┘
```

**Features:**
- Responsive grid (1/2/3 columns)
- Filter by match status
- Shows current wallet balance
- Auto-updates after each bet
- Loading/error states
- Empty state handling

**Usage:**

```typescript
import MatchesList from '@/components/MatchesList';

export default function BettingPage() {
  const [balance, setBalance] = useState(1500);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Place Your Bets</h1>
      
      <MatchesList
        userId={currentUser.id}
        userBalance={balance}
        onBalanceUpdate={(newBalance) => {
          setBalance(newBalance);
          console.log('Balance updated to:', newBalance);
        }}
      />
    </div>
  );
}
```

---

### Leaderboard Component

Displays top users ranked by wallet balance with statistics.

```
🏆 Leaderboard                    [All-time] [Week] [Month]

┌────────────┬────────────┬────────────┐
│     🥇     │     🥈     │     🥉     │
│  John Doe  │ Jane Smith │ Bob Jones  │
│   $5,000   │   $4,500   │   $4,000   │
│ 50 Bets    │ 45 Bets    │ 40 Bets    │
└────────────┴────────────┴────────────┘

Rank │ Player        │ Balance  │ Bets │ Won │ Lost
─────┼───────────────┼──────────┼──────┼─────┼─────
🥇   │ john_doe      │ $5,000   │ 50   │ 28  │ 22
🥈   │ jane_smith    │ $4,500   │ 45   │ 25  │ 20
🥉   │ bob_jones     │ $4,000   │ 40   │ 22  │ 18
 4   │ alice_wang    │ $3,800   │ 38   │ 20  │ 18
```

**Features:**
- Top 3 highlighted with medals
- Full leaderboard table
- Ranked by wallet_balance
- Shows betting stats
- Statistics summary
- Time range filter (ready for future use)

**Usage:**

```typescript
import Leaderboard from '@/components/Leaderboard';

// Show top 10 users
export default function LeaderboardWidget() {
  return <Leaderboard limit={10} />;
}

// Show all top 100
export default function FullLeaderboard() {
  return <Leaderboard limit={100} />;
}

// In a custom layout
export default function HomePage() {
  return (
    <div className="space-y-8">
      <h2>🏆 Top Players</h2>
      <Leaderboard limit={5} />
      
      <h2>📊 Top 50 Players</h2>
      <Leaderboard limit={50} />
    </div>
  );
}
```

---

## 🛣️ Pre-Built Pages

### /matches

Already created and ready to use!

```typescript
// File: app/matches/page.tsx
// Route: /matches
// Protection: Requires authentication
// Features: Full match browsing with betting
```

Simply navigate to `/matches` after logging in to see:
- All available matches in a grid
- Filter options
- Betting interface
- Real-time balance updates

### /leaderboard

Already created and ready to use!

```typescript
// File: app/leaderboard/page.tsx
// Route: /leaderboard
// Protection: Requires authentication
// Features: Full leaderboard with statistics
```

Simply navigate to `/leaderboard` after logging in to see:
- Top 100 users ranked by balance
- Top 3 highlighted cards
- Full statistics table
- Competition stats

---

## 💡 Integration Examples

### Example 1: Custom Matches Widget

```typescript
'use client';

import MatchesList from '@/components/MatchesList';
import { useState } from 'react';

export default function MatchesWidget() {
  const [balance, setBalance] = useState(1500);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Available Bets</h2>
        <span className="text-lg font-semibold text-blue-600">
          Balance: ${balance.toFixed(2)}
        </span>
      </div>

      <MatchesList
        userId="user-123"
        userBalance={balance}
        onBalanceUpdate={(newBalance) => {
          setBalance(newBalance);
          // Maybe trigger a celebration animation?
        }}
      />
    </div>
  );
}
```

### Example 2: Dashboard with Matches & Leaderboard

```typescript
'use client';

import MatchesList from '@/components/MatchesList';
import Leaderboard from '@/components/Leaderboard';
import { useState } from 'react';

export default function Dashboard() {
  const [balance, setBalance] = useState(1500);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Matches - takes 2 columns */}
      <div className="lg:col-span-2">
        <MatchesList
          userId="user-123"
          userBalance={balance}
          onBalanceUpdate={setBalance}
        />
      </div>

      {/* Leaderboard - takes 1 column */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <Leaderboard limit={10} />
        </div>
      </div>
    </div>
  );
}
```

### Example 3: Single Match Betting

```typescript
'use client';

import MatchCard from '@/components/MatchCard';
import { useState } from 'react';

export default function MatchDetail({ match }) {
  const [balance, setBalance] = useState(1500);

  const handleBetSuccess = (result) => {
    setBalance(result.wallet_balance);
    
    // Show toast notification
    console.log('✅ Bet placed successfully!');
    console.log('Potential winnings:', result.bet.potential_winnings);
  };

  return (
    <div className="max-w-md mx-auto">
      <MatchCard
        match={match}
        userId="user-123"
        userBalance={balance}
        onBetPlaced={handleBetSuccess}
      />
    </div>
  );
}
```

### Example 4: Responsive Home Page

```typescript
'use client';

import MatchesList from '@/components/MatchesList';
import Leaderboard from '@/components/Leaderboard';

export default function HomePage() {
  return (
    <div className="space-y-12 py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
        <h1 className="text-4xl font-bold">⚽ FIFA Betting Arena</h1>
        <p className="text-blue-100 mt-2">
          Place bets on live FIFA matches and compete on the leaderboard
        </p>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Featured Matches - 3 columns */}
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-4">📋 Upcoming Matches</h2>
          <MatchesList
            userId="user-123"
            userBalance={1500}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Leaderboard */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-xl font-bold mb-4">🏆 Top Players</h3>
            <Leaderboard limit={5} />
          </div>

          {/* Stats Card */}
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600">Your Stats</p>
            <p className="text-3xl font-bold text-blue-600">$1,500</p>
            <p className="text-sm text-gray-500">Current Balance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Styling & Customization

### Using with Custom Tailwind

All components use Tailwind CSS v4, so customization is easy:

```typescript
// Custom wrapper with branding
<div className="bg-gradient-to-b from-slate-900 to-slate-800">
  <MatchesList userId={id} userBalance={balance} />
</div>

// Custom spacing
<div className="px-4 md:px-8 lg:px-12 py-6">
  <Leaderboard limit={20} />
</div>

// Custom background
<div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6">
  <MatchCard match={match} userId={id} userBalance={balance} />
</div>
```

### Responsive Adjustments

Components automatically adjust for all screen sizes:

```
Mobile:     1 column grid, stacked leaderboard
Tablet:     2 column grid, 2-column top 3
Desktop:    3 column grid, full-width features
```

No additional code needed - it's built-in!

---

## 🔐 Authentication & Security

### Automatic Protection

Routes are protected by middleware:

```typescript
// These routes require authentication:
/matches        → Must be logged in
/leaderboard    → Must be logged in

// Unauthenticated access redirects to:
/auth           → Login/signup page
```

### Component-Level Checks

The page components also verify authentication:

```typescript
useEffect(() => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) router.push('/auth');
}, []);
```

### Data Security

- ✅ All bets validated server-side
- ✅ Wallet balance verified before betting
- ✅ Transactions logged for audit trail
- ✅ RLS policies enforce data isolation
- ✅ No sensitive data exposed in UI

---

## 📊 Data Requirements

### For MatchesList to work, you need:

**matches** table with sample data:
```typescript
{
  id: string;
  league: string;           // "World Cup"
  home_team: string;        // "Brazil"
  away_team: string;        // "Germany"
  match_date: string;       // ISO date
  status: string;           // "scheduled"
  odds_home: number;        // 1.85
  odds_draw: number;        // 1.95
  odds_away: number;        // 2.10
}
```

### For Leaderboard to work, you need:

**users** table with sample data:
```typescript
{
  id: string;
  username: string;
  email: string;
  full_name: string;
  wallet_balance: number;     // sorted descending
  total_bets_placed: number;
  total_won: number;
  total_lost: number;
}
```

**Add sample data:**
```bash
# Run this SQL in your Supabase console:
# See: database/sample-data.sql
```

---

## 🚀 Quick Setup Checklist

- ✅ Components created
- ✅ Pages created (/matches, /leaderboard)
- ✅ Routes protected
- ✅ Build succeeds
- ✅ Types are correct

**To get started:**

1. Load sample data from [database/sample-data.sql](database/sample-data.sql)
2. Visit `/matches` to browse and bet
3. Visit `/leaderboard` to check rankings
4. Use components in your own pages

---

## 🧪 Testing Checklist

- [ ] Navigate to `/matches` - see match grid
- [ ] Click team button - select prediction
- [ ] Enter bet amount - see winnings update
- [ ] Click "Place Bet" - bet gets placed
- [ ] Check balance updated - should decrease
- [ ] Filter matches - try each status
- [ ] Navigate to `/leaderboard` - see rankings
- [ ] Top 3 highlighted - with medals
- [ ] Table sorted - by wallet_balance
- [ ] Responsive - test on mobile/tablet/desktop

---

## 📚 Related Files

- [components/MatchCard.tsx](components/MatchCard.tsx) - Match card component
- [components/MatchesList.tsx](components/MatchesList.tsx) - Matches list
- [components/Leaderboard.tsx](components/Leaderboard.tsx) - Leaderboard
- [app/matches/page.tsx](app/matches/page.tsx) - Matches page
- [app/leaderboard/page.tsx](app/leaderboard/page.tsx) - Leaderboard page
- [app/bets/actions.ts](app/bets/actions.ts) - Bet placement logic
- [MATCHES_LEADERBOARD.md](MATCHES_LEADERBOARD.md) - Full documentation
- [BET_PLACEMENT.md](BET_PLACEMENT.md) - Betting system docs
- [database/sample-data.sql](database/sample-data.sql) - Sample data

---

## 🎉 You're All Set!

Your FIFA betting app now has:

✅ Match browsing with real odds
✅ Responsive betting interface
✅ Live balance updates
✅ User rankings & leaderboard
✅ Mobile-friendly design
✅ Complete authentication
✅ Secure bet placement
✅ Transaction logging

**Start betting and climbing the leaderboard!** 🚀
