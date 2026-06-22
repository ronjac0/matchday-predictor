import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { placeBet } from '../actions/place-bet';
import { syncLiveMatches } from '../actions/sync-matches';
import { claimDailyBonus } from '../actions/claim-daily';
import BetPopup from './bet-popup';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Silent Sync check: run if latest match is older than 1 hour
  const { data: recentMatch } = await supabase.from('matches').select('created_at').order('created_at', { ascending: false }).limit(1);
  if (!recentMatch?.length) await syncLiveMatches(new FormData());

  const [userProfile, matchesData, leaderboardData, userBetsData] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('matches').select('*').order('match_time', { ascending: true }),
    supabase.from('users').select('display_name, wallet_balance').order('wallet_balance', { ascending: false }).limit(10),
    supabase.from('bets').select('*').eq('user_id', user.id)
  ]);

  const userBetsMap = new Map();
  userBetsData.data?.forEach(bet => userBetsMap.set(bet.match_id, bet));

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <BetPopup bets={userBetsData.data || []} matches={matchesData.data || []} />
      
      {/* --- NAV & HEADER --- */}
      <nav className="border-b border-white/10 p-6 flex justify-between items-center sticky top-0 bg-black/50 backdrop-blur-md">
        <h1 className="text-xl font-black">PREDICTOR<span className="text-emerald-500">.</span></h1>
        <div className="flex gap-4">
          <form action={claimDailyBonus}><button className="text-[10px] font-black bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-full uppercase">🎁 CLAIM</button></form>
          <form action={syncLiveMatches}><button className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-2 rounded-full uppercase">SYNC</button></form>
          <div className="bg-zinc-900 px-4 py-2 rounded-xl text-emerald-400 font-bold">{userProfile.data?.wallet_balance} PTS</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {matchesData.data?.map((m) => (
            <div key={m.id} className="bg-zinc-900 p-6 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-zinc-400">{m.team_a} vs {m.team_b}</span>
                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${m.status === 'finished' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{m.status}</span>
              </div>
              
              {m.status === 'scheduled' ? (
                <form action={placeBet} className="flex gap-2">
                  <input type="hidden" name="matchId" value={m.id} />
                  <select name="predictedTeam" className="bg-black p-2 rounded border border-white/10 text-sm">
                    <option value={m.team_a}>{m.team_a}</option>
                    <option value={m.team_b}>{m.team_b}</option>
                  </select>
                  <input name="wagerAmount" type="number" placeholder="Stake" className="bg-black p-2 rounded border border-white/10 w-20 text-sm" />
                  <button type="submit" className="bg-emerald-500 text-black px-4 rounded font-bold text-sm">BET</button>
                </form>
              ) : (
                <p className="text-zinc-500 text-xs italic">Winner: {m.winner || 'Pending...'}</p>
              )}
            </div>
          ))}
        </div>

        <aside className="bg-zinc-900 p-6 rounded-2xl border border-white/5 h-fit sticky top-28">
           <h2 className="font-black mb-4">LEADERBOARD</h2>
           {leaderboardData.data?.map((p, i) => (
             <div key={i} className="flex justify-between py-2 text-sm">
               <span>{p.display_name}</span>
               <span className="font-mono text-emerald-400">{p.wallet_balance}</span>
             </div>
           ))}
        </aside>
      </main>
    </div>
  );
}