# Audit Log Section — Test-Writing Instructions

These instructions are **framework-agnostic** and describe **what to test** rather than **how to test**. Adapt them to your testing framework (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

---

## Overview

Write tests for the audit log feature before implementing it (TDD approach). These tests ensure users can view complete history of feature toggle changes, see who made changes and when, filter logs by various criteria, and export logs for compliance purposes.

## Key User Flows to Test

### Flow 1: View Recent Changes

**Given:** User navigates to audit log page  
**And:** 12 log entries exist from the last 7 days  
**When:** Page loads  
**Then:** User sees heading "Audit Log"  
**And:** User sees description "Complete history of all feature toggle changes"  
**And:** User sees entry count "12 entries"  
**And:** User sees 12 log entry cards in reverse chronological order (newest first)  
**And:** Each entry shows user avatar with initials  
**And:** Each entry shows user name  
**And:** Each entry shows action badge ("enabled" or "disabled")  
**And:** Each entry shows feature toggle name in monospace font  
**And:** Each entry shows state transition (e.g., "Disabled → Enabled")  
**And:** Each entry shows environment badge with resource name  
**And:** Each entry shows relative timestamp (e.g., "2h ago", "3d ago")  

**UI Elements to Verify:**
- Heading "Audit Log" displays
- Description text is present
- Entry count displays with correct pluralization ("entry" vs "entries")
- LogEntry components render for each log entry
- Most recent entries appear first
- All metadata visible (user, action, toggle, environment, time)

**Assertions:**
- Entries sorted by timestamp descending (newest first)
- Entry count equals entries array length
- All 12 entries render without pagination initially
- No loading state shows after entries loaded

---

### Flow 2: User Initials Generated Correctly

**Given:** Log entry has userName "Sarah Chen"  
**When:** LogEntry renders  
**Then:** Avatar displays initials "SC"  
**And:** Avatar has orange background  
**Given:** Log entry has userName "Michael Rodriguez"  
**When:** LogEntry renders  
**Then:** Avatar displays initials "MR"  
**Given:** Log entry has userName "admin"  
**When:** LogEntry renders  
**Then:** Avatar displays initials "AD"  

**UI Elements to Verify:**
- Avatar component renders with AvatarFallback
- Initials are uppercase
- Maximum 2 characters display
- Avatar background is orange (bg-orange-100/dark:bg-orange-900)
- Text color is orange (text-orange-700/dark:text-orange-200)

**Assertions:**
- getInitials function extracts first letter of each word
- Handles single-word names (first 2 letters)
- Handles multi-word names (first letter of first 2 words)
- Always returns uppercase letters
- Never exceeds 2 characters

---

### Flow 3: Timestamp Formats Correctly

**Given:** Log entry timestamp is 5 minutes ago  
**Then:** Displays "5m ago"  
**Given:** Log entry timestamp is 2 hours ago  
**Then:** Displays "2h ago"  
**Given:** Log entry timestamp is 3 days ago  
**Then:** Displays "3d ago"  
**Given:** Log entry timestamp is 8 days ago  
**Then:** Displays full date "Jan 20, 2026, 2:15 PM"  
**Given:** Log entry timestamp is "Just now" (< 1 min)  
**Then:** Displays "Just now"  

**UI Elements to Verify:**
- Relative time shows on desktop (hidden sm:inline)
- Full timestamp shows on mobile (sm:hidden)
- Tooltip/title attribute shows full timestamp on hover
- Timestamp updates appropriately based on age

**Assertions:**
- formatRelativeTime calculates correct time difference
- Uses "Just now" for < 1 minute
- Uses "{n}m ago" for < 60 minutes
- Uses "{n}h ago" for < 24 hours
- Uses "{n}d ago" for < 7 days
- Uses full date format for 7+ days
- formatTimestamp shows locale string with month, day, year, time

---

### Flow 4: Environment Badges Color-Coded

**Given:** Log entry is for development environment  
**Then:** Environment badge has blue background  
**Given:** Log entry is for staging environment  
**Then:** Environment badge has yellow background  
**Given:** Log entry is for production environment  
**Then:** Environment badge has red background  

**UI Elements to Verify:**
- Badge displays resourceName text
- Badge colors match environmentType:
  - development: blue (bg-blue-100, text-blue-800)
  - staging: yellow (bg-yellow-100, text-yellow-800)
  - production: red (bg-red-100, text-red-800)
- Dark mode variants apply correctly

**Assertions:**
- environmentColors object maps types to CSS classes
- Badge receives correct className based on entry.environmentType
- Resource name displays correctly in badge

---

### Flow 5: State Transition Visualization

**Given:** Log entry shows feature was enabled (previousState=false, newState=true)  
**Then:** Shows "Disabled" badge in gray  
**And:** Shows arrow icon (→)  
**And:** Shows "Enabled" badge in green  
**Given:** Log entry shows feature was disabled (previousState=true, newState=false)  
**Then:** Shows "Enabled" badge in green  
**And:** Shows arrow icon (→)  
**And:** Shows "Disabled" badge in gray  

**UI Elements to Verify:**
- Two state badges render with ArrowRight icon between them
- First badge shows previousState
- Second badge shows newState
- Enabled state: green background (bg-emerald-100, text-emerald-800)
- Disabled state: gray background (bg-slate-100, text-slate-800)
- Arrow icon has gray color

**Assertions:**
- State badges display "Enabled" or "Disabled" text based on boolean
- Badge colors correctly represent enabled (green) vs disabled (gray)
- Arrow icon always points right
- Both states clearly visible

---

### Flow 6: Action Badge Displays Correctly

**Given:** Log entry action is "enabled"  
**Then:** Action badge displays "enabled" text  
**And:** Badge has green background  
**Given:** Log entry action is "disabled"  
**Then:** Action badge displays "disabled" text  
**And:** Badge has gray background  

**UI Elements to Verify:**
- Action badge renders next to user name
- Badge text matches action type
- actionColors object maps action to CSS classes
- Enabled action: green (bg-emerald-100, text-emerald-800)
- Disabled action: gray (bg-slate-100, text-slate-800)

**Assertions:**
- Badge receives correct className based on entry.action
- Action text displays lowercase ("enabled" not "Enabled")
- Badge size is small (text-xs)

---

### Flow 7: Empty State When No Logs

**Given:** Audit log page loads  
**And:** No log entries exist  
**When:** Page renders  
**Then:** User sees empty state message  
**And:** Message reads "No changes have been made yet"  
**And:** No log entry cards display  

**UI Elements to Verify:**
- Empty state centered on page
- Message clearly states no changes exist
- No loading skeletons after load complete
- Entry count shows "0 entries"

**Assertions:**
- Empty state renders when entries.length === 0
- No LogEntry components render
- Empty state distinct from loading state
- Message is user-friendly and explanatory

---

## Component Interaction Tests

### LogEntry Component

**Prop: `entry`**
- When entry provided: All fields render correctly
- userName displays in bold
- toggleName displays in monospace font
- resourceName displays in environment badge
- action displays in action badge
- previousState and newState control state badge colors
- timestamp formats correctly based on age

**Avatar Initials:**
- "Sarah Chen" → "SC"
- "Michael Rodriguez" → "MR"
- "admin" → "AD"
- "John" → "JO"
- "A B C" → "AB" (max 2 letters)

**Environment Badge Colors:**
- environmentType='development' → blue badge
- environmentType='staging' → yellow badge
- environmentType='production' → red badge

**Action Badge Colors:**
- action='enabled' → green badge
- action='disabled' → gray badge

**State Badges:**
- previousState=true → "Enabled" green badge
- previousState=false → "Disabled" gray badge
- newState=true → "Enabled" green badge
- newState=false → "Disabled" gray badge

**Timestamp Display:**
- < 1 min: "Just now"
- 5 mins: "5m ago"
- 2 hours: "2h ago"
- 3 days: "3d ago"
- 8 days: "Jan 20, 2026, 2:15 PM"

---

## Parent Component (Audit Log View) Tests

### Loading State

**Given:** Audit log view is fetching data  
**When:** isLoading is true  
**Then:** Shows 5 loading skeleton cards  
**And:** Each skeleton is gray background with animate-pulse  
**And:** No log entries render yet  

**Assertions:**
- Loading skeletons render when isLoading is true
- Skeletons have consistent height (h-24)
- Animation class applied (animate-pulse)
- Real entries don't render until isLoading is false

---

### Filtering by Date Range

**Given:** User has access to date range filter  
**When:** User selects "Last 7 days"  
**Then:** Only entries from last 7 days display  
**When:** User selects "Last 30 days"  
**Then:** Entries from last 30 days display  
**When:** User selects "Last 90 days"  
**Then:** Entries from last 90 days display  

**Assertions:**
- Date range filter controls which entries display
- Timestamp comparison is accurate
- Filter updates entry count
- No entries outside date range shown

---

### Filtering by User

**Given:** Logs contain entries from 3 different users  
**When:** User selects "Sarah Chen" filter  
**Then:** Only entries where userName is "Sarah Chen" display  
**And:** Entry count updates to reflect filtered count  

**Assertions:**
- User filter matches userName field exactly
- Multiple entries from same user all display
- Entry count reflects filtered results
- Clear filter resets to show all users

---

### Filtering by Feature Toggle

**Given:** Logs contain changes to 5 different toggles  
**When:** User enters "enable_dark_mode" in toggle search  
**Then:** Only entries for "enable_dark_mode" display  
**And:** Entry count updates  

**Assertions:**
- Toggle filter matches toggleName field
- Search is case-insensitive or exact match (per design)
- Multiple entries for same toggle all display
- Clear search shows all toggles again

---

### Filtering by Environment

**Given:** Logs contain entries from dev, staging, and prod  
**When:** User selects "production" environment filter  
**Then:** Only entries where environmentType is "production" display  
**And:** All production entries have red badges  

**Assertions:**
- Environment filter matches environmentType field
- Multiple environments can be selected (if multi-select)
- Entry count reflects filtered results
- Badge colors still correct after filtering

---

### Combined Filters

**Given:** User applies multiple filters simultaneously  
**When:** User selects date range "Last 30 days"  
**And:** User selects user "Michael Rodriguez"  
**And:** User selects environment "staging"  
**Then:** Only entries matching ALL filters display  
**And:** Entry count reflects combined filter  

**Assertions:**
- Filters combine with AND logic
- Each filter independently filters the result set
- Entry count accurate for combined filters
- Clearing one filter updates results appropriately

---

### Export to CSV

**Given:** User has filtered logs to 50 entries  
**When:** User clicks "Export CSV" button  
**Then:** CSV file downloads with 50 entries  
**And:** CSV includes all fields: timestamp, userName, action, toggleName, resourceName, environmentType, previousState, newState  
**And:** Filename includes current date (e.g., "audit-log-2026-01-28.csv")  

**Assertions:**
- Export includes all filtered entries (not all entries)
- CSV format is valid and parseable
- All metadata fields included
- File downloads successfully

---

### Export to JSON

**Given:** User has 30 log entries  
**When:** User clicks "Export JSON" button  
**Then:** JSON file downloads with array of 30 entries  
**And:** Each entry includes all fields  
**And:** JSON is valid and formatted  

**Assertions:**
- Export includes all filtered entries
- JSON structure matches AuditLogEntry type
- File downloads successfully
- JSON is parseable

---

## Edge Cases

### 1. Very Long User Names
**Scenario:** User name is "Dr. Christopher Alexander Montgomery III"  
**Expected:** Initials show "DA" (first 2 words), name wraps in log entry if needed  
**Assertion:** Initials limited to 2 characters, name displays fully without breaking layout

### 2. Very Long Toggle Names
**Scenario:** Toggle name is "enable_new_experimental_checkout_flow_with_one_click_purchase"  
**Expected:** Name wraps or truncates, doesn't break card layout  
**Assertion:** Monospace font preserved, text wraps to multiple lines if needed

### 3. Single-Word User Name
**Scenario:** User name is "admin"  
**Expected:** Initials show "AD" (first 2 letters)  
**Assertion:** Single-word names handled correctly

### 4. Timestamps in Different Timezones
**Scenario:** Log entries have timestamps in UTC  
**Expected:** Display in user's local timezone  
**Assertion:** Timestamps converted correctly using locale methods

### 5. Very Old Log Entries
**Scenario:** Log entry from 6 months ago  
**Expected:** Full timestamp displays (not relative)  
**Assertion:** Old entries show full date format

### 6. Multiple Changes to Same Toggle in Short Time
**Scenario:** "feature_x" toggled 5 times in 1 hour  
**Expected:** 5 separate log entries, all visible, chronologically ordered  
**Assertion:** All changes logged, no deduplication

### 7. Deleted User
**Scenario:** Log entry from user who no longer exists  
**Expected:** Shows last known name or "[User Deleted]" placeholder  
**Assertion:** Handles missing user gracefully, doesn't crash

### 8. System-Generated Changes
**Scenario:** Toggle changed by automated script or API  
**Expected:** userName shows "System" or automation account name  
**Assertion:** System changes logged like user changes

### 9. Large Number of Entries (1000+)
**Scenario:** Audit log has 1000+ entries  
**Expected:** Pagination or infinite scroll loads entries progressively  
**Assertion:** Performance acceptable, not all entries loaded at once

### 10. No Filters Match Any Entries
**Scenario:** User applies filters that return 0 results  
**Expected:** Shows "No logs match your filters" with "Clear Filters" button  
**Assertion:** Empty result state distinct from no entries state

---

## Sample Test Data

Use these scenarios to test different log entry types:

### Log Entry 1: Enabled in Development
```json
{
  "id": "log-001",
  "timestamp": "2026-01-28T14:30:00Z",
  "userName": "Sarah Chen",
  "action": "enabled",
  "toggleName": "enable_dark_mode",
  "resourceName": "Development",
  "environmentType": "development",
  "previousState": false,
  "newState": true
}
```

### Log Entry 2: Disabled in Production
```json
{
  "id": "log-002",
  "timestamp": "2026-01-28T10:15:00Z",
  "userName": "Michael Rodriguez",
  "action": "disabled",
  "toggleName": "experimental_checkout",
  "resourceName": "Production",
  "environmentType": "production",
  "previousState": true,
  "newState": false
}
```

### Log Entry 3: Recent Change (Minutes Ago)
```json
{
  "id": "log-003",
  "timestamp": "2026-01-28T15:55:00Z",
  "userName": "admin",
  "action": "enabled",
  "toggleName": "beta_analytics",
  "resourceName": "Staging",
  "environmentType": "staging",
  "previousState": false,
  "newState": true
}
```

### Log Entry 4: Old Change (Weeks Ago)
```json
{
  "id": "log-004",
  "timestamp": "2026-01-10T09:00:00Z",
  "userName": "Emily Watson",
  "action": "disabled",
  "toggleName": "legacy_feature",
  "resourceName": "Production",
  "environmentType": "production",
  "previousState": true,
  "newState": false
}
```

### Audit Log State: Loading
```json
{
  "entries": [],
  "isLoading": true,
  "error": null,
  "filters": {
    "dateRange": "last7days"
  },
  "totalCount": 0,
  "hasMore": false
}
```

### Audit Log State: Loaded with Entries
```json
{
  "entries": [
    {
      "id": "log-001",
      "timestamp": "2026-01-28T14:30:00Z",
      "userName": "Sarah Chen",
      "action": "enabled",
      "toggleName": "enable_dark_mode",
      "resourceName": "Development",
      "environmentType": "development",
      "previousState": false,
      "newState": true
    }
  ],
  "isLoading": false,
  "error": null,
  "filters": {
    "dateRange": "last7days"
  },
  "totalCount": 1,
  "hasMore": false
}
```

### Audit Log Filters
```json
{
  "dateRange": "last30days",
  "user": "Sarah Chen",
  "toggleName": "enable_dark_mode",
  "environment": "production",
  "action": "enabled"
}
```

---

## Integration Points to Test

### 1. Log Fetching API
- Fetch logs from backend/database on page load
- Support pagination or limit (e.g., first 50 entries)
- Support filters passed as query parameters
- Handle API errors gracefully

### 2. Log Creation (Automatic)
- Every toggle change automatically creates log entry
- Log captures timestamp at exact moment of change
- Log captures current user from session
- Log captures all toggle metadata
- Logs are immutable (cannot be edited/deleted)

### 3. Filtering Logic
- Date range filter queries by timestamp
- User filter queries by userName
- Toggle filter queries by toggleName
- Environment filter queries by environmentType
- Action filter queries by action
- Combined filters use AND logic

### 4. Export Functionality
- Export applies current filters
- CSV format includes headers and all data
- JSON format is valid and complete
- File download triggers properly in browser

---

## Accessibility Tests

### Keyboard Navigation
- Tab key navigates through filter controls
- Enter key activates filter selections
- Log entries are not interactive (no tab stops)
- Export button is keyboard accessible

### Screen Reader Support
- Entry count announced: "12 entries"
- Each log entry has semantic structure
- User name, action, toggle name announced in order
- Timestamps announced with full date/time
- State transitions announced: "Changed from Disabled to Enabled"

### Color Contrast
- All badge text meets WCAG AA contrast (4.5:1)
- Environment badges readable in light and dark mode
- Action badges readable in light and dark mode
- State badges (green/gray) meet contrast requirements

### Semantic HTML
- Use article or li for each log entry
- Use headings for page title
- Use list structure if entries in list
- Avatar uses img or div with proper aria labels

---

## Done When

- [ ] LogEntry component renders correctly for all prop variations
- [ ] User initials generate correctly from names
- [ ] Timestamps format correctly (relative and full)
- [ ] Environment badges show correct colors for all types
- [ ] State transition displays correctly (previous → new)
- [ ] Action badges display correctly
- [ ] Empty state displays when no entries
- [ ] Loading state shows skeletons
- [ ] Entries sort by timestamp descending (newest first)
- [ ] Entry count displays with correct pluralization
- [ ] Filtering works for all filter types
- [ ] Combined filters work correctly
- [ ] Export to CSV works
- [ ] Export to JSON works
- [ ] Edge cases covered (long names, old dates, etc.)
- [ ] Accessibility requirements met
- [ ] Tests are framework-agnostic and well-documented

---

## Notes

- These tests should be written **before** implementing the audit log feature (TDD)
- Focus on **user behavior** and **expected outcomes**, not implementation details
- Test both **display logic** (formatting, colors) and **data logic** (filtering, sorting)
- Ensure tests are **deterministic** (same result every time)
- Use **mocks/stubs** for API calls and current time (for timestamp tests)
- Test that logs are truly immutable (read-only, no edit/delete)
- Verify chronological sorting (newest first) is maintained
- Test responsive behavior (mobile shows full timestamp, desktop shows relative)
