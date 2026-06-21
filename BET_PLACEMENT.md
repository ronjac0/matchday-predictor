# Place Bet Server Action Documentation

Complete guide to the `placeBet` server action for processing bets in your sports betting app.

## Overview

The `placeBet` server action handles the complete bet placement workflow:
1. ✅ Validates input parameters
2. ✅ Fetches user's wallet balance
3. ✅ Verifies sufficient funds
4. ✅ Fetches match details and odds
5. ✅ Validates match is available for betting
6. ✅ Creates bet record in database
7. ✅ Deducts wager from user's wallet
8. ✅ Creates transaction record for audit trail
9. ✅ Updates user's bet counter
10. ✅ Returns success/error response

## File Location

```
app/bets/actions.ts
```

## Function Signature

```typescript
export async function placeBet(
  userId: string,
  matchId: string,
  prediction: string,
  wagerAmount: number
): Promise<PlaceBetResponse>
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ Yes | The UUID of the user placing the bet |
| `matchId` | string | ✅ Yes | The UUID of the match to bet on |
| `prediction` | string | ✅ Yes | The predicted outcome: "home", "draw", or "away" |
| `wagerAmount` | number | ✅ Yes | The amount to wager (positive number) |

## Response Type

```typescript
interface PlaceBetResponse {
  success: boolean;
  bet?: Bet;                    // Created bet object if successful
  wallet_balance?: number;      // New wallet balance after bet
  error?: string;               // Error message if failed
  code?: string;                // Error code for programmatic handling
}
```

## Response Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `INVALID_INPUT` | 400 | Invalid parameters (missing/malformed) |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `MATCH_NOT_FOUND` | 404 | Match does not exist |
| `INSUFFICIENT_BALANCE` | 400 | Wallet balance < wager amount |
| `MATCH_UNAVAILABLE` | 400 | Match status not "scheduled" |
| `INVALID_PREDICTION` | 400 | Prediction not home/draw/away |
| `BET_CREATION_FAILED` | 500 | Database error creating bet |
| `WALLET_UPDATE_FAILED` | 500 | Failed to deduct from wallet |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Usage Examples

### 1. Basic Usage (Server Component)

```typescript
import { placeBet } from '@/app/bets/actions';

export default async function ServerComponent() {
  const result = await placeBet(
    'user-uuid-here',
    'match-uuid-here',
    'home',
    50
  );

  if (result.success) {
    console.log('Bet placed!', result.bet);
    console.log('New balance:', result.wallet_balance);
  } else {
    console.error('Error:', result.error);
  }
}
```

### 2. Client Component with Form

```typescript
'use client';

import { placeBet } from '@/app/bets/actions';
import { useState } from 'react';

export default function BetForm({ userId, matchId }) {
  const [amount, setAmount] = useState('');
  const [team, setTeam] = useState('home');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await placeBet(userId, matchId, team, parseFloat(amount));

    if (result.success) {
      alert(`Bet placed! Potential winnings: $${result.bet?.potential_winnings}`);
      setAmount('');
    } else {
      alert(`Error: ${result.error}`);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Wager amount"
      />
      <select value={team} onChange={(e) => setTeam(e.target.value as any)}>
        <option value="home">Home Win</option>
        <option value="draw">Draw</option>
        <option value="away">Away Win</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Placing...' : 'Place Bet'}
      </button>
    </form>
  );
}
```

### 3. API Route Usage

```typescript
// app/api/bets/place/route.ts
import { placeBet } from '@/app/bets/actions';

export async function POST(request: Request) {
  const { userId, matchId, prediction, amount } = await request.json();

  const result = await placeBet(userId, matchId, prediction, amount);

  if (result.success) {
    return Response.json(
      { bet: result.bet, wallet_balance: result.wallet_balance },
      { status: 201 }
    );
  } else {
    return Response.json(
      { error: result.error, code: result.code },
      { status: 400 }
    );
  }
}
```

### 4. Error Handling

```typescript
const result = await placeBet(userId, matchId, 'home', 100);

if (!result.success) {
  switch (result.code) {
    case 'INSUFFICIENT_BALANCE':
      console.error(`Need $${100}, but have $${result.wallet_balance}`);
      break;
    case 'MATCH_UNAVAILABLE':
      console.error('Match is not available for betting');
      break;
    case 'USER_NOT_FOUND':
      console.error('User does not exist');
      break;
    case 'INVALID_INPUT':
      console.error('Invalid parameters:', result.error);
      break;
    default:
      console.error('Unknown error:', result.error);
  }
}
```

## Validation Rules

### User ID
- Required
- Must be valid UUID
- User must exist in database

### Match ID
- Required
- Must be valid UUID
- Match must exist in database
- Match status must be "scheduled"

### Prediction
- Required
- Must be one of: "home", "draw", "away" (case-insensitive)
- Case is normalized to lowercase

### Wager Amount
- Required
- Must be positive number (> 0)
- Must be <= user's wallet balance
- Maximum: 1,000,000
- Precision: up to 2 decimal places

## Database Operations

### Tables Updated
1. **bets** - New record inserted
2. **users** - Wallet balance decremented
3. **transactions** - Audit record created

### Transaction Record
Automatically creates a transaction with:
- Type: "bet_placed"
- Amount: negative (the wager)
- Description: "Bet placed on [Home] vs [Away] (prediction)"
- Balance before/after
- Related bet ID

### User Stats Updated
- `total_bets_placed` incremented by 1

## Security Features

✅ **Input Validation** - All inputs checked before processing
✅ **User Verification** - Bets can only be placed by authenticated users
✅ **Balance Verification** - Wallet balance checked before deducting
✅ **Match Validation** - Only scheduled matches accept bets
✅ **Atomic Operations** - Bet and wallet updated in sequence
✅ **Audit Trail** - All transactions recorded
✅ **Error Handling** - Graceful error responses with helpful messages

## Error Scenarios

### Scenario: Insufficient Balance

```
Input: User has $50, tries to wager $100

