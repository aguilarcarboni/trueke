-- ============================================================
-- Migration: Predefined User Lists (Favorites & Frequent Users)
-- AC1: Every new user automatically gets two predefined lists.
-- AC2: Predefined lists cannot be deleted or renamed (enforced
--      by the is_predefined flag; app layer + RLS guard).
-- ============================================================

-- ── Trigger function: runs after every INSERT on "user" ──────
CREATE OR REPLACE FUNCTION create_predefined_user_lists()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO user_list (owner_id, name, description, is_predefined)
    VALUES
      (NEW.user_id, 'Favorites',      'Your saved favorite users',           TRUE),
      (NEW.user_id, 'Frequent Users', 'Users you interact with frequently',  TRUE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Attach trigger to user table ─────────────────────────────
CREATE OR REPLACE TRIGGER trigger_create_predefined_user_lists
  AFTER INSERT ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION create_predefined_user_lists();

-- ── Backfill: create missing predefined lists for existing users ─
INSERT INTO user_list (owner_id, name, description, is_predefined)
SELECT u.user_id, 'Favorites', 'Your saved favorite users', TRUE
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM user_list ul
  WHERE ul.owner_id = u.user_id
    AND ul.name = 'Favorites'
    AND ul.is_predefined = TRUE
);

INSERT INTO user_list (owner_id, name, description, is_predefined)
SELECT u.user_id, 'Frequent Users', 'Users you interact with frequently', TRUE
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM user_list ul
  WHERE ul.owner_id = u.user_id
    AND ul.name = 'Frequent Users'
    AND ul.is_predefined = TRUE
);
