--==========================================================--
---------------------- QUERY SCHEMA -------------------------
-- Runs a SELECT against every table and key JOIN pattern   --
-- to confirm data loaded correctly and relationships hold. --
-- Run AFTER fake-data.sql.                                 --
--==========================================================--


--==========================================================--
-- 1. USERS
--==========================================================--

-- All users
SELECT * FROM "user" ORDER BY created_at;

-- Active users only
SELECT user_id, username, email, status
FROM "user"
WHERE status = 'active'
ORDER BY username;

-- Admin users
SELECT user_id, username, email
FROM "user"
WHERE is_admin = TRUE;

-- Banned users
SELECT user_id, username, status, end_ban_date_time
FROM "user"
WHERE status = 'banned';


--==========================================================--
-- 2. ADDRESSES
--==========================================================--

-- All addresses
SELECT * FROM "address" ORDER BY country_code, province_state;

-- Addresses by country
SELECT address_id, country_code, canton_city, province_state
FROM "address"
WHERE country_code = 'CR';


--==========================================================--
-- 3. USER ADDRESSES
--==========================================================--

-- All user address records (history)
SELECT
    u.username,
    a.address_line1,
    a.canton_city,
    a.country_code,
    ua.is_current,
    ua.active_start_time,
    ua.deactivated_time
FROM user_address ua
JOIN "user"    u ON u.user_id    = ua.user_id
JOIN "address" a ON a.address_id = ua.address_id
ORDER BY u.username, ua.active_start_time DESC;

-- Current address per user only
SELECT
    u.username,
    a.address_line1,
    a.canton_city,
    a.province_state,
    a.country_code
FROM user_address ua
JOIN "user"    u ON u.user_id    = ua.user_id
JOIN "address" a ON a.address_id = ua.address_id
WHERE ua.is_current = TRUE;


--==========================================================--
-- 4. USER LISTS & MEMBERS
--==========================================================--

-- All user lists
SELECT
    ul.name,
    ul.description,
    ul.is_predefined,
    u.username AS owner
FROM user_list ul
JOIN "user" u ON u.user_id = ul.owner_id
ORDER BY ul.name;

-- List members with owner and member details
SELECT
    ul.name          AS list_name,
    owner.username   AS owner,
    member.username  AS member
FROM user_list_member ulm
JOIN user_list ul     ON ul.list_id          = ulm.list_id
JOIN "user"    owner  ON owner.user_id       = ul.owner_id
JOIN "user"    member ON member.user_id      = ulm.member_user_id
ORDER BY ul.name, member.username;


--==========================================================--
-- 5. ITEMS
--==========================================================--

-- All items
SELECT
    i.title,
    i.condition,
    i.status,
    i.item_type,
    i.category,
    u.username AS owner
FROM item i
JOIN "user" u ON u.user_id = i.owner_user_id
ORDER BY i.status, i.title;

-- Active physical items
SELECT i.title, i.condition, i.category, u.username AS owner
FROM item i
JOIN "user" u ON u.user_id = i.owner_user_id
WHERE i.status = 'active' AND i.item_type = 'physical'
ORDER BY i.title;

-- Digital items
SELECT i.title, i.condition, u.username AS owner
FROM item i
JOIN "user" u ON u.user_id = i.owner_user_id
WHERE i.item_type = 'digital';

-- Items per user (count)
SELECT u.username, COUNT(i.item_id) AS total_items
FROM "user" u
LEFT JOIN item i ON i.owner_user_id = u.user_id
GROUP BY u.username
ORDER BY total_items DESC;


--==========================================================--
-- 6. ITEM ADDRESSES
--==========================================================--

SELECT
    i.title,
    a.canton_city,
    a.country_code,
    ia.is_current
FROM item_address ia
JOIN item      i ON i.item_id    = ia.item_id
JOIN "address" a ON a.address_id = ia.address_id
ORDER BY i.title;


--==========================================================--
-- 7. ITEM MEDIA
--==========================================================--

-- All media ordered by item and display position
SELECT
    i.title,
    im.url,
    im.media_type,
    im.display_order
FROM item_media im
JOIN item i ON i.item_id = im.item_id
ORDER BY i.title, im.display_order;

-- Media count per item
SELECT
    i.title,
    COUNT(im.media_id) AS media_count
FROM item i
LEFT JOIN item_media im ON im.item_id = i.item_id
GROUP BY i.item_id, i.title
ORDER BY media_count DESC;


--==========================================================--
-- 8. ITEM LISTS & MEMBERS
--==========================================================--

