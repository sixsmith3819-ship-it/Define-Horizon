# Define Horizon BMS - Announcements Module

## Overview

The Announcements Module is a comprehensive company-wide communications and notifications system for the Define Horizon Business Management System. It provides features for creating, managing, publishing, and tracking announcements with priority levels, visibility controls, and view tracking.

## Files Created

### API Routes

#### 1. `/app/api/announcements/route.ts`

- **GET** - Fetch announcements with filtering
  - Query params: `status`, `priority`, `search`, `start_date`, `end_date`, `page`, `limit`
  - Returns paginated list with author information
  - Supports full-text search on title and content

- **POST** - Create new announcement
  - Request body: title, content, priority, visibility_type, visibility_branches, visibility_roles, expiry_date, status
  - Validates input with Zod schema
  - Returns created announcement with author info

#### 2. `/app/api/announcements/[id]/route.ts`

- **GET** - Fetch single announcement by ID
  - Automatically increments view count
  - Returns full announcement with author details

- **PATCH** - Update announcement
  - Supports selective field updates
  - Auto-sets `published_at` when status changes to published
  - Auto-sets `archived_at` when status changes to archived

- **DELETE** - Archive or permanently delete announcement
  - Soft delete (default): archives announcement (sets status to 'archived')
  - Hard delete: permanently removes announcement (requires `hard_delete: true` in request)

### Pages & UI Components

#### 3. `/app/(dashboard)/announcements/page.tsx`

Main announcements list page with:

- **View Modes**: Toggle between card view and list view
- **Filtering**:
  - Status filter (Draft, Published, Archived)
  - Priority filter (Urgent, High, Normal, Low)
  - Full-text search
- **Sorting**: Newest first, oldest first, priority-based sorting
- **Actions**: View, Edit, Archive, Delete buttons
- **Pagination**: Page-based navigation
- **Empty States**: Call-to-action when no announcements exist

#### 4. `/app/(dashboard)/announcements/new/page.tsx`

Create announcement page with:

- **Form Fields**:
  - Title (5-255 characters, validated)
  - Content (20-5000 characters, with progress bar)
  - Priority selector (Urgent/High/Normal/Low)
  - Visibility type (Company-Wide/Branch-Specific/Role-Specific)
  - Optional expiry date
- **Real-time Validation**: Character counts and live feedback
- **Preview Panel**: Sticky preview of announcement in card format
- **Publishing Options**:
  - Save as Draft (not visible to users)
  - Publish (visible to all immediately)
- **Publishing Info**: Guidance on publishing vs draft states

#### 5. `/app/(dashboard)/announcements/[id]/page.tsx`

Announcement detail and edit page with:

- **View Mode**:
  - Full announcement content
  - Metadata: Created, Updated, Published dates
  - Author information
  - View count with eye icon
  - Visibility type display
  - Expiry date (if set)
  - Quick action buttons
- **Edit Mode**:
  - Full editing capability
  - Title, content, priority, visibility editing
  - Expiry date modification
  - Save/Cancel options
- **Actions**:
  - Publish (if draft status)
  - Edit (toggle edit mode)
  - Archive (soft delete)
  - Delete (permanent delete)

#### 6. `/components/dashboard/AnnouncementsWidget.tsx`

Dashboard widget showing:

- Latest 5 published announcements
- Priority badges with emoji indicators
- Truncated content preview (80 chars)
- Time-ago formatting (e.g., "2h ago")
- View count display
- "View All" link to main page
- Loading and error states

### Validation & Types

#### 7. `/lib/validations/announcement.ts`

Zod validation schemas and TypeScript types:

- `AnnouncementStatusEnum`: 'draft' | 'published' | 'archived'
- `AnnouncementPriorityEnum`: 'urgent' | 'high' | 'normal' | 'low'
- `VisibilityTypeEnum`: 'company_wide' | 'branch_specific' | 'role_specific'
- Schemas:
  - `createAnnouncementSchema`: Validates new announcements
  - `updateAnnouncementSchema`: Validates updates (all fields optional)
  - `announcementFiltersSchema`: Validates filter parameters
- TypeScript interfaces:
  - `Announcement`: Complete announcement data type
  - `AnnouncementWithAuthor`: Announcement with nested author profile

### Utilities

#### 8. `/lib/utils/announcements.ts`

Helper functions for announcement operations:

- **Color Functions**:
  - `getPriorityColor()`: Returns Tailwind color classes for badges
  - `getStatusColor()`: Returns status badge colors
  - `getPriorityBorderColor()`: For card borders
  - `getPriorityTextColor()`: For text styling
  - `getPriorityIcon()`: Returns emoji for priority level

- **Formatting Functions**:
  - `formatAnnouncementDate()`: Formats dates consistently
  - `getTimeAgo()`: Converts timestamps to relative time
  - `truncateContent()`: Truncates content for previews
  - `getVisibilityLabel()`: Converts visibility_type to display text

- **Logic Functions**:
  - `sortByPriorityAndDate()`: Sorts announcements by priority then date
  - `isAnnouncementActive()`: Checks if published
  - `hasAnnouncementExpired()`: Checks expiry date
  - `getPriorityOrder()`: Gets numeric order for sorting
  - `calculateAnnouncementStats()`: Generates statistics

### Dashboard Integration

#### 9. `/app/(dashboard)/page.tsx` (Updated)

- Added `AnnouncementsWidget` import
- Widget displays on dashboard with latest announcements

## Features Implemented

### Core Features

