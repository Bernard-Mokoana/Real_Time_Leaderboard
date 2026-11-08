ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE users ALTER COLUMN avatar_url TYPE VARCHAR(255);

ALTER TABLE users DROP COLUMN IF EXISTS friends_list;

CREATE TABLE IF NOT EXISTS friendships (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships (friend_id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_task_type') THEN
        ALTER TABLE tasks ADD CONSTRAINT chk_tasks_task_type
            CHECK (task_type IN ('lesson', 'quiz', 'project', 'challenge', 'discussion'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_xp_value') THEN
        ALTER TABLE tasks ADD CONSTRAINT chk_tasks_xp_value CHECK (xp_value >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_events_event_type') THEN
        ALTER TABLE leaderboard_events ADD CONSTRAINT chk_events_event_type
            CHECK (event_type IN ('task_completed', 'bonus', 'penalty'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_snapshots_timeframe') THEN
        ALTER TABLE leaderboard_snapshots ADD CONSTRAINT chk_snapshots_timeframe
            CHECK (timeframe IN ('daily', 'weekly', 'all_time'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_snapshots_final_rank') THEN
        ALTER TABLE leaderboard_snapshots ADD CONSTRAINT chk_snapshots_final_rank
            CHECK (final_rank >= 1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scores_total_xp') THEN
        ALTER TABLE scores ADD CONSTRAINT chk_scores_total_xp CHECK (total_xp >= 0);
    END IF;
END $$;

DROP INDEX IF EXISTS idx_scores_leaderboard_ranking;

CREATE INDEX IF NOT EXISTS idx_scores_ranking_order
    ON scores (
        total_xp DESC,
        (COALESCE(date_trunc('second', last_earned), 'infinity'::timestamp)) ASC,
        user_id DESC
    );

CREATE INDEX IF NOT EXISTS idx_leaderboard_events_created_user
    ON leaderboard_events (created_at, user_id);
