'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// CHANGED: Removed the "WC" restriction to pull all current matches available on the free tier
const API_URL = 'https://api.football-data.org/v4/matches';

export async function syncLiveMatches(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY;

  if (!apiKey) {
    console.error("Missing API Key");
    return;
  }

  try {
    const response = await fetch(API_URL, { headers: { 'X-Auth-Token': apiKey } });
    const data = await response.json();
    
    // DEBUGGING: This will print the API data to your VS Code Terminal
    console.log("Football API Response:", data);

    if (!data.matches || data.matches.length === 0) {
      console.log("API returned no matches for today.");
      return;
    }
    
    const formattedMatches = data.matches.map((m: any) => ({
      id: m.id.toString(),
      team_a: m.homeTeam?.name || 'TBD',
      team_b: m.awayTeam?.name || 'TBD',
      match_time: m.utcDate,
      status: m.status === 'FINISHED' ? 'finished' : 'scheduled',
      winner: m.status === 'FINISHED' ? (m.score.winner === 'HOME_TEAM' ? m.homeTeam.name : (m.score.winner === 'AWAY_TEAM' ? m.awayTeam.name : 'Draw')) : null
    }));

    await supabase.from('matches').upsert(formattedMatches, { onConflict: 'id' });
    
    // Run the automated payout sweeper
    await supabase.rpc('process_all_settlements');

    revalidatePath('/dashboard');
    
  } catch (error) {
    console.error("Failed to sync matches:", error);
  }
}