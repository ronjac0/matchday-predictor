'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// NOTE: You will need a free API key from https://www.football-data.org/
// Add NEXT_PUBLIC_FOOTBALL_API_KEY=your_key to your .env.local file
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';

export async function syncLiveMatches() {
  const supabase = await createClient();
  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY;

  if (!apiKey) {
    return { error: 'Missing API Key in .env.local' };
  }

  try {
    const response = await fetch(API_URL, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 3600 } // Cache for 1 hour to prevent API rate limits
    });

    if (!response.ok) throw new Error('Failed to fetch from Football API');

    const data = await response.json();
    const upcomingMatches = data.matches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED').slice(0, 10);

    // Format for Supabase
    const formattedMatches = upcomingMatches.map((match: any) => ({
      id: match.id.toString(), // Use their ID to prevent duplicates
      team_a: match.homeTeam?.name || 'TBD',
      team_b: match.awayTeam?.name || 'TBD',
      match_time: match.utcDate,
      status: 'scheduled'
    }));

    // Upsert into database (Update if exists, insert if new)
    const { error } = await supabase.from('matches').upsert(formattedMatches, { onConflict: 'id' });

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, message: `Synced ${formattedMatches.length} live matches!` };

  } catch (error: any) {
    return { error: error.message };
  }
}