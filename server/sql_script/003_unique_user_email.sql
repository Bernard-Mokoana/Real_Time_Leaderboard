UPDATE users
SET email = LOWER(TRIM(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users (email)
