# Milestone 4: Feature Toggle Dashboard

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation), Milestone 2 (Authentication), Milestone 3 (Resource Configuration) complete

## Goal

Implement the feature toggle dashboard — the core functionality for viewing and managing feature flags with role-based access control.

## Overview

The feature toggle dashboard allows users to view and manage feature flags for the currently selected App Configuration resource. Toggles can be enabled/disabled with a single click (if user has admin permissions). Read-only users see the same UI but with disabled controls. Production environment changes require explicit confirmation.

**Key Functionality:**
- View all feature flags for the current Azure resource
- Enable/disable toggles with a single click (admin only)
- Search feature toggles by name
- Filter toggles by state (all/enabled/disabled)
- Display last modified by and timestamp for each toggle
- Show production warning and require confirmation for production changes
- Display disabled toggle switches for read-only users
- Handle empty state when no toggles exist

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/feature-toggle-dashboard/tests.md` for detailed test-writing instructions including:
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

Copy the section components from `product-plan/sections/feature-toggle-dashboard/components/`:

- `Dashboard.tsx` — Main dashboard with search, filter, and toggle list
- `ToggleRow.tsx` — Individual toggle row with switch and metadata
- `ProductionConfirmation.tsx` — Confirmation modal for production changes

**Props Interfaces:**

```typescript
// Dashboard
interface DashboardProps {
  toggles: FeatureToggle[];
  currentResource: {
    id: string;
    displayName: string;
    environmentType: EnvironmentType;
  };
  userRole: UserRole;
  onToggleChange: (toggleId: string, newState: boolean) => Promise<void>;
}

// ProductionConfirmation
interface ProductionConfirmationProps {
  isOpen: boolean;
  toggleName: string;
  currentState: boolean;
  newState: boolean;
  onConfirm: (confirmed: boolean) => void;
  onCancel: () => void;
}
```

### Data Layer

The components expect these data shapes (from `types.ts`):

```typescript
type UserRole = 'read-only' | 'admin';
type EnvironmentType = 'development' | 'staging' | 'production';

interface FeatureToggle {
  id: string;
  name: string; // Feature key/name
  description?: string;
  enabled: boolean;
  lastModifiedBy?: string;
  lastModifiedAt?: string; // ISO 8601 timestamp
}
```

You'll need to:
- Fetch toggles from Azure App Configuration using the Azure SDK
- Store current resource selection (from Milestone 3)
- Get user role from authentication state (from Milestone 2)
- Call Azure APIs to enable/disable feature flags
- Create audit log entries for each toggle change

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onToggleChange` | Called when user clicks toggle switch (admin only). Should update the toggle in Azure, create audit log entry, return promise. |
| `onConfirm` | (ProductionConfirmation) Called when user confirms production change with checkbox. |
| `onCancel` | (ProductionConfirmation) Called when user cancels production change. |

### Backend Integration

**Fetch Toggles:**

- `GET /api/resources/:resourceId/toggles` — Fetch all feature flags for a resource
  - Use Azure App Configuration SDK
  - Return array of FeatureToggle objects

**Update Toggle:**

- `PUT /api/resources/:resourceId/toggles/:toggleId` — Enable or disable a toggle
  - Use Azure SDK to update the feature flag
  - Create audit log entry (see Milestone 5 data structure)
  - Return updated toggle with new timestamp and user

**Role-Based Access:**

- Admin users can call the update endpoint
- Read-only users should see 403 Forbidden if they attempt updates
- Frontend enforces this by disabling toggle switches for read-only users

### Production Safety

**Confirmation Modal:**

When user attempts to change a toggle in a production environment:

1. Show confirmation modal with:
   - Toggle name
   - Current state → New state
   - Checkbox: "I understand this will affect production"
   - Warning styling (red/orange)
2. User must check the checkbox to enable the "Confirm" button
3. Only proceed with change if user confirms

### Search and Filter

**Search:**
- Filter toggles by name (case-insensitive substring match)
- Update in real-time as user types

**Filter:**
- All toggles (default)
- Enabled only
- Disabled only

### Empty States

Implement empty state UI for when no records exist yet:

- **No toggles in resource:** Show message "No Feature Toggles Found" with explanation "This resource doesn't have any feature flags configured yet. Add feature flags in Azure App Configuration to manage them here."
- **No search results:** Show "No toggles match your search" with option to clear search
- **No filtered results:** Show "No [enabled/disabled] toggles" with option to clear filter

The Dashboard component includes empty state design — make sure to render it when appropriate.

## Files to Reference

- `product-plan/sections/feature-toggle-dashboard/README.md` — Feature overview and design intent
- `product-plan/sections/feature-toggle-dashboard/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/feature-toggle-dashboard/components/` — React components
- `product-plan/sections/feature-toggle-dashboard/types.ts` — TypeScript interfaces
- `product-plan/sections/feature-toggle-dashboard/sample-data.json` — Test data

## Expected User Flows

When fully implemented, users should be able to complete these flows:

### Flow 1: Admin Enables Toggle in Development

1. Admin user navigates to dashboard
2. User sees list of feature toggles for current resource (Development)
3. User clicks toggle switch for "new-checkout-flow" (currently disabled)
4. **Outcome:** Toggle immediately switches to enabled (green), API call updates Azure, last modified shows admin's name and timestamp

### Flow 2: Admin Enables Toggle in Production (with Confirmation)

1. Admin user selects Production resource from resource switcher
2. User sees list of feature toggles with production warning banner
3. User clicks toggle switch for "ai-recommendations" (currently disabled)
4. **Outcome:** Confirmation modal appears with message "Are you sure you want to enable ai-recommendations in Production?" and checkbox "I understand this will affect production"
5. User checks the checkbox
6. User clicks "Confirm" button
7. **Outcome:** Toggle is enabled, modal closes, toggle shows as enabled in the list

### Flow 3: Read-Only User Views Dashboard

1. Read-only user navigates to dashboard
2. User sees list of feature toggles for current resource
3. All toggle switches are disabled (greyed out)
4. User hovers over a toggle switch
5. **Outcome:** Tooltip or message indicates "You have read-only access. Contact an administrator to modify toggles."

### Flow 4: Search for Specific Toggle

1. User sees 10 toggles in the list
2. User types "checkout" in search box
3. **Outcome:** List filters to show only "new-checkout-flow" toggle (1 result)
4. User clears search
5. **Outcome:** Full list of 10 toggles returns

### Flow 5: Filter Enabled Toggles Only

1. User clicks filter dropdown and selects "Enabled"
2. **Outcome:** List shows only enabled toggles (5 out of 10)
3. User selects "All" filter
4. **Outcome:** Full list returns

### Flow 6: Empty State - No Toggles

1. User selects a newly configured resource with no feature flags
2. **Outcome:** Empty state appears with message "No Feature Toggles Found" and explanation "This resource doesn't have any feature flags configured yet."

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] Dashboard displays all toggles for current resource
- [ ] Toggle switches work for admin users (enable/disable with click)
- [ ] Toggle switches are disabled for read-only users
- [ ] Production confirmation modal appears for production environment changes
- [ ] Production modal requires checkbox before confirming
- [ ] Search filters toggles by name in real-time
- [ ] Filter dropdown works (all/enabled/disabled)
- [ ] Last modified by and timestamp display for each toggle
- [ ] Empty state shows when no toggles exist
- [ ] Empty state shows when search/filter returns no results
- [ ] Each toggle change creates an audit log entry (backend)
- [ ] Matches the visual design
- [ ] Responsive on mobile
