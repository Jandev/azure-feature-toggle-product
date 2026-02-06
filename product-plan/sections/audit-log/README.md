# Audit Log Section

Complete history of all feature toggle changes for accountability and troubleshooting.

## Overview

The Audit Log section provides a complete history of all feature toggle changes, showing who made each change, what was changed, and when. This ensures accountability, helps troubleshoot issues, and provides compliance documentation. Users can filter logs by date range, user, feature toggle, or environment.

## Components

### LogEntry
Individual audit log entry card/row displaying a single change event.

**Features:**
- User avatar with initials
- User name prominently displayed
- Action badge (enabled/disabled)
- Feature toggle name (monospace font)
- State transition visualization (Enabled → Disabled or vice versa)
- Environment badge with resource name
- Timestamp in relative format ("2h ago") on desktop, full format on mobile
- Color-coded by environment (blue/yellow/red)
- Hover effects and responsive layout

**Props:**
- `entry` — AuditLogEntry object with complete log details

## Data Types

See `types.ts` for complete interface definitions:
- `AuditLogEntry` — Complete audit log entry with user, action, toggle, timestamp
- `AuditLogFilters` — Filter options for date range, user, toggle, environment, action
- `AuditLogState` — State for audit log view with entries, loading, error, filters
- `ActionType` — 'enabled' | 'disabled'
- `EnvironmentType` — 'development' | 'staging' | 'production'
- `DateRangeFilter` — 'last7days' | 'last30days' | 'last90days' | 'custom'
- `ExportOptions` — Options for exporting logs (CSV/JSON)

See `sample-data.json` for test data with 12 sample log entries across multiple users and environments.

## Implementation Notes

**Log Entry Display:**
- Most recent entries first (descending chronological order)
- User initials generated from name (first letter of each word, max 2 characters)
- Relative timestamps for recent entries (< 7 days): "Just now", "5m ago", "2h ago", "3d ago"
- Full timestamps for older entries: "Jan 15, 2026, 3:45 PM"
- Tooltip on hover shows full timestamp

**Environment Color Coding:**
- Development: Blue badge
- Staging: Yellow badge
- Production: Red badge

**State Visualization:**
- Shows previous state → new state with arrow
- Color-coded: Enabled (green), Disabled (gray)
- Makes it immediately clear what changed

**Filtering (Parent Component):**
While LogEntry is just the display component, a complete audit log view would include:
- Date range selector (Last 7 days, Last 30 days, Last 90 days, Custom range)
- User filter dropdown
- Toggle name search/filter
- Environment filter (Dev/Staging/Production)
- Action filter (Enabled/Disabled actions only)
- Combine multiple filters
- Show filtered count

**Export Functionality (Parent Component):**
- Export to CSV or JSON format
- Include all filtered results
- All metadata preserved (user, timestamp, etc.)

**Performance Considerations:**
- Implement pagination or infinite scroll for large datasets
- Load first 50 entries by default
- Lazy load more on scroll
- Virtual scrolling for 100+ entries

## Dependencies

- **lucide-react** — Icons (ArrowRight)
- **shadcn/ui** — UI Components
  - Install via: `npx shadcn@latest add avatar badge card`

## Integration Example

```tsx
import { LogEntry } from './components';
import type { AuditLogEntry } from './types';

const [logs, setLogs] = useState<AuditLogEntry[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  // Fetch audit logs from API
  fetchAuditLogs().then((data) => {
    setLogs(data);
    setIsLoading(false);
  });
}, []);

return (
  <div className="space-y-6">
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Audit Log
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Complete history of all feature toggle changes
      </p>
      
      {/* Filters would go here */}
      
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
      </div>
    </div>

    {isLoading ? (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    ) : logs.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">
          No changes have been made yet
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {logs.map((entry) => (
          <LogEntry key={entry.id} entry={entry} />
        ))}
      </div>
    )}
  </div>
);
```

## Complete Audit Log View Example

For a full audit log page with filtering and export:

```tsx
const [state, setState] = useState<AuditLogState>({
  entries: [],
  isLoading: true,
  error: null,
  filters: {
    dateRange: 'last7days',
  },
  totalCount: 0,
  hasMore: false,
});

const handleFilterChange = (filters: AuditLogFilters) => {
  setState((prev) => ({ ...prev, filters }));
  // Re-fetch with new filters
  fetchAuditLogs(filters);
};

const handleExport = async (format: 'csv' | 'json') => {
  const data = await exportAuditLogs({
    format,
    filters: state.filters,
  });
  // Download file
  downloadFile(data, `audit-log.${format}`);
};

return (
  <div className="space-y-6">
    {/* Header with export button */}
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Audit Log</h2>
      <Button onClick={() => handleExport('csv')}>
        Export CSV
      </Button>
    </div>

    {/* Filters */}
    <AuditLogFilters
      filters={state.filters}
      onChange={handleFilterChange}
    />

    {/* Log entries */}
    <div className="space-y-3">
      {state.entries.map((entry) => (
        <LogEntry key={entry.id} entry={entry} />
      ))}
    </div>

    {/* Pagination or Load More */}
    {state.hasMore && (
      <Button onClick={loadMore}>Load More</Button>
    )}
  </div>
);
```

## User Flows

1. **View Recent Changes**: User navigates to Audit Log → Sees most recent changes (last 7 days) → Scrolls through chronological list

2. **Filter by Date Range**: User clicks date range filter → Selects "Last 30 days" → List updates to show entries in range

3. **Find Changes by Specific User**: User clicks user filter → Selects user → List shows only that user's changes

4. **Track a Specific Feature**: User enters feature name in search → List shows only changes to that feature → Sees complete history of state changes

5. **Export Logs for Compliance**: User applies filters → Clicks "Export" → Selects CSV format → File downloads with filtered entries

6. **Investigate Production Incident**: User selects production filter → Sets date range to incident time → Reviews all production changes → Identifies which toggle changed and by whom

## Business Rules

- **Immutable Logs**: Audit entries cannot be edited or deleted (append-only)
- **Automatic Logging**: Every toggle change automatically creates a log entry
- **Required Fields**: Timestamp, user, action, toggle name, environment always captured
- **Retention Policy**: Logs retained for at least 90 days (configurable)
- **Default View**: Show last 7 days by default
- **Chronological Order**: Most recent entries first (descending)
- **Timezone**: Display times in user's local timezone
- **Access Control**: All authenticated users can view logs (not just admins)

## Edge Cases

1. **No Logs Yet**: Show empty state with "No changes have been made yet"
2. **Very Large Dataset**: Implement pagination or virtual scrolling for performance
3. **Filter Returns No Results**: Show "No logs match your filters" with clear filters button
4. **Export Large Dataset**: Warn if exporting > 1000 entries, offer to refine filters
5. **Deleted User**: Show "[User Deleted]" or last known name if user no longer exists
6. **Renamed Toggle**: Show toggle name as it was at time of change
7. **System Changes**: Mark automated changes differently (e.g., "System" as user)

See the section specification for complete details.
