# Trueke
## Database Documentation 
This **`README.md`** document contains a quick description of each entity displayed in the ER diagram under **`docs/db/er-diagram.md`** and what each attribute entails if necessary. Note, most constraints should be present in final versions of the table creation for data integrity purposes but currently they won't be done for development facility and testing purposes.

<details>
<summary><strong style="font-size:18pt;">Entities</strong></summary>
Throughout this section you will be exposed to each entity and examples of each data type for exposure, regarding formatting and potental. 

---

### **`User`**

The central entity that represents the end-user as an **authorized** member of the software product, allowing them to create items, propose exchanges, negotiate, rate and post. Also encapsulates the concept of an *administrator* inside.

| Attribute | Description | Example |
|---|---|---|
| user_id | Primary key. Unique, mandatory identifier used in the backend to identify users, allowing for future changes in email and username without disrupting functionality. | $1982001830$ |
| email | Unique, mandatory. User's email address. | johndoe@gmail.com |
| username | Unique, mandatory. User's display name. | jdoe711 |
| first_name | User's first name. | John |
| last_name | User's last name. | Doe |
| password_hash | Hashed representation of the user's password. Never stored in plain text to protect user information and access. | $2b$12$... |
| bio | Optional free-form text describing the user. | "Avid trader from CR." |
| profile_picture | URL or reference to the user's profile picture. | https://cdn.example.com/pic.jpg |
| status | Mandatory. Backend-controlled status used to prevent banned users from accessing the platform. | **`active`** \| **`deleted`** \| **`banned`** |
| end_ban_date_time | Timestamp indicating when a ban expires. Null if not banned. | 2026-03-01 00:00:00 |
| created_at | Timestamp of when the user account was created. | 2025-01-15 10:23:45 |
| is_admin | Boolean flag indicating administrator privileges. Drives admin-specific logic and access control. | `true` \| `false` |

*Users Constraints & Rules*
- user_id is primary key and generated (UUID).
- email & username are unique and potentially modifiable.
- bio is an optional element and empty as default.
- profile_picture is optional, default image to be determined. 
- rating average should be a function that derives the rating from the user rating table. 
---

### **`Address`**
Represents locations in the world, containing the key elements needed to locate either items, negotiations, or users. Addresses are decoupled from users and items so they can be created dynamically and reused — when a location already exists it is referenced rather than duplicated; this allows for better address management.

| Attribute | Description | Example |
|---|---|---|
| address_id | Primary key. Unique identifier used to detect and prevent duplicates. | a3f2c1... |
| country | Country code following ISO 3166 standard. | `US`, `CR` |
| address_1 | Free-form line 1. Optional. Descriptive street-level address. | 123 Main St |
| address_2 | Free-form line 2. Optional. Indicates apartment, suite, or unit. | Apt 4B |
| municipality | Optional. Municipality, district or equivalent administrative subdivision. | Pozos |
| canton | Mandatory. Canton, city or equivalent administrative division, a concept shared worldwide. | Santa Ana |
| province | Mandatory. Province, state, or equivalent top-level subdivision. | San José |
| zip_code | Postal/zip code of the address. | 10301 |
| created_at | Timestamp of when the address record was created. | 2025-02-10 08:00:00 |

*Addresses Constraints & Rules*
- address_id is primary key and generated (UUID). 
- address_1 & address_2 optional free-form lines, 255 chars max. 
---

### **`User Address`**
A history table that describes the current address of a user and retains a log of all past addresses, enabling full address history tracking for user tracking and potential analytics in future work.

| Attribute | Description | Example |
|---|---|---|
| user_id | FK → User. The user this address record belongs to. | 1982001830 |
| address_id | FK → Address. The address associated with the user. | a3f2c1... |
| is_current | Boolean flag indicating whether this is the user's current active address. | `true` \| `false` |
| active_start_time | Timestamp of when this address became the user's active address. | 2025-02-10 08:00:00 |
| deactivated_at_time | Timestamp of when this address was replaced or deactivated. Null if currently active. | 2025-09-01 12:00:00 |

