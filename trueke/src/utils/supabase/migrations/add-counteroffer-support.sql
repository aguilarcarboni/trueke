-- ============================================
-- Migration: Add Counteroffer Support
-- ============================================

-- 1. Add 'countered' to exchange_status enum
ALTER TYPE exchange_status ADD VALUE IF NOT EXISTS 'countered';

-- 2. Add parent_exchange_id column to exchange table (self-referencing FK for counteroffer chains)
ALTER TABLE exchange
ADD COLUMN IF NOT EXISTS parent_exchange_id UUID REFERENCES exchange(exchange_id) ON DELETE SET NULL;

-- 3. Create counteroffer function
DROP FUNCTION IF EXISTS create_counteroffer(UUID, UUID, UUID[], UUID[], TEXT, INTEGER);
CREATE OR REPLACE FUNCTION create_counteroffer(
    p_parent_exchange_id UUID,
    p_actor_user_id UUID,
    p_offered_item_ids UUID[],
    p_requested_item_ids UUID[],
    p_message TEXT DEFAULT NULL,
    p_expiration_days INTEGER DEFAULT 7
)
RETURNS TABLE(
    out_exchange_id UUID,
    result_status TEXT,
    out_created_at TIMESTAMP,
    result_message TEXT
) AS $$
DECLARE
    v_exchange_id UUID;
    v_parent_status exchange_status;
    v_parent_initiator UUID;
    v_target_user_id UUID;
    v_negotiation_id UUID;
    v_item_id UUID;
    v_now TIMESTAMP := NOW();
    v_actor_name VARCHAR;
    v_message_clean TEXT := NULLIF(BTRIM(p_message), '');
