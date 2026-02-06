# Feature Toggle Dashboard Section

View and manage feature flags from Azure App Configuration.

## Overview

The Feature Toggle Dashboard is the main interface where users view and manage feature flags from the currently selected Azure App Configuration resource. Users can enable/disable toggles with a single click, search and filter flags, and see the current state of all features. The interface respects user permissions - read-only users see disabled controls while admin users can make changes.

## Components

### Dashboard
Main view showing all feature toggles from the selected resource.

**Features:**
- Current resource indicator with environment badge
- Search bar (filter by feature name)
- Filter controls (show all/enabled/disabled)
- List of feature toggles with real-time state
- Production environment warning for admins
- Read-only badge for non-admin users
- Toggle count display
- Empty state when no toggles exist
- Error state with clear messaging
- Loading skeletons

**Props:**
- `toggles` — Array of FeatureToggle objects
- `currentResource` — Current resource info (id, displayName, environmentType)
- `userRole` — 'read-only' | 'admin'
- `isLoading` — Boolean indicating data fetch in progress
- `error` — Error message string or null
- `updatingToggleId` — ID of toggle currently being updated (for loading state)
- `onToggle` — Callback when user toggles a feature (receives toggleId and currentState)

### ToggleRow
Individual row/card displaying a single feature toggle.

**Features:**
- Toggle switch (enabled/disabled state)
- Feature name (monospace font)
- State badge (Enabled/Disabled)
- Optional description
- Last modified by and timestamp
- Loading spinner when updating
- Disabled state for read-only users with tooltip
- Hover effects and focus states
- Responsive layout (mobile/desktop)

**Props:**
- `toggle` — FeatureToggle object
- `userRole` — 'read-only' | 'admin'
- `isUpdating` — Boolean indicating update in progress
- `onToggle` — Callback when toggle is clicked (receives toggleId and currentState)

### ProductionConfirmation
Modal dialog confirming production toggle changes.

**Features:**
- Warning icon and title
- Clear message about affecting live users
- Feature name display
- State transition visualization (Enabled → Disabled or vice versa)
- Confirmation checkbox ("I understand this will affect live users")
- Confirm button (disabled until checkbox checked)
- Cancel button
- Red color scheme for emphasis

**Props:**
- `isOpen` — Boolean controlling modal visibility
- `toggleName` — Name of the feature being changed
- `currentState` — Current enabled/disabled state
- `newState` — New enabled/disabled state
- `onConfirm` — Callback when user confirms
- `onCancel` — Callback when user cancels

## Data Types

See `types.ts` for complete interface definitions:
- `FeatureToggle` — Feature flag with id, name, description, enabled state, metadata
- `DashboardState` — Complete dashboard state including toggles, loading, error, filters
- `ToggleChangeRequest` — Request object for changing a toggle
- `ToggleChangeResult` — Result of toggle change operation
- `ConfirmationModalState` — State for production confirmation modal
- `UserRole` — 'read-only' | 'admin'
- `EnvironmentType` — 'development' | 'staging' | 'production'

See `sample-data.json` for test data with 10 sample toggles and various states.

## Implementation Notes

**Toggle Flow (Non-Production):**
1. User clicks toggle switch
2. Optimistically update UI (show loading on that toggle)
3. Make API call to Azure App Configuration
4. On success: Update toggle state, show success toast, update "last modified"
5. On error: Revert to original state, show error toast

**Toggle Flow (Production):**
1. User clicks toggle switch
2. Show ProductionConfirmation modal
3. User checks "I understand" and clicks Confirm
4. Proceed with same flow as non-production

**Permission Handling:**
- Read-only users: Toggle switches are visible but disabled with grayed-out appearance
- Tooltip on hover explains "You have read-only access"
- Admin users: Full interactive toggle switches

**Search and Filter:**
- Search: Real-time filtering by feature name (case-insensitive)
- Filter: Show All / Enabled Only / Disabled Only
- Filters can be combined
- Show count of filtered results
- "No results" message with clear filters button

**Environment Color Coding:**
- Development: Blue badge
- Staging: Yellow badge
- Production: Red badge + warning banner

