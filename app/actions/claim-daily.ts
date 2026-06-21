'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function claimDailyBonus(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  // Fetch current balance
  const { data: userData } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', user.id)
    .single();

  if (!userData) return;

  // Add 50 points
  await supabase
    .from('users')
    .update({ wallet_balance: userData.wallet_balance + 50 })
    .eq('id', user.id);

  // Refresh the dashboard to show new balance
  revalidatePath('/dashboard');
}