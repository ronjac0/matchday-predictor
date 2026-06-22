'use client';

import { useState } from 'react';
import { placeBet } from '../actions/place-bet';

export default function SmartBetForm({ match }: { match: any }) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [stake, setStake] = useState<number | ''>('');

  // Determine current odds based on selection
  const currentOdds = selectedTeam === match.team_a ? match.odds_team_a 
                    : selectedTeam === match.team_b ? match.odds_team_b 
                    : null;

  // Calculate potential return
  const potentialReturn = (stake && currentOdds) ? Math.floor(Number(stake) * currentOdds) : 0;

  return (
    <form action={placeBet} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={match.id} />
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-1/2 relative">
          <select 
            name="predictedTeam" 
            required 
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
          >
            <option value="" className="text-zinc-500">Select Winner...</option>
            <option value={match.team_a}>{match.team_a} (Odds: {match.odds_team_a}x)</option>
            <option value={match.team_b}>{match.team_b} (Odds: {match.odds_team_b}x)</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
        </div>
        
        <div className="w-full sm:w-1/2 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-black tracking-widest">PTS</span>
          <input 
            type="number" 
            name="wagerAmount" 
            placeholder="Stake" 
            required 
            min="1" 
            value={stake}
            onChange={(e) => setStake(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 pl-12 text-sm font-black text-white focus:outline-none focus:border-emerald-500 font-mono" 
          />
        </div>
      </div>

      {/* Dynamic Submit Button */}
      <button 
        type="submit" 
        disabled={!selectedTeam || !stake}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black uppercase tracking-widest rounded-xl p-3.5 text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] flex justify-between items-center px-6"
      >
        <span>Place Wager</span>
        {potentialReturn > 0 && (
          <span className="bg-black/20 px-3 py-1 rounded-lg text-xs">
            To Win: {potentialReturn}
          </span>
        )}
      </button>
    </form>
  );
}