*User Addresses Constraints & Rules *
- user_id & address_id primary key for element, valid id's must be provided.
---

### **`User List`**
Holds the concept and data of a user-curated list, which may be predefined by the system or created by a user.

| Attribute | Description | Example |
|---|---|---|
| list_id | Primary key. Unique identifier for the list. | l1c2d3... |
| owner_id | FK → User. The user who owns the list. | 1982001830 |
| name | Display name of the list. | "Favourites" |
| description | Optional description of the list's purpose. | "Users I frequently trade with." |
| is_predefined | Boolean indicating whether this list was created by the system rather than the user. | `true` \| `false` |
| created_at | Timestamp of when the list was created. | 2025-03-20 14:00:00 |

---

### **`User List Member`**
Junction table that maintains the members of a given list, representing the relationship between a user and a list.

| Attribute | Description | Example |
|---|---|---|
| list_id | FK → User List. The list the member belongs to. | l1c2d3... |
| member_user_id | FK → User. The user who is a member of the list. | 2048110011 |
| added_date_time | Timestamp of when the user was added to the list. | 2025-04-01 09:30:00 |

---

### **`Item / Listing`**
Represents any item listing a user may offer — the essence and core functionality of the Trueke system. Listings are exclusively used as items for the MVP. If services were introduced, this entity would be split into a base `Listing` class and two children: `Item` and `Service`.

| Attribute | Description | Example |
|---|---|---|
| item_id | Primary key. Unique identifier for the listing. | i9a8b7... |
| owner_user_id | FK → User. The user who owns and posted the listing. | 1982001830 |
| title | Short display title of the listing. | "Nintendo Switch OLED" |
| description | Detailed description of the item being listed. | "Used but in great condition." |
| last_date_uploaded | System-generated timestamp of the last time the listing was uploaded or re-submitted. | 2025-06-10 11:00:00 |
| date_bought | Optional date indicating when the owner originally purchased the item. | 2023-11-25 |
| condition | Condition descriptor of the item. | `New`, `Like New`, `Used`, `Heavily Used`, `Broken` |
| state | Current state of the listing lifecycle. | `Draft` \| `Active` \| `Contested` \| `Traded` \| `Deleted` |
| item_type | Indicates whether the item is physical or digital. | `Physical` \| `Digital` |
| category | Predefined/fixed category value. Includes an "Other" option with a free-text field for the MVP. | `Electronics`, `Books`, `Other` |

---

### **`Item Address`**
Associates an address with an item, structured identically to **User Address** but bound to an item rather than a user.

| Attribute | Description | Example |
|---|---|---|
| item_id | FK → Item. The item this address is associated with. | i9a8b7... |
| address_id | FK → Address. The address associated with the item. | a3f2c1... |
| is_current | Boolean flag indicating whether this is the user's current active address. | `true` \| `false` |
| active_start_time | Timestamp of when this address became the user's active address. | 2025-02-10 08:00:00 |
| deactivated_at_time | Timestamp of when this address was replaced or deactivated. Null if currently active. | 2025-09-01 12:00:00 |

---

### **`Item Media`**
Handles images and media associated with a listing. At least one image is required per item, enforced at the application layer. Maximum of 20 media entries per item.

| Attribute | Description | Example |
|---|---|---|
| media_id | Primary key. Unique identifier for the media entry. | m0d1e2... |
| item_id | FK → Item. The item this media belongs to. | i9a8b7... |
| url | URL pointing to the media file. | https://cdn.example.com/img.jpg |
| media_type | Type of media stored. Currently restricted to images. | `image` |
| display_order | Integer indicating the display order of the media for the listing. | 1 |

---

### **`Item List`**
Handles the creation of a list of items, for users to define lists of favorites, office, etc...

