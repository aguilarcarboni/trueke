# Trueke — User Stories

---

## EPIC: User Authentication *(existing)*

---

### [AUTH-3.1] Password Recovery

**Status:** New

**Description**

Password Recovery.
As a user
I want to recover my account when I forget my password
So that I can regain access to the platform without creating a new account

**Acceptance Criteria:** JIRA

AC1: A "Forgot my password" link is visible on the login page.
AC2: The system asks for my registered email address.
AC3: If the email exists, a password-reset link is sent to that email.
AC4: If the email does not exist, a generic message is shown (e.g., "If an account with that email exists, a reset link has been sent") to prevent account enumeration.
AC5: The reset link expires after a reasonable time window (e.g., 15–60 minutes).
AC6: Clicking the reset link takes me to a form where I can set a new password.
AC7: The new password must meet the same validation rules as registration (8+ chars, 1 uppercase, 1 number, 1 special character).
AC8: After successfully resetting, I am redirected to the login page with a confirmation message.
AC9: The old password no longer works after a successful reset.

**Comments:**

- Currently, authentication is handled with a custom bcrypt-hashed password flow stored in the `user` table (not Supabase Auth). There is no password reset mechanism in place.
- Implementation will require a new `password_reset_token` table (or columns on `user`) to store a hashed token, user_id, created_at, and expires_at.
- An email delivery service must be integrated (e.g., Supabase Edge Functions + Resend/SendGrid, or a transactional email provider). This is a new infrastructure dependency.
- The reset link should contain a cryptographically secure token (e.g., `crypto.randomUUID()` or `crypto.randomBytes`), stored hashed in the DB—never plain text.
- Rate-limiting should be considered on the reset request endpoint to prevent abuse.
- The generic message on AC4 is intentional to avoid leaking which emails are registered.

---

### [AUTH-3.2] Soft Delete Account

**Status:** New

**Description**

Account Soft Deletion.
As a user
I want to deactivate my account
So that my data is preserved but I can no longer access or be visible on the platform

**Acceptance Criteria:** JIRA

AC1: An option to deactivate/delete my account is available in my profile settings.
AC2: Before deactivation, I am asked to confirm my decision (e.g., a confirmation dialog with a password re-entry).
AC3: After deactivation, I am logged out and cannot log back in.
AC4: My items are no longer visible in the marketplace.
AC5: My profile is no longer visible to other users.
AC6: Any pending exchange proposals involving my items are automatically cancelled.
AC7: I receive a confirmation email that my account has been deactivated.

**Comments:**

- The `user` table already has a `status` column with enum values `'active' | 'inactive' | 'banned'`. Soft delete can leverage the `'inactive'` status.
- The login action in `login/actions.ts` already checks `user.status !== 'active'` and blocks login, so setting status to `'inactive'` will naturally prevent login.
- Items owned by the deactivated user should have their `status` set to `'deleted'` (the item_status enum already supports this).
- All pending exchanges where the user is a participant should transition to `'cancelled'`.
- Consider whether account reactivation should be possible (e.g., within 30 days) and if so, add a `deactivated_at` timestamp for the grace period.
- A cascading server action is needed that updates user status, cancels active exchanges, and sets items to deleted—ideally within a single transaction or DB function.
- **Shared logic note:** The side effects of user status changes (items hidden/deleted, exchanges cancelled) are the same for deactivation (this story) and banning ([UCM-1.3]). Both should share a common backend handler (e.g., `handleUserStatusChange(userId, newStatus)`) to avoid duplicating this logic.

---

### [AUTH-3.3] Change Password or Email

**Status:** New

**Description**

Account Credentials Update.
As a user
I want to change my password or email address
So that I can keep my account secure and up to date

**Acceptance Criteria:** JIRA

AC1: A section in my profile settings allows me to update my email or password.
AC2: To change my password, I must provide my current password and the new password.
AC3: The new password must meet the same validation rules as registration.
AC4: To change my email, I must provide my current password for verification.
AC5: The new email must not already be in use by another account.
AC6: Errors are displayed clearly if validation fails (e.g., "Current password is incorrect", "Email already in use").
AC7: After a successful password change, my current session remains active.
AC8: After a successful email change, a confirmation is shown.

**Comments:**

- Passwords are stored as bcrypt hashes in the `user.password_hash` column. The update flow must hash the new password with the same salt rounds (`SALT_ROUNDS = 10` as defined in `register/actions.ts`).
- Email uniqueness is enforced at the DB level (`email VARCHAR(255) NOT NULL UNIQUE` in `create-schema.sql`).
- The current `user/actions.ts` only has a `updateProfileAction` that calls `updateUserProfile`—this does not handle password or email changes. A new server action is needed.
- Session invalidation (AC7) depends on the session mechanism: currently sessions use a cookie-based `session_token`. If sessions are not stored server-side in a sessions table, invalidating other sessions may require adding one.
- Consider requiring email verification for email changes before the new email becomes active (sending a confirmation link to the new email). This is a stretch goal but recommended.
- After a successful password change, my current session remains active but all other sessions are invalidated.

---

### [AUTH-3.4] User Rating Average

**Status:** New

**Description**

User Rating Display.
As a user
I want to see a rating average on every user's profile
So that I can evaluate the trustworthiness of someone before trading

**Acceptance Criteria:** JIRA

AC1: Every user profile displays an average rating score (e.g., 4.5 / 5).
AC2: The rating is visible to all logged-in users who view a profile.
AC3: The rating also appears next to the user's name on their item listings in the marketplace.
AC4: If a user has no ratings yet, a label such as "No ratings yet" is displayed instead of a number.
AC5: The total number of ratings is shown alongside the average (e.g., "4.5 (12 ratings)").

**Comments:**

- The `user_rating` table already exists with a `score SMALLINT CHECK (score BETWEEN 1 AND 5)`, `exchange_id`, `rated_user_id`, and `by_user_id`.
- The average should be computed with a SQL aggregate: `SELECT AVG(score)::NUMERIC(2,1), COUNT(*) FROM user_rating WHERE rated_user_id = $1`.
- For performance, consider creating a materialized view or a denormalized `rating_avg` and `rating_count` column on the `user` table, updated via trigger on `user_rating` inserts.
- The `Item` type in `exchangeTypes.ts` already has optional `owner_rating` and `owner_totalTrades` fields—these should be populated from real data instead of mock data.
- The mock data in `data.ts` uses hardcoded ratings (e.g., `rating: 4.8`). This needs to resolve from the database.
- A DB function or RPC (e.g., `get_user_rating_avg(p_user_id UUID)`) is recommended to encapsulate the calculation.

---

## EPIC: User Control & Management *(new)*

---

### [UCM-1.1] Ban Users

**Status:** New

**Description**

User Banning.
As an administrator
I want to ban a user from the platform
So that I can enforce community guidelines and protect other users

**Acceptance Criteria:** JIRA

AC1: In the admin dashboard, I can see a list of all users with their status.
AC2: I can select a user and choose to ban them.
AC3: When banning a user, I must specify a ban duration (e.g., 7 days, 30 days, permanent).
AC4: A reason for the ban can optionally be provided.
AC5: The ban action is recorded in the admin log.

> **Note:** The effects of a ban on the user (login blocked, items hidden, exchanges cancelled, auto-restore on expiry) are defined in [UCM-1.3] Banned User Restriction. This story covers only the admin action of issuing a ban.

**Comments:**

- The `user` table already has `status user_status` with `'banned'` as a valid value, and an `end_ban_date_time` column.
- A DB constraint `chk_ban_dates` already enforces that banned users must have `end_ban_date_time IS NOT NULL` and active users must have it `IS NULL`.
- The login flow in `login/actions.ts` already checks `user.end_ban_date_time` and blocks login if the ban has not expired—this logic is already implemented.
- The admin UI in `admin.tsx` has a `handleBanUser` function that currently only calls `console.log`. This needs to be wired to a real server action.
- For "permanent" bans, set `end_ban_date_time` to a far-future date (e.g., year 9999) since the column is `NOT NULL` when status is `'banned'`.
- When a user is banned, all their pending exchanges should be cancelled and their active items should be set to `'deleted'` or a new intermediate state.
- An audit log mechanism (currently hardcoded mock data `auditLogs` in `admin.tsx`) needs a real DB table or use the existing `login_event` pattern.
- After banning, the user's status changes to "banned" and they are immediately prevented from performing any actions.

