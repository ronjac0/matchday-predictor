import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { placeBet } from '../actions/place-bet';
import { syncLiveMatches } from '../actions/sync-matches';

// --- EXPANDED FLAG DICTIONARY ---
const getFlag = (teamName: string) => {
  if (!teamName) return '';
  const name = teamName.toLowerCase().replace(/ fc| afc| united| city/ig, '').trim();
  const flags: Record<string, string> = {
    'argentina': '🇦🇷', 'france': '🇫🇷', 'brazil': '🇧🇷', 'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'portugal': '🇵🇹', 'spain': '🇪🇸', 'germany': '🇩🇪', 'italy': '🇮🇹',
    'netherlands': '🇳🇱', 'croatia': '🇭🇷', 'morocco': '🇲🇦', 'usa': '🇺🇸',
    'united states': '🇺🇸', 'mexico': '🇲🇽', 'japan': '🇯🇵', 'senegal': '🇸🇳',
    'uruguay': '🇺🇾', 'belgium': '🇧🇪', 'canada': '🇨🇦', 'south korea': '🇰🇷'
  };
  return flags[name] || '🏳️';
};

// --- REAL-LIFE CAPTAINS DICTIONARY (Using reliable ESPN CDNs) ---
const getCaptain = (teamName: string) => {
  // Safe fallback if teamName is unexpectedly blank
  if (!teamName) return { name: 'Squad', img: `https://ui-avatars.com/api/?name=TBD&background=27272a&color=10b981` };
  
  const name = teamName.toLowerCase().replace(/ fc| afc| united| city/ig, '').trim();
  
  // ESPN provides transparent, hotlink-friendly PNGs
  const captains: Record<string, { name: string, img: string }> = {
    'argentina': { name: 'L. Messi', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/45843.png' },
    'france': { name: 'K. Mbappé', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/229497.png' },
    'brazil': { name: 'Neymar Jr', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/132284.png' },
    'england': { name: 'H. Kane', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/132104.png' },
    'portugal': { name: 'C. Ronaldo', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/22774.png' },
    'spain': { name: 'Á. Morata', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/149021.png' },
    'germany': { name: 'İ. Gündoğan', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/131710.png' },
    'usa': { name: 'C. Pulisic', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/225046.png' },
    'united states': { name: 'C. Pulisic', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/225046.png' },
    'croatia': { name: 'L. Modrić', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/41606.png' },
    'netherlands': { name: 'V. van Dijk', img: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/161060.png' }
  };
  
  // If no official photo is found, generate a sleek initial-based graphic
  return captains[name] || { 
    name: 'Squad', 
    img: `https://ui-avatars.com/api/?name=${teamName.charAt(0)}&background=27272a&color=10b981&font-size=0.4&bold=true` 
  };
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const [userProfile, matchesData, leaderboardData, userBetsData] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('matches').select('*').order('match_time', { ascending: true }),
    supabase.from('users').select('display_name, wallet_balance').order('wallet_balance', { ascending: false }).limit(10),
    supabase.from('bets').select('match_id, predicted_team, wager_amount').eq('user_id', user.id)
  ]);

  const userBetsMap = new Map();
  userBetsData.data?.forEach(bet => userBetsMap.set(bet.match_id, bet));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-emerald-500/30">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <h1 className="text-lg font-semibold tracking-tight text-white uppercase">Matchday</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <form action={syncLiveMatches}>
              <button type="submit" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                Refresh Odds
              </button>
            </form>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">{userProfile.data?.display_name}</span>
              <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md flex items-center gap-2">
                <span className="text-emerald-500 font-mono text-sm">₹</span>
                <span className="text-sm font-semibold text-white">{userProfile.data?.wallet_balance}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: MATCHES (Takes up 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Live & Upcoming Fixtures</h2>

          {matchesData.data?.length === 0 ? (
            <div className="border border-zinc-800/50 border-dashed rounded-xl p-12 text-center">
              <p className="text-zinc-500 text-sm">No active fixtures available.</p>
            </div>
          ) : (
            matchesData.data?.map((match) => {
              const hasBet = userBetsMap.has(match.id);
              const userBetDetails = userBetsMap.get(match.id);
              const teamACaptain = getCaptain(match.team_a);
              const teamBCaptain = getCaptain(match.team_b);

              return (
                <div key={match.id} className="bg-[#121214] border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700/80 transition-colors">
                  
                  {/* MATCH SCOREBOARD */}
                  <div className="p-8 flex items-center justify-between">
                    
                    {/* Team A */}
                    <div className="flex flex-col items-center gap-3 w-1/3">
                      <div className="relative w-16 h-16 rounded-full border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden flex items-end justify-center">
                        <img 
                          src={teamACaptain.img} 
                          alt={teamACaptain.name} 
                          className="w-14 h-14 object-cover object-top"
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-base font-semibold text-white tracking-tight flex items-center justify-center gap-2">
                          {match.team_a} <span className="text-sm">{getFlag(match.team_a)}</span>
                        </span>
                        <span className="text-xs text-zinc-500">{teamACaptain.name}</span>
                      </div>
                    </div>
                    
                    {/* VS Divider */}
                    <div className="flex flex-col items-center justify-center w-1/3">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-2">VS</span>
                      <div className="w-px h-8 bg-zinc-800"></div>
                    </div>
                    
                    {/* Team B */}
                    <div className="flex flex-col items-center gap-3 w-1/3">
                      <div className="relative w-16 h-16 rounded-full border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden flex items-end justify-center">
                        <img 
                          src={teamBCaptain.img} 
                          alt={teamBCaptain.name} 
                          className="w-14 h-14 object-cover object-top"
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-base font-semibold text-white tracking-tight flex items-center justify-center gap-2">
                          <span className="text-sm">{getFlag(match.team_b)}</span> {match.team_b}
                        </span>
                        <span className="text-xs text-zinc-500">{teamBCaptain.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* BETTING CONTROLS */}
                  {match.status !== 'scheduled' ? (
                    <div className="bg-[#09090b] border-t border-zinc-800/60 p-4 text-center">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Market Closed</span>
                    </div>
                  ) : hasBet ? (
                    <div className="bg-[#052e16]/30 border-t border-emerald-900/30 p-4 px-6 flex justify-between items-center">
                      <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Position Secured
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-white">{userBetDetails.wager_amount}</span>
                        <span className="text-xs text-zinc-400 ml-1">on {userBetDetails.predicted_team}</span>
                      </div>
                    </div>
                  ) : (
                    <form action={placeBet} className="bg-[#09090b] border-t border-zinc-800/60 p-5">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input type="hidden" name="matchId" value={match.id} />
                        
                        <select name="predictedTeam" required className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer">
                          <option value="" className="text-zinc-500">Select Winner</option>
                          <option value={match.team_a}>{match.team_a}</option>
                          <option value={match.team_b}>{match.team_b}</option>
                        </select>
                        
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">₹</span>
                          <input type="number" name="wagerAmount" placeholder="Stake" required min="1" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 pl-7 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 font-mono" />
                        </div>
                        
                        <button type="submit" className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors w-full sm:w-auto">
                          Place Bet
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: LEADERBOARD (Takes up 4 columns) */}
        <div className="lg:col-span-4">
          <div className="bg-[#121214] border border-zinc-800/60 rounded-xl p-6 sticky top-24">
            <h2 className="text-sm font-semibold text-white tracking-tight mb-6">Global Leaderboard</h2>
            
            <div className="space-y-1">
              {leaderboardData.data?.map((player, index) => {
                const isTopThree = index < 3;
                
                return (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg hover:bg-zinc-900/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono w-4 text-center ${isTopThree ? 'text-emerald-500 font-bold' : 'text-zinc-600'}`}>
                        {index + 1}
                      </span>
                      <span className={`text-sm ${isTopThree ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}>
                        {player.display_name}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-zinc-300">
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