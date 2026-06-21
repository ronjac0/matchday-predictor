'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@/lib/types';

interface LeaderboardProps {
  limit?: number;
}

export default function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
        );

        let query = supabase.from('users').select('*');

        // Optional: Filter by date if time range is selected
        // For now, we'll just get all users and sort by wallet balance
        const { data, error: fetchError } = await query.order('wallet_balance', {
          ascending: false,
        });

        if (fetchError) {
          setError('Failed to fetch leaderboard');
          console.error(fetchError);
        } else {
          setUsers(data || []);
        }
      } catch (err) {
        setError('An error occurred while fetching leaderboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeRange]);

  const displayedUsers = users.slice(0, limit);
  const topUser = displayedUsers[0];
  const secondPlace = displayedUsers[1];
  const thirdPlace = displayedUsers[2];

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return '';
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🏆 Leaderboard</h2>
          <p className="text-gray-600 mt-1">Top {limit} Users by Wallet Balance</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2">
          {(['all', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {displayedUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No users found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Highlighted Cards */}
          {displayedUsers.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[topUser, secondPlace, thirdPlace].map(
                (user, idx) =>
                  user && (
                    <div
                      key={user.id}
                      className={`rounded-lg p-6 text-center text-white transition-transform hover:scale-105 ${
                        idx === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : idx === 1
                            ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                            : 'bg-gradient-to-br from-orange-400 to-orange-600'
                      }`}
                    >
                      <p className="text-5xl font-bold mb-2">{getMedalEmoji(idx + 1)}</p>
                      <p className="text-2xl font-bold">{user.username || user.email}</p>
                      <p className="text-sm opacity-90 mt-1">
                        {user.full_name || 'Anonymous'}
                      </p>
                      <p className="text-3xl font-bold mt-4">${user.wallet_balance.toFixed(2)}</p>
                      <p className="text-xs opacity-75 mt-2">
                        Bets: {user.total_bets_placed || 0} | Won: {user.total_won || 0}
                      </p>
                    </div>
                  )
              )}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Player</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-800">
                    Wallet Balance
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-800">Bets</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-800">Won</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-800">Lost</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user, idx) => {
                  const rank = idx + 1;
                  const winRate =
                    user.total_bets_placed && user.total_bets_placed > 0
                      ? ((user.total_won || 0) / (user.total_bets_placed || 1) * 100).toFixed(1)
                      : '0';

                  return (
                    <tr
                      key={user.id}
                      className={`border-b transition-colors ${
                        rank <= 3
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <td className={`px-4 py-4 font-bold ${getMedalColor(rank)}`}>
                        <span className="text-lg">{getMedalEmoji(rank)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.username || user.email}
                          </p>
                          <p className="text-sm text-gray-500">{user.full_name || 'Anonymous'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-gray-900">
                        ${user.wallet_balance.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700">
                        {user.total_bets_placed || 0}
                      </td>
                      <td className="px-4 py-4 text-right text-green-600 font-semibold">
                        {user.total_won || 0}
                      </td>
                      <td className="px-4 py-4 text-right text-red-600 font-semibold">
                        {user.total_lost || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Statistics */}
          {displayedUsers.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-gray-600 text-sm">Average Balance</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  $
                  {(
                    displayedUsers.reduce((sum, u) => sum + u.wallet_balance, 0) /
                    displayedUsers.length
                  ).toFixed(2)}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-gray-600 text-sm">Total Bets</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {displayedUsers.reduce((sum, u) => sum + (u.total_bets_placed || 0), 0)}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-gray-600 text-sm">Total Won</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {displayedUsers.reduce((sum, u) => sum + (u.total_won || 0), 0)}
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-gray-600 text-sm">Total Lost</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {displayedUsers.reduce((sum, u) => sum + (u.total_lost || 0), 0)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