---

### [UCM-1.2] View Reports

**Status:** New

**Description**

Admin Report Viewing.
As an administrator
I want to view all user and item reports submitted by the community
So that I can review flagged content and take appropriate action

**Acceptance Criteria:** JIRA

AC1: The admin dashboard displays a list of all reports with their current status (Open, Reviewed, Resolved).
AC2: I can filter reports by status and search by reporter name, reported user/item, or reason.
AC3: I can click on a report to see its full details: reporter info, reason, description, and submission date.
AC4: From the report detail view, I can take action: resolve the report, dismiss the report, or ban the reported user.
AC5: When a report is resolved, I can optionally add admin notes.
AC6: Report data should include: reporter identity, reported (user or item), reason category, free-text description, date filed, and current status.
AC7: Resolved/dismissed reports remain accessible for historical reference.

**Comments:**

- The `report` table already exists in the DB with: `report_id`, `reporter_user_id`, `target_type` (ENUM: `'user' | 'item'`), `target_id`, `reason`, `description`, `status` (ENUM: `'open' | 'reviewed' | 'resolved'`), and `created_at`.
- The admin UI in `admin.tsx` currently renders reports from mock data imported from `data.ts`. This needs to be replaced with real data fetched from the `report` table.
- The status filter and search functionality are already built in the UI (`filterStatus`, `searchQuery` states)—they just need to operate on real data.
- `handleResolveReport` and `handleBanUser` are placeholder functions (console.log) that need server actions.
- Consider adding an `admin_notes` column to the `report` table and a `resolved_by_user_id` FK for audit trail.
- The `notification_type` enum already includes `'item_reported'` and `'user_reported'`, so notifications can be sent when reports are filed or resolved.
- **Open question for PO:** What specific data/metrics should admin reports aggregate? Current implementation only shows individual reports—if the PO wants summary analytics (e.g., reports per week, most-reported users, report resolution time), that would be a separate dashboard widget.

---

### [UCM-1.3] Banned User Restriction

**Status:** New

**Description**

Banned User Access Control.
As an administrator
I want to prevent banned users from interacting with any part of the platform
So that community safety and moderation actions are enforced

**Acceptance Criteria:** JIRA

AC1: A banned user cannot log in and sees a clear message stating their account is banned.
AC2: A banned user cannot create, edit, or view items.
AC3: A banned user cannot send messages or proposals.
AC4: If a ban duration has expired, the user's status is automatically restored to active and they can log in again.
AC5: Banned user's items are hidden from marketplace, and pending exchanges cancelled.

> **Shared logic note:** The side effects in AC5 (items hidden, exchanges cancelled) are the same as [AUTH-3.2] Soft Delete Account AC4+AC6. Both should share a common backend handler (e.g., `handleUserStatusChange(userId, newStatus)`) to avoid duplicating this logic.

**Comments:**

- Login blocking for banned users is already partially implemented in `login/actions.ts`—it checks `user.end_ban_date_time` and returns an error if the ban has not expired.
- However, middleware-level enforcement does not currently exist. If a user is banned while they are already logged in (have a valid session cookie), they can continue to use the app until the cookie expires. A server-side session check must be added on every authenticated request.
- Consider creating a `middleware.ts` (Next.js middleware) or a shared `requireAuth()` utility that checks user status on every server action / API route.
- For AC5 (auto-restore), two approaches:
  1. **Lazy approach (recommended):** On each login attempt, check if `end_ban_date_time < NOW()`. If so, update status back to `'active'` and clear `end_ban_date_time`. The current login code already compares dates but doesn't auto-restore.
  2. **Scheduled approach:** A cron job or Supabase pg_cron to periodically unban expired users.
- When banning mid-session, the user's active session cookies should be invalidated. This may require a server-side session store or a `banned_at` timestamp check on every request.
- A banned user cannot access any API endpoint that requires authentication.

---

## EPIC: Item Management *(existing)*

---

### [ITEM-3.1] Item State Lifecycle

**Status:** New

**Description**

Item State Management.
As a user
I want my items to have clear states throughout their lifecycle
So that I understand the current status of each item and its availability for trading

**Acceptance Criteria:** JIRA

AC1: Items can be in one of the following states: Draft, Active, Contested, Traded, Archived.
AC2: New items are created in "Draft" state by default.
AC3: I can publish a draft item to make it "Active" and visible in the marketplace.
AC4: I can archive my items to remove them from the marketplace without deleting them.
AC5: Each item's state is clearly displayed on my items list and in the marketplace.

> **Note:** Exchange-driven state transitions (Active → Contested → Traded, and revert to Active on cancellation) are defined in [EXCH-3.2]. This story covers only user-initiated state changes.

**Comments:**

- The current `item_status` enum in the DB is: `'draft' | 'active' | 'contested' | 'traded' | 'deleted'`.
- The user story mentions "Archived" but the DB currently uses `'deleted'` for soft deletion. **Decision needed:** either add `'archived'` as a new enum value (requires `ALTER TYPE item_status ADD VALUE 'archived'`) or repurpose `'deleted'` as the archive state and accept that archived and deleted are the same.
- The `item-constants.ts` file has labels and styles for all current statuses including `'contested'`—these are already defined but not fully utilized in the UI.
- Currently, items are created as `'draft'` (see `items/actions.ts` line 55: `status: 'draft'`). There is no "publish" action to transition from draft → active in the existing server actions.
- The `exchange-actions.ts` `createExchangeProposal` calls an RPC function `create_exchange_proposal`—this DB function needs to be checked/updated to set items to `'contested'` upon acceptance.
- The marketplace already filters only `status: 'active'` items, so contested/traded/deleted items are already excluded.

---

### [ITEM-3.2] Item Condition Options

**Status:** New

**Description**

Item Condition Categories.
As a user
I want to describe the condition of my item when listing it
So that potential trading partners know what to expect

**Acceptance Criteria:** JIRA

AC1: When creating or editing an item, I must select a condition from the available options.
AC2: The available conditions are: New, Like New, Good, Acceptable, Bad.
AC3: The condition is clearly displayed on the item listing with a visual indicator (e.g., color-coded badge).
AC4: The condition can be updated as long as the item is not in an active exchange.

**Comments:**

- The current `item_condition` enum in the DB is: `'new' | 'like new' | 'used' | 'heavily used' | 'broken'`.
- The user story specifies different labels: "Good, Acceptable, Bad" instead of "Used, Heavily Used, Broken". **Decision needed with PO:** either update the DB enum values or just relabel the display names. Changing DB enums requires a migration with `ALTER TYPE`.
- If the enum values change, all existing items with the old condition values must be migrated (e.g., `UPDATE item SET condition = 'good' WHERE condition = 'used'`).
- `item-constants.ts` has full label maps, badge styles, and helper functions for conditions—these would need to be updated.
- The `create-item.tsx` component and `items/actions.ts` both reference the current enum values—they must stay in sync with whatever the DB uses.

---

### [ITEM-3.3] Multiple Image Upload Enforcement

**Status:** ~~New~~ **Absorbed** — Merged into [INFRA-1.1] and [ITEM-FE-1.1]

> **This story has been retired.** All of its acceptance criteria are now covered by other stories:
> - AC1–AC5 (multi-upload, preview, remove, validation) → [INFRA-1.1] AC1–AC10
> - AC2–AC3 (at least one image required, error message) → [ITEM-FE-1.1] AC4
> - AC6 (first image = thumbnail) → [INFRA-1.1] AC11
>
> Keeping this entry for traceability only. Do not implement separately.

---

### [ITEM-3.4] Delete Items

**Status:** New

**Description**

Item Deletion.
As a user
I want to delete my items
So that I can remove listings I no longer want to trade

**Acceptance Criteria:** JIRA

