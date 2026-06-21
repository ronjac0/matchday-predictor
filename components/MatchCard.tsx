'use client';

import { useState } from 'react';
import type { Match } from '@/lib/types';
import { placeBet } from '@/app/bets/actions';

interface MatchCardProps {
  match: Match;
  userId: string;
  userBalance: number;
  onBetPlaced?: (result: any) => void;
}

export default function MatchCard({
  match,
  userId,
  userBalance,
  onBetPlaced,
}: MatchCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'draw' | 'away' | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const matchDate = new Date(match.match_date);
  const formattedDate = matchDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getOdds = (team: 'home' | 'draw' | 'away') => {
    if (team === 'home') return match.odds_home;
    if (team === 'draw') return match.odds_draw;
    return match.odds_away;
  };

  const potentialWinnings = selectedTeam
    ? (parseFloat(betAmount) || 0) * getOdds(selectedTeam)
    : 0;

  const handlePlaceBet = async () => {
    setError('');
    setSuccess(false);

    if (!selectedTeam) {
      setError('Please select a team or draw');
      return;
    }

    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (amount > userBalance) {
      setError(`Insufficient balance. You have $${userBalance.toFixed(2)}`);
      return;
    }

    setIsLoading(true);

    try {
      const result = await placeBet(userId, match.id, selectedTeam, amount);

      if (result.success) {
        setSuccess(true);
        setBetAmount('');
        setSelectedTeam(null);
        if (onBetPlaced) {
          onBetPlaced(result);
        }
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to place bet');
      }
    } catch (err) {
      setError('An error occurred while placing the bet');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    live: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{match.league}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
              statusColors[match.status as keyof typeof statusColors]
            }`}
          >
            {match.status}
          </span>
        </div>
        <p className="text-sm text-blue-100">{formattedDate}</p>
      </div>

      {/* Match Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="font-bold text-lg text-gray-800">{match.home_team}</p>
            <p className="text-xs text-gray-500 mt-1">Home</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-gray-500 text-sm font-semibold">vs</p>
            {match.status === 'completed' && (
              <p className="text-sm font-bold text-gray-700">
                {match.home_score ?? '-'} - {match.away_score ?? '-'}
              </p>
            )}
          </div>

          <div className="flex-1 text-center">
            <p className="font-bold text-lg text-gray-800">{match.away_team}</p>
            <p className="text-xs text-gray-500 mt-1">Away</p>
          </div>
        </div>
      </div>

      {/* Odds */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
              selectedTeam === 'home'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedTeam('home')}
          >
            <p className="text-xs text-gray-600 dark:text-gray-500">
              {selectedTeam === 'home' ? 'Home' : 'Home'}
            </p>
            <p className="font-bold text-lg">{match.odds_home}</p>
          </div>

          <div
            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
              selectedTeam === 'draw'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedTeam('draw')}
          >
            <p className="text-xs text-gray-600">Draw</p>
            <p className="font-bold text-lg">{match.odds_draw}</p>
          </div>

          <div
            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
              selectedTeam === 'away'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedTeam('away')}
          >
            <p className="text-xs text-gray-600">Away</p>
            <p className="font-bold text-lg">{match.odds_away}</p>
          </div>
        </div>
      </div>

      {/* Betting Section */}
      {match.status === 'scheduled' && (
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bet Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min="0"
                max={userBalance}
                step="1"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: ${userBalance.toFixed(2)}
            </p>
          </div>

          {selectedTeam && potentialWinnings > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Potential Winnings:{' '}
                <span className="font-bold text-green-600">
                  ${potentialWinnings.toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                at {getOdds(selectedTeam)}x odds
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 font-semibold">✓ Bet placed successfully!</p>
            </div>
          )}

          <button
            onClick={handlePlaceBet}
            disabled={!selectedTeam || !betAmount || isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Placing Bet...' : 'Place Bet'}
          </button>
        </div>
      )}

      {match.status !== 'scheduled' && (
        <div className="p-4 bg-gray-100 text-center">
          <p className="text-sm text-gray-600 font-medium">
            {match.status === 'completed' && 'This match has ended'}
            {match.status === 'live' && 'This match is live'}
            {match.status === 'cancelled' && 'This match was cancelled'}
          </p>
        </div>
      )}
    </div>
  );
}
