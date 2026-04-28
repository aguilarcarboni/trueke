--=========================================================--
-- Notification Preferences (multi-channel opt-in settings)
--=========================================================--
CREATE TABLE IF NOT EXISTS notification_preference (
    user_id            UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    notification_type  notification_type NOT NULL,
    channel            notification_channel NOT NULL,
    is_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, notification_type, channel),
    CONSTRAINT chk_notification_preference_in_app_enabled
        CHECK (channel <> 'in_app' OR is_enabled = TRUE)
);