AC1: I can delete an item from my items list.
AC2: A confirmation dialog is shown before deleting.
AC3: An item can only be deleted if it is not part of an active (pending or contested) exchange.
AC4: If the item is in an active exchange, I see a message explaining why it cannot be deleted.
AC5: Deleted items are no longer visible in the marketplace.
AC6: Deleted items remain accessible in my item history for reference.

**Comments:**

- The `item_status` enum already includes `'deleted'` — this is a soft delete, not a hard delete (the row remains in the DB).
- There is no `deleteItem` server action currently. A new action is needed in `items/actions.ts` that:
  1. Verifies ownership.
  2. Checks that the item is not part of any exchange with status `'pending'`.
  3. Sets `item.status = 'deleted'`.
- The marketplace query already filters `status: 'active'`, so setting status to `'deleted'` will automatically hide the item.
- The "My Items" section should differentiate between active and deleted items (perhaps a separate tab or filter).
- The `exchange_item` table relationship via FK means the item row itself should never be hard-deleted (to preserve exchange history), reinforcing the soft-delete approach.

---

### [ITEM-3.5] Search and Filter Items

**Status:** New

**Description**

Item Search and Filtering.
As a user
I want to search for items by title and filter by criteria
So that I can quickly find items I am interested in trading for

**Acceptance Criteria:** JIRA

AC1: A search bar is available in the marketplace that matches items by title keywords.
AC2: I can filter items by category.
AC3: I can filter items by condition.
AC4: I can filter items by item type (physical / digital).
AC5: Filters can be combined with search.
AC6: The results update as I type or change filters.
AC7: When no results match, a clear "No items found" message is displayed.

**Comments:**

- The `marketplace.tsx` component already has search by title/description and a category filter implemented client-side.
- However, condition filter and item type filter are not implemented yet—the UI only has a "SlidersHorizontal" button that is non-functional.
- Current search is purely client-side (all items are fetched, then filtered with `.filter()`). For scalability, consider moving search to the server side with Supabase's `.ilike()` or full-text search using `to_tsvector`.
- The `getMarketplaceItems()` action fetches all active items without any filter parameters. To support server-side filtering, this function would need to accept filter parameters.
- Adding condition and type filters to the UI requires additional `<Select>` components alongside the existing category filter.
- Consider debouncing the search input to avoid excessive re-renders.

---

### [ITEM-3.6] Report Items

**Status:** New

**Description**

Item Reporting.
As a user
I want to report an item that I believe violates community guidelines
So that administrators can review it and take action

**Acceptance Criteria:** JIRA

AC1: A "Report" option is available on every item detail view.
AC2: When reporting, I must select a reason from predefined categories (e.g., Misleading Description, Fake Item, Inappropriate Content, Spam, Other).
AC3: I can provide an optional description to give more context.
AC4: After submitting, I receive a confirmation that the report has been filed.
AC5: I cannot report my own items.
AC6: The item owner is notified that their item has been reported.
AC7: The report appears in the admin dashboard for review.

**Comments:**

- The `report` table already exists with `target_type` supporting `'item'`, plus `reason`, `description`, and `status` fields.
- The `notification_type` enum already includes `'item_reported'`, so the notification infrastructure for AC6 is partially in place.
- A new server action `createItemReport` is needed that inserts into `report` with `target_type = 'item'` and `target_id = item_id`.
- The admin UI in `admin.tsx` already has a reports tab with filtering and detail views—it just uses mock data. Wiring it to real data will satisfy AC7.
- Consider preventing duplicate reports (same user reporting the same item twice). A unique constraint on `(reporter_user_id, target_type, target_id)` or an application-layer check would work.
- **Open question for PO:** Should the item be automatically hidden from the marketplace after a certain number of reports, or only after admin review?

---

## EPIC: Direct Exchange *(existing)*

---

### [EXCH-3.1] Counteroffer

**Status:** New

**Description**

Exchange Counteroffer.
As a user who receives an exchange proposal
I want to make a counteroffer with different items
So that I can negotiate a trade that works better for me

**Acceptance Criteria:** JIRA

AC1: When viewing a received exchange proposal, I have the option to "Counteroffer" in addition to Accept and Reject.
AC2: The counteroffer form shows the original proposal details for reference.
AC3: I can select different items from my inventory to offer.
AC4: I can modify which of my items are being requested.
AC5: I can include an optional message explaining my counteroffer.
AC6: After submitting, the original proposal status changes and the counteroffer becomes the active proposal.
AC7: The original proposer is notified of the counteroffer.
AC8: I can see the full history of offers and counteroffers in the exchange, showing who proposed what and when.
AC9: The most recent counteroffer is clearly distinguished from older ones.

**Comments:**

- **Consolidation note:** AC8–AC9 absorb the scope of the former [OFFER-1.2] "Counteroffer History." The offer-handling epic was removed; counteroffer tracking now lives here where it belongs.
- The `notification_type` enum already includes `'counter_offer'`, indicating this feature was planned from the database design phase.
- The current exchange flow only supports: create → accept/reject/cancel. There is no counteroffer action.
- Architecturally, a counteroffer can be implemented as a new `exchange` record that references the original exchange (a `parent_exchange_id` column may be needed on the `exchange` table). The history (AC8) is then a chain of exchange records linked by parent IDs: `SELECT * FROM exchange WHERE parent_exchange_id = $1 OR exchange_id = $1 ORDER BY creation_date ASC`.
- Alternatively, the counteroffer can simply be a new independent exchange proposal from the receiving user to the initiating user, with the original proposal auto-rejected. This is simpler but loses the negotiation thread.
- The `CreateExchangeRequest` type in `exchangeTypes.ts` would need an optional `parent_exchange_id` field if threading is desired.
- The `trade-proposal-dialog.tsx` component needs a variation mode for counteroffers that pre-populates context from the original proposal.
- A new DB function `create_counter_offer` or an extended `create_exchange_proposal` with a parent reference is recommended.
- History is preserved even after the exchange is resolved (accepted, rejected, expired).

---

### [EXCH-3.2] Contested State on Proposal Acceptance

**Status:** New

**Description**

Item Locking on Exchange Acceptance.
As a user
I want items in an accepted exchange to be placed in a "Contested" state
So that they cannot be involved in other exchanges simultaneously

**Acceptance Criteria:** JIRA

AC1: When an exchange proposal is accepted, all items involved in the exchange are automatically set to "Contested" status.
AC2: Items in "Contested" status are not shown as available for new exchange proposals.
AC3: Items in "Contested" status are still visible in the marketplace but marked as "In Exchange" or similar.
AC4: If the exchange is cancelled after acceptance, items return to "Active" status.
AC5: Once the exchange is fully completed, items transition from "Contested" to "Traded".

**Comments:**

- The `item_status` enum already includes `'contested'` — the value exists but is not being used in any current flow.
- The `accept_exchange` DB function (called via RPC in `exchange-actions.ts`) needs to be updated to set all associated items to `status = 'contested'`.
- A reverse operation is needed: if an accepted exchange is later cancelled, items must revert to `'active'`. This requires a `revert_contested_items` function or logic within the cancellation flow.
- The `create_exchange_proposal` DB function should validate that none of the involved items are already in `'contested'` or `'traded'` status before allowing the proposal.
- The marketplace already filters `status = 'active'`, so contested items would disappear from the marketplace. If AC3 requires them to still show but marked, the query needs to include `'contested'` items with a visual indicator.
- **Decision needed:** Should the contested state occur on proposal acceptance or only after both parties confirm a physical/virtual exchange meeting? Review with PO.

---

## EPIC: Exchange Messaging *(existing)*

---

### [MSG-1.1] 1:1 Messaging Between Exchange Users

**Status:** New

**Description**

Direct Messaging Tied to Exchanges.
As a user involved in an exchange
I want a private conversation to be created automatically when a trade proposal is sent, so that I can message the other person to discuss details, negotiate terms, and coordinate the trade

**Acceptance Criteria:** JIRA

