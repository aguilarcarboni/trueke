DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'meeting_rsvp_status'
      AND e.enumlabel = 'maybe'
  ) THEN
    ALTER TYPE meeting_rsvp_status ADD VALUE 'maybe';
  END IF;
END
$$;
