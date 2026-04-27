-- Password history table for password reuse prevention
CREATE TABLE IF NOT EXISTS password_history (
    history_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    password_hash    CHAR(60) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimizes lookup of most recent password hashes per user
CREATE INDEX IF NOT EXISTS idx_password_history_user_created_at
ON password_history (user_id, created_at DESC);