AC1: When I send a trade proposal, a private conversation between me and the other user is created automatically.
AC2: The initial proposal details (items offered, items requested, and any message I included) appear as the first entry in the conversation.
AC3: From the conversation, I can send text messages to the other user.
AC4: I can see the full message history of the conversation, including who sent each message and when.
AC5: Conversations are always between exactly two people (1:1). There are no group conversations.
AC6: I can access my conversations from the Messages section and also from the exchange detail view — both lead to the same thread.
AC7: If I have unread messages, I see an indicator (e.g., a count badge) so I know to check.

**Comments:**

- **Consolidation note:** This story absorbs the scope of the former [OFFER-1.1] "Offers Initiate a Negotiation" — the concept that a proposal auto-creates a conversation is now AC1–AC2 of this story. The "Offer Handling" epic was removed to eliminate confusion between messaging and offer management. All messaging logic lives here.
- The DB already has a full messaging infrastructure: the `negotiation` table acts as a conversation container, `negotiation_participant` tracks members, and `message` stores individual messages with `sender_user_id`, `content`, `created_at`, `is_edited`, and `is_deleted` (soft-delete).
- **Linking exchange ↔ conversation:** Currently there is no FK between `exchange` and `negotiation`. A `negotiation_id` column on the `exchange` table (or vice versa) is needed. The `create_exchange_proposal` RPC should be extended to also create a `negotiation` + two `negotiation_participant` entries in the same transaction. The `CreateExchangeRequest.message` field becomes the first message in the auto-created conversation.
- The `messages.tsx` component currently renders entirely from mock data (`conversations` from `data.ts`). The input field and send button are non-functional (no server action wired).
- New server actions needed: `sendMessage`, `getConversationMessages`, `getMyConversations`.
- Real-time messaging would ideally use Supabase Realtime (Postgres changes listener). For MVP, polling or page-refresh is acceptable.
- **Scope note:** Messaging is tied to exchanges only. Users cannot start a conversation with someone without first sending a trade proposal.

---

### [MSG-1.2] Conversation Privacy

**Status:** New

**Description**

Conversation Privacy.
As a user
I want all my conversations to be private
So that only the two participants can see the messages exchanged

**Acceptance Criteria:** JIRA

AC1: All conversations are private — only the two participants can view and send messages.
AC2: No other user can see or access a conversation they are not part of.
AC3: If a conversation is linked to an exchange, only the two users involved in that exchange can access it.

**Comments:**

- The `negotiation` table already has an `is_public BOOLEAN NOT NULL DEFAULT FALSE` column. Since all exchanges are 1:1 and there are no group conversations, this value should always remain `FALSE`.
- The `negotiation_participant` table enforces who can send messages: only the two registered participants may create or view messages (validated in the `sendMessage` and `getConversationMessages` server actions).
- For the server actions, the query to fetch messages should check: if the requesting user is a participant → allow; else → access denied.
- The former [MSG-1.2] had ACs about making conversations public or toggling visibility. Those were removed because: (a) exchanges are direct 1:1 only, (b) there are no group exchanges, and (c) privacy is always enforced with no exceptions.

---

## EPIC: Meeting Management *(new)*

---

### [MEET-1.1] Create Meeting Linked to Exchange

**Status:** New

**Description**

Meeting Creation.
As a user involved in an exchange
I want to create a meeting linked to the exchange
So that we can arrange when and where to complete the trade

**Acceptance Criteria:** JIRA

AC1: From an accepted exchange, I can create a meeting.
AC2: The meeting is automatically linked to the exchange's negotiation.
AC3: All participants in the exchange are automatically added as invitees.
AC4: After creating the meeting, all invitees receive a notification.
AC5: The meeting appears in the exchange detail view and in a dedicated meetings section.

**Comments:**

- The `meeting` table already exists with `meeting_id`, `negotiation_id` (FK → negotiation), `address_id`, `meeting_type`, `platform`, `access_code`, `scheduled_at`, `due_date`, and `created_by_user_id`.
- The `meeting_invitee` table tracks invitees with `meeting_id`, `user_id`, and `rsvp_status` (enum: `'accepted' | 'declined' | 'pending' | 'overdue'`).
- The `notification_type` enum includes `'meeting_invite'` and `'meeting_rsvp'`.
- No meeting-related server actions or UI exist currently—this is entirely new functionality.
- The meeting must reference a `negotiation_id` (NOT NULL FK), so the exchange-conversation linking from [MSG-1.1] AC1 is a prerequisite.
- A new `createMeeting` server action is needed that inserts into `meeting` and bulk-inserts into `meeting_invitee` for all participants.

---

### [MEET-1.2] Physical and Virtual Meeting Types

**Status:** New

**Description**

Meeting Type Configuration.
As a user creating a meeting
I want to specify whether the meeting is physical or virtual
So that participants know the location or platform details for the exchange

**Acceptance Criteria:** JIRA

AC1: When creating a meeting, I choose between "Physical" and "Virtual."
AC2: For a physical meeting, I provide: location (address), date, and time.
AC3: For a virtual meeting, I provide: platform name (e.g., Zoom, Google Meet), access code/link, date, and time.
AC4: The meeting details are displayed to all invitees with the relevant fields for the meeting type.
AC5: Meeting details can be edited by the creator before the scheduled time.

**Comments:**

- The `meeting_type` enum already exists: `'physical' | 'virtual'`.
- The `meeting` table has `address_id` (FK → address, nullable for virtual meetings), `platform VARCHAR(100)`, and `access_code VARCHAR(255)`.
- For physical meetings, the reusable `address` table and the existing address creation logic (already used for items and users) can be leveraged.
- Form validation: if `meeting_type = 'physical'`, require `address_id`; if `meeting_type = 'virtual'`, require `platform` and `access_code`.
- The `scheduled_at` and `due_date` columns handle the timing. `due_date` is optional and can represent the expected end time.
- No meeting UI component exists in the codebase. A new `MeetingForm` component and a `MeetingDetail` component are needed.

---

### [MEET-1.3] Meeting RSVP

**Status:** New

**Description**

Meeting RSVP.
As a user invited to a meeting
I want to accept or decline the invitation
So that the meeting organizer knows who will attend

**Acceptance Criteria:** JIRA

AC1: When I receive a meeting invitation, I can accept or decline it.
AC2: My RSVP status is visible to the meeting creator and other invitees.
AC3: I receive a notification when I am invited to a meeting.
AC4: The meeting organizer can see a summary of all RSVPs (accepted, declined, pending).
AC5: If I do not respond before the meeting date, my status is marked as "Overdue."

**Comments:**

- The `meeting_invitee` table already has `rsvp_status` with enum `'accepted' | 'declined' | 'pending' | 'overdue'`. The default is `'pending'`.
- The `notification_type` enum includes `'meeting_invite'` and `'meeting_rsvp'`, covering notifications for both invitations and responses.
- New server actions needed: `respondToMeeting(meeting_id, user_id, response)` that updates `meeting_invitee.rsvp_status`.
- For the "Overdue" status (AC5), a mechanism is needed: either a cron job or lazy evaluation (on query, check if `meeting.scheduled_at < NOW()` and `rsvp_status = 'pending'`, then update to `'overdue'`).
- The meeting RSVP summary can be a simple aggregate query: `SELECT rsvp_status, COUNT(*) FROM meeting_invitee WHERE meeting_id = $1 GROUP BY rsvp_status`.

---

## EPIC: List Management *(new)*

---

### [LIST-1.1] Predefined Favorite and Frequent Users Lists

**Status:** New

**Description**

Default User Lists.
As a user
I want to have a "Favorites" and a "Frequent Users" list permanently available
So that I can quickly access the users I interact with most

**Acceptance Criteria:** JIRA

AC1: Every new user account automatically has two predefined lists: "Favorites" and "Frequent Users."
AC2: These predefined lists cannot be deleted or renamed.
AC3: The lists are accessible from the Favorites section of the app.
AC4: Each list displays the users it contains, with their avatar, name, and rating.

**Comments:**

