'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Match } from '@/lib/types';
import MatchCard from './MatchCard';

interface MatchesListProps {
  userId: string;
  userBalance: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

export default function MatchesList({
  userId,
  userBalance,
  onBalanceUpdate,
}: MatchesListProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState(userBalance);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'completed'>(
    'all'
  );

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
        );

        const { data, error: fetchError } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: false });

        if (fetchError) {
          setError('Failed to fetch matches');
          console.error(fetchError);
        } else {
          setMatches(data || []);
        }
      } catch (err) {
        setError('An error occurred while fetching matches');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const filteredMatches =
    filterStatus === 'all' ? matches : matches.filter((m) => m.status === filterStatus);

  const handleBetPlaced = (result: any) => {
    if (result.wallet_balance !== undefined) {
      setCurrentBalance(result.wallet_balance);
      if (onBalanceUpdate) {
        onBalanceUpdate(result.wallet_balance);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Upcoming Matches</h2>
          <p className="text-gray-600 mt-1">Balance: ${currentBalance.toFixed(2)}</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'scheduled', 'live', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No {filterStatus !== 'all' ? filterStatus : ''} matches available</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Showing {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
          </p>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                userId={userId}
                userBalance={currentBalance}
                onBetPlaced={handleBetPlaced}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
