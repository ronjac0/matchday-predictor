'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function forceSettleBets() {
  const supabase = await createClient();
  
  // Directly trigger the database payout sweeper
  const { error } = await supabase.rpc('process_all_settlements');
  
  if (error) {
    console.error("Payout failed:", error);
  }

  // Refresh the dashboard to show the new balances
  revalidatePath('/dashboard');
}