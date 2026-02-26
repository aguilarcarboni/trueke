--=========================================================--
--------------- DROP TRIGGERS & FUNCTIONS -------------------
--=========================================================--
DROP TRIGGER IF EXISTS trg_set_previous_address_inactive_user_address ON user_address;
DROP TRIGGER IF EXISTS trg_set_previous_address_inactive_item_address ON item_address;
DROP TRIGGER IF EXISTS trg_update_item_last_date_uploaded ON item_media;

DROP FUNCTION IF EXISTS set_previous_address_inactive_user_address();
DROP FUNCTION IF EXISTS set_previous_address_inactive_item_address();
DROP FUNCTION IF EXISTS update_item_last_date_uploaded();

--=========================================================--
----------------- DROP INDEXES/CONSTRAINTS ------------------
--=========================================================--
DROP INDEX IF EXISTS uq_user_current_address;
DROP INDEX IF EXISTS uq_item_current_address;
DROP INDEX IF EXISTS uq_item_media_display_order;

--=========================================================--
--------------------- DROP TABLES --------------------------
--=========================================================--
DROP TABLE IF EXISTS login_event;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS report;
DROP TABLE IF EXISTS item_rating;
DROP TABLE IF EXISTS user_rating;
DROP TABLE IF EXISTS exchange_item;
DROP TABLE IF EXISTS exchange_participant;
DROP TABLE IF EXISTS exchange;
DROP TABLE IF EXISTS meeting_invitee;
DROP TABLE IF EXISTS meeting;
DROP TABLE IF EXISTS message;
DROP TABLE IF EXISTS negotiation_participant;
DROP TABLE IF EXISTS negotiation;
DROP TABLE IF EXISTS item_list_member;
DROP TABLE IF EXISTS item_list;
DROP TABLE IF EXISTS item_media;
DROP TABLE IF EXISTS item_address;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS user_list_member;
DROP TABLE IF EXISTS user_list;
DROP TABLE IF EXISTS user_address;
DROP TABLE IF EXISTS "address";
DROP TABLE IF EXISTS "user";

--=========================================================--
--------------------- DROP ENUMS ---------------------------
--=========================================================--
DROP TYPE IF EXISTS login_event_type;
DROP TYPE IF EXISTS notification_priority;
DROP TYPE IF EXISTS notification_status;
DROP TYPE IF EXISTS notification_channel;
DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS report_status;
DROP TYPE IF EXISTS report_target_type;
DROP TYPE IF EXISTS meeting_rsvp_status;
DROP TYPE IF EXISTS meeting_type;
DROP TYPE IF EXISTS exchange_direction;
DROP TYPE IF EXISTS exchange_role;
DROP TYPE IF EXISTS exchange_status;
DROP TYPE IF EXISTS negotiation_status;
DROP TYPE IF EXISTS item_type;
DROP TYPE IF EXISTS item_status;
DROP TYPE IF EXISTS item_condition;
DROP TYPE IF EXISTS user_status;