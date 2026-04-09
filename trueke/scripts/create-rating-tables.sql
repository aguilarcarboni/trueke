-- ═══════════════════════════════════════════════════════════════════════════
-- Rating & Review System
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ENUM: item condition rating ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE item_condition_rating AS ENUM ('like_new', 'good', 'acceptable', 'bad');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: review (user-to-user rating on a completed exchange) ─────────
CREATE TABLE IF NOT EXISTS review (
  review_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id       UUID NOT NULL REFERENCES exchange(exchange_id) ON DELETE CASCADE,
  reviewer_user_id  UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  reviewed_user_id  UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT DEFAULT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per user per exchange
  UNIQUE (exchange_id, reviewer_user_id)
);

-- ─── TABLE: item_review (item condition rating on a completed exchange) ──
CREATE TABLE IF NOT EXISTS item_review (
  item_review_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id       UUID NOT NULL REFERENCES exchange(exchange_id) ON DELETE CASCADE,
  reviewer_user_id  UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  item_id           UUID NOT NULL REFERENCES item(item_id) ON DELETE CASCADE,
  condition_rating  item_condition_rating NOT NULL,
  comment           TEXT DEFAULT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One condition review per item per exchange
  UNIQUE (exchange_id, item_id, reviewer_user_id)
);

-- ─── VIEW: user_rating_summary ───────────────────────────────────────────
-- Pre‑computed average and count for O(1) lookups in profiles / dialogs.
CREATE OR REPLACE VIEW user_rating_summary AS
SELECT
  reviewed_user_id                AS user_id,
  COUNT(*)::INT                    AS total_reviews,
  ROUND(AVG(rating)::NUMERIC, 2)  AS average_rating
FROM review
GROUP BY reviewed_user_id;

-- ─── INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_review_reviewed_user   ON review(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_review_exchange        ON review(exchange_id);
CREATE INDEX IF NOT EXISTS idx_item_review_item       ON item_review(item_id);
CREATE INDEX IF NOT EXISTS idx_item_review_exchange   ON item_review(exchange_id);

-- ─── RLS (Row Level Security) ────────────────────────────────────────────
-- Auth is handled by NextAuth.js (not Supabase Auth), so auth.uid() is not
-- available. The server actions validate the authenticated user before any
-- write. We enable RLS with permissive policies so the anon key still works.
ALTER TABLE review ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_review ENABLE ROW LEVEL SECURITY;

CREATE POLICY review_select_all ON review FOR SELECT USING (true);
CREATE POLICY review_insert_all ON review FOR INSERT WITH CHECK (true);
CREATE POLICY item_review_select_all ON item_review FOR SELECT USING (true);
CREATE POLICY item_review_insert_all ON item_review FOR INSERT WITH CHECK (true);
