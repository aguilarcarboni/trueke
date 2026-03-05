-- ============================================
-- Exchange Functions for Trade Proposals
-- ============================================

-- Function to create an exchange (trade proposal)
-- This function handles:
-- 1. Creating the exchange record
-- 2. Adding the initiator as a participant
-- 3. Adding the target user as a participant
-- 4. Creating the exchange items (offered and requested)
-- 5. Creating notification for target user (AC6)
--
-- NOTE: Return columns use result_ prefix to avoid conflicts
--       with table column names (status, message)
CREATE OR REPLACE FUNCTION create_exchange_proposal(
    p_initiator_id UUID,
    p_target_user_id UUID,
    p_offered_item_ids UUID[],
    p_requested_item_ids UUID[],
    p_message TEXT DEFAULT NULL,
    p_expiration_days INTEGER DEFAULT 7
)
RETURNS TABLE(
    exchange_id UUID,
    result_status TEXT,
    created_at TIMESTAMP,
    result_message TEXT
) AS $$
DECLARE
    v_exchange_id UUID;
    v_item_id UUID;
    v_initiator_name VARCHAR;
    v_offered_items_str TEXT;
    v_requested_items_str TEXT;
BEGIN
    -- Validate expiration_days (AC4)
    IF p_expiration_days < 1 THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Expiration days must be at least 1'::TEXT;
        RETURN;
    END IF;

    -- Validate different users
    IF p_initiator_id = p_target_user_id THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Cannot create exchange with yourself'::TEXT;
        RETURN;
    END IF;

    -- Validate offered items belong to initiator and are active
    IF EXISTS (
        SELECT 1 FROM UNNEST(p_offered_item_ids) AS uid
        WHERE NOT EXISTS (
            SELECT 1 FROM item i
            WHERE i.item_id = uid
            AND i.owner_user_id = p_initiator_id
            AND i.status = 'active'
        )
    ) THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Invalid offered items'::TEXT;
        RETURN;
    END IF;

    -- Validate requested items belong to target and are active
    IF EXISTS (
        SELECT 1 FROM UNNEST(p_requested_item_ids) AS uid
        WHERE NOT EXISTS (
            SELECT 1 FROM item i
            WHERE i.item_id = uid
            AND i.owner_user_id = p_target_user_id
            AND i.status = 'active'
        )
    ) THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Invalid requested items'::TEXT;
        RETURN;
    END IF;

    -- Get initiator name
    SELECT u.username INTO v_initiator_name FROM "user" u WHERE u.user_id = p_initiator_id;

    -- Create exchange record (AC1, AC4)
    INSERT INTO exchange (initiator_user_id, status, optional_message, creation_date, expiration_date)
    VALUES (
        p_initiator_id,
        'pending'::exchange_status,
        p_message,
        NOW(),
        NOW() + (p_expiration_days || ' days')::INTERVAL
    )
    RETURNING exchange.exchange_id INTO v_exchange_id;

    -- Add participants (AC2, AC3)
    INSERT INTO exchange_participant (exchange_id, user_id, role)
    VALUES (v_exchange_id, p_initiator_id, 'initiator'::exchange_role);

    INSERT INTO exchange_participant (exchange_id, user_id, role)
    VALUES (v_exchange_id, p_target_user_id, 'member'::exchange_role);

    -- Add offered items
    FOREACH v_item_id IN ARRAY p_offered_item_ids LOOP
        INSERT INTO exchange_item (exchange_id, item_id, direction)
        VALUES (v_exchange_id, v_item_id, 'offered'::exchange_direction);
    END LOOP;

    -- Add requested items
    FOREACH v_item_id IN ARRAY p_requested_item_ids LOOP
        INSERT INTO exchange_item (exchange_id, item_id, direction)
        VALUES (v_exchange_id, v_item_id, 'requested'::exchange_direction);
    END LOOP;

    -- Build notification description strings
    SELECT string_agg(i.title, ', ') INTO v_offered_items_str
    FROM UNNEST(p_offered_item_ids) AS uid
    JOIN item i ON i.item_id = uid;

    SELECT string_agg(i.title, ', ') INTO v_requested_items_str
    FROM UNNEST(p_requested_item_ids) AS uid
    JOIN item i ON i.item_id = uid;

    -- Create notification for target user (AC6)
    INSERT INTO notification (
        recipient_user_id, sender_user_id, type, reference_type, reference_id,
        title, body, is_read, delivery_channel, status, priority
    ) VALUES (
        p_target_user_id,
        p_initiator_id,
        'proposal_created'::notification_type,
        'exchange'::VARCHAR,
        v_exchange_id,
        ('New Trade Proposal from ' || COALESCE(v_initiator_name, 'A User'))::VARCHAR(255),
        (COALESCE(v_initiator_name, 'A User') || ' wants to trade: ' || COALESCE(v_offered_items_str, 'items') ||
         ' for your: ' || COALESCE(v_requested_items_str, 'items'))::TEXT,
        FALSE,
        'in_app'::notification_channel,
        'queued'::notification_status,
        'normal'::notification_priority
    );

    -- Return success
    RETURN QUERY SELECT
        v_exchange_id,
        'success'::TEXT,
        NOW()::TIMESTAMP,
        'Exchange proposal created successfully'::TEXT;