SELECT
    il.name          AS list_name,
    u.username       AS owner,
    i.title          AS item_title
FROM item_list_member ilm
JOIN item_list il ON il.item_list_id = ilm.item_list_id
JOIN "user"    u  ON u.user_id       = il.owner_id
JOIN item      i  ON i.item_id       = ilm.member_item_id
ORDER BY il.name, i.title;


--==========================================================--
-- 9. NEGOTIATIONS & PARTICIPANTS
--==========================================================--

-- All negotiations
SELECT
    n.content_description,
    n.status,
    n.is_public,
    u.username AS created_by,
    n.created_at
FROM negotiation n
JOIN "user" u ON u.user_id = n.created_by_user_id
ORDER BY n.created_at DESC;

-- Participants per negotiation
SELECT
    n.content_description AS negotiation,
    u.username            AS participant,
    np.joined_at
FROM negotiation_participant np
JOIN negotiation n ON n.negotiation_id = np.negotiation_id
JOIN "user"      u ON u.user_id        = np.user_id
ORDER BY n.negotiation_id, np.joined_at;


--==========================================================--
-- 10. MESSAGES
--==========================================================--

-- All non-deleted messages with sender info
SELECT
    m.content,
    u.username   AS sender,
    n.content_description AS negotiation,
    m.is_edited,
    m.created_at
FROM message m
JOIN "user"      u ON u.user_id        = m.sender_user_id
JOIN negotiation n ON n.negotiation_id = m.negotiation_id
WHERE m.is_deleted = FALSE
ORDER BY m.created_at;

-- Soft-deleted messages
SELECT message_id, content, delete_timestamp
FROM message
WHERE is_deleted = TRUE;

-- Message count per negotiation
SELECT
    n.content_description,
    COUNT(m.message_id) AS message_count
FROM negotiation n
LEFT JOIN message m ON m.negotiation_id = n.negotiation_id AND m.is_deleted = FALSE
GROUP BY n.negotiation_id, n.content_description
ORDER BY message_count DESC;


--==========================================================--
-- 11. MEETINGS & INVITEES
--==========================================================--

-- All meetings
SELECT
    m.meeting_type,
    m.platform,
    m.scheduled_at,
    m.due_date,
    u.username AS created_by,
    n.content_description AS for_negotiation
FROM meeting m
JOIN "user"      u ON u.user_id        = m.created_by_user_id
JOIN negotiation n ON n.negotiation_id = m.negotiation_id
ORDER BY m.scheduled_at;

-- RSVP status per meeting
SELECT
    m.meeting_type,
    m.scheduled_at,
    u.username     AS invitee,
    mi.rsvp_status
FROM meeting_invitee mi
JOIN meeting m ON m.meeting_id = mi.meeting_id
JOIN "user"  u ON u.user_id    = mi.user_id
ORDER BY m.scheduled_at, mi.rsvp_status;

-- Upcoming meetings (scheduled in the future)
SELECT meeting_type, platform, scheduled_at
FROM meeting
WHERE scheduled_at > NOW()
ORDER BY scheduled_at;


--==========================================================--
-- 12. EXCHANGES
--==========================================================--

-- All exchanges with initiator
SELECT
    e.status,
    e.creation_date,
    e.expiration_date,
    u.username AS initiator,
    e.optional_message
FROM exchange e
JOIN "user" u ON u.user_id = e.initiator_user_id
ORDER BY e.creation_date DESC;

-- Participants per exchange with roles
SELECT
    e.exchange_id,
    e.status,
    u.username AS participant,
    ep.role
FROM exchange_participant ep
JOIN exchange e ON e.exchange_id = ep.exchange_id
JOIN "user"   u ON u.user_id     = ep.user_id
ORDER BY e.exchange_id, ep.role;

-- Items involved in each exchange
SELECT
    e.status,
    i.title,
    ei.direction,
    owner.username AS item_owner
FROM exchange_item ei
JOIN exchange e      ON e.exchange_id  = ei.exchange_id
JOIN item     i      ON i.item_id      = ei.item_id
JOIN "user"   owner  ON owner.user_id  = i.owner_user_id
ORDER BY e.exchange_id, ei.direction;

-- Full exchange summary: who trades what with whom
SELECT
    e.exchange_id,
    e.status,
    initiator.username  AS initiator,
    member.username     AS member,
    offered.title       AS offered_item,
    requested.title     AS requested_item
