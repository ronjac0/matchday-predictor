'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function placeBet(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const matchId = formData.get('matchId') as string;
  const predictedTeam = formData.get('predictedTeam') as string;
  const wagerAmount = parseInt(formData.get('wagerAmount') as string);

  if (!matchId || !predictedTeam || isNaN(wagerAmount) || wagerAmount <= 0) {
    return { error: 'Invalid bet details' };
  }

  // 1. Check if the user has ALREADY bet on this match
  const { data: existingBet } = await supabase
    .from('bets')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .single();

  if (existingBet) {
    return { error: 'You have already placed a bet on this match. One bet per fixture!' };
  }

  // 2. Fetch User Profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', user.id)
    .single();

  if (userError || !userData) return { error: 'User profile not found' };
  if (userData.wallet_balance < wagerAmount) return { error: 'Insufficient virtual coins!' };

  // 3. Deduct from wallet
  const newBalance = userData.wallet_balance - wagerAmount;
  await supabase
    .from('users')
    .update({ wallet_balance: newBalance })
    .eq('id', user.id);

  // 4. Place the bet
  const { error: betError } = await supabase.from('bets').insert({
    user_id: user.id,
    match_id: matchId,
    predicted_team: predictedTeam,
    wager_amount: wagerAmount,
    status: 'pending'
  });

  if (betError) {
    // Refund if bet database insert fails
    await supabase.from('users').update({ wallet_balance: userData.wallet_balance }).eq('id', user.id);
    return { error: 'Failed to record your bet.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}