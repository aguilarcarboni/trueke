-- Align item_status enum with app/UI: add archived (idempotent for existing DBs).

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'item_status'
      AND e.enumlabel = 'archived'
  ) THEN
    ALTER TYPE item_status ADD VALUE 'archived';
  END IF;
END
$block$;
