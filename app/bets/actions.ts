'use server';

import { supabase } from '@/lib/supabase';
import type { Bet } from '@/lib/types';

/**
 * Response type for bet placement
 */
export interface PlaceBetResponse {
  success: boolean;
  bet?: Bet;
  wallet_balance?: number;
  error?: string;
  code?: string;
}

/**
 * Validation for bet placement
 */
function validateBetInput(
  userId: string,
  matchId: string,
  prediction: string,
  amount: number
): { valid: boolean; error?: string } {
  if (!userId || userId.trim() === '') {
    return { valid: false, error: 'User ID is required' };
  }

  if (!matchId || matchId.trim() === '') {
    return { valid: false, error: 'Match ID is required' };
  }

  if (!prediction || !['home', 'draw', 'away'].includes(prediction.toLowerCase())) {
    return {
      valid: false,
      error: 'Prediction must be "home", "draw", or "away"',
    };
  }

  if (!amount || typeof amount !== 'number') {
    return { valid: false, error: 'Wager amount must be a valid number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Wager amount must be greater than 0' };
  }

  if (amount > 1000000) {
    return { valid: false, error: 'Wager amount exceeds maximum limit' };
  }

  return { valid: true };
}

/**
 * Process a bet placement
 * 
 * @param userId - The user placing the bet
 * @param matchId - The match to bet on
 * @param prediction - The predicted outcome (home, draw, away)
 * @param wagerAmount - The amount to wager
 * @returns PlaceBetResponse with success status and bet data or error
 */
