-- Active: 1779020459307@@127.0.0.1@5432@realtimeleaderboard@public
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_events_idempotency
ON leaderboard_events (user_id, reference_id)
WHERE reference_id IS NOT NULL;