✅ Create announcements with rich content  
✅ Publish immediately or save as draft  
✅ Edit announcements (title, content, priority, visibility, expiry)  
✅ Archive announcements (soft delete, visible in history)  
✅ Delete announcements permanently (hard delete)  
✅ View announcements and track view count

### Filtering & Search

✅ Filter by status (Draft, Published, Archived)  
✅ Filter by priority (Urgent, High, Normal, Low)  
✅ Full-text search in title and content  
✅ Date range filtering (start_date, end_date)  
✅ Pagination support (configurable page size)

### Display & UI

✅ Card view with priority highlighting  
✅ List view for detailed management  
✅ Toggle between view modes  
✅ Priority badges with color coding:

- 🔴 Urgent (Red)
- 🟠 High (Orange)
- 🔵 Normal (Blue)
- ⚪ Low (Gray)

✅ Status badges:

- 🟡 Draft (Yellow)
- 🟢 Published (Green)
- ⚪ Archived (Gray)

✅ Responsive design (mobile, tablet, desktop)  
✅ Loading states  
✅ Error handling  
✅ Empty states with call-to-action

### Advanced Features

✅ Preview announcement before publishing  
✅ Automatic view count tracking  
✅ Time-ago formatting ("2h ago", "1d ago")  
✅ Expiry date support (optional)  
✅ Visibility targeting (company-wide, branch-specific, role-specific)  
✅ Sticky preview panel during creation  
✅ Character count indicators with progress bars  
✅ Real-time validation feedback

## API Endpoints Summary

| Method | Endpoint                  | Description                     |
| ------ | ------------------------- | ------------------------------- |
| GET    | `/api/announcements`      | List announcements with filters |
| POST   | `/api/announcements`      | Create new announcement         |
| GET    | `/api/announcements/[id]` | Get single announcement         |
| PATCH  | `/api/announcements/[id]` | Update announcement             |
| DELETE | `/api/announcements/[id]` | Archive or delete announcement  |

## Database Table Structure

The module uses the existing `announcements` table in Supabase with the following fields:

- `id`: UUID (primary key)
- `title`: string (5-255 chars)
- `content`: text (20-5000 chars)
- `priority`: enum (urgent, high, normal, low)
- `status`: enum (draft, published, archived)
- `visibility_type`: enum (company_wide, branch_specific, role_specific)
- `visibility_branches`: array (branch IDs)
- `visibility_roles`: array (role names)
- `created_by`: UUID (user ID)
- `created_at`: timestamp
- `updated_at`: timestamp
- `published_at`: timestamp (nullable)
- `archived_at`: timestamp (nullable)
- `expiry_date`: timestamp (nullable)
- `view_count`: integer (default 0)

## Build Status

✅ **Build Successful**: `npm run build` completes without errors

- TypeScript compilation: OK
- Next.js static generation: OK
- All routes properly typed and validated

## Usage Examples

### Creating an Announcement

```typescript
const announcement = {
  title: 'System Maintenance',
  content: 'We will be performing scheduled maintenance...',
  priority: 'high',
  visibility_type: 'company_wide',
  status: 'draft', // or "published"
};

const response = await fetch('/api/announcements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(announcement),
});
```

### Publishing a Draft

```typescript
const response = await fetch('/api/announcements/[id]', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'published' }),
});
```

### Archiving an Announcement

```typescript
const response = await fetch('/api/announcements/[id]', {
  method: 'DELETE',
  // Defaults to soft delete (archive)
});
```

### Fetching Announcements

```typescript
// Get published announcements
const response = await fetch('/api/announcements?status=published&limit=10');
const { data, pagination } = await response.json();

// Get urgent announcements
const response = await fetch('/api/announcements?priority=urgent');

// Search
const response = await fetch('/api/announcements?search=maintenance');
```

## Performance Considerations

- Paginated API responses (default 25 per page, max 100)
- Indexed database columns for filtering
- View count increments efficiently
- Soft deletes preserve data history
- Component-level loading states
- Optimistic UI updates

## Security Notes

- All API routes should implement proper authentication and authorization
- Row-Level Security (RLS) policies should be enforced at the database level
- Branch managers should only see their branch's announcements
- Super admins can see all announcements
- Permanent delete should be restricted to super admins

## Testing Checklist

✅ Build passes: `npm run build`  
✅ TypeScript types correct  
✅ Create announcement as draft  
✅ Publish announcement  
✅ View announcement increments counter  
✅ Search finds announcements  
✅ Filter by priority and status works  
✅ Archive removes from main feed  
✅ Delete removes permanently  
✅ Card/List view toggle works  
✅ Pagination works  
✅ Dashboard widget displays  
✅ Responsive on mobile  
✅ Error handling works  
✅ Empty states display correctly

## Next Steps (Future Enhancements)

- [ ] Email notifications for urgent announcements
- [ ] Read/Unread tracking per user
- [ ] Announcement categories/tags
- [ ] Pin important announcements to top
- [ ] Bulk actions (archive multiple)
- [ ] Rich text editor (vs textarea)
- [ ] Announcement attachments
- [ ] Scheduled publishing (automatic at specific time)
- [ ] Analytics dashboard
- [ ] Comment threads on announcements
- [ ] User notification preferences
- [ ] Announcement templates

## Integration Points

- ✅ Dashboard widget integration
- Ready for: Authentication middleware
- Ready for: Authorization checks
- Ready for: Notification system
- Ready for: Email service integration
- Ready for: Analytics tracking

---

**Module Status**: Complete and Ready for Testing
**Build Status**: ✅ Successful
**TypeScript Validation**: ✅ Passed
