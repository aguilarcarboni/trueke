--===================================--
---- Create ENUMS for the database ----
--===================================--
DO $$ BEGIN 
    CREATE TYPE user_status         AS ENUM ('active', 'inactive', 'banned');  
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE item_condition      AS ENUM ('new', 'like new', 'used', 'heavily used', 'broken');                                                     
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE item_status         AS ENUM ('draft', 'active', 'contested', 'traded', 'deleted');                                                     
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE item_type           AS ENUM ('physical', 'digital');                                                                                   
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE negotiation_status  AS ENUM ('active', 'inactive', 'deleted');                                                                         
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE exchange_status     AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'cancelled');                                               
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE exchange_role       AS ENUM ('initiator', 'member');                                                                                   
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE exchange_direction  AS ENUM ('offered', 'requested');                                                                                  
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE meeting_type        AS ENUM ('physical', 'virtual');                                                                                   
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE meeting_rsvp_status AS ENUM ('accepted', 'declined', 'pending', 'overdue');                                                           
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE report_target_type  AS ENUM ('user', 'item');                                                                                          
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE report_status       AS ENUM ('open', 'reviewed', 'resolved');                                                                          
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE notification_type   AS ENUM ('account_created', 'proposal_created', 'proposal_accepted', 'proposal_rejected', 'counter_offer', 'message_received', 'meeting_invite', 'meeting_rsvp', 'item_reported', 'user_reported', 'rating_received', 'system'); 
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE notification_channel  AS ENUM ('in_app', 'email');                                                                                     
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE notification_status   AS ENUM ('queued', 'sent', 'failed', 'skipped', 'delivered');                                                    
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high');                                                                               
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;
DO $$ BEGIN 
    CREATE TYPE login_event_type    AS ENUM ('login', 'logout');                                                                                       
    EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

--==========================================================--
----------------------- CREATE TABLES ------------------------
--==========================================================--
-- Users Table
CREATE TABLE IF NOT EXISTS "user" (
    user_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    username            VARCHAR(255) NOT NULL UNIQUE,
    first_name          VARCHAR(255) NOT NULL,
    last_name           VARCHAR(255) NOT NULL,
    password_hash       TEXT NOT NULL,
    status              user_status NOT NULL DEFAULT 'active',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    profile_picture_url TEXT DEFAULT '',
    bio                 TEXT DEFAULT '',
    end_ban_date_time   TIMESTAMP,
    is_admin            BOOLEAN NOT NULL DEFAULT FALSE
);

