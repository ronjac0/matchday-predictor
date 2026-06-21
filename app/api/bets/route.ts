/**
 * Example: Fetch User's Bets with Matches
 * This shows how to query the database using Supabase with proper typing
 */

import { supabase } from '@/lib/supabase';
import type { BetWithMatch } from '@/lib/types';

export async function GET() {
  try {
    // Get current user's ID from Supabase Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's bets with related match data
    // RLS automatically filters to only this user's bets
    const { data: bets, error } = await supabase
      .from('bets')
      .select(
        `
        id,
        user_id,
        match_id,
        prediction,
        amount,
        odds,
        potential_winnings,
        status,
        result,
        placed_at,
        settled_at,
        matches (
          id,
          league,
          home_team,
          away_team,
          match_date,
          status,
          home_score,
          away_score,
          winner,
          odds_home,
          odds_draw,
          odds_away
        )
      `
      )
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ bets });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Example: Place a New Bet using Server Action
 */
export async function POST(request: Request) {
  try {
    const { match_id, prediction, amount } = await request.json();

    // Validate input
    if (!match_id || !prediction || !amount) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import and call the server action
    const { placeBet } = await import('@/app/bets/actions');

    const result = await placeBet(user.id, match_id, prediction, amount);

    if (!result.success) {
      // Map error codes to HTTP status codes
      let statusCode = 400;
      if (result.code === 'USER_NOT_FOUND' || result.code === 'MATCH_NOT_FOUND') {
        statusCode = 404;
      } else if (result.code === 'INTERNAL_ERROR') {
        statusCode = 500;
      }

      return Response.json(
        {
          error: result.error,
          code: result.code,
          wallet_balance: result.wallet_balance,
        },
        { status: statusCode }
      );
    }

    return Response.json(
      {
        success: true,
        bet: result.bet,
        wallet_balance: result.wallet_balance,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