FROM exchange e
JOIN exchange_participant ep_i  ON ep_i.exchange_id = e.exchange_id AND ep_i.role = 'initiator'
JOIN exchange_participant ep_m  ON ep_m.exchange_id = e.exchange_id AND ep_m.role = 'member'
JOIN "user" initiator           ON initiator.user_id = ep_i.user_id
JOIN "user" member              ON member.user_id    = ep_m.user_id
LEFT JOIN exchange_item ei_off  ON ei_off.exchange_id = e.exchange_id AND ei_off.direction = 'offered'
LEFT JOIN item offered           ON offered.item_id   = ei_off.item_id
LEFT JOIN exchange_item ei_req  ON ei_req.exchange_id = e.exchange_id AND ei_req.direction = 'requested'
LEFT JOIN item requested         ON requested.item_id = ei_req.item_id
ORDER BY e.creation_date DESC;


--==========================================================--
-- 13. RATINGS
--==========================================================--

-- User ratings with rater and rated usernames
SELECT
    rater.username  AS rated_by,
    rated.username  AS rated_user,
    ur.score,
    ur.comment,
    ur.created_at
FROM user_rating ur
JOIN "user" rater ON rater.user_id = ur.by_user_id
JOIN "user" rated ON rated.user_id = ur.rated_user_id
ORDER BY ur.created_at DESC;

-- Average user rating per user
SELECT
    u.username,
    ROUND(AVG(ur.score), 2) AS avg_score,
    COUNT(ur.user_rating_id) AS total_ratings
FROM "user" u
LEFT JOIN user_rating ur ON ur.rated_user_id = u.user_id
GROUP BY u.user_id, u.username
ORDER BY avg_score DESC NULLS LAST;

-- Item ratings
SELECT
    i.title,
    rater.username    AS rated_by,
    ir.condition_received,
    ir.comment,
    ir.created_at
FROM item_rating ir
JOIN item   i     ON i.item_id    = ir.item_id
JOIN "user" rater ON rater.user_id = ir.rated_by_user_id
ORDER BY ir.created_at DESC;


--==========================================================--
-- 14. REPORTS
--==========================================================--

-- All reports
SELECT
    r.target_type,
    r.reason,
    r.status,
    reporter.username AS reporter,
    r.description,
    r.created_at
FROM report r
JOIN "user" reporter ON reporter.user_id = r.reporter_user_id
ORDER BY r.created_at DESC;

-- Open reports only
SELECT r.target_type, r.target_id, r.reason, reporter.username AS reporter
FROM report r
JOIN "user" reporter ON reporter.user_id = r.reporter_user_id
WHERE r.status = 'open';


--==========================================================--
-- 15. NOTIFICATIONS
--==========================================================--

-- All notifications for a specific user (Alice)
SELECT
    n.type,
    n.title,
    n.body,
    n.delivery_channel,
    n.status,
    n.priority,
    n.is_read
FROM notification n
WHERE n.recipient_user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY n.priority DESC, n.sent_at DESC;

-- Unread in-app notifications per user
SELECT
    u.username,
    COUNT(n.notification_id) AS unread_count
FROM "user" u
LEFT JOIN notification n
    ON n.recipient_user_id = u.user_id
    AND n.delivery_channel = 'in_app'
    AND n.is_read = FALSE
GROUP BY u.user_id, u.username
ORDER BY unread_count DESC;

-- High-priority notifications that are still queued
SELECT recipient.username, n.title, n.type, n.priority
FROM notification n
JOIN "user" recipient ON recipient.user_id = n.recipient_user_id
WHERE n.priority = 'high' AND n.status = 'queued';


--==========================================================--
-- 16. LOGIN EVENTS
--==========================================================--

-- All login events newest first
SELECT
    u.username,
    le.event_type,
    le.event_time,
    le.ip_address
FROM login_event le
JOIN "user" u ON u.user_id = le.user_id
ORDER BY le.event_time DESC;

-- Login count per user
SELECT
    u.username,
    COUNT(*) FILTER (WHERE le.event_type = 'login')  AS login_count,
    COUNT(*) FILTER (WHERE le.event_type = 'logout') AS logout_count
FROM login_event le
JOIN "user" u ON u.user_id = le.user_id
GROUP BY u.user_id, u.username
ORDER BY login_count DESC;

-- Most recent login per user
SELECT DISTINCT ON (u.user_id)
    u.username,
    le.event_time AS last_login,
    le.ip_address
FROM login_event le
JOIN "user" u ON u.user_id = le.user_id
WHERE le.event_type = 'login'
ORDER BY u.user_id, le.event_time DESC;
