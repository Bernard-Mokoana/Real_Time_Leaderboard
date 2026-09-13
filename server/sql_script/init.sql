CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    friends_list VARCHAR(250),
    avatar_url VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    xp_value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE leaderboard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    xp_delta INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_xp BIGINT NOT NULL DEFAULT 0,
    last_earned TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timeframe VARCHAR(20) NOT NULL,
    period_key VARCHAR(20) NOT NULL,
    xp_earned BIGINT NOT NULL DEFAULT 0,
    final_rank INTEGER NOT NULL,
    captured_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, timeframe, period_key)
);

CREATE INDEX idx_leaderboard_events_user_id ON leaderboard_events(user_id);
CREATE INDEX idx_leaderboard_events_task_id ON leaderboard_events(task_id);
CREATE INDEX idx_leaderboard_events_created_at ON leaderboard_events(created_at);

CREATE INDEX idx_leaderboard_snapshots_period ON leaderboard_snapshots(timeframe, period_key, final_rank);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN 
     NEW.updated_at = now();
     RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_scores_updated_at
    BEFORE UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();






