CREATE UNIQUE INDEX IF NOT EXISTS idx_task_completion_once_per_user
ON leaderboard_events (user_id, task_id)
WHERE event_type = 'task_completed';

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_events_idempotency
ON leaderboard_events (user_id, reference_id)
WHERE reference_id IS NOT NULL;