| Attribute | Description | Example |
|---|---|---|
| item_list_id | Primary key. Unique identifier for the list. | l1c2d3... |
| owner_id | FK → User. The user who owns the list. | 1982001830 |
| name | Display name of the list. | "Favourites" |
| description | Optional description of the list's purpose. | "Items I want to trade for." |
| is_predefined | Boolean indicating whether this list was created by the system rather than the user. | `true` \| `false` |
| created_at | Timestamp of when the list was created. | 2025-03-20 14:00:00 |

---

### **`Item List Member`**
Junction table that maintains the items of a given list, representing the relationship between a user and a list. 

| Attribute | Description | Example |
|---|---|---|
| item_list_id | FK → Item List. The list the member belongs to. | l1c2d3... |
| item_member_id | FK → Item. The item who is a member of the list. | 2048110011 |
| added_date_time | Timestamp of when the item was added to the list. | 2025-04-01 09:30:00 |

--- 

### **`Negotiation`**
Core concept of Trueke. A strong entity that acts as a container of contextual information for exchanges, messages, and meetings. Whenever a meeting or an exchange is created it must be associated with a negotiation.

| Attribute | Description | Example |
|---|---|---|
| negotiation_id | Primary key. Unique identifier for the negotiation. | n5f6g7... |
| created_by_user_id | FK → User. The user who initiated the negotiation. | 1982001830 |
| content_description | Optional description or summary of what the negotiation is about. | "Swap Switch for PS5 controller." |
| is_public | Boolean flag indicating whether the negotiation is publicly visible. | `true` \| `false` |
| created_at | Timestamp of when the negotiation was created. | 2025-07-01 10:00:00 |
| status | Status of a negotiation that indicates whether it is active or not, used to make soft deletions for chats and such. | `active` \| `inactive` \| `deleted` |

---

### **`Negotiation Participant`**
Tracks the members involved in a negotiation. Enforces messaging rules so that only registered participants may send messages in a given negotiation.

| Attribute | Description | Example |
|---|---|---|
| negotiation_id | FK → Negotiation. The negotiation the participant belongs to. | n5f6g7... |
| user_id | FK → User. The participating user. | 2048110011 |
| joined_at | Timestamp of when the user joined the negotiation. | 2025-07-01 10:05:00 |

---

### **`Message`**
Contains the information associated with a message sent within a specific negotiation.

| Attribute | Description | Example |
|---|---|---|
| message_id | Primary key. Unique identifier for the message. | msg001... |
| negotiation_id | FK → Negotiation. The negotiation this message belongs to. | n5f6g7... |
| sender_user_id | FK → User. The user who sent the message. | 1982001830 |
| content | The text content of the message. | "Would you add a game to the deal?" |
| is_edited | Boolean flag indicating whether the message has been edited. | `true` \| `false` |
| edit_timestamp | Timestamp of the most recent edit. Null if never edited. | 2025-07-02 09:15:00 |
| is_deleted | Boolean flag indicating soft-deletion of the message. | `true` \| `false` |
| delete_timestamp | Timestamp of when the message was soft-deleted. Null if not deleted. | 2025-07-03 14:00:00 |
| created_at | Timestamp of when the message was originally sent. | 2025-07-02 09:00:00 |

---

### **`Exchange Proposal / Exchange`**
The core transactional entity that represents and tracks the exchange process — its timing, initial state, status lifecycle, and optional context message. 

| Attribute | Description | Example |
|---|---|---|
| exchange_id | Primary key. Unique identifier for the exchange. | ex1234... |
| initiator_user_id | FK → User. The user who initiated the exchange proposal. | 1982001830 |
| status | Current status of the exchange in its lifecycle. | `pending` \| `accepted` \| `rejected` \| `expired` \| `cancelled` |
| expiration_date | Timestamp by which the proposal must be accepted or it expires automatically. | 2025-07-10 23:59:59 |
| creation_date | Timestamp of when the exchange was proposed. | 2025-07-05 08:00:00 |
| optional_message | Optional message attached by the initiator when creating the proposal. | "Happy to negotiate further." |

---

### **`Exchange Participant`**
Junction table that associates a single exchange with multiple users, theoretically supporting an unlimited number of participants.

