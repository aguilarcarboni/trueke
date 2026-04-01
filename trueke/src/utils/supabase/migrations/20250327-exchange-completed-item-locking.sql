-- Existing databases: add terminal exchange status and refresh RPCs for item locking.
-- Idempotent enum extension; then replaces accept_exchange, cancel_exchange, and defines complete_exchange.

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'exchange_status'
      AND e.enumlabel = 'completed'
  ) THEN
    ALTER TYPE exchange_status ADD VALUE 'completed';
  END IF;
END
$block$;

CREATE OR REPLACE FUNCTION accept_exchange(
    p_exchange_id UUID,
    p_accepting_user_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_initiator_id UUID;
    v_exchange_status exchange_status;
BEGIN
    SELECT initiator_user_id, status INTO v_initiator_id, v_exchange_status
    FROM exchange
    WHERE exchange_id = p_exchange_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Exchange not found'::TEXT;
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM exchange_participant
        WHERE exchange_id = p_exchange_id
        AND user_id = p_accepting_user_id
        AND user_id <> v_initiator_id
    ) THEN
        RETURN QUERY SELECT FALSE, 'Only the target user can accept'::TEXT;
        RETURN;
    END IF;

    IF v_exchange_status <> 'pending'::exchange_status THEN
        RETURN QUERY SELECT FALSE, 'Exchange is not pending'::TEXT;
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1 FROM exchange_item ei
        JOIN item i ON i.item_id = ei.item_id
        WHERE ei.exchange_id = p_exchange_id
        AND i.status <> 'active'::item_status
    ) THEN
        RETURN QUERY SELECT FALSE, 'One or more items are no longer available for trading.'::TEXT;
        RETURN;
    END IF;

    UPDATE exchange
    SET status = 'accepted'::exchange_status
    WHERE exchange_id = p_exchange_id;

    UPDATE item
    SET status = 'contested'::item_status
    WHERE item_id IN (
        SELECT item_id FROM exchange_item WHERE exchange_id = p_exchange_id
    );

    RETURN QUERY SELECT TRUE, 'Exchange accepted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cancel_exchange(
    p_exchange_id UUID,
    p_initiator_user_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_initiator_id UUID;
    v_exchange_status exchange_status;
BEGIN
    SELECT initiator_user_id, status INTO v_initiator_id, v_exchange_status
    FROM exchange
    WHERE exchange_id = p_exchange_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Exchange not found'::TEXT;
        RETURN;
    END IF;

    IF v_initiator_id <> p_initiator_user_id THEN
        RETURN QUERY SELECT FALSE, 'Only the initiator can cancel'::TEXT;
        RETURN;
    END IF;

    IF v_exchange_status NOT IN ('pending'::exchange_status, 'accepted'::exchange_status) THEN
        RETURN QUERY SELECT FALSE, 'Exchange cannot be cancelled in its current state'::TEXT;
        RETURN;
    END IF;

    IF v_exchange_status = 'accepted'::exchange_status THEN
        UPDATE item
        SET status = 'active'::item_status
        WHERE item_id IN (
            SELECT item_id FROM exchange_item WHERE exchange_id = p_exchange_id
        )
        AND status = 'contested'::item_status;
    END IF;

    UPDATE exchange
    SET status = 'cancelled'::exchange_status
    WHERE exchange_id = p_exchange_id;

    RETURN QUERY SELECT TRUE, 'Exchange cancelled successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_exchange(
    p_exchange_id UUID,
    p_completing_user_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_exchange_status exchange_status;
BEGIN
    SELECT status INTO v_exchange_status
    FROM exchange
    WHERE exchange_id = p_exchange_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Exchange not found'::TEXT;
        RETURN;
    END IF;

    IF v_exchange_status <> 'accepted'::exchange_status THEN
        RETURN QUERY SELECT FALSE, 'Only an accepted exchange can be marked complete'::TEXT;
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM exchange_participant
        WHERE exchange_id = p_exchange_id AND user_id = p_completing_user_id
    ) THEN
        RETURN QUERY SELECT FALSE, 'Not a participant in this exchange'::TEXT;
        RETURN;
    END IF;

    UPDATE exchange
    SET status = 'completed'::exchange_status
    WHERE exchange_id = p_exchange_id;

    UPDATE item
    SET status = 'traded'::item_status
    WHERE item_id IN (
        SELECT item_id FROM exchange_item WHERE exchange_id = p_exchange_id
    )
    AND status = 'contested'::item_status;

    RETURN QUERY SELECT TRUE, 'Exchange marked complete'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Let logged-in users call this RPC via PostgREST (required on many Supabase projects)
GRANT EXECUTE ON FUNCTION public.complete_exchange(uuid, uuid) TO authenticated, service_role;

-- Refresh API schema so .rpc('complete_exchange', ...) is recognized (safe to run; ignore if not allowed)
NOTIFY pgrst, 'reload schema';
