# Quick Start: Admin View

## Accessing the Views

The application now has **completely separate routes**:

### 🔵 User Interface
**URL:** `http://localhost:3000/user`
- Full trading platform functionality
- Marketplace, exchanges, auctions, messages
- User profile and favorites
- Standard blue theme

### 🔴 Admin Interface  
**URL:** `http://localhost:3000/admin`
- Reports management panel
- User moderation tools
- Audit log tracking
- Red/destructive theme
- **No access** to trading features

### 🏠 Root URL
**URL:** `http://localhost:3000/`
- Automatically redirects to `/user`

## Quick Navigation

While viewing either interface, you'll see a **floating "Switch View" button** in the bottom-right corner:
- In User View → Shows "Switch to Admin View" button
- In Admin View → Shows "Switch to User View" button

This makes it easy to test both interfaces during development/demos.

## What You'll See

### Admin Sidebar (Left)
- 🛡️ Red-themed admin interface
- Shield icon and "Administrator Mode" badge
- Navigation: Reports, User Management, Audit Log, Analytics, Settings

### Reports Dashboard (Main Area)
- **Statistics Cards**: Total users, active reports, trades, banned users
- **Search & Filter**: Find reports by user name, reason, or status
- **Report Cards**: Click any report to see full details
- **Report Details Panel**: 
  - Reporter and reported user info
  - Full description and reason
  - Evidence (screenshots/images)
  - Related items or exchanges
  - Admin notes and resolution history
  - Action buttons: Ban User, Dismiss, Resolve

### Sample Reports Included
- 7 realistic mock reports covering various scenarios
- Different statuses (pending, reviewing, resolved, dismissed)
- Complete with evidence, admin notes, and related items

## Key Differences: Admin vs User View

| Feature | Regular User | Admin |
|---------|-------------|-------|
| Create Items | ✅ Yes | ❌ No |
| Send Messages | ✅ Yes | ❌ No |
| Make Trades | ✅ Yes | ❌ No |
| View Marketplace | ✅ Yes | ❌ No |
| Profile Page | ✅ Yes | ❌ No |
| **Manage Reports** | ❌ No | ✅ Yes |
| **Ban Users** | ❌ No | ✅ Yes |
| **View Audit Log** | ❌ No | ✅ Yes |
| **User Management** | ❌ No | ✅ Yes |

## Demo Flow

1. **Start on User View** - Visit `http://localhost:3000/user`
2. **Explore Trading Features** - Navigate through marketplace, messages, profile
3. **Switch to Admin** - Click the "Switch to Admin View" button (bottom-right)
4. **View Reports** - See 4 active reports needing attention
5. **Click a Report** - Full details panel appears with evidence
6. **Review Evidence** - Check screenshots and related items
7. **Take Action** - Ban user, dismiss, or resolve the report
8. **Check Other Tabs** - User Management and Audit Log
9. **Switch Back** - Click "Switch to User View" to return

## URL Structure

```
/                    → Redirects to /user
/user                → Regular user interface
/admin               → Admin-only interface
```

## Screenshots Reference

### Admin Reports Panel Features:
- 🔍 Search bar for finding specific reports
- 🎯 Filter dropdown (All, Pending, Reviewing, Resolved, Dismissed)
- ⚠️ Color-coded status badges
- 👥 Reporter → Reported user flow
- 📅 Timestamps for tracking
- 🖼️ Evidence gallery with images
- 📝 Admin internal notes
- 🚫 Quick action buttons

### Report Types You'll See:
1. Misleading Description (Item not as advertised)
2. Failed Trade (User didn't show up)
3. Inappropriate Messages (Harassment)
4. Scam Attempt (Requesting outside payment)
5. Fake Item (Counterfeit product)
6. Harassment (Repeated unwanted contact)
7. Spam (Duplicate listings)

## Technical Notes

- Built with React, TypeScript, and shadcn/ui components
- Fully responsive (works on mobile and desktop)
- Mock data for demonstration purposes
- Console logs when actions are taken (check browser console)
- No backend integration yet (perfect for mockups/demos)

---

**Need Help?** See full documentation in `ADMIN_VIEW.md`