## Dependencies

- **lucide-react** — Icons (Search, X, Server, AlertCircle, Loader2, ArrowRight, AlertTriangle)
- **shadcn/ui** — UI Components
  - Dashboard: `npx shadcn@latest add badge button input`
  - ToggleRow: `npx shadcn@latest add card`
  - ProductionConfirmation: `npx shadcn@latest add button dialog`

## Integration Example

```tsx
const [dashboardState, setDashboardState] = useState<DashboardState>({
  toggles: [],
  isLoading: true,
  error: null,
  currentResource: {
    id: 'res-001',
    displayName: 'Production',
    environmentType: 'production',
  },
  userRole: 'admin',
  searchQuery: '',
  filter: 'all',
});

const [updatingToggleId, setUpdatingToggleId] = useState<string | null>(null);
const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
  isOpen: false,
  toggle: null,
  isConfirmed: false,
});

const handleToggle = async (toggleId: string, currentState: boolean) => {
  const toggle = dashboardState.toggles.find((t) => t.id === toggleId);
  if (!toggle) return;

  // Check if production confirmation needed
  if (dashboardState.currentResource.environmentType === 'production') {
    setConfirmationModal({
      isOpen: true,
      toggle: {
        toggleId,
        toggleName: toggle.name,
        currentState,
        newState: !currentState,
        requiresConfirmation: true,
      },
      isConfirmed: false,
    });
    return;
  }

  // Proceed with toggle
  await performToggle(toggleId, !currentState);
};

const performToggle = async (toggleId: string, newState: boolean) => {
  setUpdatingToggleId(toggleId);
  
  try {
    // Update in Azure App Configuration
    await updateFeatureToggle(toggleId, newState);
    
    // Update local state
    setDashboardState((prev) => ({
      ...prev,
      toggles: prev.toggles.map((t) =>
        t.id === toggleId
          ? {
              ...t,
              enabled: newState,
              lastModifiedBy: currentUser.name,
              lastModifiedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
    
    // Show success toast
    toast.success('Feature toggle updated successfully');
  } catch (error) {
    // Show error toast
    toast.error('Failed to update toggle: ' + error.message);
  } finally {
    setUpdatingToggleId(null);
  }
};

return (
  <>
    <Dashboard
      toggles={dashboardState.toggles}
      currentResource={dashboardState.currentResource}
      userRole={dashboardState.userRole}
      isLoading={dashboardState.isLoading}
      error={dashboardState.error}
      updatingToggleId={updatingToggleId}
      onToggle={handleToggle}
    />
    
    {confirmationModal.toggle && (
      <ProductionConfirmation
        isOpen={confirmationModal.isOpen}
        toggleName={confirmationModal.toggle.toggleName}
        currentState={confirmationModal.toggle.currentState}
        newState={confirmationModal.toggle.newState}
        onConfirm={() => {
          performToggle(
            confirmationModal.toggle!.toggleId,
            confirmationModal.toggle!.newState
          );
          setConfirmationModal({ isOpen: false, toggle: null, isConfirmed: false });
        }}
        onCancel={() => {
          setConfirmationModal({ isOpen: false, toggle: null, isConfirmed: false });
        }}
      />
    )}
  </>
);
```

## User Flows

1. **Admin Enables Feature (Non-Production)**: User clicks toggle → Switch animates → Success notification → "Last modified" updates

2. **Admin Enables Feature (Production)**: User clicks toggle → Confirmation modal appears → User checks "I understand" → Clicks Confirm → Toggle updates → Success notification

3. **Read-Only User Views Dashboard**: User sees toggles → Toggle switches are disabled/grayed out → Hover shows "You have read-only access" tooltip → Can search and filter normally

4. **Search for Specific Toggle**: User types in search bar → List filters in real-time → Shows matching results with count

5. **Filter by State**: User clicks filter (Enabled/Disabled) → List updates to show only matching toggles

6. **Toggle Change Fails**: Admin clicks toggle → Request fails → Toggle reverts to original state → Error notification with retry option

See the section specification for complete flow details.