END;
$$ LANGUAGE plpgsql;

-- Function to get exchange details with all related information
CREATE OR REPLACE FUNCTION get_exchange_details(p_exchange_id UUID)
RETURNS TABLE(
    exchange_id UUID,
    initiator_id UUID,
    initiator_name VARCHAR,
    status exchange_status,
    message TEXT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    offered_items JSONB,
    requested_items JSONB,
    participants JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.exchange_id,
        e.initiator_user_id,
        u.username,
        e.status,
        e.optional_message,
        e.creation_date,
        e.expiration_date,
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'item_id', i.item_id,
                    'title', i.title,
                    'condition', i.condition,
                    'owner_id', i.owner_user_id
                )
            ) FILTER (WHERE ei.direction = 'offered'::exchange_direction),
            '[]'::jsonb
        ),
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'item_id', i.item_id,
                    'title', i.title,
                    'condition', i.condition,
                    'owner_id', i.owner_user_id
                )
            ) FILTER (WHERE ei.direction = 'requested'::exchange_direction),
            '[]'::jsonb
        ),
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'user_id', ep.user_id,
                    'username', u2.username,
                    'role', ep.role
                )
            ),
            '[]'::jsonb
        )
    FROM exchange e
    LEFT JOIN "user" u ON e.initiator_user_id = u.user_id
    LEFT JOIN exchange_item ei ON e.exchange_id = ei.exchange_id
    LEFT JOIN item i ON ei.item_id = i.item_id
    LEFT JOIN exchange_participant ep ON e.exchange_id = ep.exchange_id
    LEFT JOIN "user" u2 ON ep.user_id = u2.user_id
    WHERE e.exchange_id = p_exchange_id
    GROUP BY e.exchange_id, e.initiator_user_id, u.username, e.status, e.optional_message, e.creation_date, e.expiration_date;
END;
$$ LANGUAGE plpgsql;

-- Function to accept an exchange (only target user can accept)
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
    -- Get exchange info
    SELECT initiator_user_id, status INTO v_initiator_id, v_exchange_status
    FROM exchange
    WHERE exchange_id = p_exchange_id;

    -- Check if exchange exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Exchange not found'::TEXT;
        RETURN;
    END IF;

    -- Check if user is a participant but not the initiator
    IF NOT EXISTS (
        SELECT 1 FROM exchange_participant
        WHERE exchange_id = p_exchange_id
        AND user_id = p_accepting_user_id
        AND user_id <> v_initiator_id
    ) THEN
        RETURN QUERY SELECT FALSE, 'Only the target user can accept'::TEXT;
        RETURN;
    END IF;

    -- Check if exchange is still pending
    IF v_exchange_status <> 'pending'::exchange_status THEN
        RETURN QUERY SELECT FALSE, 'Exchange is not pending'::TEXT;
        RETURN;
    END IF;

    -- Update exchange status
    UPDATE exchange
    SET status = 'accepted'::exchange_status
    WHERE exchange_id = p_exchange_id;

    RETURN QUERY SELECT TRUE, 'Exchange accepted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to reject/decline an exchange
