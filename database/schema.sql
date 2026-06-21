-- ============================================================================
-- Sports Betting App Database Schema
-- Run this in Supabase SQL Editor or migrate it using a migration tool
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  wallet_balance DECIMAL(15, 2) DEFAULT 1000.00 NOT NULL,
  total_bets_placed INTEGER DEFAULT 0,
  total_won INTEGER DEFAULT 0,
  total_lost INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT wallet_balance_positive CHECK (wallet_balance >= 0)
);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league VARCHAR(100) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  match_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  home_score INTEGER,
  away_score INTEGER,
  winner VARCHAR(100), -- home, away, draw, or null for incomplete
  odds_home DECIMAL(5, 2) NOT NULL,
  odds_draw DECIMAL(5, 2) NOT NULL,
  odds_away DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  CONSTRAINT valid_odds CHECK (odds_home > 1 AND odds_draw > 1 AND odds_away > 1)
);

-- ============================================================================
-- BETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  prediction VARCHAR(100) NOT NULL, -- home, draw, away
  amount DECIMAL(15, 2) NOT NULL,
  odds DECIMAL(5, 2) NOT NULL,
  potential_winnings DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, won, lost, voided
  result VARCHAR(100),
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP,
  
  CONSTRAINT valid_prediction CHECK (prediction IN ('home', 'draw', 'away')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'won', 'lost', 'voided')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_odds CHECK (odds > 1)
);

-- ============================================================================
-- TRANSACTIONS TABLE (for audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- deposit, withdrawal, bet_placed, bet_won, bet_lost
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  related_bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_match_id ON bets(match_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_user_match ON bets(user_id, match_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- ============================================================================
-- MATCHES TABLE RLS POLICIES
-- ============================================================================

-- All authenticated users can view all matches
CREATE POLICY "Authenticated users can view matches" ON matches
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- BETS TABLE RLS POLICIES
-- ============================================================================

-- Users can only view their own bets
CREATE POLICY "Users can view own bets" ON bets
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can only insert bets for themselves
CREATE POLICY "Users can insert own bets" ON bets
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only update their own pending bets (for cancellation)
CREATE POLICY "Users can update own pending bets" ON bets
  FOR UPDATE
  USING (auth.uid()::text = user_id::text AND status = 'pending')
  WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================================
-- TRANSACTIONS TABLE RLS POLICIES
-- ============================================================================

-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Only system functions can insert transactions (security)
CREATE POLICY "System only can insert transactions" ON transactions
  FOR INSERT
  WITH CHECK (FALSE);

-- ============================================================================
-- VIEWS (Optional - for easier queries)
-- ============================================================================

-- View for user betting statistics
CREATE OR REPLACE VIEW user_betting_stats AS
SELECT
  u.id,
  u.username,
  u.wallet_balance,
  COUNT(b.id) as total_bets,
  COUNT(CASE WHEN b.status = 'won' THEN 1 END) as total_wins,
  COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as total_losses,
  COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.potential_winnings ELSE 0 END), 0) as total_won_amount,
  COALESCE(SUM(CASE WHEN b.status = 'lost' THEN b.amount ELSE 0 END), 0) as total_lost_amount,
  ROUND(
    100.0 * COUNT(CASE WHEN b.status = 'won' THEN 1 END) / 
    NULLIF(COUNT(b.id), 0), 
    2
  ) as win_percentage
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
GROUP BY u.id, u.username, u.wallet_balance;

-- View for upcoming matches with bet counts
CREATE OR REPLACE VIEW matches_with_stats AS
SELECT
  m.id,
  m.league,
  m.home_team,
  m.away_team,
  m.match_date,
  m.status,
  m.odds_home,
  m.odds_draw,
  m.odds_away,
  COUNT(b.id) as total_bets,
  COALESCE(SUM(b.amount), 0) as total_amount_bet
FROM matches m
LEFT JOIN bets b ON m.id = b.match_id
GROUP BY m.id, m.league, m.home_team, m.away_team, m.match_date, 
         m.status, m.odds_home, m.odds_draw, m.odds_away;

-- ============================================================================
-- TRIGGERS (Optional - for automatic updates)
-- ============================================================================

-- Update user updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_timestamp();

-- Update match updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_update_timestamp
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_match_timestamp();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'Stores user account information and wallet balance';
COMMENT ON TABLE matches IS 'Stores sports match information with odds';
COMMENT ON TABLE bets IS 'Stores user bets on matches';
COMMENT ON TABLE transactions IS 'Audit trail of all wallet transactions';

COMMENT ON COLUMN users.wallet_balance IS 'User wallet balance in currency units, starts at 1000';
COMMENT ON COLUMN bets.prediction IS 'User prediction: home win, draw, or away win';
COMMENT ON COLUMN bets.status IS 'Bet status: pending, won, lost, or voided';
COMMENT ON COLUMN matches.status IS 'Match status: scheduled, live, completed, or cancelled';
