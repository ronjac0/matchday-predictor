'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const API_URL = 'https://api.football-data.org/v4/matches';

// --- SYNTHETIC ODDS GENERATOR ---
function generateAlgorithmicOdds(teamA: string, teamB: string) {
  // Create a deterministic "power score" based on team names so odds stay consistent
  const powerA = teamA.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50 + 50; 
  const powerB = teamB.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50 + 50;
  
  const totalPower = powerA + powerB;
  
  // Calculate implied probability (with a slight 5% bookmaker edge built in)
  const probA = (powerA / totalPower) * 1.05;
  const probB = (powerB / totalPower) * 1.05;
  
  // Convert probability to decimal odds (minimum 1.10)
  const oddsA = Math.max(1.10, 1 / probA);
  const oddsB = Math.max(1.10, 1 / probB);
  
  return { 
    oddsA: Number(oddsA.toFixed(2)), 
    oddsB: Number(oddsB.toFixed(2)) 
  };
}

export async function syncLiveMatches(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY;

  if (!apiKey) return;

  try {
    const response = await fetch(API_URL, { headers: { 'X-Auth-Token': apiKey } });
    const data = await response.json();
    
    if (!data.matches || data.matches.length === 0) return;
    
    const formattedMatches = data.matches.map((m: any) => {
      const teamA = m.homeTeam?.name || 'TBD';
      const teamB = m.awayTeam?.name || 'TBD';
      const syntheticOdds = generateAlgorithmicOdds(teamA, teamB);

      return {
        id: m.id.toString(),
        team_a: teamA,
        team_b: teamB,
        match_time: m.utcDate,
        status: m.status === 'FINISHED' ? 'finished' : 'scheduled',
        winner: m.status === 'FINISHED' ? (m.score.winner === 'HOME_TEAM' ? teamA : (m.score.winner === 'AWAY_TEAM' ? teamB : 'Draw')) : null,
        odds_team_a: syntheticOdds.oddsA,
        odds_team_b: syntheticOdds.oddsB
      };
    });

    await supabase.from('matches').upsert(formattedMatches, { onConflict: 'id' });
    await supabase.rpc('process_all_settlements');
    revalidatePath('/dashboard');
    
  } catch (error) {
    console.error("Failed to sync matches:", error);
  }
}