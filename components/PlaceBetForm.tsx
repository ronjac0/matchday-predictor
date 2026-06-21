'use client';

import { useState } from 'react';
import { placeBet, cancelBet, type PlaceBetResponse } from '@/app/bets/actions';
import type { Match } from '@/lib/types';

interface PlaceBetFormProps {
  match: Match;
  userId: string;
  userBalance: number;
  onSuccess?: (response: PlaceBetResponse) => void;
  onError?: (error: string) => void;
}

export default function PlaceBetForm({
  match,
  userId,
  userBalance,
  onSuccess,
  onError,
}: PlaceBetFormProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'draw' | 'away'>('home');
  const [wagerAmount, setWagerAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Calculate potential winnings
  const amount = parseFloat(wagerAmount) || 0;
  let odds = match.odds_home;
  if (selectedTeam === 'draw') {
    odds = match.odds_draw;
  } else if (selectedTeam === 'away') {
    odds = match.odds_away;
  }
  const potentialWinnings = amount * odds;

  async function handlePlaceBet(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Call server action
      const result = await placeBet(userId, match.id, selectedTeam, amount);

      if (result.success) {
        setSuccess(
          `Bet placed successfully! Potential winnings: $${result.bet?.potential_winnings.toFixed(2)}`
        );
        setWagerAmount('');
        setSelectedTeam('home');
        onSuccess?.(result);
      } else {
        const errorMsg = result.error || 'Failed to place bet';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  const isFormValid = amount > 0 && amount <= userBalance;

  return (
    <form onSubmit={handlePlaceBet} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Place Your Bet</h2>
        <p className="text-slate-600">
          {match.home_team} vs {match.away_team}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Prediction Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Select Your Prediction
        </label>
        <div className="grid grid-cols-3 gap-3">
          {/* Home */}
          <button
            type="button"
            onClick={() => setSelectedTeam('home')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedTeam === 'home'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-lg font-bold text-slate-900">{match.home_team}</div>
            <div className="text-2xl font-bold text-blue-600">{match.odds_home}</div>
            <div className="text-xs text-slate-500 mt-1">Home Win</div>
          </button>

          {/* Draw */}
          <button
            type="button"
            onClick={() => setSelectedTeam('draw')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedTeam === 'draw'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-lg font-bold text-slate-900">Draw</div>
            <div className="text-2xl font-bold text-purple-600">{match.odds_draw}</div>
            <div className="text-xs text-slate-500 mt-1">No Winner</div>
          </button>

          {/* Away */}
          <button
            type="button"
            onClick={() => setSelectedTeam('away')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedTeam === 'away'
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-lg font-bold text-slate-900">{match.away_team}</div>
            <div className="text-2xl font-bold text-green-600">{match.odds_away}</div>
            <div className="text-xs text-slate-500 mt-1">Away Win</div>
          </button>
        </div>
      </div>

      {/* Wager Amount */}
      <div>
        <label htmlFor="wager" className="block text-sm font-medium text-slate-700 mb-1">
          Wager Amount ($)
        </label>
        <input
          id="wager"
          type="number"
          min="1"
          max={userBalance}
          step="0.01"
          value={wagerAmount}
          onChange={(e) => setWagerAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <p className="text-xs text-slate-500 mt-1">
          Available balance: ${userBalance.toFixed(2)}
        </p>
      </div>

      {/* Potential Winnings */}
      {amount > 0 && (
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Wager Amount:</span>
            <span className="font-bold text-slate-900">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-slate-700">Odds:</span>
            <span className="font-bold text-slate-900">{odds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-3">
            <span className="text-lg font-bold text-slate-900">Potential Winnings:</span>
            <span className="text-lg font-bold text-green-600">
              ${potentialWinnings.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
          isFormValid && !isLoading
            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            : 'bg-blue-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Placing Bet...' : 'Place Bet'}
      </button>

      {/* Warning if insufficient balance */}
      {amount > userBalance && amount > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ Wager amount exceeds your available balance
          </p>
        </div>
      )}
    </form>
  );
}