CREATE OR REPLACE FUNCTION reject_exchange(
    p_exchange_id UUID,
    p_rejecting_user_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_initiator_id UUID;
    v_exchange_status exchange_status;
BEGIN
    -- Get exchange info
    SELECT initiator_user_id, status INTO v_initiator_id, v_exchange_status
    FROM exchange
    WHERE exchange_id = p_exchange_id;

    -- Check if exchange exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Exchange not found'::TEXT;
        RETURN;
    END IF;

    -- Check if user is a participant
    IF NOT EXISTS (
        SELECT 1 FROM exchange_participant
        WHERE exchange_id = p_exchange_id
        AND user_id = p_rejecting_user_id
    ) THEN
        RETURN QUERY SELECT FALSE, 'Not a participant in this exchange'::TEXT;
        RETURN;
    END IF;

    -- Check if exchange is still pending
    IF v_exchange_status <> 'pending'::exchange_status THEN
        RETURN QUERY SELECT FALSE, 'Exchange is not pending'::TEXT;
        RETURN;
    END IF;

    -- Update exchange status
    UPDATE exchange
    SET status = 'rejected'::exchange_status
    WHERE exchange_id = p_exchange_id;

    RETURN QUERY SELECT TRUE, 'Exchange rejected successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's exchanges
CREATE OR REPLACE FUNCTION get_user_exchanges(
    p_user_id UUID,
    p_status exchange_status DEFAULT NULL
)
RETURNS TABLE(
    exchange_id UUID,
    initiator_id UUID,
    initiator_name VARCHAR,
    status exchange_status,
    message TEXT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    offered_count BIGINT,
    requested_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.exchange_id,
        e.initiator_user_id,
        u.username,
        e.status,
        e.optional_message,
        e.creation_date,
        e.expiration_date,
        COUNT(ei.item_id) FILTER (WHERE ei.direction = 'offered'::exchange_direction),
        COUNT(ei.item_id) FILTER (WHERE ei.direction = 'requested'::exchange_direction)
    FROM exchange e
    LEFT JOIN exchange_participant ep ON e.exchange_id = ep.exchange_id
    LEFT JOIN exchange_item ei ON e.exchange_id = ei.exchange_id
    LEFT JOIN "user" u ON e.initiator_user_id = u.user_id
    WHERE ep.user_id = p_user_id
    AND (p_status IS NULL OR e.status = p_status)
    GROUP BY e.exchange_id, e.initiator_user_id, u.username, e.status, e.optional_message, e.creation_date, e.expiration_date
    ORDER BY e.creation_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel an exchange (only initiator can cancel)
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
    -- Get exchange info
    SELECT initiator_user_id, status INTO v_initiator_id, v_exchange_status
    FROM exchange
    WHERE exchange_id = p_exchange_id;

    -- Check if exchange exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Exchange not found'::TEXT;
        RETURN;
    END IF;

    -- Check if user is the initiator
    IF v_initiator_id <> p_initiator_user_id THEN
        RETURN QUERY SELECT FALSE, 'Only the initiator can cancel'::TEXT;
        RETURN;
    END IF;

    -- Check if exchange is still pending or accepted
    IF v_exchange_status NOT IN ('pending'::exchange_status, 'accepted'::exchange_status) THEN
        RETURN QUERY SELECT FALSE, 'Exchange cannot be cancelled in its current state'::TEXT;
        RETURN;
    END IF;

    -- Update exchange status
    UPDATE exchange
    SET status = 'cancelled'::exchange_status
    WHERE exchange_id = p_exchange_id;

    RETURN QUERY SELECT TRUE, 'Exchange cancelled successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;
