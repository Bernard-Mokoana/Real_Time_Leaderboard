CREATE INDEX IF NOT EXISTS idx_scores_leaderboard_ranking
ON scores (total_xp DESC, user_id ASC);