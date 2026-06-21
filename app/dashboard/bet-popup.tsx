'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function BetPopup({ bets, matches }: { bets: any[], matches: any[] }) {
  const [popupBet, setPopupBet] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const resolvedBets = bets.filter(b => b.status === 'won' || b.status === 'lost');
    
    for (const bet of resolvedBets) {
      if (!sessionStorage.getItem(`seen_bet_${bet.id}`)) {
        setPopupBet(bet);
        setTimeout(() => {
          setIsVisible(true);
          // TRIGGER CONFETTI IF THEY WON!
          if (bet.status === 'won') {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#10b981', '#fbbf24', '#ffffff'],
              disableForReducedMotion: true
            });
          }
        }, 400);
        break; 
      }
    }
  }, [bets]);

  if (!popupBet) return null;

  const match = matches.find(m => m.id === popupBet.match_id);
  const matchName = match ? `${match.team_a} vs ${match.team_b}` : 'Matchup';
  const isWin = popupBet.status === 'won';

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      sessionStorage.setItem(`seen_bet_${popupBet.id}`, 'true');
      setPopupBet(null);
    }, 300); 
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100 backdrop-blur-md bg-black/60' : 'opacity-0 pointer-events-none'}`}>
      <div className={`w-full max-w-sm bg-zinc-950 border ${isWin ? 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]'} rounded-3xl p-8 text-center transform transition-transform duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner ${isWin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          <span className="text-4xl">{isWin ? '🎉' : '💔'}</span>
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
          {isWin ? 'Bet Won!' : 'Bet Lost'}
        </h2>
        
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          The results are in for <strong className="text-white">{matchName}</strong>.
          {isWin 
            ? ` Your prediction on ${popupBet.predicted_team} was spot on.` 
            : ` Your prediction on ${popupBet.predicted_team} didn't pan out.`}
        </p>

        <div className={`inline-block px-6 py-3 rounded-xl mb-8 border ${isWin ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-red-950/30 border-red-900/50 text-red-400'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">
            {isWin ? 'Payout (Est)' : 'Lost Wager'}
          </span>
          <span className="text-2xl font-black font-mono">
            {isWin ? '+' : '-'}{popupBet.wager_amount} PTS
          </span>
        </div>

        <button onClick={handleClose} className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest py-4 rounded-xl text-sm transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
}