-- Addresses Table
CREATE TABLE IF NOT EXISTS "address" (
    address_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code        CHAR(2) NOT NULL,
    address_line1       TEXT DEFAULT '',
    address_line2       TEXT DEFAULT '',
    muni_district       TEXT DEFAULT '',
    canton_city         TEXT NOT NULL,
    province_state      TEXT NOT NULL,
    zip_code            TEXT NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Addresses Table
CREATE TABLE IF NOT EXISTS user_address (
    user_id             UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    address_id          UUID NOT NULL REFERENCES "address"(address_id) ON DELETE RESTRICT,
    is_current          BOOLEAN NOT NULL DEFAULT TRUE,
    active_start_time   TIMESTAMP NOT NULL DEFAULT NOW(),
    deactivated_time    TIMESTAMP,
    PRIMARY KEY (user_id, address_id)
);

-- User List Table
CREATE TABLE IF NOT EXISTS user_list (
    list_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    is_predefined       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User List Member Table 
CREATE TABLE IF NOT EXISTS user_list_member (
    list_id             UUID NOT NULL REFERENCES user_list(list_id) ON DELETE CASCADE,
    member_user_id      UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    added_date_time     TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (list_id, member_user_id)
);

-- Items Table
CREATE TABLE IF NOT EXISTS item (
    item_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id       UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    last_date_uploaded  TIMESTAMP NOT NULL DEFAULT NOW(),
    date_bought         DATE,
    condition           item_condition NOT NULL,
    status              item_status NOT NULL DEFAULT 'draft',
    item_type           item_type NOT NULL,
    category            VARCHAR(100) NOT NULL
);

-- Item Address Table
CREATE TABLE IF NOT EXISTS item_address (
    item_id             UUID NOT NULL REFERENCES item(item_id) ON DELETE CASCADE,
    address_id          UUID NOT NULL REFERENCES "address"(address_id) ON DELETE RESTRICT,
    is_current          BOOLEAN NOT NULL DEFAULT TRUE,
    active_start_time   TIMESTAMP NOT NULL DEFAULT NOW(),
    deactivated_time    TIMESTAMP,
    PRIMARY KEY (item_id, address_id)
);

-- Item Media Table
CREATE TABLE IF NOT EXISTS item_media (
    media_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id         UUID NOT NULL REFERENCES item(item_id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    media_type      VARCHAR(50) NOT NULL DEFAULT '.jpg',
    display_order   INTEGER NOT NULL DEFAULT 1
);

-- Item List
CREATE TABLE IF NOT EXISTS item_list (
    item_list_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_predefined   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Item List Member Table
CREATE TABLE IF NOT EXISTS item_list_member (
    item_list_id    UUID NOT NULL REFERENCES item_list(item_list_id) ON DELETE CASCADE,
    member_item_id  UUID NOT NULL REFERENCES item(item_id) ON DELETE CASCADE,
    added_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (item_list_id, member_item_id)
);

-- Negotiations Table
CREATE TABLE IF NOT EXISTS negotiation (
    negotiation_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by_user_id      UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    content_description     TEXT,
    is_public               BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    status                  negotiation_status NOT NULL DEFAULT 'active'
);

-- Negotiation Participant Table
CREATE TABLE IF NOT EXISTS negotiation_participant (
    negotiation_id  UUID NOT NULL REFERENCES negotiation(negotiation_id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (negotiation_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS message (
    message_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id      UUID NOT NULL REFERENCES negotiation(negotiation_id) ON DELETE CASCADE,
    sender_user_id      UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    is_edited           BOOLEAN NOT NULL DEFAULT FALSE,
    edit_timestamp      TIMESTAMP,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    delete_timestamp    TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Meeting Table 
CREATE TABLE IF NOT EXISTS meeting (
    meeting_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id      UUID NOT NULL REFERENCES negotiation(negotiation_id) ON DELETE CASCADE,
    address_id          UUID REFERENCES "address"(address_id) ON DELETE RESTRICT,
    meeting_type        meeting_type NOT NULL,
    platform            VARCHAR(100),
    access_code         VARCHAR(255),
    scheduled_at        TIMESTAMP NOT NULL,
    due_date            TIMESTAMP,
    created_by_user_id  UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- Meeting RSVP Table
CREATE TABLE IF NOT EXISTS meeting_invitee (
    meeting_id  UUID NOT NULL REFERENCES meeting(meeting_id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    rsvp_status meeting_rsvp_status NOT NULL DEFAULT 'pending',
    PRIMARY KEY (meeting_id, user_id)
);


-- Exchanges Table
CREATE TABLE IF NOT EXISTS exchange (
    exchange_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_user_id   UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    status              exchange_status NOT NULL DEFAULT 'pending',
    expiration_date     TIMESTAMP,
    creation_date       TIMESTAMP NOT NULL DEFAULT NOW(),
    optional_message    TEXT
);

-- Exchange Participant Table
CREATE TABLE IF NOT EXISTS exchange_participant (
    exchange_id UUID NOT NULL REFERENCES exchange(exchange_id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    role        exchange_role NOT NULL DEFAULT 'member',
    PRIMARY KEY (exchange_id, user_id)
);

-- Exchange Item Table
CREATE TABLE IF NOT EXISTS exchange_item (
    exchange_id     UUID NOT NULL REFERENCES exchange(exchange_id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES item(item_id) ON DELETE CASCADE,
    direction       exchange_direction NOT NULL DEFAULT 'offered',
    PRIMARY KEY (exchange_id, item_id)
);

-- User Ratings Table
CREATE TABLE IF NOT EXISTS user_rating (
    user_rating_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id     UUID NOT NULL REFERENCES exchange(exchange_id) ON DELETE CASCADE,
    rated_user_id   UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    by_user_id      UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    score           SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (exchange_id, rated_user_id, by_user_id)
);

-- Item Ratings Table 
CREATE TABLE IF NOT EXISTS item_rating (
    item_rating_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id         UUID NOT NULL REFERENCES exchange(exchange_id) ON DELETE CASCADE,
    item_id             UUID NOT NULL REFERENCES item(item_id) ON DELETE CASCADE,
    rated_by_user_id    UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    condition_received  VARCHAR(50) NOT NULL,
    comment             TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (exchange_id, item_id, rated_by_user_id)
);

-- Reports Table
CREATE TABLE IF NOT EXISTS report (
    report_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id    UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    target_type         report_target_type NOT NULL,
    target_id           UUID NOT NULL,
    reason              VARCHAR(100) NOT NULL,
    description         TEXT,
    status              report_status NOT NULL DEFAULT 'open',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notification (
    notification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id   UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    sender_user_id      UUID REFERENCES "user"(user_id) ON DELETE CASCADE,
    type                notification_type NOT NULL,
    reference_type      VARCHAR(50),
    reference_id        UUID,
    title               VARCHAR(255) NOT NULL,
    body                TEXT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP,
    delivery_channel    notification_channel NOT NULL,
    status              notification_status NOT NULL DEFAULT 'queued',
    priority            notification_priority NOT NULL DEFAULT 'normal',
    sent_at             TIMESTAMP,
    expires_at          TIMESTAMP
);

-- Login Events Table
CREATE TABLE IF NOT EXISTS login_event (
    login_event_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    event_type      login_event_type NOT NULL,
    event_time      TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address      INET,
    user_agent      TEXT
);

--==========================================================--
------------------- CREATE CONSTRAINTS -----------------------
--==========================================================--

-- Ensure only one current address per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_current_address
ON user_address(user_id)
WHERE is_current = TRUE;

-- Ensure only one current address per item
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_current_address
ON item_address(item_id)
WHERE is_current = TRUE;

-- Ensure users cannot rate themselves
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_no_self_rating'
          AND conrelid = 'user_rating'::regclass
    ) THEN
        ALTER TABLE user_rating
        ADD CONSTRAINT chk_no_self_rating
        CHECK (rated_user_id <> by_user_id);
    END IF;
END $$;

-- Ensure banned users have an end ban date time set and active users do not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_ban_dates'
          AND conrelid = '"user"'::regclass
    ) THEN
        ALTER TABLE "user"
        ADD CONSTRAINT chk_ban_dates
        CHECK (
            (status = 'banned' AND end_ban_date_time IS NOT NULL) OR
            (status <> 'banned' AND end_ban_date_time IS NULL)
        );
    END IF;
END $$;

-- Ensure Media display order is unique per item
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_media_display_order
ON item_media(item_id, display_order);

--=========================================================--
--------------- CREATE TRIGGERS & FUNCTIONS -----------------
--=========================================================--
-- Whenever a new address is inputted automatically set it as the current address for the user and deactivate any previous current address
CREATE OR REPLACE FUNCTION set_previous_address_inactive_user_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current THEN
        UPDATE user_address
        SET is_current = FALSE, deactivated_time = NOW()
        WHERE user_id = NEW.user_id AND is_current = TRUE AND address_id <> NEW.address_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before inserting or updating a user address
CREATE OR REPLACE TRIGGER trg_set_previous_address_inactive_user_address
BEFORE INSERT OR UPDATE ON user_address
FOR EACH ROW
EXECUTE FUNCTION set_previous_address_inactive_user_address();

-- Whenever a new address is inputted automatically set it as the current address for the item and deactivate any previous current address
CREATE OR REPLACE FUNCTION set_previous_address_inactive_item_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current THEN
        UPDATE item_address
        SET is_current = FALSE, deactivated_time = NOW()
        WHERE item_id = NEW.item_id AND is_current = TRUE AND address_id <> NEW.address_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before inserting or updating an item address
CREATE OR REPLACE TRIGGER trg_set_previous_address_inactive_item_address
BEFORE INSERT OR UPDATE ON item_address
FOR EACH ROW
EXECUTE FUNCTION set_previous_address_inactive_item_address();

-- Automatically update the last_date_uploaded field of the item whenever a new media is added
CREATE OR REPLACE FUNCTION update_item_last_date_uploaded()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE item
    SET last_date_uploaded = NOW()
    WHERE item_id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after inserting a new media for an item
CREATE OR REPLACE TRIGGER trg_update_item_last_date_uploaded
AFTER INSERT ON item_media
FOR EACH ROW
EXECUTE FUNCTION update_item_last_date_uploaded();
