/**
 * Utilities for testing bet placement
 * Use these functions to test the placeBet server action
 */

import { placeBet, cancelBet } from '@/app/bets/actions';

/**
 * Test placeBet with valid inputs
 */
export async function testPlaceBetSuccess() {
  console.log('Testing: Valid bet placement');

  // Replace with actual test data
  const result = await placeBet(
    '11111111-1111-1111-1111-111111111111', // test user id
    '55555555-5555-5555-5555-555555555555', // test match id
    'home',
    50
  );

  console.log('Result:', result);
  console.log('Success:', result.success);

  if (result.success) {
    console.log('✅ Bet created:', result.bet?.id);
    console.log('💰 New balance:', result.wallet_balance);
    console.log('🎯 Potential winnings:', result.bet?.potential_winnings);
  } else {
    console.log('❌ Error:', result.error);
    console.log('Code:', result.code);
  }
}

/**
 * Test placeBet with insufficient balance
 */
export async function testInsufficientBalance() {
  console.log('Testing: Insufficient balance');

  const result = await placeBet(
    '11111111-1111-1111-1111-111111111111', // test user id
    '55555555-5555-5555-5555-555555555555', // test match id
    'home',
    999999 // unrealistic amount
  );

  console.log('Result:', result);

  if (!result.success && result.code === 'INSUFFICIENT_BALANCE') {
    console.log('✅ Correctly rejected for insufficient balance');
    console.log('User balance:', result.wallet_balance);
  } else {
    console.log('❌ Unexpected result');
  }
}

/**
 * Test placeBet with invalid prediction
 */
export async function testInvalidPrediction() {
  console.log('Testing: Invalid prediction');

  const result = await placeBet(
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'invalid-prediction' as any,
    50
  );

  console.log('Result:', result);

  if (!result.success && result.code === 'INVALID_INPUT') {
    console.log('✅ Correctly rejected invalid prediction');
  } else {
    console.log('❌ Unexpected result');
  }
}

/**
 * Test placeBet with negative amount
 */
export async function testNegativeAmount() {
  console.log('Testing: Negative wager amount');

  const result = await placeBet(
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'home',
    -50
  );

  console.log('Result:', result);

  if (!result.success && result.code === 'INVALID_INPUT') {
    console.log('✅ Correctly rejected negative amount');
  } else {
    console.log('❌ Unexpected result');
  }
}

/**
 * Test placeBet with non-existent user
 */
export async function testNonExistentUser() {
  console.log('Testing: Non-existent user');

  const result = await placeBet(
    'non-existent-user-id',
    '55555555-5555-5555-5555-555555555555',
    'home',
    50
  );

  console.log('Result:', result);

  if (!result.success && result.code === 'USER_NOT_FOUND') {
    console.log('✅ Correctly rejected non-existent user');
  } else {
    console.log('❌ Unexpected result');
  }
}

/**
 * Test placeBet with non-existent match
 */
export async function testNonExistentMatch() {
  console.log('Testing: Non-existent match');

  const result = await placeBet(
    '11111111-1111-1111-1111-111111111111',
    'non-existent-match-id',
    'home',
    50
  );

  console.log('Result:', result);

  if (!result.success && result.code === 'MATCH_NOT_FOUND') {
    console.log('✅ Correctly rejected non-existent match');
  } else {
    console.log('❌ Unexpected result');
  }
}

/**
 * Test cancelBet functionality
 */
export async function testCancelBet() {
  console.log('Testing: Cancel pending bet');

  // First place a bet
  const placeBetResult = await placeBet(
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'home',
    50
  );

  if (placeBetResult.success && placeBetResult.bet) {
    // Now cancel it
    const cancelResult = await cancelBet(
      '11111111-1111-1111-1111-111111111111',
      placeBetResult.bet.id
    );

    console.log('Cancel result:', cancelResult);

    if (cancelResult.success) {
      console.log('✅ Bet canceled successfully');
      console.log('Refunded balance:', cancelResult.wallet_balance);
    } else {
      console.log('❌ Failed to cancel:', cancelResult.error);
    }
  } else {
    console.log('❌ Failed to place initial bet');
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 Running bet placement tests...\n');

  try {
    await testPlaceBetSuccess();
    console.log('\n---\n');

    await testInsufficientBalance();
    console.log('\n---\n');

    await testInvalidPrediction();
    console.log('\n---\n');

    await testNegativeAmount();
    console.log('\n---\n');

    await testNonExistentUser();
    console.log('\n---\n');

    await testNonExistentMatch();
    console.log('\n---\n');

    await testCancelBet();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('Test error:', error);
  }
}

/**
 * Example: Check user can place bet
 */
export async function checkBettingEligibility(
  userId: string,
  wagerAmount: number
): Promise<{
  eligible: boolean;
  reason?: string;
  walletBalance?: number;
}> {
  try {
    const result = await placeBet(userId, 'dummy-match-id', 'home', wagerAmount);

    if (result.code === 'MATCH_NOT_FOUND' && result.wallet_balance !== undefined) {
      // We got far enough to check balance
      if (wagerAmount <= result.wallet_balance) {
        return {
          eligible: true,
          walletBalance: result.wallet_balance,
        };
      } else {
        return {
          eligible: false,
          reason: `Insufficient balance. Need $${wagerAmount}, have $${result.wallet_balance}`,
          walletBalance: result.wallet_balance,
        };
      }
    }

    if (result.code === 'USER_NOT_FOUND') {
      return {
        eligible: false,
        reason: 'User not found',
      };
    }

    if (result.success) {
      // Shouldn't happen with dummy match, but handle it
      return {
        eligible: true,
        walletBalance: result.wallet_balance,
      };
    }

    return {
      eligible: false,
      reason: result.error,
    };
  } catch (error) {
    return {
      eligible: false,
      reason: 'Error checking eligibility',
    };
  }
}
