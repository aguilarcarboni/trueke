DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'notification_type'
          AND e.enumlabel = 'proposal_cancelled'
    ) THEN
        ALTER TYPE notification_type ADD VALUE 'proposal_cancelled';
    END IF;
END $$;
