// ADD THIS EXACT LINE AT THE VERY TOP to kill the Next.js cache
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { placeBet } from '../actions/place-bet';
import { syncLiveMatches } from '../actions/sync-matches';
import { claimDailyBonus } from '../actions/claim-daily';
import BetPopup from './bet-popup';

// --- BULLETPROOF FLAG DICTIONARY ---
const getFlag = (teamName: string) => {
  if (!teamName) return '🏳️';
  const name = teamName.toLowerCase();
  
  if (name.includes('argentina')) return '🇦🇷';
  if (name.includes('france')) return '🇫🇷';
  if (name.includes('brazil') || name.includes('brasil')) return '🇧🇷';
  if (name.includes('england')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (name.includes('portugal')) return '🇵🇹';
  if (name.includes('spain') || name.includes('españa')) return '🇪🇸';
  if (name.includes('germany') || name.includes('deutschland')) return '🇩🇪';
  if (name.includes('italy') || name.includes('italia')) return '🇮🇹';
  if (name.includes('netherland') || name.includes('holland')) return '🇳🇱';
  if (name.includes('croatia')) return '🇭🇷';
  if (name.includes('morocco')) return '🇲🇦';
  if (name.includes('usa') || name.includes('united states')) return '🇺🇸';
  if (name.includes('mexico')) return '🇲🇽';
  if (name.includes('japan')) return '🇯🇵';
  if (name.includes('senegal')) return '🇸🇳';
  if (name.includes('uruguay')) return '🇺🇾';
  if (name.includes('belgium')) return '🇧🇪';
  if (name.includes('canada')) return '🇨🇦';
  if (name.includes('korea')) return '🇰🇷'; 
  if (name.includes('wales')) return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
  if (name.includes('iran')) return '🇮🇷'; 
  if (name.includes('saudi')) return '🇸🇦';
  if (name.includes('poland')) return '🇵🇱';
  if (name.includes('australia')) return '🇦🇺';
  if (name.includes('denmark')) return '🇩🇰';
  if (name.includes('tunisia')) return '🇹🇳';
  if (name.includes('costa rica')) return '🇨🇷';
  if (name.includes('cameroon')) return '🇨🇲';
  if (name.includes('ghana')) return '🇬🇭';
  if (name.includes('serbia')) return '🇷🇸';
  if (name.includes('switzerland')) return '🇨🇭';
  if (name.includes('ecuador')) return '🇪🇨';
  if (name.includes('qatar')) return '🇶🇦';
  if (name.includes('turkey') || name.includes('türkiye')) return '🇹🇷';
  if (name.includes('czech')) return '🇨🇿';
  if (name.includes('ukraine')) return '🇺🇦';
  if (name.includes('colombia')) return '🇨🇴';
  if (name.includes('chile')) return '🇨🇱';
  if (name.includes('peru')) return '🇵🇪';
  if (name.includes('egypt')) return '🇪🇬';
  if (name.includes('algeria')) return '🇩🇿';
  if (name.includes('ivory') || name.includes('ivoire')) return '🇨🇮';
  if (name.includes('nigeria')) return '🇳🇬';
  if (name.includes('scotland')) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (name.includes('ireland')) return '🇮🇪';
  if (name.includes('austria')) return '🇦🇹';
  if (name.includes('hungary')) return '🇭🇺';
  if (name.includes('romania')) return '🇷🇴';
  if (name.includes('sweden')) return '🇸🇪';
  
  return '🏳️';
};

const formatMatchTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' UTC';
};

