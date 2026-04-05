-- Replace cancel_exchange: second arg is p_actor_user_id (not p_initiator_user_id).
-- Pending: only initiator may cancel. Accepted: any participant may cancel; contested items → active.
-- Run in Supabase SQL Editor after deploying app code that calls p_actor_user_id.

DROP FUNCTION IF EXISTS public.cancel_exchange(uuid, uuid);

CREATE OR REPLACE FUNCTION cancel_exchange(
    p_exchange_id UUID,
    p_actor_user_id UUID
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

    IF v_exchange_status NOT IN ('pending'::exchange_status, 'accepted'::exchange_status) THEN
        RETURN QUERY SELECT FALSE, 'Exchange cannot be cancelled in its current state'::TEXT;
        RETURN;
    END IF;

    IF v_exchange_status = 'pending'::exchange_status THEN
        IF v_initiator_id <> p_actor_user_id THEN
            RETURN QUERY SELECT FALSE, 'Only the initiator can cancel a pending proposal'::TEXT;
            RETURN;
        END IF;
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM exchange_participant
            WHERE exchange_id = p_exchange_id AND user_id = p_actor_user_id
        ) THEN
            RETURN QUERY SELECT FALSE, 'Only participants in this exchange can cancel'::TEXT;
            RETURN;
        END IF;
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

NOTIFY pgrst, 'reload schema';
