'use server'

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';

// The function now explicitly returns Promise<void> to satisfy strict HTML Form typing
export async function syncLiveMatches(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY;

  if (!apiKey) {
    console.error('Missing API Key in .env.local');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 3600 } 
    });

    if (!response.ok) throw new Error('Failed to fetch from Football API');

    const data = await response.json();
    
    if (!data.matches) {
      throw new Error('Invalid data format received from API');
    }

    const upcomingMatches = data.matches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED').slice(0, 10);

    const formattedMatches = upcomingMatches.map((match: any) => ({
      id: match.id.toString(), 
      team_a: match.homeTeam?.name || 'TBD',
      team_b: match.awayTeam?.name || 'TBD',
      match_time: match.utcDate,
      status: 'scheduled'
    }));

    const { error } = await supabase.from('matches').upsert(formattedMatches, { onConflict: 'id' });

    if (error) throw error;

    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error('API Sync Error:', error.message);
  }
}