Response:
{
  success: false,
  error: "Insufficient balance. You have $50.00 but need $100.00",
  code: "INSUFFICIENT_BALANCE",
  wallet_balance: 50
}
```

### Scenario: Match Already Started

```
Input: Match status is "live", not "scheduled"

Response:
{
  success: false,
  error: "Match is live. Betting is only available for scheduled matches.",
  code: "MATCH_UNAVAILABLE"
}
```

### Scenario: Invalid Prediction

```
Input: prediction = "winner" (not home/draw/away)

Response:
{
  success: false,
  error: "Prediction must be \"home\", \"draw\", or \"away\"",
  code: "INVALID_INPUT"
}
```

### Scenario: Successful Bet

```
Input:
- userId: "123e4567-..."
- matchId: "987e6543-..."
- prediction: "home"
- wagerAmount: 100

Response:
{
  success: true,
  bet: {
    id: "bet-uuid",
    user_id: "123e4567-...",
    match_id: "987e6543-...",
    prediction: "home",
    amount: 100,
    odds: 1.85,
    potential_winnings: 185,
    status: "pending",
    placed_at: "2024-06-20T10:30:00Z"
  },
  wallet_balance: 900
}
```

## Related Functions

### cancelBet(userId, betId)
Cancel a pending bet and refund the wager.

```typescript
const result = await cancelBet(userId, betId);
if (result.success) {
  console.log('Bet canceled, refunded:', result.wallet_balance);
}
```

## Components Using placeBet

### PlaceBetForm.tsx
Pre-built component with UI for placing bets.

```typescript
import PlaceBetForm from '@/components/PlaceBetForm';

<PlaceBetForm 
  match={matchData}
  userId={user.id}
  userBalance={user.wallet_balance}
  onSuccess={(result) => console.log('Bet placed!', result)}
  onError={(error) => console.error(error)}
/>
```

## Data Flow

```
User submits bet form
        ↓
placeBet server action called
        ↓
Validate inputs
        ↓
Fetch user from database
        ↓
Check wallet balance
        ↓
Fetch match details
        ↓
Verify match is available
        ↓
Get odds for prediction
        ↓
Create bet record in database
        ↓
Update user wallet balance
        ↓
Create transaction record
        ↓
Update user bet counter
        ↓
Return success response with new balance
```

## Best Practices

### ✅ Do
- Always check `result.success` before accessing `result.bet`
- Use the error code for programmatic error handling
- Validate amount and prediction on client before calling
- Show user-friendly error messages
- Update UI with new wallet balance on success
- Use `PlaceBetForm` component for consistent UX

### ❌ Don't
- Trust client-side validation alone (server validates too)
- Pass negative or zero amounts
- Use invalid user/match IDs
- Ignore the response code
- Assume balance didn't change after error
- Manually update wallet without calling this function

## Testing

### Test Cases

```typescript
// Test 1: Valid bet
const result = await placeBet(
  'valid-user-id',
  'valid-match-id',
  'home',
  50
);
expect(result.success).toBe(true);
expect(result.wallet_balance).toBeLessThan(initialBalance);

// Test 2: Insufficient balance
const result = await placeBet(
  'user-with-$10',
  'valid-match-id',
  'home',
  100
);
expect(result.code).toBe('INSUFFICIENT_BALANCE');

// Test 3: Invalid prediction
const result = await placeBet(
  'valid-user-id',
  'valid-match-id',
  'invalid',
  50
);
expect(result.code).toBe('INVALID_INPUT');

// Test 4: Unavailable match
const result = await placeBet(
  'valid-user-id',
  'completed-match-id',
  'home',
  50
);
expect(result.code).toBe('MATCH_UNAVAILABLE');
```

## Performance Considerations

- ⚡ Uses single database queries where possible
- ⚡ Indexes on user_id, match_id, and status for fast lookups
- ⚡ Transactions are logged asynchronously
- ⚡ Bet counter update is non-blocking (warnings only if fail)

## Troubleshooting

### Issue: "User not found"
**Cause:** User ID doesn't exist
**Solution:** Verify user exists in users table

### Issue: "Insufficient balance"
**Cause:** Wager > wallet balance
**Solution:** Check user's current balance first

### Issue: "Match not found"
**Cause:** Match ID doesn't exist
**Solution:** Verify match exists in matches table

### Issue: "Match unavailable for betting"
**Cause:** Match status isn't "scheduled"
**Solution:** Only bet on scheduled matches

### Issue: Server error with no details
**Cause:** Database connection issue
**Solution:** Check Supabase project is running

## Related Documentation

- [Database Schema](database/README.md) - Bets table structure
- [API Routes](app/api/bets/route.ts) - REST API example
- [Authentication](AUTHENTICATION.md) - User auth setup
- [Validation](lib/validation.ts) - Form validation utilities

## Support

For issues or questions:
1. Check error code in response
2. Review error message for details
3. See troubleshooting section above
4. Check database schema in Supabase
5. Review browser console for logs
