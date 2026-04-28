--=========================================================--
-- Queue email notifications based on user channel preference
--=========================================================--

CREATE OR REPLACE FUNCTION enqueue_email_notification_from_in_app()
RETURNS TRIGGER AS $$
DECLARE
    v_email_enabled BOOLEAN;
BEGIN
    -- Only queue email for rows inserted as in_app
    IF NEW.delivery_channel <> 'in_app' THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM notification_preference np
        WHERE np.user_id = NEW.recipient_user_id
          AND np.notification_type = NEW.type
          AND np.channel = 'email'::notification_channel
          AND np.is_enabled = TRUE
    )
    INTO v_email_enabled;

    IF v_email_enabled THEN
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
            sent_at,
            expires_at
        )
        VALUES (
            NEW.recipient_user_id,
            NEW.sender_user_id,
            NEW.type,
            NEW.reference_type,
            NEW.reference_id,
            NEW.title,
            NEW.body,
            FALSE,
            'email'::notification_channel,
            'queued'::notification_status,
            NEW.priority,
            NULL,
            NEW.expires_at
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enqueue_email_notification_from_in_app ON notification;

CREATE TRIGGER trg_enqueue_email_notification_from_in_app
AFTER INSERT ON notification
FOR EACH ROW
EXECUTE FUNCTION enqueue_email_notification_from_in_app();
