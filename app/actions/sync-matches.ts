'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';

export async function syncLiveMatches(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY;

  if (!apiKey) return;

  try {
    const response = await fetch(API_URL, { headers: { 'X-Auth-Token': apiKey } });
    const data = await response.json();
    
    // 1. Format the data from the API
    const formattedMatches = data.matches.map((m: any) => ({
      id: m.id.toString(),
      team_a: m.homeTeam?.name,
      team_b: m.awayTeam?.name,
      match_time: m.utcDate,
      status: m.status === 'FINISHED' ? 'finished' : 'scheduled',
      winner: m.status === 'FINISHED' ? (m.score.winner === 'HOME_TEAM' ? m.homeTeam.name : m.awayTeam.name) : null
    }));

    // 2. Save the fresh match statuses and winners to the database
    await supabase.from('matches').upsert(formattedMatches, { onConflict: 'id' });
    
    // 3. THE PROPER FIX: Run the Sweeper to securely pay out any newly finished matches
    await supabase.rpc('process_all_settlements');

    // 4. Refresh the dashboard for the user
    revalidatePath('/dashboard');
    
  } catch (error) {
    console.error("Failed to sync matches:", error);
  }
}