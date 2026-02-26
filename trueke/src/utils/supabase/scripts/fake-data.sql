--==========================================================--
----------------------- FAKE DATA ----------------------------
-- Covers all tables; safe to re-run (DELETEs first).       --
-- Fixed UUIDs so relationships are easy to trace/query.    --
--==========================================================--

--==========================================================--
-------------------------- USERS ----------------------------
--==========================================================--
INSERT INTO "user" (user_id, email, username, first_name, last_name, password_hash, status, end_ban_date_time, is_admin) VALUES
    ('00000000-0000-0000-0000-000000000001', 'alice@example.com',  'alice_trader',  'Alice', 'Walker',   'hashed_pw_alice', 'active',   NULL,   FALSE),
    ('00000000-0000-0000-0000-000000000002', 'bob@example.com',    'bob_swap',      'Bob',   'Marley',   'hashed_pw_bob',   'active',   NULL,   FALSE),
    ('00000000-0000-0000-0000-000000000003', 'carol@example.com',  'carol_barter',  'Carol', 'Danvers',  'hashed_pw_carol', 'active',   NULL,   FALSE),
    ('00000000-0000-0000-0000-000000000004', 'dave@example.com',   'dave_deals',    'Dave',  'Grohl',    'hashed_pw_dave',  'active',   NULL,   FALSE),
    ('00000000-0000-0000-0000-000000000005', 'eve@example.com',    'eve_exchange',  'Eve',   'Online',   'hashed_pw_eve',   'active',   NULL,   TRUE),
    ('00000000-0000-0000-0000-000000000006', 'frank@example.com',  'frank_bans',    'Frank', 'Castle',   'hashed_pw_frank', 'banned',   NOW() + INTERVAL '30 days',   FALSE);

--==========================================================--
------------------------ ADDRESSES --------------------------
--==========================================================--
INSERT INTO "address" (address_id, country_code, address_line1, canton_city, province_state, zip_code) VALUES
    ('aa000000-0000-0000-0000-000000000001', 'US', '42 Maple St',       'New York',      'New York',      '10001'),
    ('aa000000-0000-0000-0000-000000000002', 'US', '7 Sunset Blvd',     'Los Angeles',   'California',    '90001'),
    ('aa000000-0000-0000-0000-000000000003', 'CR', 'Av. Central 100',   'San José',      'San José',      '10101'),
    ('aa000000-0000-0000-0000-000000000004', 'CR', 'Calle 5, No. 20',   'Heredia',       'Heredia',       '40101'),
    ('aa000000-0000-0000-0000-000000000005', 'US', '300 Lake Shore Dr', 'Chicago',       'Illinois',      '60601'),
    ('aa000000-0000-0000-0000-000000000006', 'CR', 'Barrio Corazón',    'Cartago',       'Cartago',       '30101');

--==========================================================--
--------------------- USER ADDRESSES ------------------------
-- Trigger ensures only one is_current per user.            --
-- Insert old address first, then the current one.          --
--==========================================================--

-- Alice: old address (Chicago), then current (New York)
INSERT INTO user_address (user_id, address_id, is_current, active_start_time, deactivated_time) VALUES
    ('00000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000005', FALSE, NOW() - INTERVAL '6 months', NOW() - INTERVAL '1 month');
INSERT INTO user_address (user_id, address_id, is_current, active_start_time) VALUES
    ('00000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', TRUE, NOW() - INTERVAL '1 month');

-- Bob: current (Los Angeles)
INSERT INTO user_address (user_id, address_id, is_current, active_start_time) VALUES
    ('00000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000002', TRUE, NOW() - INTERVAL '3 months');

-- Carol: current (San José)
INSERT INTO user_address (user_id, address_id, is_current, active_start_time) VALUES
    ('00000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000003', TRUE, NOW() - INTERVAL '5 months');

-- Dave: current (Heredia)
INSERT INTO user_address (user_id, address_id, is_current, active_start_time) VALUES
    ('00000000-0000-0000-0000-000000000004', 'aa000000-0000-0000-0000-000000000004', TRUE, NOW() - INTERVAL '2 months');

--==========================================================--
----------------------- USER LISTS --------------------------
--==========================================================--

INSERT INTO user_list (list_id, owner_id, name, description, is_predefined) VALUES
    ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Trusted Traders',  'People I have traded with before',  FALSE),
    ('bb000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Blocked Users',    'Predefined block list',             TRUE),
    ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'My Favourites',    'Users I want to trade with',        FALSE);