| Attribute | Description | Example |
|---|---|---|
| exchange_id | FK → Exchange. The exchange the participant belongs to. | ex1234... |
| user_id | FK → User. The participating user. | 2048110011 |
| role | The participant's role in the exchange. | `initiator` \| `member` |

---

### **`Exchange Item`**
Junction table that works alongside Exchange Participant to track which items are exchanged. Each participant in an exchange must be associated with at least two items: one they give and one they receive.

| Attribute | Description | Example |
|---|---|---|
| exchange_id | FK → Exchange. The exchange this item is part of. | ex1234... |
| item_id | FK → Item. The item involved in the exchange transaction. | i9a8b7... |
| direction | Indicates the direction of the item's movement in the exchange. | `offered` \| `requested` |
| offered_by_user_id | FK → User. The user who is offering this item. | 1982001830 |

---

### **`User Rating`**
Captures the rating any exchange participant gives to any other participant after an exchange has been completed. Unique constraint: `(exchange_id, rated_user_id, by_user_id)`.

| Attribute | Description | Example |
|---|---|---|
| user_rating_id | Primary key. Unique identifier for the rating record. | ur0001... |
| exchange_id | FK → Exchange. The completed exchange that prompted this rating. | ex1234... |
| rated_user_id | FK → User. The user being rated. | 2048110011 |
| by_user_id | FK → User. The user who submitted the rating. | 1982001830 |
| score | Numeric rating score given by the reviewer. | 5 |
| comment | Optional textual comment accompanying the rating. | "Smooth trade, highly recommend!" |
| created_at | Timestamp of when the rating was submitted. | 2025-07-15 16:00:00 |

---

### **`Item Rating`**
Captures the rating a participant gives to an item they received during a completed exchange. Unique constraint: `(exchange_id, item_id, rated_by_user_id)`.

| Attribute | Description | Example |
|---|---|---|
| item_rating_id | Primary key. Unique identifier for the item rating record. | ir0001... |
| exchange_id | FK → Exchange. The completed exchange in which the item was obtained. | ex1234... |
| item_id | FK → Item. The item being rated. | i9a8b7... |
| rated_by_user_id | FK → User. The user who received and is rating the item. | 2048110011 |
| condition_received | The condition of the item as received, as reported by the recipient. | `As described`, `Better than expected`, `Worse than described` |
| comment | Optional textual comment about the item. | "Exactly as advertised." |
| created_at | Timestamp of when the item rating was submitted. | 2025-07-15 17:00:00 |

---

### **`Meeting`**
A container entity representing a multi-party or two-party meeting in either a virtual or physical setting, providing all required information to access it. Must always be associated with a negotiation.

| Attribute | Description | Example |
|---|---|---|
| meeting_id | Primary key. Unique identifier for the meeting. | mt0001... |
| negotiation_id | FK → Negotiation. The negotiation this meeting is tied to. | n5f6g7... |
| address_id | FK → Address. The physical location of the meeting, optional when virtual. | a3f2c1... |
| meeting_type | Indicates whether the meeting is in-person or remote. | `Physical` \| `Virtual` |
| platform | Applies to virtual meetings. The platform or tool used. | `Zoom`, `Google Meet` |
| access_code | Applies to virtual meetings. Code or link required to join. | abc-defg-hij |
| scheduled_at | Timestamp of when the meeting is scheduled to begin. | 2025-07-20 15:00:00 |
| due_date | Deadline or expected end date/time of the meeting. | 2025-07-20 16:00:00 |
| created_by_user_id | FK → User. The user who created the meeting. | 1982001830 |

---

### **`Meeting Address`**
Associates an address with a meeting. Structured identically to **Item Address** and **User Address** but bound to a meeting instead.

| Attribute | Description | Example |
|---|---|---|
| meeting_id | FK → Meeting. The meeting this address is associated with. | mt0001... |
| address_id | FK → Address. The physical location of the meeting. | a3f2c1... |

---

### **`Meeting Invitee`**
Junction table that handles invitations to a meeting and tracks each invitee's RSVP status.