- The `user_list` table has a `is_predefined BOOLEAN NOT NULL DEFAULT FALSE` field that supports this—predefined lists would have `is_predefined = TRUE`.
- The `user_list_member` table (FK → `user_list` + `user`) tracks membership.
- During user registration, a DB trigger or application logic needs to create two `user_list` entries with `is_predefined = TRUE` and names "Favorites" and "Frequent Users."
- The `favorites.tsx` UI already has tabs for "Favorite Items," "Frequent Users," and "Custom Lists"—this structure aligns with the requirement, but it currently uses mock data.
- **Note:** The current mock shows "Favorite Items" (items), but this story is about "Favorite Users." Clarify with PO whether "Favorites" refers to users, items, or both. The DB has separate tables: `user_list` / `user_list_member` (for users) and `item_list` / `item_list_member` (for items). Both can have predefined lists.

---

### [LIST-1.2] Add Users to a List

**Status:** New

**Description**

Add to List.
As a user
I want to add another user to one of my lists
So that I can keep track of users I want to remember

**Acceptance Criteria:** JIRA

AC1: From a user's profile or from a trade/conversation, I can add them to one of my lists.
AC2: A dropdown or dialog shows my available lists when adding a user.
AC3: After adding, a confirmation is shown.
AC4: I cannot add the same user to the same list twice.

**Comments:**

- The `user_list_member` table has a composite PK `(list_id, member_user_id)`, which naturally prevents duplicates (AC4).
- A new server action `addUserToList(list_id, member_user_id)` is needed that inserts into `user_list_member`.
- The UI needs an "Add to List" button or menu option on user profiles and conversation headers.
- The action should verify that the list belongs to the requesting user (`user_list.owner_id = current_user_id`).

---

### [LIST-1.3] Remove Users from a List

**Status:** New

**Description**

Remove from List.
As a user
I want to remove a user from one of my lists
So that I can keep my lists up to date

**Acceptance Criteria:** JIRA

AC1: From a list view, I can remove a user from the list.
AC2: A confirmation is shown before removal.
AC3: After removal, the list updates immediately.

**Comments:**

- A new server action `removeUserFromList(list_id, member_user_id)` is needed that deletes from `user_list_member`.
- The action should verify list ownership before allowing removal.
- The `user_list_member` table uses CASCADE on `list_id` and `member_user_id` FKs, so referential integrity is maintained.

---

### [LIST-1.4] View List Contents

**Status:** New

**Description**

View List.
As a user
I want to view the contents of any of my lists
So that I can see all the users I have organized

**Acceptance Criteria:** JIRA

AC1: I can click on any list to see all users in it.
AC2: Each user entry shows their avatar, name, location, rating, and trade count.
AC3: The list view shows the total number of members.
AC4: Empty lists display a message like "No users in this list yet."

**Comments:**

- A new server action `getListMembers(list_id)` is needed that joins `user_list_member` with `user` to return full user profiles.
- The `favorites.tsx` component already renders user cards with avatar, name, location, rating, and trade count—this layout can be reused.
- The action must verify that the list belongs to the requesting user (lists are private per [LIST-1.6]).

---

### [LIST-1.5] Create Custom Lists

**Status:** New

**Description**

Custom List Creation.
As a user
I want to create my own custom lists
So that I can organize users beyond just favorites and frequent users

**Acceptance Criteria:** JIRA

AC1: I can create a new list by providing a name.
AC2: I can optionally add a description to the list.
AC3: After creation, the list is empty and ready for members to be added.
AC4: The new list appears in my lists section.
AC5: Custom list names do not need to be unique but should be reasonable in length.

**Comments:**

- A new server action `createList(name, description?)` is needed that inserts into `user_list` with `owner_id = current_user_id` and `is_predefined = FALSE`.
- The `favorites.tsx` UI already has a "New List" button and a "Create New List" card placeholder—these need to be wired to the server action.
- The `user_list.name` column is `VARCHAR(100)`, so length is naturally limited.
- Consider adding a reasonable limit on the number of custom lists per user (application-layer enforcement) to prevent abuse.

---

### [LIST-1.6] Delete Custom Lists

**Status:** New

**Description**

Custom List Deletion.
As a user
I want to delete custom lists I no longer need
So that my lists section stays organized

**Acceptance Criteria:** JIRA

AC1: I can delete any custom list I created.
AC2: Predefined lists (Favorites, Frequent Users) cannot be deleted.
AC3: A confirmation dialog is shown before deletion.
AC4: Deleting a list does not delete the users within it—they remain on the platform.

**Comments:**

- A new server action `deleteList(list_id)` is needed that verifies: (a) the list belongs to the current user, and (b) `is_predefined = FALSE`. If both pass, delete the `user_list` row.
- The `user_list_member` entries have `ON DELETE CASCADE`, so members are automatically removed when the list is deleted.
- AC4 is naturally satisfied—deleting from `user_list` cascades to `user_list_member` (junction table only), not to the `user` table itself.

---

### [LIST-1.7] List Privacy

**Status:** New

**Description**

List Privacy.
As a user
I want my lists to be private
So that only I can see who I have added to my lists

**Acceptance Criteria:** JIRA

AC1: Lists are only visible to their owner.
AC2: Other users cannot see my lists or their contents.
AC3: No public indication is given to a user that they have been added to someone's list.

**Comments:**

- Privacy enforcement must happen at the server action / API level: all list queries must filter by `owner_id = current_user_id`.
- There is no `is_public` flag on `user_list`—all lists are implicitly private since no sharing mechanism exists (and none should be added per this requirement).
- No notifications should be sent when a user is added to a list. Ensure the `addUserToList` action does not trigger any notification.
- Row Level Security (RLS) in Supabase could further enforce this at the DB level if enabled: `CREATE POLICY list_owner_only ON user_list FOR ALL USING (owner_id = auth.uid())`. However, since the app uses a custom auth flow (not Supabase Auth), RLS may not apply directly—enforce in application code.

---

## EPIC: Notifications *(new)*

---

### [NOTIF-1.1] System Notifications for Key Events

**Status:** New

**Description**

Event-Driven Notifications.
As a user
I want to be notified about important events related to my activity
So that I stay informed about new offers, counteroffers, exchange outcomes, meetings, and messages

**Acceptance Criteria:** JIRA

AC1: I receive a notification when someone sends me a new trade offer.
AC2: I receive a notification when someone submits a counteroffer to my proposal.
AC3: I receive a notification when an exchange I am involved in is accepted or rejected.
AC4: I receive a notification when there is a change in an auction I participate in (e.g., outbid, auction ending, auction result).
AC5: I receive a notification when I am invited to a meeting.
AC6: I receive a notification when I receive a new message in a conversation.
AC7: Each notification shows a title, a brief description, and the time it was received.
AC8: I can see all my notifications in a dedicated notifications area.
AC9: Unread notifications are clearly indicated.

**Comments:**

- The `notification` table is fully designed: `recipient_user_id`, `sender_user_id`, `type` (enum with 12 values including `proposal_created`, `counter_offer`, `proposal_accepted`, `proposal_rejected`, `message_received`, `meeting_invite`, `rating_received`, etc.), `title`, `body`, `is_read`, `read_at`, `priority`, and `reference_type`/`reference_id` for deep-linking.
- The `notification_type` enum covers all required events: `'account_created' | 'proposal_created' | 'proposal_accepted' | 'proposal_rejected' | 'counter_offer' | 'message_received' | 'meeting_invite' | 'meeting_rsvp' | 'item_reported' | 'user_reported' | 'rating_received' | 'system'`.
- However, **no notification creation logic exists in the codebase**. Every server action that should trigger a notification (create exchange, accept exchange, send message, create meeting, etc.) needs to also insert a `notification` row.
- The `reference_type` and `reference_id` columns allow the UI to link a notification to a specific exchange, message, meeting, or item—this enables "click to navigate" behavior.
- The mock `notifications` array in `data.ts` shows the intended UI format but is hardcoded. A `getMyNotifications` server action is needed.
- A `markNotificationAsRead(notification_id)` server action is also needed.
- Consider a DB trigger approach: instead of inserting notifications in every server action, create Postgres triggers on `exchange`, `message`, `meeting_invitee`, etc. that auto-insert notifications. This centralizes the logic but adds DB complexity.

---

### [NOTIF-1.2] Notification Delivery Channels

**Status:** New

**Description**