INSERT INTO user_list_member (list_id, member_user_id) VALUES
    ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
    ('bb000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
    ('bb000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001');

--==========================================================--
-------------------------- ITEMS ----------------------------
--==========================================================--

INSERT INTO item (item_id, owner_user_id, title, description, condition, status, item_type, category) VALUES
    ('cc000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Vintage Film Camera',       'A classic 35mm film camera in great shape.',         'like new',    'active',  'physical', 'Photography'),
    ('cc000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Clean Code (Book)',         'Robert C. Martin. Minor spine crease.',              'used',        'active',  'physical', 'Books'),
    ('cc000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Gaming Headset',            'Surround sound, barely used.',                       'like new',    'active',  'physical', 'Electronics'),
    ('cc000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'PS5 DualSense Controller',  'Works perfectly, no stick drift.',                   'used',        'active',  'physical', 'Gaming'),
    ('cc000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Adobe Photoshop License',   'Transferable 1-year license key.',                   'new',         'active',  'digital',  'Software'),
    ('cc000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'Mechanical Keyboard',       'TKL, Cherry MX Blue switches.',                      'used',        'active',  'physical', 'Electronics'),
    ('cc000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', 'Mountain Bike',             'Aluminium frame, 21 speeds. Needs new tires.',       'heavily used','traded',  'physical', 'Sports'),
    ('cc000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', 'Electric Guitar',           'Fender Stratocaster, sunburst finish.',              'like new',    'active',  'physical', 'Music'),
    ('cc000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000005', 'Standing Desk',             'Motorised, adjustable height, 160x80cm.',            'used',        'draft',   'physical', 'Furniture');

--==========================================================--
--------------------- ITEM ADDRESSES -----------------------
--==========================================================--

INSERT INTO item_address (item_id, address_id, is_current, active_start_time) VALUES
    ('cc000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', TRUE, NOW() - INTERVAL '10 days'),
    ('cc000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', TRUE, NOW() - INTERVAL '8 days'),
    ('cc000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000002', TRUE, NOW() - INTERVAL '15 days'),
    ('cc000000-0000-0000-0000-000000000004', 'aa000000-0000-0000-0000-000000000002', TRUE, NOW() - INTERVAL '12 days'),
    ('cc000000-0000-0000-0000-000000000006', 'aa000000-0000-0000-0000-000000000003', TRUE, NOW() - INTERVAL '7 days'),
    ('cc000000-0000-0000-0000-000000000008', 'aa000000-0000-0000-0000-000000000004', TRUE, NOW() - INTERVAL '20 days');

--==========================================================--
----------------------- ITEM MEDIA --------------------------
--==========================================================--

INSERT INTO item_media (item_id, url, media_type, display_order) VALUES
    ('cc000000-0000-0000-0000-000000000001', 'https://cdn.example.com/items/camera-front.jpg',    '.jpg', 1),
    ('cc000000-0000-0000-0000-000000000001', 'https://cdn.example.com/items/camera-side.jpg',     '.jpg', 2),
    ('cc000000-0000-0000-0000-000000000001', 'https://cdn.example.com/items/camera-top.jpg',      '.jpg', 3),
    ('cc000000-0000-0000-0000-000000000002', 'https://cdn.example.com/items/clean-code.jpg',      '.jpg', 1),
    ('cc000000-0000-0000-0000-000000000003', 'https://cdn.example.com/items/headset-main.jpg',    '.jpg', 1),
    ('cc000000-0000-0000-0000-000000000003', 'https://cdn.example.com/items/headset-cable.jpg',   '.jpg', 2),
    ('cc000000-0000-0000-0000-000000000004', 'https://cdn.example.com/items/controller.jpg',      '.jpg', 1),
    ('cc000000-0000-0000-0000-000000000005', 'https://cdn.example.com/items/ps-license.png',      '.png', 1),
    ('cc000000-0000-0000-0000-000000000006', 'https://cdn.example.com/items/keyboard-top.jpg',    '.jpg', 1),
    ('cc000000-0000-0000-0000-000000000006', 'https://cdn.example.com/items/keyboard-side.jpg',   '.jpg', 2),
    ('cc000000-0000-0000-0000-000000000007', 'https://cdn.example.com/items/bike.jpg',            '.jpg', 1),
    ('cc000000-0000-0000-0000-000000000008', 'https://cdn.example.com/items/guitar-front.jpg',    '.jpg', 1),
    ('cc000000-0000-0000-0000-000000000008', 'https://cdn.example.com/items/guitar-back.jpg',     '.jpg', 2),
    ('cc000000-0000-0000-0000-000000000009', 'https://cdn.example.com/items/desk.jpg',            '.jpg', 1);

--==========================================================--
----------------------- ITEM LISTS --------------------------
--==========================================================--

INSERT INTO item_list (item_list_id, owner_id, name, description, is_predefined) VALUES
    ('dd000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Wishlist',          'Items I want to receive',     TRUE),
    ('dd000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Saved for Later',   'Items I am considering',      FALSE),
    ('dd000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Tech Finds',        'Cool tech items',             FALSE);

INSERT INTO item_list_member (item_list_id, member_item_id) VALUES
    ('dd000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000003'),
    ('dd000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000008'),
    ('dd000000-0000-0000-0000-000000000002', 'cc000000-0000-0000-0000-000000000001'),
    ('dd000000-0000-0000-0000-000000000003', 'cc000000-0000-0000-0000-000000000006'),
    ('dd000000-0000-0000-0000-000000000003', 'cc000000-0000-0000-0000-000000000004');

--==========================================================--
---------------------- NEGOTIATIONS -------------------------
--==========================================================--

INSERT INTO negotiation (negotiation_id, created_by_user_id, content_description, is_public, status) VALUES
    ('ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Interested in trading my camera for your headset.',  TRUE,  'active'),
    ('ee000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Photoshop license for your guitar?',                 FALSE, 'active'),
    ('ee000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Looking to swap my controller.',                     TRUE,  'inactive');

INSERT INTO negotiation_participant (negotiation_id, user_id) VALUES
    ('ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
    ('ee000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
    ('ee000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'),
    ('ee000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002'),
    ('ee000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005');

--==========================================================--
------------------------ MESSAGES ---------------------------
--==========================================================--

INSERT INTO message (message_id, negotiation_id, sender_user_id, content) VALUES
    ('ff000000-0000-0000-0000-000000000001', 'ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hey Bob! Would you trade your headset for my vintage camera?'),
    ('ff000000-0000-0000-0000-000000000002', 'ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'That camera looks amazing! What condition is it in exactly?'),
    ('ff000000-0000-0000-0000-000000000003', 'ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Like new — only used a few times, comes with original case.'),
    ('ff000000-0000-0000-0000-000000000004', 'ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Deal! Let''s set up a meeting to finalize.'),
    ('ff000000-0000-0000-0000-000000000005', 'ee000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Dave, is your guitar still available? I have a Photoshop license to offer.'),
    ('ff000000-0000-0000-0000-000000000006', 'ee000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Yes! Send me the license details and we can talk.');

-- Soft-deleted message example
INSERT INTO message (message_id, negotiation_id, sender_user_id, content, is_deleted, delete_timestamp) VALUES
    ('ff000000-0000-0000-0000-000000000007', 'ee000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'This message was removed.', TRUE, NOW() - INTERVAL '1 day');

--==========================================================--
------------------------ MEETINGS ---------------------------
--==========================================================--

-- Physical meeting for negotiation 1 (Alice & Bob)
INSERT INTO meeting (meeting_id, negotiation_id, meeting_type, scheduled_at, due_date, created_by_user_id) VALUES
    ('11000000-0000-0000-0000-000000000001', 'ee000000-0000-0000-0000-000000000001', 'physical', NOW() + INTERVAL '3 days', NOW() + INTERVAL '4 days', '00000000-0000-0000-0000-000000000001');

-- Virtual meeting for negotiation 2 (Carol & Dave)
INSERT INTO meeting (meeting_id, negotiation_id, meeting_type, platform, access_code, scheduled_at, created_by_user_id) VALUES
    ('11000000-0000-0000-0000-000000000002', 'ee000000-0000-0000-0000-000000000002', 'virtual',  'Google Meet', 'abc-defg-hij', NOW() + INTERVAL '1 day', '00000000-0000-0000-0000-000000000003');

INSERT INTO meeting_invitee (meeting_id, user_id, rsvp_status) VALUES
    ('11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'accepted'),
    ('11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted'),
    ('11000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'accepted'),
    ('11000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'pending');

--==========================================================--
------------------------ EXCHANGES --------------------------
--==========================================================--

-- Exchange 1: Alice ↔ Bob — accepted (camera for headset)
INSERT INTO exchange (exchange_id, initiator_user_id, status, expiration_date, optional_message) VALUES
    ('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'accepted',  NOW() + INTERVAL '7 days', 'Let the swap begin!'),
    ('22000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'pending',   NOW() + INTERVAL '5 days', 'Photoshop for guitar — fair trade?'),
    ('22000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'rejected',  NOW() - INTERVAL '1 day', 'Controller for keyboard, interest?');

INSERT INTO exchange_participant (exchange_id, user_id, role) VALUES
    ('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'initiator'),
    ('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
    ('22000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'initiator'),
    ('22000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'member'),
    ('22000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'initiator'),
    ('22000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'member');

INSERT INTO exchange_item (exchange_id, item_id, direction) VALUES
    -- Exchange 1: Alice offers camera, Bob offers headset
    ('22000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000001', 'offered'),
    ('22000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000003', 'requested'),
    -- Exchange 2: Carol offers license, Dave offers guitar
    ('22000000-0000-0000-0000-000000000002', 'cc000000-0000-0000-0000-000000000005', 'offered'),
    ('22000000-0000-0000-0000-000000000002', 'cc000000-0000-0000-0000-000000000008', 'requested'),
    -- Exchange 3: Bob offers controller, Carol offers keyboard
    ('22000000-0000-0000-0000-000000000003', 'cc000000-0000-0000-0000-000000000004', 'offered'),
    ('22000000-0000-0000-0000-000000000003', 'cc000000-0000-0000-0000-000000000006', 'requested');

--==========================================================--
------------------------ RATINGS ----------------------------
-- Only for the accepted exchange (exc1: Alice ↔ Bob).      --
--==========================================================--

-- User ratings
INSERT INTO user_rating (exchange_id, rated_user_id, by_user_id, score, comment) VALUES
    ('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 5, 'Bob was great — fast, friendly, item exactly as described.'),
    ('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 4, 'Alice was reliable. Minor delay in responding but all good.');

-- Item ratings
INSERT INTO item_rating (exchange_id, item_id, rated_by_user_id, condition_received, comment) VALUES
    -- Alice rates the headset she received
    ('22000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'like new',  'Sound quality is incredible. Exactly as listed.'),
    -- Bob rates the camera he received
    ('22000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'like new',  'Beautiful camera. Came with the original case and strap.');

--==========================================================--
------------------------- REPORTS ---------------------------
--==========================================================--

INSERT INTO report (report_id, reporter_user_id, target_type, target_id, reason, description, status) VALUES
    ('33000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'user', '00000000-0000-0000-0000-000000000006', 'Scam attempt',       'User asked to trade outside the platform and ghosted.', 'reviewed'),
    ('33000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'item', 'cc000000-0000-0000-0000-000000000007', 'Misleading condition','Item was listed as heavily used but arrived broken.',    'open'),
    ('33000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'user', '00000000-0000-0000-0000-000000000006', 'Harassment',         'Sent repeated unsolicited messages.',                   'resolved');

--==========================================================--
---------------------- NOTIFICATIONS ------------------------
--==========================================================--

INSERT INTO notification (notification_id, recipient_user_id, sender_user_id, type, reference_type, reference_id, title, body, delivery_channel, status, priority) VALUES
    ('44000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL,                                         'account_created',    NULL,         NULL, 'Welcome to Trueke!',         'Your account is ready. Start trading!',                     'in_app', 'sent',    'normal'),
    ('44000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',        'proposal_created',   'exchange',   '22000000-0000-0000-0000-000000000001', 'New Trade Proposal', 'Alice wants to trade with you!',          'in_app', 'sent',    'high'),
    ('44000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',        'proposal_accepted',  'exchange',   '22000000-0000-0000-0000-000000000001', 'Proposal Accepted!', 'Bob accepted your trade proposal.',       'in_app', 'sent',    'high'),
    ('44000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',        'rating_received',    'user_rating','22000000-0000-0000-0000-000000000001', 'You received a rating', 'Bob rated you 4/5.',                  'in_app', 'sent',    'normal'),
    ('44000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',        'rating_received',    'user_rating','22000000-0000-0000-0000-000000000001', 'You received a rating', 'Alice rated you 5/5.',                'email',  'sent',    'normal'),
    ('44000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',        'message_received',   'negotiation','ee000000-0000-0000-0000-000000000002', 'New Message',         'You have a new message from Alice.',      'in_app', 'queued',  'normal'),
    ('44000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', NULL,                                         'meeting_invite',     'meeting',    '11000000-0000-0000-0000-000000000001', 'Meeting Scheduled',   'A meeting has been set for your trade.',   'in_app', 'sent',    'high');

--==========================================================--
--------------------- LOGIN EVENTS --------------------------
--==========================================================--

INSERT INTO login_event (user_id, event_type, event_time, ip_address, user_agent) VALUES
    ('00000000-0000-0000-0000-000000000001', 'login',  NOW() - INTERVAL '2 hours',   '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    ('00000000-0000-0000-0000-000000000001', 'logout', NOW() - INTERVAL '1 hour',    '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    ('00000000-0000-0000-0000-000000000001', 'login',  NOW() - INTERVAL '30 minutes','192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    ('00000000-0000-0000-0000-000000000002', 'login',  NOW() - INTERVAL '4 hours',   '10.0.0.5',     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
    ('00000000-0000-0000-0000-000000000003', 'login',  NOW() - INTERVAL '1 day',     '203.0.113.42', 'Mozilla/5.0 (X11; Linux x86_64)'),
    ('00000000-0000-0000-0000-000000000003', 'logout', NOW() - INTERVAL '23 hours',  '203.0.113.42', 'Mozilla/5.0 (X11; Linux x86_64)'),
    ('00000000-0000-0000-0000-000000000004', 'login',  NOW() - INTERVAL '3 days',    '198.51.100.7', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'),
    ('00000000-0000-0000-0000-000000000006', 'login',  NOW() - INTERVAL '10 days',   '198.51.100.99','Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