BEGIN
    -- Validate expiration
    IF p_expiration_days < 1 THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Expiration days must be at least 1'::TEXT;
        RETURN;
    END IF;

    -- Validate non-empty arrays
    IF COALESCE(array_length(p_offered_item_ids, 1), 0) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'You must offer at least one item'::TEXT;
        RETURN;
    END IF;

    IF COALESCE(array_length(p_requested_item_ids, 1), 0) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'You must request at least one item'::TEXT;
        RETURN;
    END IF;

    -- Get parent exchange details
    SELECT e.status, e.initiator_user_id, e.negotiation_id
    INTO v_parent_status, v_parent_initiator, v_negotiation_id
    FROM exchange e
    WHERE e.exchange_id = p_parent_exchange_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Parent exchange not found'::TEXT;
        RETURN;
    END IF;

    -- Only pending exchanges can be countered
    IF v_parent_status <> 'pending'::exchange_status THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Can only counteroffer a pending exchange'::TEXT;
        RETURN;
    END IF;

    -- Actor must be a participant but NOT the initiator of the parent exchange
    IF NOT EXISTS (
        SELECT 1 FROM exchange_participant
        WHERE exchange_id = p_parent_exchange_id
        AND user_id = p_actor_user_id
        AND user_id <> v_parent_initiator
    ) THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Only the recipient can make a counteroffer'::TEXT;
        RETURN;
    END IF;

    -- The target of the counteroffer is the original initiator
    v_target_user_id := v_parent_initiator;

    -- Cannot counteroffer yourself
    IF p_actor_user_id = v_target_user_id THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP, 'Cannot counteroffer yourself'::TEXT;
        RETURN;
    END IF;

    -- Validate offered items belong to actor and are active
    IF EXISTS (
        SELECT 1
        FROM UNNEST(p_offered_item_ids) AS uid
        WHERE NOT EXISTS (
            SELECT 1 FROM item i
            WHERE i.item_id = uid
              AND i.owner_user_id = p_actor_user_id
              AND i.status = 'active'
        )
    ) THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP,
            ('Invalid offered items: some items are not active or do not belong to user ' || p_actor_user_id::TEXT)::TEXT;
        RETURN;
    END IF;

    -- Validate requested items belong to target and are active
    IF EXISTS (
        SELECT 1
        FROM UNNEST(p_requested_item_ids) AS uid
        WHERE NOT EXISTS (
            SELECT 1 FROM item i
            WHERE i.item_id = uid
              AND i.owner_user_id = v_target_user_id
              AND i.status = 'active'
        )
    ) THEN
        RETURN QUERY SELECT NULL::UUID, 'error'::TEXT, NULL::TIMESTAMP,
            ('Invalid requested items: some items are not active or do not belong to user ' || v_target_user_id::TEXT)::TEXT;
        RETURN;
    END IF;

    -- Get actor's display name
    SELECT u.username INTO v_actor_name
    FROM "user" u WHERE u.user_id = p_actor_user_id;

    -- Mark parent exchange as countered
    UPDATE exchange
    SET status = 'countered'::exchange_status
    WHERE exchange.exchange_id = p_parent_exchange_id;

    -- Create the new counteroffer exchange (reuses existing negotiation)
    INSERT INTO exchange (
        initiator_user_id,
        negotiation_id,
        status,
        optional_message,
        creation_date,
        expiration_date,
        parent_exchange_id
    )
    VALUES (
        p_actor_user_id,
        v_negotiation_id,
        'pending'::exchange_status,
        v_message_clean,
        v_now,
        v_now + (p_expiration_days || ' days')::INTERVAL,
        p_parent_exchange_id
    )
    RETURNING exchange.exchange_id INTO v_exchange_id;

    -- Exchange participants
    INSERT INTO exchange_participant (exchange_id, user_id, role)
    VALUES (v_exchange_id, p_actor_user_id, 'initiator'::exchange_role);

    INSERT INTO exchange_participant (exchange_id, user_id, role)
    VALUES (v_exchange_id, v_target_user_id, 'member'::exchange_role);

    -- Exchange items: offered (actor's items)
    FOREACH v_item_id IN ARRAY p_offered_item_ids LOOP
        INSERT INTO exchange_item (exchange_id, item_id, direction)
        VALUES (v_exchange_id, v_item_id, 'offered'::exchange_direction);
    END LOOP;

    -- Exchange items: requested (target's items)
    FOREACH v_item_id IN ARRAY p_requested_item_ids LOOP
        INSERT INTO exchange_item (exchange_id, item_id, direction)
        VALUES (v_exchange_id, v_item_id, 'requested'::exchange_direction);
    END LOOP;

    -- Insert counteroffer message into existing negotiation
    IF v_message_clean IS NOT NULL THEN
        INSERT INTO message (
            negotiation_id,
            sender_user_id,
            content,
            created_at
        )
        VALUES (
            v_negotiation_id,
            p_actor_user_id,
            v_message_clean,
            v_now
        );
    END IF;

    -- Notify the original initiator about the counteroffer
    INSERT INTO notification (
        recipient_user_id,
        sender_user_id,
        type,
        reference_type,
        reference_id,
        title,
        body,
        is_read,
        delivery_channel,
        status,
        priority,
        sent_at
    )
    VALUES (
        v_target_user_id,
        p_actor_user_id,
        'counter_offer'::notification_type,
        'exchange'::VARCHAR,
        v_exchange_id,
        ('Counteroffer from ' || COALESCE(v_actor_name, 'A User'))::VARCHAR(255),
        (COALESCE(v_actor_name, 'A User') || ' has made a counteroffer to your trade proposal.')::TEXT,
        FALSE,
        'in_app'::notification_channel,
        'queued'::notification_status,
        'normal'::notification_priority,
        v_now
    );

    RETURN QUERY SELECT
        v_exchange_id,
        'success'::TEXT,
        v_now::TIMESTAMP,
        'Counteroffer created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get the full exchange history chain (AC8)
-- Given any exchange_id, returns all exchanges in the same chain (root → latest)
DROP FUNCTION IF EXISTS get_exchange_history(UUID);
CREATE OR REPLACE FUNCTION get_exchange_history(p_exchange_id UUID)
RETURNS TABLE(
    out_exchange_id UUID,
    out_parent_exchange_id UUID,
    out_initiator_id UUID,
    out_initiator_name VARCHAR,
    out_status exchange_status,
    out_message TEXT,
    out_created_at TIMESTAMP,
    out_expires_at TIMESTAMP,
    out_offered_items JSONB,
    out_requested_items JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE chain AS (
        -- Find the root: walk up from the given exchange
        SELECT e.exchange_id, e.parent_exchange_id, 0 AS depth
        FROM exchange e
        WHERE e.exchange_id = p_exchange_id

        UNION ALL

        SELECT e.exchange_id, e.parent_exchange_id, c.depth + 1
        FROM exchange e
        JOIN chain c ON e.exchange_id = c.parent_exchange_id
        WHERE c.parent_exchange_id IS NOT NULL
    ),
    root AS (
        SELECT chain.exchange_id FROM chain ORDER BY depth DESC LIMIT 1
    ),
    -- Walk down from root to get all descendants
    full_chain AS (
        SELECT e.exchange_id, e.parent_exchange_id, 0 AS order_num
        FROM exchange e
        WHERE e.exchange_id = (SELECT root.exchange_id FROM root)

        UNION ALL

        SELECT e.exchange_id, e.parent_exchange_id, fc.order_num + 1
        FROM exchange e
        JOIN full_chain fc ON e.parent_exchange_id = fc.exchange_id
    )
    SELECT
        e.exchange_id,
        e.parent_exchange_id,
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
        )
    FROM full_chain fc
    JOIN exchange e ON e.exchange_id = fc.exchange_id
    LEFT JOIN "user" u ON e.initiator_user_id = u.user_id
    LEFT JOIN exchange_item ei ON e.exchange_id = ei.exchange_id
    LEFT JOIN item i ON ei.item_id = i.item_id
    GROUP BY e.exchange_id, e.parent_exchange_id, e.initiator_user_id, u.username,
             e.status, e.optional_message, e.creation_date, e.expiration_date, fc.order_num
    ORDER BY fc.order_num ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_counteroffer(uuid, uuid, uuid[], uuid[], text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_exchange_history(uuid) TO authenticated, service_role;

-- 5. Update get_user_exchanges to also return parent_exchange_id
DROP FUNCTION IF EXISTS get_user_exchanges(UUID, exchange_status);
CREATE OR REPLACE FUNCTION get_user_exchanges(
    p_user_id UUID,
    p_status exchange_status DEFAULT NULL
)
RETURNS TABLE(
    out_exchange_id UUID,
    out_initiator_id UUID,
    out_initiator_name VARCHAR,
    out_status exchange_status,
    out_message TEXT,
    out_created_at TIMESTAMP,
    out_expires_at TIMESTAMP,
    out_offered_count BIGINT,
    out_requested_count BIGINT,
    out_parent_exchange_id UUID
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
        COUNT(ei.item_id) FILTER (WHERE ei.direction = 'requested'::exchange_direction),
        e.parent_exchange_id
    FROM exchange e
    LEFT JOIN exchange_participant ep ON e.exchange_id = ep.exchange_id
    LEFT JOIN exchange_item ei ON e.exchange_id = ei.exchange_id
    LEFT JOIN "user" u ON e.initiator_user_id = u.user_id
    WHERE ep.user_id = p_user_id
    AND (p_status IS NULL OR e.status = p_status)
    GROUP BY e.exchange_id, e.initiator_user_id, u.username, e.status, e.optional_message, e.creation_date, e.expiration_date, e.parent_exchange_id
    ORDER BY e.creation_date DESC;
END;
$$ LANGUAGE plpgsql;