| Attribute | Description | Example |
|---|---|---|
| meeting_id | FK → Meeting. The meeting the invitee is associated with. | mt0001... |
| user_id | FK → User. The invited user. | 2048110011 |
| rsvp_status | The invitation response status of the invitee. | `accepted` \| `declined` \| `pending` \| `overdue` |

---

### **`Report`**
Polymorphic entity used for both user and item reports. The `target_type` field distinguishes whether the report is filed against a user or an item. May be split into two separate entities if complexity demands it.

| Attribute | Description | Example |
|---|---|---|
| report_id | Primary key. Unique identifier for the report. | rpt001... |
| reporter_user_id | FK → User. The user who filed the report. | 1982001830 |
| target_type | Indicates whether the report is against a user or an item. | `User` \| `Item` |
| target_id | The ID of the reported entity (user_id or item_id depending on target_type). | 2048110011 |
| reason | Category or reason for the report. | `Fraud`, `Inappropriate content`, `Spam` |
| description | Free-form description providing additional context for the report. | "User sent threatening messages." |
| status | Current review/resolution status of the report. | `Open` \| `Reviewed` \| `Resolved` |
| created_at | Timestamp of when the report was filed. | 2025-08-01 11:00:00 |

---

### **`Notification`**
Captures and stores user-facing events so the UI can present an in-app notification list and the system can optionally send email or push alerts. Designed to be lightweight, queryable by recipient, and linkable to other domain objects for context.

| Attribute | Description | Example |
|---|---|---|
| notification_id | Primary key (UUID). Unique identifier for the notification. | uuid-0001... |
| recipient_user_id | FK → User (NOT NULL). The user who receives and sees the notification. | 1982001830 |
| sender_user_id | FK → User (NULLABLE). Optional user who triggered the notification (e.g., a proposal initiator or message sender). | 2048110011 |
| type | ENUM (NOT NULL). Identifies the nature of the notification. | `account_created` \| `proposal_created` \| `proposal_accepted` \| `proposal_rejected` \| `counter_offer` \| `message_received` \| `meeting_invite` \| `meeting_rsvp` \| `item_reported` \| `user_reported` \| `rating_received` \| `system` |
| reference_type | String (NULLABLE). Polymorphic context label used by the UI to route the notification to the correct view. | `exchange`, `proposal`, `message`, `item`, `meeting`, `user` |
| reference_id | String/UUID (NULLABLE). The ID value of the referenced object (e.g., an exchange_id or message_id). | ex1234... |
| title | Short text (NOT NULL). Brief headline shown in notification lists. | "Your proposal was accepted!" |
| body | Text or JSON payload (NULLABLE). Renderable content or template parameters providing a short summary. | "Trade for Nintendo Switch confirmed." |
| is_read | Boolean (default `false`). Indicates whether the recipient has read the notification. | `true` \| `false` |
| read_at | Timestamp (NULLABLE). Records when the recipient marked the notification as read. | 2025-08-05 09:10:00 |
| delivery_channel | ENUM (NOT NULL). The primary channel used to deliver this notification instance. Channel preference logic resides in a separate `NotificationPreference` table. | `in_app` \| `email` |
| status | ENUM (default `queued`). Global delivery state of the notification instance. | `queued` \| `sent` \| `failed` \| `skipped` \| `delivered` |
| priority | ENUM (default `normal`). Ordering hint for the inbox and delivery queue. | `low` \| `normal` \| `high` |
| sent_at | Timestamp (NULLABLE). Records when the notification was dispatched via email or push. | 2025-08-05 09:00:00 |
| expires_at | Timestamp (NULLABLE). Optional expiry for time-sensitive notifications (e.g., proposal expiration warnings). | 2025-08-10 23:59:59 |

*Notification Constraints & Rules*

- `notification_id` is the primary key, auto-generated as a UUID.
- `recipient_user_id` is required; every notification must target a specific user.
- `type` must be one of the allowed enum values.
- If `reference_type` is provided, `reference_id` should also be provided (enforced at the application layer).
- `is_read` defaults to `false`; marking a notification as read also sets `read_at`.

