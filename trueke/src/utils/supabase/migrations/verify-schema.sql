-- Confirm All Tables Exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'user', 'address', 'user_address', 'user_list', 'user_list_member',
      'item', 'item_address', 'item_media', 'item_list', 'item_list_member',
      'negotiation', 'negotiation_participant', 'message',
      'meeting', 'meeting_invitee',
      'exchange', 'exchange_participant', 'exchange_item',
      'user_rating', 'item_rating',
      'report', 'notification', 'login_event'
  )
ORDER BY table_name;