export async function placeBet(
  userId: string,
  matchId: string,
  prediction: string,
  wagerAmount: number
): Promise<PlaceBetResponse> {
  try {
    // Step 1: Validate input
    const validation = validateBetInput(userId, matchId, prediction, wagerAmount);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid bet input',
        code: 'INVALID_INPUT',
      };
    }

    // Normalize prediction
    const normalizedPrediction = prediction.toLowerCase() as 'home' | 'draw' | 'away';

    // Step 2: Fetch user's current wallet balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, total_bets_placed')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    if (!userData) {
      return {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Step 3: Verify wallet balance
    if (userData.wallet_balance < wagerAmount) {
      return {
        success: false,
        error: `Insufficient balance. You have $${userData.wallet_balance.toFixed(2)} but need $${wagerAmount.toFixed(2)}`,
        code: 'INSUFFICIENT_BALANCE',
        wallet_balance: userData.wallet_balance,
      };
    }

    // Step 4: Fetch match details and odds
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) {
      console.error('Error fetching match:', matchError);
      return {
        success: false,
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND',
      };
    }

    if (!matchData) {
      return {
        success: false,
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND',
      };
    }

    // Step 5: Verify match is still available for betting
    if (matchData.status !== 'scheduled') {
      return {
        success: false,
        error: `Match is ${matchData.status}. Betting is only available for scheduled matches.`,
        code: 'MATCH_UNAVAILABLE',
      };
    }

    // Step 6: Get odds based on prediction
    let odds: number;
    switch (normalizedPrediction) {
      case 'home':
        odds = matchData.odds_home;
        break;
      case 'draw':
        odds = matchData.odds_draw;
        break;
      case 'away':
        odds = matchData.odds_away;
        break;
      default:
        return {
          success: false,
          error: 'Invalid prediction',
          code: 'INVALID_PREDICTION',
        };
    }

    const potentialWinnings = wagerAmount * odds;

    // Step 7: Create the bet record
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .insert([
        {
          user_id: userId,
          match_id: matchId,
          prediction: normalizedPrediction,
          amount: wagerAmount,
          odds,
          potential_winnings: potentialWinnings,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (betError) {
      console.error('Error creating bet:', betError);
      return {
        success: false,
        error: 'Failed to create bet. Please try again.',
        code: 'BET_CREATION_FAILED',
      };
    }

    if (!betData) {
      return {
        success: false,
        error: 'Failed to create bet. No data returned.',
        code: 'BET_CREATION_FAILED',
      };
    }

    // Step 8: Deduct wager from user's wallet balance
    const newBalance = userData.wallet_balance - wagerAmount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      // Log the error but don't fail - the bet was created
      console.error('Error updating wallet balance:', updateError);
      // In production, you might want to rollback the bet here
      return {
        success: false,
        error: 'Bet created but failed to update wallet. Please contact support.',
        code: 'WALLET_UPDATE_FAILED',
      };
    }

    // Step 9: Create transaction record for audit trail
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'bet_placed',
          amount: -wagerAmount,
          description: `Bet placed on ${matchData.home_team} vs ${matchData.away_team} (${normalizedPrediction})`,
          balance_before: userData.wallet_balance,
          balance_after: newBalance,
          related_bet_id: betData.id,
        },
      ]);

    if (transactionError) {
      // Log but don't fail - transaction is secondary
      console.warn('Warning: Failed to create transaction record:', transactionError);
    }

    // Step 10: Increment user's total bets placed
    const { error: incrementError } = await supabase
      .from('users')
      .update({ total_bets_placed: userData.total_bets_placed + 1 })
      .eq('id', userId);

    if (incrementError) {
      // Log but don't fail - this is secondary
      console.warn('Warning: Failed to update bet counter:', incrementError);
    }

    // Success!
    return {
      success: true,
      bet: betData,
      wallet_balance: newBalance,
    };
  } catch (error) {
    console.error('Unexpected error in placeBet:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Cancel a pending bet
 * Can only cancel bets that are still pending
 */
export async function cancelBet(
  userId: string,
  betId: string
): Promise<PlaceBetResponse> {
  try {
    // Validate inputs
    if (!userId || userId.trim() === '') {
      return { success: false, error: 'User ID is required', code: 'INVALID_INPUT' };
    }

    if (!betId || betId.trim() === '') {
      return { success: false, error: 'Bet ID is required', code: 'INVALID_INPUT' };
    }

    // Fetch the bet
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
      .eq('user_id', userId)
      .single();

    if (betError) {
      console.error('Error fetching bet:', betError);
      return {
        success: false,
        error: 'Bet not found',
        code: 'BET_NOT_FOUND',
      };
    }

    if (!betData) {
      return {
        success: false,
        error: 'Bet not found',
        code: 'BET_NOT_FOUND',
      };
    }

    // Verify bet is pending
    if (betData.status !== 'pending') {
      return {
        success: false,
        error: `Cannot cancel a ${betData.status} bet`,
        code: 'BET_NOT_CANCELABLE',
      };
    }

    // Get current user balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, total_bets_placed')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Update bet status
    const { error: updateBetError } = await supabase
      .from('bets')
      .update({ status: 'voided' })
      .eq('id', betId);

    if (updateBetError) {
      console.error('Error canceling bet:', updateBetError);
      return {
        success: false,
        error: 'Failed to cancel bet',
        code: 'BET_CANCEL_FAILED',
      };
    }

    // Refund the wager to user's wallet
    const newBalance = userData.wallet_balance + betData.amount;

    const { error: updateBalanceError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    if (updateBalanceError) {
      console.error('Error refunding bet:', updateBalanceError);
      return {
        success: false,
        error: 'Bet canceled but refund failed. Please contact support.',
        code: 'REFUND_FAILED',
      };
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: 'bet_voided',
          amount: betData.amount,
          description: `Bet canceled: ${betData.prediction}`,
          balance_before: userData.wallet_balance,
          balance_after: newBalance,
          related_bet_id: betData.id,
        },
      ]);

    if (transactionError) {
      console.warn('Warning: Failed to create void transaction:', transactionError);
    }

    return {
      success: true,
      bet: betData,
      wallet_balance: newBalance,
    };
  } catch (error) {
    console.error('Unexpected error in cancelBet:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
    };
  }
}
