'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function claimDailyBonus(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  // 1. Fetch current balance AND the timestamp of their last claim
  const { data: userData } = await supabase
    .from('users')
    .select('wallet_balance, last_bonus_claim')
    .eq('id', user.id)
    .single();

  if (!userData) return;

  // 2. The Backend Time Lock
  if (userData.last_bonus_claim) {
    const lastClaimTime = new Date(userData.last_bonus_claim).getTime();
    const now = new Date().getTime();
    
    // Calculate how many hours have passed since the last claim
    const hoursPassed = (now - lastClaimTime) / (1000 * 60 * 60);

    if (hoursPassed < 24) {
      // Security trigger: Reject the claim if it hasn't been 24 hours
      console.error(`Nice try! You must wait ${Math.ceil(24 - hoursPassed)} more hours.`);
      return; 
    }
  }

  // 3. Grant the points AND update the timestamp to right now
  await supabase
    .from('users')
    .update({ 
      wallet_balance: userData.wallet_balance + 50,
      last_bonus_claim: new Date().toISOString()
    })
    .eq('id', user.id);

  // Refresh the dashboard to show the new balance
  revalidatePath('/dashboard');
}