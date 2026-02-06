# Milestone 5: Audit Log

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation), Milestone 2 (Authentication), Milestone 3 (Resource Configuration), Milestone 4 (Feature Toggle Dashboard) complete

## Goal

Implement the audit log feature — track and display all feature toggle changes for accountability and troubleshooting.

## Overview

The audit log tracks all changes to feature toggles, including who made the change, what was changed, and when. It provides accountability and helps troubleshoot issues. Users can filter by date range, environment, user, toggle name, and action type.

**Key Functionality:**
- Display chronological history of all toggle changes
- Show user avatar, name, and email for each change
- Display toggle name, resource, and environment
- Show state change (before → after) with visual indicators
- Filter by date range (last 7/30/90 days)
- Filter by environment type (dev/staging/production)
- Filter by action (enabled/disabled)
- Search by toggle name or user name
- Export audit logs (CSV/JSON format)
- Handle empty state when no logs exist or filters return no results

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/audit-log/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

The test instructions are framework-agnostic — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section component from `product-plan/sections/audit-log/components/`:

- `LogEntry.tsx` — Individual audit log entry card with user info and change details

The main view (`AuditLogView.tsx`) contains the full page with filters.

**Props Interface:**

```typescript
// LogEntry
interface LogEntryProps {
  entry: AuditLogEntry;
}
```

### Data Layer

The components expect these data shapes (from `types.ts`):

```typescript
type ActionType = 'enabled' | 'disabled';
type EnvironmentType = 'development' | 'staging' | 'production';
type DateRangeFilter = 'last7days' | 'last30days' | 'last90days' | 'custom';

interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  userEmail: string;
  action: ActionType;
  toggleId: string;
  toggleName: string;
  resourceId: string;
  resourceName: string;
  environmentType: EnvironmentType;
  previousState: boolean;
  newState: boolean;
}

interface AuditLogFilters {
  dateRange: DateRangeFilter;
  customStartDate?: string;
  customEndDate?: string;
  userId?: string;
  toggleName?: string;
  environmentType?: EnvironmentType;
  action?: ActionType;
}
```

You'll need to:
- Store audit log entries in your database
- Create entries automatically when toggles are changed (in Milestone 4)
- Query logs with pagination and filtering
- Support export to CSV/JSON format

### Backend Integration

**Fetch Audit Logs:**

- `GET /api/audit-logs` — Fetch audit log entries with filters and pagination
  - Query parameters: `dateRange`, `environmentType`, `action`, `search`, `page`, `limit`
  - Return paginated results with total count

**Create Audit Log Entry:**

- Called automatically when a toggle is changed (in Milestone 4)
- Store: timestamp, user info, action, toggle info, resource info, state change

**Export Audit Logs:**

- `POST /api/audit-logs/export` — Generate CSV or JSON export
  - Accept filters in request body
  - Return file download or signed URL

### Filtering System

**Date Range:**
- Last 7 days (default)
- Last 30 days
- Last 90 days
- Custom date range (optional enhancement)

**Environment:**
- All environments (default)
- Development only
- Staging only
- Production only

**Action:**
- All actions (default)
- Enabled only
- Disabled only

**Search:**
- Search by toggle name (case-insensitive)
- Search by user name (case-insensitive)

All filters work together (AND logic).

### Timestamp Display

Show relative timestamps for recent entries:
- "2h ago" for entries within 24 hours
- "Yesterday" for entries 24-48 hours ago
- Full date/time for older entries

Include full timestamp on hover or below relative time.

### Empty States

Implement empty state UI for when no records exist yet:

- **No logs yet:** Show message "No Audit Logs Yet" with explanation "Feature toggle changes will appear here once you start managing toggles."
- **No filtered results:** Show message "No logs match your filters" with "Clear Filters" button
- **No search results:** Show message "No logs found for '[search query]'" with option to clear search

The audit log view includes empty state design — make sure to render it when appropriate.

## Files to Reference

- `product-plan/sections/audit-log/README.md` — Feature overview and design intent
- `product-plan/sections/audit-log/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/audit-log/components/` — React components
- `product-plan/sections/audit-log/types.ts` — TypeScript interfaces
- `product-plan/sections/audit-log/sample-data.json` — Test data

## Expected User Flows

When fully implemented, users should be able to complete these flows:

### Flow 1: View Recent Audit Logs

1. User navigates to Audit Log page
2. User sees chronological list of recent toggle changes (last 7 days by default)
3. Each entry shows user avatar, name, action, toggle name, environment badge, and timestamp
4. **Outcome:** User can review what changes were made, by whom, and when

### Flow 2: Filter by Environment (Production Only)

1. User sees audit log list (all environments)
2. User clicks environment filter and selects "Production"
3. **Outcome:** List updates to show only changes made in production environment

### Flow 3: Search for Specific Toggle

1. User types "checkout" in search box
2. **Outcome:** List filters to show only entries for toggles with "checkout" in the name
3. User clears search
4. **Outcome:** Full log list returns

### Flow 4: Change Date Range to Last 30 Days

1. User clicks date range filter and selects "Last 30 days"
2. **Outcome:** List updates to show entries from the past 30 days (more entries appear)

### Flow 5: Export Audit Logs

1. User applies filters (e.g., production only, last 30 days)
2. User clicks "Export" button
3. **Outcome:** Download dialog appears with CSV file containing filtered audit logs

### Flow 6: Empty State - No Logs Yet

1. New user navigates to Audit Log page
2. No toggle changes have been made yet
3. **Outcome:** Empty state appears with message "No Audit Logs Yet" and explanation "Feature toggle changes will appear here once you start managing toggles."

### Flow 7: No Results After Filtering

1. User applies filters that match no entries (e.g., production + specific user who hasn't made production changes)
2. **Outcome:** Empty state shows "No logs match your filters" with "Clear Filters" button

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] Audit logs display in chronological order (newest first)
- [ ] Each entry shows user info, action, toggle, resource, environment, timestamp
- [ ] State change visualized (e.g., "OFF → ON" or "ON → OFF")
- [ ] Date range filter works (7/30/90 days)
- [ ] Environment filter works (all/dev/staging/production)
- [ ] Action filter works (all/enabled/disabled)
- [ ] Search filters by toggle name and user name
- [ ] Multiple filters work together (AND logic)
- [ ] "Clear Filters" button resets all filters
- [ ] Relative timestamps show for recent entries ("2h ago")
- [ ] Full timestamp visible on hover or below
- [ ] Export button downloads CSV or JSON
- [ ] Empty state shows when no logs exist
- [ ] Empty state shows when filters return no results
- [ ] Pagination works if many entries (optional)
- [ ] Matches the visual design
- [ ] Responsive on mobile
