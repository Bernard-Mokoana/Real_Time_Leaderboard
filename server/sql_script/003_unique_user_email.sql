BEGIN;

CREATE TABLE IF NOT EXISTS users_email_collisions (
    user_id  UUID PRIMARY KEY,
    original_email  TEXT NOT NULL,
    kept_user_id  UUID NOT NULL,
    resolved_at  TIMESTAMP_TZ NOT NULL DEFAULT now()
);

WITH ranked AS (
    SELECT id, email, first_value(id) OVER w AS kept_id,
    ROW_NUMBER() OVER w AS rn
    FROM users
    WINDOW w AS (
        PARTITION BY LOWER(TRIM(email))
        ORDER BY created_at ASC, id ASC
    )
), 
losers AS (
    SELECT id, email, kept_id FROM ranked WHERE rn > 1
),
audited AS (
    INSERT INTO users_email_collisions (user_id, original_email, kept_user_id)
    SELECT id, email, kept_id FROM losers
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id
)

UPDATE users u 
SET email = 'duplicate-' || u.id::text || '@invalid.invalid'
FROM losers l  
WHERE u.id = l.id;  

UPDATE users 
SET email = LOWER(TRIM(email))
WHERE email <> LOWER(TRIM(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users (email);

COMMIT;