Multi-Channel Notification Delivery.
As a user
I want to receive notifications through different channels
So that I am informed in the way that is most convenient for me

**Acceptance Criteria:** JIRA

AC1: Notifications are available in-app (notification bell / notification panel).
AC2: Notifications can optionally be delivered as web pop-ups (browser push notifications).
AC3: Notifications can optionally be sent via email.
AC4: I can configure my notification preferences to choose which channels I want for each notification type.
AC5: In-app notifications are always enabled and cannot be turned off.
AC6: Email and web pop-up notifications are opt-in.

**Comments:**

- The `notification` table has a `delivery_channel` column with enum `'in_app' | 'email'`, and a `status` column with `'queued' | 'sent' | 'failed' | 'skipped' | 'delivered'`—the infrastructure for multi-channel delivery is already designed at the DB level.
- A `NotificationPreference` table is mentioned in the DB docs ("Channel preference logic resides in a separate NotificationPreference table") but **does not exist yet** in `create-schema.sql`. This table needs to be created with columns like: `user_id`, `notification_type`, `channel`, `is_enabled`.
- **In-app notifications (AC1):** This is the simplest channel—just insert a notification row and query it in the UI. A notification bell in the app header, with an unread count badge, is the standard UX pattern.
- **Web push notifications (AC2):** Requires the Web Push API and a service worker. This is a significant frontend + backend feature (VAPID keys, push subscription storage, push endpoint). Consider this as a stretch goal / future sprint.
- **Email notifications (AC3):** Requires an email delivery service (same dependency as [AUTH-3.1] password recovery). Emails would be triggered by a background worker or Supabase Edge Function that processes queued notifications with `delivery_channel = 'email'`.
- **For MVP, recommend focusing on in-app notifications only.** Email and web push can be addressed in a later iteration once the email service infrastructure is in place.
- The `priority` column (`'low' | 'normal' | 'high'`) and `expires_at` column can be used to order the notification inbox and auto-dismiss stale alerts.

---
---

# Sprint 1 — Revised & New Stories

The following user stories are either **new cross-cutting stories** that address systemic issues identified in Sprint 0 review, or **revised versions** of Sprint 0 stories that were not accepted or accepted with observations. Each revised story clearly references the original it replaces and focuses on the specific fixes requested.

---

## EPIC: Shared Infrastructure *(new)*

---

### [INFRA-1.1] Image Upload & Storage via Supabase

**Status:** New (cross-cutting)

**Description**

Reusable Image Upload Component with Supabase Storage.
As a user
I want to select and upload image files directly from my device across all areas of the app
So that my profile picture, item photos, and other images are stored reliably and displayed correctly

**Acceptance Criteria:**

AC1: I can upload images from my device in every part of the app that requires a photo (registration, profile edit, item creation, item edit).
AC2: A "Choose File" button or drag-and-drop area opens my device's file browser to select images.
AC3: After selecting an image, it is stored in the cloud and displayed correctly wherever it is used.
AC4: I can see a preview of the image(s) I selected before confirming.
AC5: For profile pictures, only one image can be uploaded. For item listings, I can upload multiple images.
AC6: When uploading multiple images, I can reorder them and remove individual images.
AC7: Only valid image formats are accepted (JPEG, PNG, WebP). Files that are too large (over 5 MB) or exceed the allowed quantity (1 for profile, up to 20 for items) are rejected.
AC8: If a file is invalid or too large, a clear error message explains the problem.
AC9: A loading indicator is shown while the image is being uploaded.
AC10: When editing a profile or item, my existing images are shown and I can replace or remove them.
AC11: For item listings, the first image in the list is automatically used as the thumbnail in the marketplace.

**Comments:**

- **Current state:** No Supabase Storage integration exists anywhere in the codebase. Profile pictures use a URL text input (`https://...`) in both `register/page.tsx` and `edit-profile-dialog.tsx`. The create-item form (`create-item.tsx`) has an `<input type="file">` but explicitly states "File storage will be implemented in a later sprint" — the selected file is never uploaded.
- **Supabase Storage setup required:** A storage bucket (e.g., `trueke-media`) must be created in the Supabase project with appropriate RLS policies (authenticated users can upload to their own folder, public read access for served images).
- **Recommended bucket structure:** `avatars/{user_id}/filename` for profile pictures, `items/{item_id}/filename` for item images.
- The component should use the Supabase client's `supabase.storage.from('trueke-media').upload(path, file)` and `.getPublicUrl(path)` methods.
- For avatars (single mode): upload → get public URL → store in `user.profile_picture_url`. Old avatar file should be deleted from storage when replaced.
- For items (multi mode): upload each file → get public URLs → insert into `item_media` table with `display_order`. The `item_media` table already supports this with `url` and `display_order` columns.
- This story is a **prerequisite** for [AUTH-FE-1.1], [AUTH-FE-3.1], [ITEM-FE-1.1], and [ITEM-FE-2.1]. Those stories reference this component.
- **Implementation:** Create a reusable `<ImageUploader>` component (e.g., `components/ui/image-uploader.tsx`) and a utility module (`utils/supabase/storage.ts`) that encapsulates upload, delete, and URL generation logic. The component should support single-image mode (avatars) and multi-image mode (items) via props.

---

### [INFRA-1.2] Centralized Address Form Component

**Status:** New (cross-cutting)

**Description**

Standardized Address Input Component.
As a user
I want the address/location fields to look and behave the same everywhere in the app
So that I have a consistent experience when entering my location during registration, profile editing, or item creation

**Acceptance Criteria:**

AC1: The address fields look and behave the same in every screen where I enter a location (registration, profile edit, item creation, item edit).
AC2: The Country field is a dropdown list (initially showing Costa Rica).
AC3: The Province/State field is a dropdown list that updates automatically based on the selected country.
AC4: The Canton/City field is a dropdown list that updates automatically based on the selected province.
AC5: The Municipality/District field is a text input (optional).
AC6: The Zip Code field is a text input (required).
AC7: Address Line 1 and Address Line 2 are text inputs (optional).
AC8: All required fields are clearly marked and validated with appropriate error messages.
AC9: The address information entered is correctly saved to the database.

**Comments:**

- **Current inconsistency (the core problem):** The address format varies across three different forms:
  1. **Registration (`register/page.tsx`)**: Uses `country-state-city` dropdowns (Country → Province → Canton). Municipality is free text. No Address Line 1/2 fields.
  2. **Profile edit (`edit-profile-dialog.tsx`)**: Uses `country-state-city` dropdowns (Country → Province/State → City). Has Municipality, Zip, and Address Line 1/2. Different field names than registration (uses `city` instead of `cantonCity`, `province` instead of explicit `province`).
  3. **Create item (`create-item.tsx`)**: Uses ALL plain text inputs — even the country code is a 2-character text field. No dropdowns at all. Same logical fields but completely different UX.
- **Solution:** Extract a shared `<AddressForm>` component that standardizes the field names, validation, dropdown behavior, and DB column mapping. All three screens (and future ones like item edit and meeting creation) should import and use this single component.
- The cascading dropdowns should be powered by the `country-state-city` library (already used in registration and profile edit).
- The component should accept props for: initial values, which fields are required in that context, and an `onChange` callback that returns the normalized address object.
- The DB `address` table columns are: `country_code CHAR(2)`, `address_line1 VARCHAR(255)`, `address_line2 VARCHAR(255)`, `muni_district VARCHAR(100)`, `canton_city VARCHAR(100)`, `province_state VARCHAR(100)`, `zip_code VARCHAR(20)`. The component output must match these column names (AC9).
- Validation patterns already exist (duplicated across files): `LOCATION_TEXT`, `ZIPCODE_PATTERN`, `ADDRESS_LINE_PATTERN`. These should be centralized in the shared component or a shared validation module.
- This story is a **prerequisite** for [AUTH-FE-1.1], [AUTH-FE-3.1], [ITEM-FE-1.1], and [ITEM-FE-2.1].

---

## EPIC: Sprint 0 Revisions — Item Management

---

### [ITEM-FE-1.1] Item Create UI (Revised)

