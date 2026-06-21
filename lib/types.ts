/**
 * Database Types
 * Generated from database schema
 * Use these types with Supabase queries for type safety
 */

export type User = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  total_bets_placed: number;
  total_won: number;
  total_lost: number;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_score: number | null;
  away_score: number | null;
  winner: 'home' | 'away' | 'draw' | null;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  created_at: string;
  updated_at: string;
};

export type Bet = {
  id: string;
  user_id: string;
  match_id: string;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
  odds: number;
  potential_winnings: number;
  status: 'pending' | 'won' | 'lost' | 'voided';
  result: string | null;
  placed_at: string;
  settled_at: string | null;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_lost';
  amount: number;
  description: string | null;
  balance_before: number | null;
  balance_after: number | null;
  related_bet_id: string | null;
  created_at: string;
};

export type UserBettingStats = {
  id: string;
  username: string;
  wallet_balance: number;
  total_bets: number;
  total_wins: number;
  total_losses: number;
  total_won_amount: number;
  total_lost_amount: number;
  win_percentage: number | null;
};

export type MatchWithStats = {
  id: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  total_bets: number;
  total_amount_bet: number;
};

/**
 * Helper type for Supabase query with relations
 */
export type BetWithMatch = Bet & {
  matches: Match;
};

export type BetWithUser = Bet & {
  users: User;
};

export type BetWithAll = Bet & {
  users: User;
  matches: Match;
};

/**
 * Request/Response types for API endpoints
 */
export type PlaceBetRequest = {
  match_id: string;
  prediction: 'home' | 'draw' | 'away';
  amount: number;
};

export type PlaceBetResponse = {
  success: boolean;
  bet?: Bet;
  error?: string;
  wallet_balance?: number;
};

export type UpdateBetRequest = {
  status: 'pending' | 'cancelled' | 'voided';
};

export type DepositRequest = {
  amount: number;
};

export type WithdrawalRequest = {
  amount: number;
};

export type WalletResponse = {
  balance: number;
  last_updated: string;
};