---

### **`Login History`**
Tracks user login and logout events for auditing, security, and notification purposes.

| Attribute | Description | Example |
|---|---|---|
| login_history_id | Primary key. Unique identifier for the login event record. | lh0001... |
| user_id | FK → User. The user associated with this login/logout event. | 1982001830 |
| event_type | Type of authentication event recorded. | `login` \| `logout` |
| created_at | Timestamp of when the event occurred. | 2025-08-05 08:55:00 |
| ip_address | IP address from which the event originated. | 192.168.1.10 |
| user_agent | Browser or client user-agent string at the time of the event. | Mozilla/5.0 (Windows NT 10.0...) |
</details>

## Migration 
The SQL scripts in charge of constructing the schema are found in `src/utils/supabase/`. Rather than using a migration framework, we use the Supabase SQL editor or `psql` directly to keep deployment simple and explicit. The scripts are the following:

| Script | Purpose |
|---|---|
| `migrations/create-schema.sql` | Creates all ENUMs, tables, constraints, and triggers |
| `migrations/schema-breakdown.sql` | Drops everything — use to reset a local instance |
| `scripts/fake-data.sql` | Inserts a fixed seed dataset for development and testing |
| `scripts/fake-data-cleanup.sql` | Deletes all seed rows (leaves schema intact) |
| `scripts/query-schema.sql` | Spot-checks every table with representative SELECT queries |
| `scripts/create-admins.sql` | Inserts or promotes admin users (run once, not wiped by cleanup) |



The SQL scripts in charge of constructing the schema are found in the `src` folder under `utils/supabase/migrations`, instead of using a migration tool we utilize the SQL CLI found in Supabase to prevent over complicating database deployment and modifications. The script in charge of constructing the schema is `create-schema.sql`; subsequently the script in charge of deleting the schema is `schema-breakdown.sql`.

Furthermore, there are various scripts that together verify the schema. First, we create a fake set of data using `utils/supabase/scripts/fake-data.sql` to guarantee successful integration of the database. Secondly, we attempt to query each individual table `utils/supabase/scripts/query-schema.sql`. Together we successfully revise the creation of data. 

## Migration

The SQL scripts in charge of constructing the schema are found in `src/utils/supabase/migrations/`. Rather than using a migration framework, we use the Supabase SQL editor or `psql` directly to keep deployment simple and explicit.

| Script | Purpose |
|---|---|
| `migrations/create-schema.sql` | Creates all ENUMs, tables, constraints, and triggers |
| `migrations/schema-breakdown.sql` | Drops everything — use to reset a local instance |
| `scripts/fake-data.sql` | Inserts a fixed seed dataset for development and testing |
| `scripts/fake-data-cleanup.sql` | Deletes all seed rows (leaves schema intact) |
| `scripts/query-schema.sql` | Spot-checks every table with representative SELECT queries |
| `scripts/create-admins.sql` | Inserts or promotes admin users (run once, not wiped by cleanup) |

### Running Migrations
1. Open your project in [supabase.com](https://supabase.com) → **SQL Editor**
2. Paste and run the scripts in the following order:

```
migrations/create-schema.sql
scripts/create-admins.sql     ← optional, only if admin accounts are needed
scripts/fake-data.sql         ← optional, only for development/testing
```

---

### Running migrations

#### Option A — Supabase SQL Editor (recommended for Supabase hosted projects)

1. Open your project in [supabase.com](https://supabase.com) → **SQL Editor**
2. Paste and run the scripts in the following order:

```
migrations/schema-breakdown.sql ← ensure old image is deleted
migrations/create-schema.sql    ← construct schema  
migrations/verify-schema.sql    ← optional, only if admin accounts are needed
```
---

### Verifying the migration (AC3)

After running `create-schema.sql`, confirm all expected tables exist by querying the Postgres information schema:

```sql
-- Lists all tables created by the migration
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
-- Expected: 23 rows returned, one per table name above.
```

