'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// FIX: Explicitly returning Promise<void> to satisfy Vercel's strict type-checker
export async function placeBet(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('Not authenticated');
    return;
  }

  const matchId = formData.get('matchId') as string;
  const predictedTeam = formData.get('predictedTeam') as string;
  const wagerAmount = parseInt(formData.get('wagerAmount') as string);

  if (!matchId || !predictedTeam || isNaN(wagerAmount) || wagerAmount <= 0) {
    console.error('Invalid bet details');
    return;
  }

  // 1. Check if the user has ALREADY bet on this match
  const { data: existingBet } = await supabase
    .from('bets')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .single();

  if (existingBet) {
    console.error('You have already placed a bet on this match. One bet per fixture!');
    return;
  }

  // 2. Fetch User Profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    console.error('User profile not found');
    return;
  }
  
  if (userData.wallet_balance < wagerAmount) {
    console.error('Insufficient virtual coins!');
    return;
  }

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
    console.error('Failed to record your bet.');
    return;
  }

  // Instantly refresh the dashboard to show the new bet and updated balance
  revalidatePath('/dashboard');
}