const getManagerTier = (points: number) => {
  if (points >= 10000) return { title: '👑 The Oracle', color: 'text-amber-400' };
  if (points >= 5000) return { title: '🥇 The Gaffer', color: 'text-yellow-300' };
  if (points >= 2000) return { title: '🥈 First Team', color: 'text-zinc-300' };
  return { title: '🥉 Academy', color: 'text-orange-400' };
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // --- THE FIXED SILENT SYNC ---
  // Grab the single most recently updated match to check the data freshness
  const { data: recentMatch } = await supabase
    .from('matches')
    .select('match_time')
    .order('match_time', { ascending: false })
    .limit(1);

  // If we have no matches, OR if the app needs to pull initial data, trigger it.
  if (!recentMatch || recentMatch.length === 0) {
    await syncLiveMatches(new FormData());
  }

  // Fetch all fresh data simultaneously
  const [userProfile, matchesData, leaderboardData, userBetsData] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('matches').select('*').order('match_time', { ascending: true }),
    supabase.from('users').select('display_name, wallet_balance').order('wallet_balance', { ascending: false }).limit(10),
    supabase.from('bets').select('*').eq('user_id', user.id)
  ]);

  const userBetsMap = new Map();
  userBetsData.data?.forEach(bet => userBetsMap.set(bet.match_id, bet));
  
  const currentTier = getManagerTier(userProfile.data?.wallet_balance || 0);

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 font-sans selection:bg-emerald-500/30 relative overflow-x-hidden">
      
      {/* CSS Animations for Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 30s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}} />

      <BetPopup bets={userBetsData.data || []} matches={matchesData.data || []} />

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Live Marquee */}
      <div className="bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest py-1.5 overflow-hidden border-b border-emerald-400 relative z-50">
        <div className="animate-marquee">
          <span className="mx-4">⚽ WELCOME TO MATCHDAY PREDICTOR</span> • 
          <span className="mx-4">🔥 STREAKS COMING SOON</span> • 
          <span className="mx-4">💰 BUILD YOUR BANKROLL</span> • 
          <span className="mx-4">👑 REACH 'THE ORACLE' TIER</span> • 
          <span className="mx-4">📈 ODDS UPDATED HOURLY</span> •
          <span className="mx-4">⚽ WELCOME TO MATCHDAY PREDICTOR</span> • 
          <span className="mx-4">🔥 STREAKS COMING SOON</span> • 
          <span className="mx-4">💰 BUILD YOUR BANKROLL</span> • 
          <span className="mx-4">👑 REACH 'THE ORACLE' TIER</span> • 
          <span className="mx-4">📈 ODDS UPDATED HOURLY</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <span className="text-black font-black text-xl leading-none">P</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase hidden sm:block">
              Predictor<span className="text-emerald-500">.</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <form action={claimDailyBonus}>
              <button type="submit" className="group flex items-center gap-2 text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-full hover:bg-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                🎁 CLAIM +50
              </button>
            </form>

            <form action={syncLiveMatches}>
              <button type="submit" className="group flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">SYNC</span>
              </button>
            </form>
            
            <div className="h-6 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className={`text-[10px] uppercase tracking-widest font-black ${currentTier.color}`}>{currentTier.title}</p>
                <p className="text-sm font-bold text-white leading-tight">{userProfile.data?.display_name}</p>
              </div>
              <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                <span className="text-emerald-400 font-black text-sm">PTS</span>
                <span className="text-lg font-black text-white tracking-tight">{userProfile.data?.wallet_balance}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 xl:grid-cols-12 gap-10 relative z-10">
        
        {/* Left Column: Matches & History */}
        <div className="xl:col-span-8 space-y-12">
          
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-3">
                <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                Featured Matchups
              </h2>
            </div>

            {matchesData.data?.length === 0 ? (
              <div className="border border-white/10 border-dashed rounded-3xl p-16 text-center bg-zinc-950/50">
                <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">No active fixtures available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {matchesData.data?.map((match) => {
                  const hasBet = userBetsMap.has(match.id);
                  const userBetDetails = userBetsMap.get(match.id);
                  const isCompleted = match.status !== 'scheduled';

                  return (
                    <div key={match.id} className={`bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl group relative transition-all duration-500 ${isCompleted ? 'opacity-40 blur-[2px] grayscale-[0.5] hover:opacity-100 hover:blur-none hover:grayscale-0' : 'hover:bg-zinc-900/80 hover:border-white/10'}`}>
                      
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest whitespace-nowrap">
                          {formatMatchTime(match.match_time)}
                        </span>
                      </div>

                      <div className="p-6 pt-12 sm:p-8 sm:pt-14 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 text-[100px] font-black text-white/[0.02] whitespace-nowrap pointer-events-none uppercase">{match.team_a}</div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 text-[100px] font-black text-white/[0.02] whitespace-nowrap pointer-events-none uppercase">{match.team_b}</div>

                        <div className="flex items-center gap-4 w-[40%] z-10">
                          <span className="text-5xl sm:text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500">{getFlag(match.team_a)}</span>
                          <span className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight truncate">{match.team_a}</span>
                        </div>
                        
                        <div className="w-[20%] flex flex-col items-center justify-center z-10">
                          <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                            <span className="text-xs uppercase tracking-widest text-zinc-400 font-black">VS</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end gap-4 w-[40%] z-10 text-right">
                          <span className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight truncate">{match.team_b}</span>
                          <span className="text-5xl sm:text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500">{getFlag(match.team_b)}</span>
                        </div>
                      </div>
                      
                      <div className="bg-black/40 border-t border-white/5 p-4 sm:px-8">
                        {isCompleted ? (
                          <div className="text-center py-2 flex flex-col items-center gap-1">
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Match Finished</span>
                            <span className="text-sm font-bold text-emerald-400">Winner: {match.winner || 'Pending Database Sync'}</span>
                          </div>
                        ) : hasBet ? (
                          <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                              Bet Locked In
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-white">{userBetDetails.predicted_team}</span>
                              <span className="text-emerald-500 font-bold">•</span>
                              <span className="text-sm font-black text-white font-mono">{userBetDetails.wager_amount} PTS</span>
                            </div>
                          </div>
                        ) : (
                          <form action={placeBet} className="flex flex-col sm:flex-row gap-4 items-center">
                            <input type="hidden" name="matchId" value={match.id} />
                            
                            <div className="w-full sm:w-1/3 relative">
                              <select name="predictedTeam" required className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer transition-colors">
                                <option value="" className="text-zinc-500">Select Winner...</option>
                                <option value={match.team_a}>{match.team_a}</option>
                                <option value={match.team_b}>{match.team_b}</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                            </div>
                            
                            <div className="w-full sm:w-1/3 relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-black tracking-widest">PTS</span>
                              <input type="number" name="wagerAmount" placeholder="Stake" required min="1" className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 pl-12 text-sm font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-colors" />
                            </div>
                            
                            <button 
                              type="submit" 
                              className="w-full sm:w-1/3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl p-3.5 text-sm transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                              Place Wager
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-zinc-700 rounded-full"></span>
              Open & Settled Slips
            </h2>
            
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              {userBetsData.data?.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-sm font-semibold uppercase tracking-widest">No betting history found.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {userBetsData.data?.map((bet) => {
                    const match = matchesData.data?.find(m => m.id === bet.match_id);
                    const matchName = match ? `${match.team_a} vs ${match.team_b}` : 'Unknown Fixture';
                    
                    let statusStyle = "text-zinc-400 bg-zinc-800/50 border-zinc-700/50"; 
                    if (bet.status === 'won') statusStyle = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                    if (bet.status === 'lost') statusStyle = "text-red-400 bg-red-500/10 border-red-500/20";

                    return (
                      <div key={bet.id} className="p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div>
                          <p className="text-sm font-bold text-white">{matchName}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Pick:</span>
                            <span className="text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded-md">{bet.predicted_team} {getFlag(bet.predicted_team)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Risk</p>
                            <p className="text-sm font-black text-white font-mono">{bet.wager_amount} PTS</p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${statusStyle} min-w-[90px] text-center`}>
                            {bet.status || 'Pending'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Leaderboard */}
        <div className="xl:col-span-4">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 sticky top-28 backdrop-blur-md shadow-2xl">
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <span className="text-xl">🏆</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight uppercase">Global Ranks</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Top Predictors</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {leaderboardData.data?.map((player, index) => {
                const isTopThree = index < 3;
                let rankVisual = <span className="text-zinc-600 font-black">{index + 1}</span>;
                
                if (index === 0) rankVisual = <span className="text-amber-400 font-black text-lg">1</span>;
                if (index === 1) rankVisual = <span className="text-zinc-300 font-black text-lg">2</span>;
                if (index === 2) rankVisual = <span className="text-orange-500 font-black text-lg">3</span>;

                const playerTier = getManagerTier(player.wallet_balance);
                
                return (
                  <div key={index} className={`flex justify-between items-center p-4 rounded-xl transition-all ${isTopThree ? 'bg-white/5 border border-white/10' : 'hover:bg-white/[0.02] border border-transparent'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-6 text-center">{rankVisual}</div>
                      <div>
                         <span className={`text-sm block ${isTopThree ? 'text-white font-black' : 'text-zinc-400 font-bold'}`}>
                           {player.display_name}
                         </span>
                         <span className={`text-[9px] uppercase tracking-widest font-black ${playerTier.color}`}>
                           {playerTier.title}
                         </span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-400 font-mono tracking-tight">
                      {player.wallet_balance}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}