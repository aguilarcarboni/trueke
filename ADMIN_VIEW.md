# Admin View Documentation

## Overview

The Trueke platform now includes a dedicated **Admin View** accessible via a separate route (`/admin`). This provides complete isolation between user and admin functionalities, with admins having access to moderation and user management capabilities without any trading features.

## Accessing the Interfaces

### Route Structure

The application uses Next.js App Router with separate routes:

```
/                    → Root (redirects to /user)
/user                → Regular user interface
/admin               → Admin-only interface
```

### Navigation

- **Direct URL Access:**
  - User interface: `http://localhost:3000/user`
  - Admin interface: `http://localhost:3000/admin`

- **View Switcher (Development/Demo):**
  - A floating button appears in the bottom-right corner
  - Allows quick switching between user and admin views
  - Can be removed in production by removing the `<ViewSwitcher />` component

## Separation of Concerns

Unlike the previous toggle-based approach, the route-based architecture provides:

✅ **Complete Isolation** - User and admin code are in separate route folders  
✅ **Independent Layouts** - Each route can have its own metadata and layout  
✅ **Better Security** - Easier to protect admin routes with middleware  
✅ **Clearer Intent** - URL clearly indicates which interface you're using  
✅ **Separate Deployments** - Can deploy user and admin to different domains if needed

## Admin Features

### What Admins CAN Do:

1. **View and Manage Reports**
   - See all user-to-user reports with full details
   - Filter reports by status (pending, reviewing, resolved, dismissed)
   - Search reports by user names or reason
   - View evidence, related items, and exchanges
   - Add admin notes to reports
   - Resolve or dismiss reports
   - Ban reported users if necessary

2. **User Management**
   - View all registered users
   - See user statistics (trades, ratings, location)
   - Ban or warn users
   - View user profiles and activity

3. **Audit Log**
   - Track all administrative actions
   - Monitor recent platform activity
   - See who performed what action and when

4. **Platform Analytics** (placeholder for future features)
   - User statistics
   - Trade metrics
   - Platform health monitoring

### What Admins CANNOT Do:

Admins have a restricted interface and **cannot**:
- ❌ Create their own profile
- ❌ Create or list items for trade
- ❌ Make or receive trade offers
- ❌ Send or receive messages with users
- ❌ Participate in auctions
- ❌ Add items to favorites
- ❌ Access the marketplace as a buyer/seller

This ensures admins remain neutral moderators focused solely on platform management.

## User Interface Differences

### Regular User View
- **Sidebar Navigation:** Dashboard, Marketplace, Exchanges, Auctions, Messages, Favorites, Profile, Admin
- **Primary Color:** Standard theme colors
- **Features:** Full trading platform functionality

### Admin View
- **Sidebar Navigation:** Reports, User Management, Audit Log, Analytics, Settings
- **Primary Color:** Red/destructive theme for admin distinction
- **Features:** Moderation and management tools only
- **Visual Indicators:** Shield icon, "Administrator Mode" badge

## Report System

### Report Types

Reports are categorized by reason:
- **Misleading Description** - Item not as advertised
- **Failed Trade** - User didn't complete agreed exchange
- **Inappropriate Messages** - Harassment or offensive content
- **Fake/Counterfeit Item** - Suspected counterfeit products
- **Harassment** - Repeated unwanted contact
- **Scam Attempt** - Fraudulent behavior
- **Spam** - Duplicate or spam listings
- **Other** - Miscellaneous issues

### Report Status Flow

1. **Pending** - New report, awaiting review
2. **Reviewing** - Admin is investigating
3. **Resolved** - Issue resolved, action taken
4. **Dismissed** - Report was invalid or resolved without action

### Report Details

Each report includes:
- Reporter and reported user information
- Detailed description of the issue
- Evidence (screenshots, images)
- Related items or exchanges
- Admin notes (internal tracking)
- Resolution history

### Admin Actions

For each report, admins can:
1. **Review** - View full details and evidence
2. **Ban User** - Permanently restrict reported user
3. **Dismiss** - Mark report as invalid
4. **Resolve** - Close report with action taken
5. **Add Notes** - Track investigation progress

## Mock Data

The system includes 7 sample reports covering various scenarios:
- Misleading item descriptions
- Failed trades
- Inappropriate messages
- Scam attempts
- Counterfeit items
- Harassment
- Spam listings

Reports include realistic details like evidence, admin notes, and resolution tracking.

## Current Statistics (Mock)

- **Total Users:** 1,247
- **Active Reports:** 4 (pending/reviewing)
- **Trades Today:** 34
- **Banned Users:** 15

## Future Enhancements

Potential features to add:
- Real-time notification system for new reports
- Advanced filtering and sorting options
- Bulk actions for managing multiple reports
- Automated flagging system using AI
- User appeal system
- Detailed analytics dashboard
- Export reports to CSV/PDF
- Admin role permissions (super admin, moderator, support)
- Two-way communication system with reporters
- Temporary suspension options (not just permanent ban)

## Technical Implementation

### File Structure

```
app/
├── page.tsx                          # Root - redirects to /user
├── layout.tsx                        # Root layout
├── user/
│   ├── page.tsx                      # User interface
│   └── layout.tsx                    # User metadata
├── admin/
│   ├── page.tsx                      # Admin interface
│   └── layout.tsx                    # Admin metadata
components/
├── app-sidebar.tsx                   # User navigation (no admin link)
├── admin-sidebar.tsx                 # Admin navigation
├── view-switcher.tsx                 # Dev/demo tool for switching
└── sections/
    └── admin.tsx                     # Admin dashboard & reports
lib/
└── data.ts                           # Types and mock data (no isAdminMode)
```

### Key Files

1. **`app/user/page.tsx`** - Regular user interface with all trading features
2. **`app/admin/page.tsx`** - Admin interface with reports panel only
3. **`components/admin-sidebar.tsx`** - Admin-specific navigation sidebar
4. **`components/view-switcher.tsx`** - Optional floating button for testing
5. **`components/sections/admin.tsx`** - Main admin dashboard and reports panel
6. **`lib/data.ts`** - Report types, mock data, and user definitions

### Type Definitions

```typescript
type ReportReason = "misleading-description" | "failed-trade" | "inappropriate-messages" | ...
type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed"

interface Report {
  id: string
  reporter: User
  reported: User
  reason: ReportReason
  reasonText: string
  description: string
  status: ReportStatus
  date: string
  relatedItem?: Item
  relatedExchange?: Exchange
  evidence?: string[]
  adminNotes?: string
  resolvedBy?: string
  resolvedDate?: string
}
```

## Usage Tips

1. **Testing Separate Routes**: Navigate directly to `/user` or `/admin` URLs
2. **Demo to Stakeholders**: Use the view switcher button for easy navigation
3. **Adding Reports**: Edit `trueke/lib/data.ts` to add more sample reports
4. **Removing Switcher**: Delete `<ViewSwitcher />` from page components for production
5. **Styling**: Admin interface uses destructive color variants (red) for distinction
6. **Responsive**: Both interfaces work on mobile and desktop devices
7. **Route Protection**: Add middleware to `app/admin` folder to protect in production

## Future Authentication

To add authentication and route protection:

```typescript
// middleware.ts (in root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if user is admin
  const isAdmin = checkAdminStatus(request) // Your auth logic
  
  if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/user', request.url))
  }
}

export const config = {
  matcher: '/admin/:path*',
}
```

## Support

For questions or issues with the admin functionality, refer to the main project documentation or contact the development team.
