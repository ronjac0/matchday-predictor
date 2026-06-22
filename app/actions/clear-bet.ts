'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function clearBet(betId: string) {
  const supabase = await createClient();
  
  // Mark the bet as cleared so it hides from the dashboard
  await supabase.from('bets').update({ is_cleared: true }).eq('id', betId);
  
  // Refresh the UI
  revalidatePath('/dashboard');
}