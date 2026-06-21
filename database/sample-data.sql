-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- Run this after schema.sql to populate test data
-- ============================================================================

-- Clear existing data (optional - use with caution in production!)
-- DELETE FROM bets;
-- DELETE FROM matches;
-- DELETE FROM users;

-- ============================================================================
-- SAMPLE USERS
-- ============================================================================

INSERT INTO users (id, email, username, full_name, wallet_balance) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john@example.com', 'john_doe', 'John Doe', 2500.00),
  ('22222222-2222-2222-2222-222222222222', 'jane@example.com', 'jane_smith', 'Jane Smith', 1500.00),
  ('33333333-3333-3333-3333-333333333333', 'alex@example.com', 'alex_betting', 'Alex Johnson', 1000.00),
  ('44444444-4444-4444-4444-444444444444', 'emma@example.com', 'emma_trades', 'Emma Wilson', 3200.00);

-- ============================================================================
-- SAMPLE MATCHES (FIFA World Cup style)
-- ============================================================================

INSERT INTO matches (id, league, home_team, away_team, match_date, status, odds_home, odds_draw, odds_away) VALUES
  (
    '55555555-5555-5555-5555-555555555555',
    'FIFA World Cup',
    'Brazil',
    'France',
    '2026-07-10 14:00:00',
    'scheduled',
    1.85,
    3.50,
    4.20
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'FIFA World Cup',
    'Argentina',
    'Germany',
    '2026-07-11 16:00:00',
    'scheduled',
    2.10,
    3.25,
    3.60
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'FIFA World Cup',
    'England',
    'Spain',
    '2026-07-12 18:00:00',
    'scheduled',
    2.50,
    3.40,
    2.80
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'Premier League',
    'Manchester United',
    'Liverpool',
    '2026-07-15 19:45:00',
    'completed',
    2.20,
    3.10,
    3.50
  );

-- Update completed match with results
UPDATE matches 
SET 
  home_score = 2,
  away_score = 1,
  winner = 'home',
  status = 'completed'
WHERE id = '88888888-8888-8888-8888-888888888888';

-- ============================================================================
-- SAMPLE BETS
-- ============================================================================

INSERT INTO bets (id, user_id, match_id, prediction, amount, odds, potential_winnings, status, placed_at) VALUES
  -- John's bets
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'home',
    100.00,
    1.85,
    185.00,
    'pending',
    NOW() - INTERVAL '2 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666666',
    'draw',
    50.00,
    3.25,
    162.50,
    'pending',
    NOW() - INTERVAL '1 day'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888888',
    'home',
    200.00,
    2.20,
    440.00,
    'won',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 hours'
  ),
  
  -- Jane's bets
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    'away',
    75.00,
    4.20,
    315.00,
    'pending',
    NOW() - INTERVAL '1 day'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '22222222-2222-2222-2222-222222222222',
    '77777777-7777-7777-7777-777777777777',
    'home',
    100.00,
    2.50,
    250.00,
    'pending',
    NOW() - INTERVAL '6 hours'
  ),
  
  -- Alex's bets
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '33333333-3333-3333-3333-333333333333',
    '66666666-6666-6666-6666-666666666666',
    'away',
    50.00,
    3.60,
    180.00,
    'pending',
    NOW() - INTERVAL '3 hours'
  ),
  (
    '12121212-1212-1212-1212-121212121212',
    '33333333-3333-3333-3333-333333333333',
    '88888888-8888-8888-8888-888888888888',
    'away',
    150.00,
    3.50,
    525.00,
    'lost',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 hours'
  ),
  
  -- Emma's bets
  (
    '34343434-3434-3434-3434-343434343434',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    'home',
    250.00,
    1.85,
    462.50,
    'pending',
    NOW() - INTERVAL '2 days'
  );

-- ============================================================================
-- SAMPLE TRANSACTIONS
-- ============================================================================

-- Note: In production, these would be created automatically by triggers
-- This is just for demonstration

INSERT INTO transactions (user_id, type, amount, description, balance_before, balance_after, created_at) VALUES
  -- John's transactions
  (
    '11111111-1111-1111-1111-111111111111',
    'deposit',
    500.00,
    'Initial deposit',
    2000.00,
    2500.00,
    NOW() - INTERVAL '7 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'bet_placed',
    -100.00,
    'Bet placed on Brazil vs France',
    2500.00,
    2400.00,
    NOW() - INTERVAL '2 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'bet_won',
    440.00,
    'Bet won on Manchester United vs Liverpool',
    2240.00,
    2680.00,
    NOW() - INTERVAL '2 hours'
  ),
  
  -- Jane's transactions
  (
    '22222222-2222-2222-2222-222222222222',
    'deposit',
    500.00,
    'Initial deposit',
    1000.00,
    1500.00,
    NOW() - INTERVAL '5 days'
  ),
  
  -- Alex's transactions
  (
    '33333333-3333-3333-3333-333333333333',
    'bet_placed',
    -150.00,
    'Bet placed on Manchester United vs Liverpool',
    1150.00,
    1000.00,
    NOW() - INTERVAL '5 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'bet_lost',
    -150.00,
    'Bet lost on Manchester United vs Liverpool',
    1000.00,
    850.00,
    NOW() - INTERVAL '2 hours'
  );

-- ============================================================================
-- VERIFY DATA (Optional - run to see what was inserted)
-- ============================================================================

-- SELECT 'Users' as table_name, COUNT(*) as count FROM users
-- UNION ALL
-- SELECT 'Matches', COUNT(*) FROM matches
-- UNION ALL
-- SELECT 'Bets', COUNT(*) FROM bets
-- UNION ALL
-- SELECT 'Transactions', COUNT(*) FROM transactions;
