'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function placeBet(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  const matchId = formData.get('matchId') as string;
  const predictedTeam = formData.get('predictedTeam') as string;
  const wagerAmount = parseInt(formData.get('wagerAmount') as string);

  if (!matchId || !predictedTeam || !wagerAmount || wagerAmount <= 0) return;

  // 1. Get user balance AND match data simultaneously
  const [userProfile, matchData] = await Promise.all([
    supabase.from('users').select('wallet_balance').eq('id', user.id).single(),
    supabase.from('matches').select('team_a, team_b, odds_team_a, odds_team_b').eq('id', matchId).single()
  ]);

  if (!userProfile.data || userProfile.data.wallet_balance < wagerAmount) {
    console.error("Insufficient funds");
    return;
  }

  // 2. Determine the exact odds for the chosen team
  const isTeamA = predictedTeam === matchData.data?.team_a;
  const lockedOdds = isTeamA ? matchData.data?.odds_team_a : matchData.data?.odds_team_b;

  // 3. Deduct balance and insert the bet with the locked odds
  await supabase.from('users').update({ 
    wallet_balance: userProfile.data.wallet_balance - wagerAmount 
  }).eq('id', user.id);

  await supabase.from('bets').insert({
    user_id: user.id,
    match_id: matchId,
    predicted_team: predictedTeam,
    wager_amount: wagerAmount,
    locked_odds: lockedOdds,
    status: 'pending'
  });

  revalidatePath('/dashboard');
}