**Status:** New — *replaces [ITEM-FE-1] (Not Accepted)*

**Description**

Item Creation Form with Standardized Address, Functional Image Upload, and Fixed Category Fields.
As a user
I want an easy-to-use create item form with a consistent address format, working image upload, and clear category/condition fields
So that I can publish complete and accurate item listings

**Acceptance Criteria:**

AC1: The form contains all required fields to create an item listing: Title, Description, Category (dropdown), Condition (dropdown), Type (Physical / Digital), Date Bought (optional), and at least one image (required).
AC2: The address section uses the same dropdown format as registration and profile edit (Country → Province → Canton/City).
AC3: I can select images from my device, see previews, reorder them, and remove individual images before saving.
AC4: At least one image must be uploaded before the item can be created. A clear error is shown if no image is attached.
AC5: The page clearly indicates which fields are required and which are optional, and displays appropriate validation error messages for each field.
AC6: Category and Condition are dropdown lists with predefined options — I cannot type a custom value. No "category-specific attributes" section is shown.
AC7: On successful creation, I am redirected to the item detail view and a confirmation message is displayed.

**Comments:**

- **Why [ITEM-FE-1] was not accepted:**
  1. Address format inconsistent — `create-item.tsx` uses all plain text inputs while registration/profile use `country-state-city` dropdowns. Must be unified.
  2. Image upload does not work — the `<input type="file">` exists but the file is never stored (the component itself says "File storage will be implemented in a later sprint").
  3. The "Category-Specific Attributes" section (`categoryNote` variable on line ~217 showing "Additional attributes for {category} can be added later") needs to be removed entirely.
- **Address fix:** Replace the entire manual address section (lines ~285–400 in `create-item.tsx`) with the shared `<AddressForm>` component from [INFRA-1.2]. This ensures cascading dropdowns and consistent field mapping.
- **Image fix:** Replace the current `<Input type="file">` placeholder (lines ~402–413) with the `<ImageUploader>` component from [INFRA-1.1] in multi-image mode. Images must be uploaded to Supabase Storage and their URLs inserted into the `item_media` table.
- **Category-specific attributes removal:** Delete the "Category-Specific Attributes" section entirely (lines ~415–419 in `create-item.tsx`), including the `categoryNote` variable.
- **Dependencies:** [INFRA-1.1] (image upload) and [INFRA-1.2] (address component) must be completed first.
- The `createItem` server action in `items/actions.ts` already validates at least one image URL. When integrating with Supabase Storage, the flow becomes: upload files → get URLs → pass URLs to `createItem`.
- Categories are already a fixed array (`categories` imported from `data.ts`). Conditions are already a fixed enum (`ITEM_CONDITIONS` from `item-constants.ts`). Both are correct as-is; just ensure no free-text alternative exists.

---

### [ITEM-FE-2.1] Item Edit UI (Revised)

**Status:** New — *replaces [ITEM-FE-2] (Accepted with Observation)*

**Description**

Item Edit Form with Standardized Address, Full Image Management, and Fixed Category/Condition Fields.
As a user
I want to edit any item I own with consistent address dropdowns, the ability to view/upload/remove images, and fixed category/condition options
So that I can correct or improve my listing with the same experience as when I created it

**Acceptance Criteria:**

AC1: When I open the edit screen, all current item data is pre-populated: title, description, category, condition, type, date bought, address, and all existing images.
AC2: The address section uses the same dropdown format as registration and item creation (Country → Province → Canton/City), pre-filled with the item's current address.
AC3: I can see all existing images, upload new ones from my device, remove individual images, and reorder them.
AC4: Category and Condition are dropdown lists with the same predefined options as item creation — I cannot type a custom value.
AC5: Editing the item does not affect any other data (other items, exchanges, etc.).
AC6: If there are validation errors, each field displays a clear, specific error message.
AC7: I can cancel the edit and return to the item detail view without saving changes.

**Comments:**

- **Why [ITEM-FE-2] had observations:**
  1. Address format must be consistent with registration and item creation — use the same centralized component.
  2. Images must be viewable, uploadable, editable (add/remove), not just a group-delete operation. This requires the [INFRA-1.1] image uploader in "edit" mode that shows existing images and allows adding/removing individual ones.
  3. Categories are fixed fields (dropdown selects) — the user should not be able to type custom category or condition values.
- On save, the `updated_at` timestamp is automatically refreshed in the database.
- **Image edit flow:** The component should load existing `item_media` URLs as the initial state. When a user adds new images, they are uploaded to Supabase Storage. When a user removes an image, it is deleted from both `item_media` and Supabase Storage upon save. Reordering updates the `display_order` column.
- **Category/condition:** The `edit-item-dialog.tsx` and the edit form should use the same `<Select>` dropdowns as `create-item.tsx`, populated from `categories` (data.ts) and `ITEM_CONDITIONS` (item-constants.ts). No free-text input for these fields.
- **Dependencies:** [INFRA-1.1] (image upload) and [INFRA-1.2] (address component).
- The existing `updateItem` action in `items/actions.ts` handles title, description, category, condition, type — but does not handle address or image updates. The action needs to be extended to also update `item_address` and `item_media` rows.

---

## EPIC: Sprint 0 Revisions — Direct Exchange

---

### [EXCH-FE-1.1] Propose Exchange UI (Revised)

**Status:** New — *replaces [EXCH-FE-1] (Accepted with Observation)*

**Description**

Trade Proposal Dialog with Calendar-Based Expiration Date Picker.
As a user
I want to select an expiration date from a calendar when creating a trade proposal
So that I can clearly see and choose the exact date the proposal expires instead of guessing a number of days

**Acceptance Criteria:**

AC1: The proposal dialog shows my available items for the trade. I can select one or more items to offer.
AC2: I must select at least one item and set an expiration date before submitting.
AC3: The expiration date is selected from a visual calendar — I click on a calendar and pick a specific date.
AC4: I can only select future dates; past dates and today are not available.
AC5: After a successful submission, the page confirms the proposal was sent.
AC6: If something goes wrong (e.g., invalid item, conflict), a clear error message is displayed.
AC7: If I am the owner of the item being viewed, the option to send a proposal is not available.

**Comments:**

- **Why [EXCH-FE-1] had an observation:** The expiration was set by entering a number of days (e.g., "7") in a text input (`expirationDays` state, validated as `parseInt`). The professor wants a calendar date picker instead, where the user selects the actual date.
- **Current implementation in `trade-proposal-dialog.tsx`:** The `expirationDays` state is a string, parsed to an integer, and passed as `expiration_days` in the `CreateExchangeRequest`. The server action `createExchangeProposal` passes this to the `create_exchange_proposal` RPC.
- **Change required:**
  1. Replace the `<Input>` for `expirationDays` with a `<Calendar>` component (already available in the project at `components/ui/calendar.tsx`) wrapped in a `<Popover>` for the date picker UX.
  2. Store the selected date as an ISO date string (e.g., `2026-04-01`) instead of a day count.
  3. Either convert the selected date back to `expiration_days` before sending (by calculating the difference: `selectedDate - today` in days), or modify the `CreateExchangeRequest` type and the RPC function to accept an `expiration_date` directly instead of `expiration_days`.
  4. If the RPC already has an `expiration_date` column on the `exchange` table, passing the date directly is cleaner. The `exchange` table does have `expiration_date TIMESTAMPTZ`.
- **Validation:** The calendar disables past dates. If somehow a past date is selected, show "Expiration date must be in the future."
- The rest of the dialog (item selection, message, submission) remains unchanged from the original and is working correctly.

---

### [EXCH-FE-2] Accept / Reject Proposal (Frontend)

**Status:** To Do

**Description**

UI for the item owner to review incoming trade proposals and accept or reject them with clear confirmation.
As a user
I want to see the details of each proposal I receive and be able to accept or reject it easily
So that I can handle incoming trade requests quickly and with confidence

**Acceptance Criteria:**

AC1: Each incoming proposal clearly shows: the item(s) being offered, my item that was requested, the sender's message (if any), and the expiration date.
AC2: "Accept" and "Reject" buttons are visible only to the owner of the requested item. Other users cannot see or use these options.
AC3: If I have already responded to a proposal (accepted, rejected, or it expired), the "Accept" and "Reject" buttons are no longer shown and the current status is displayed instead.
AC4: When I tap "Accept," a confirmation prompt appears before the action is finalized. While the action is processing, the buttons are temporarily unavailable so I do not accidentally tap twice.
AC5: After accepting, a success message confirms the trade was accepted. The proposal now shows as "Accepted."
AC6: When I tap "Reject," a confirmation prompt appears before the action is finalized. After rejecting, a message confirms the rejection and the proposal shows as "Rejected."
AC7: If the item involved is no longer available (e.g., it was already traded or removed), the system informs me clearly and does not allow the action to proceed.
AC8: If something goes wrong while processing my response, a clear error message is shown and I can try again.

**Comments:**

- **Current implementation:** `exchanges.tsx` already has `handleAcceptExchange` (line ~150) and `handleRejectExchange` (line ~182) functions that call `acceptExchange()` and `rejectExchange()` server actions from `exchange-actions.ts`. Both use `setActionLoading(exchangeId)` to disable buttons during the request.
- **Server actions:** `acceptExchange` calls `supabase.rpc('accept_exchange', {p_exchange_id, p_accepting_user_id})` and `rejectExchange` calls `supabase.rpc('reject_exchange', {p_exchange_id, p_rejecting_user_id})`. Both return `ApiResponse<null>`.
- **AC4 — loading state:** Already implemented via `actionLoading` state. While a request is in flight, the button shows a spinner and is disabled (`setActionLoading(exchangeId)` → `setActionLoading(null)` in `finally`).
- **AC4/AC6 — confirmation prompt:** Currently there is NO confirmation dialog before accept or reject. A confirmation step (e.g., an `<AlertDialog>` from `components/ui/alert-dialog.tsx`) should be added so the user must explicitly confirm "Are you sure you want to accept/reject this proposal?" before the server action fires.
- **AC7 — conflict handling:** The DB functions `accept_exchange` and `reject_exchange` should already validate item availability. If an item has been traded or removed (status ≠ `'active'`), the RPC should return an error. The frontend displays this via `getFriendlyErrorMessage(result.error)` in the toast. Per [EXCH-3.2], items in an accepted exchange transition to `'contested'` status.
- **AC3 — status display:** Exchanges have statuses: `'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'`. The `statusStyles` map in `exchanges.tsx` (line ~42) already provides visual styling for each status. Buttons should only render when `exchange.status === 'pending'` and the current user is the target owner.
- **Notification:** On accept/reject, a notification should be sent to the other party. Notification types `'proposal_accepted'` and `'proposal_rejected'` exist in the schema.
- **Dependencies:** Relies on [EXCH-FE-1.1] for the proposal creation flow. Relies on server actions and DB RPCs already present.

---

## EPIC: Sprint 0 Revisions — User Authentication

---

### [AUTH-FE-1.1] Registration (Revised)

**Status:** New — *replaces [AUTH-FE-1] (Not Accepted)*

**Description**

Registration Form with Standardized Address, File-Based Avatar Upload, and Password Confirmation.
As a user
I want a registration page with consistent address dropdowns, the ability to upload my profile picture from my device, and a password confirmation field
So that I can create an account with a complete and validated profile

**Acceptance Criteria:**

AC1: The form contains fields for: Email, Username, First Name, Last Name, Profile Picture (file upload), Bio/Description, Password, Confirm Password, and Location (address).
AC2: The address section uses the same dropdown format as profile edit and item creation (Country → Province → Canton/City).
AC3: I can select a profile picture from my device, see a preview, and it is saved to the platform.
AC4: A "Confirm Password" field is present. Both password fields must match before the form can be submitted. If they don't match, a clear error message is shown (e.g., "Passwords do not match").
AC5: All mandatory fields are clearly marked with a required indicator (*).
AC6: If the email format is invalid, an inline error message is displayed.
AC7: If the password format is invalid, an inline error message is displayed (8+ characters, 1 uppercase, 1 number, 1 special character [?, !, *, &]).
AC8: On successful registration, a "User created" confirmation message is shown and the user is redirected to the login page.

**Comments:**

- **Why [AUTH-FE-1] was not accepted:**
  1. Address format inconsistent — the registration page uses `country-state-city` dropdowns but with a different field structure/naming than profile edit. Must use the centralized component.
  2. Profile picture is a URL text input (`profilePictureUrl` with `https://...` placeholder), not a file upload. Users cannot actually upload an avatar from their device.
  3. No password confirmation field — the form only has one password input, with no way to verify the user typed what they intended.
- **Address fix:** Replace the current location section (the `<div>` with `MapPin` icon around line ~375 in `register/page.tsx`) with the shared `<AddressForm>` component from [INFRA-1.2]. Remove the local state variables for `stateCode`, `province`, `muniDistrict`, `cantonCity`, `zipCode` and let the component manage them internally.
- **Avatar fix:** Replace the `<Input>` for `profilePictureUrl` (line ~275) with the `<ImageUploader>` component from [INFRA-1.1] in single-image mode. On form submit, the uploaded URL from Supabase Storage is sent as the `profilePictureUrl` value.
- **Confirm password fix:** Add a `confirmPassword` state variable. Add a new input field after the password field with matching show/hide toggle. Add validation: `if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match."`. The `register` server action in `register/actions.ts` does not need changes — confirm password is a frontend-only validation.
- **Dependencies:** [INFRA-1.1] (image upload) and [INFRA-1.2] (address component).
- The current registration page already has proper email validation, password pattern validation, and required field indicators. Those aspects remain unchanged.

---

### [AUTH-FE-3.1] Profile View & Edit (Revised)

**Status:** New — *replaces [AUTH-FE-3] (Not Accepted)*

**Description**

Profile Display and Edit with Standardized Address and File-Based Avatar Upload.
As a user
I want to view and edit my profile with consistent address dropdowns and the ability to upload/change my profile picture from my device
So that I can manage all my profile data with the same experience as other address and image forms in the app

**Acceptance Criteria:**

AC1: The profile page displays: first and last names, username, bio, location, and profile picture.
AC2: An edit option is available that opens a form pre-populated with all current profile data.
AC3: The address section in the edit form uses the same dropdown format as registration and item creation (Country → Province → Canton/City), pre-filled with my current address.
AC4: I can see my current profile picture, upload a new one from my device, or remove it.
AC5: I can cancel the edit (reverting all changes) or save it.
AC6: When saved, the updated information (including any new profile picture and address) is saved correctly.

**Comments:**

- **Why [AUTH-FE-3] was not accepted:**
  1. Address format inconsistent — `edit-profile-dialog.tsx` uses `country-state-city` dropdowns but with a different field naming convention than registration. Must use the centralized component.
  2. Profile picture is a URL text input (line ~170 in `edit-profile-dialog.tsx`: `<Label>Profile picture URL</Label>` + `<Input ... placeholder="https://...">`). Users cannot upload a file from their device; they can only paste a URL.
- **Address fix:** Replace the entire Location section in `edit-profile-dialog.tsx` (lines ~262–470: the Country dropdown, Province dropdown, City dropdown, Municipality input, Zip input, Address line inputs) with the shared `<AddressForm>` component from [INFRA-1.2], passing the current `profile.address` as initial values.
- **Avatar fix:** Replace the URL input (lines ~163–178) with the `<ImageUploader>` component from [INFRA-1.1] in single-image mode. Display current avatar as the initial image. On save, if a new file was selected, upload to Supabase Storage, get URL, update `user.profile_picture_url`. If the old avatar is replaced, delete the old file from storage.
- **Dependencies:** [INFRA-1.1] (image upload) and [INFRA-1.2] (address component).
- The profile view component (`profile.tsx`) already displays address info nicely (lines ~69–77: concatenation of muniDistrict, city, province, countryCode). This display logic should remain unchanged.
- The `updateProfileAction` in `user/actions.ts` currently handles name, username, bio, profilePictureUrl, and address. The avatar URL field just needs to receive the Supabase Storage URL instead of a user-pasted URL.
