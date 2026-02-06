# Feature Toggle Dashboard Section — Test-Writing Instructions

These instructions are **framework-agnostic** and describe **what to test** rather than **how to test**. Adapt them to your testing framework (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

---

## Overview

Write tests for the feature toggle dashboard before implementing it (TDD approach). These tests ensure users can view all feature toggles, enable/disable them with proper permissions, handle production confirmations, search and filter toggles, and manage errors gracefully.

## Key User Flows to Test

### Flow 1: Admin Views Dashboard and Toggles

**Given:** User is logged in as admin  
**And:** User has selected a development resource  
**And:** Resource has 5 feature toggles  
**When:** Dashboard loads  
**Then:** User sees heading "Feature Toggles"  
**And:** User sees environment badge "Development" with blue background  
**And:** User sees toggle count "5 toggles"  
**And:** User sees 5 toggle rows rendered  
**And:** Each toggle shows name in monospace font  
**And:** Each toggle shows state badge ("Enabled" or "Disabled")  
**And:** Each toggle shows toggle switch control  
**And:** Toggle switches are enabled (admin can interact)  

**UI Elements to Verify:**
- Heading "Feature Toggles" displays
- Environment badge shows resource displayName with correct color
- Toggle count displays with correct pluralization
- Search bar with placeholder "Search toggles..." exists
- Filter buttons exist: "All", "Enabled", "Disabled"
- ToggleRow components render for each toggle
- No "Read-Only" badge displays

**Assertions:**
- Dashboard renders when toggles array has items
- currentResource prop displays in badge
- Environment color matches environmentType (development=blue)
- Number of ToggleRow components equals toggles.length
- userRole prop affects switch enabled/disabled state

---

### Flow 2: Admin Toggles Feature (Non-Production)

**Given:** User is admin viewing development dashboard  
**And:** Feature "enable_dark_mode" is currently enabled  
**When:** User clicks toggle switch for "enable_dark_mode"  
**Then:** Toggle switch immediately shows loading spinner  
**And:** Toggle switch is disabled during update  
**And:** No confirmation modal appears (non-production)  
**When:** Update succeeds  
**Then:** Toggle switch animates to disabled position  
**And:** State badge changes to "Disabled"  
**And:** "Last modified by" updates to current user name  
**And:** "Last modified" timestamp updates to current time  
**And:** Loading spinner disappears  
**And:** Toggle switch is re-enabled  

**UI Elements to Verify:**
- Toggle switch renders and is clickable
- Loading spinner (Loader2) appears on updating toggle
- Switch disabled attribute set during update
- State badge text changes based on enabled property
- Last modified info displays below toggle name

**Assertions:**
- onToggle callback called with correct toggleId and currentState (true)
- updatingToggleId prop controls loading state
- isUpdating prop passed to ToggleRow makes switch disabled
- Toggle enabled property changes after successful update
- lastModifiedBy and lastModifiedAt update

---

### Flow 3: Admin Toggles Feature in Production (Requires Confirmation)

**Given:** User is admin viewing production dashboard  
**And:** User sees production warning banner at top  
**And:** Warning reads "Production Environment" and "Changes to toggles will affect live users"  
**When:** User clicks toggle switch for "new_checkout_flow" (currently disabled)  
**Then:** ProductionConfirmation modal opens  
**And:** Modal title shows "Production Environment"  
**And:** Modal shows warning icon (AlertTriangle)  
**And:** Modal displays feature name "new_checkout_flow" in monospace font  
**And:** Modal shows state transition "Disabled → Enabled" with arrow  
**And:** Modal shows checkbox "I understand this change will affect live users in production"  
**And:** "Confirm Change" button is disabled  
**When:** User checks the confirmation checkbox  
**Then:** "Confirm Change" button becomes enabled  
**And:** Button has red background  
**When:** User clicks "Confirm Change"  
**Then:** Modal closes  
**And:** Toggle update proceeds (loading, then success)  
**And:** Toggle switch changes to enabled position  

**UI Elements to Verify:**
- Production warning banner displays when environmentType is 'production'
- Warning has red background and AlertCircle icon
- ProductionConfirmation modal renders when isOpen is true
- Modal shows feature toggle name
- Modal shows current and new states with visual badges
- Confirmation checkbox must be checked before confirm button enables
- "Cancel" button available in modal
- Modal closes when user clicks cancel or confirm

**Assertions:**
- currentResource.environmentType === 'production' triggers modal flow
- onToggle initially called with toggle details (opens modal instead of updating)
- Modal receives correct toggleName, currentState, newState props
- Checkbox state controls "Confirm Change" button disabled attribute
- onConfirm callback called when user confirms
- Actual toggle update happens after confirmation (not before)

---

### Flow 4: Read-Only User Views Dashboard

**Given:** User is logged in with read-only role  
**When:** Dashboard loads  
**Then:** User sees heading "Feature Toggles"  
**And:** User sees "Read-Only" badge in header  
**And:** All toggle switches are visible but disabled  
**And:** Toggle switches appear grayed out  
**When:** User hovers over a toggle switch  
**Then:** Tooltip displays "You have read-only access"  
**And:** User cannot click or change toggle state  

**UI Elements to Verify:**
- "Read-Only" badge displays when userRole is 'read-only'
- Badge has secondary variant with gray background
- All ToggleRow components receive userRole='read-only'
- Toggle switches have disabled attribute
- Switches have reduced opacity or gray appearance
- Tooltip or title attribute on switches explains read-only access

**Assertions:**
- userRole prop controls badge visibility
- userRole='read-only' disables all toggle switches
- onToggle callback never called for read-only users
- Search and filter controls remain functional for read-only users

---

### Flow 5: Search for Toggles

**Given:** Dashboard displays 10 feature toggles  
**And:** User wants to find toggle "enable_analytics"  
**When:** User types "analytics" in search bar  
**Then:** Toggle list filters to show only "enable_analytics"  
**And:** Toggle count updates to "1 toggle"  
**And:** Other toggles are hidden  
**When:** User clears search (clicks X icon)  
**Then:** All 10 toggles display again  
**And:** Toggle count updates to "10 toggles"  

**UI Elements to Verify:**
- Search input exists with Search icon
- X (clear) icon appears when search query exists
- X icon disappears when search is empty
- Filtered toggles render based on search query
- Toggle count updates dynamically
- Search is case-insensitive

**Assertions:**
- Search filters by toggle name (toggle.name)
- Filter is case-insensitive (toLowerCase comparison)
- Search updates in real-time as user types
- Clear button resets search query to empty string
- Filtered count matches number of visible toggles

---

### Flow 6: Filter Toggles by State

**Given:** Dashboard displays 10 toggles (6 enabled, 4 disabled)  
**When:** User clicks "Enabled" filter button  
**Then:** Filter button highlights with orange background  
**And:** Toggle list shows only 6 enabled toggles  
**And:** Toggle count shows "6 toggles"  
**When:** User clicks "Disabled" filter button  
**Then:** "Enabled" filter de-highlights  
**And:** "Disabled" filter highlights with orange background  
**And:** Toggle list shows only 4 disabled toggles  
**And:** Toggle count shows "4 toggles"  
**When:** User clicks "All" filter button  
**Then:** "Disabled" filter de-highlights  
**And:** "All" filter highlights  
**And:** All 10 toggles display  
**And:** Toggle count shows "10 toggles"  

**UI Elements to Verify:**
- Filter buttons exist in border-wrapped group: "All", "Enabled", "Disabled"
- Active filter has orange background
- Inactive filters have gray text
- Filter updates toggle list immediately
- Toggle count reflects filtered results

**Assertions:**
- filter state controls which toggles display
- filter='all' shows all toggles
- filter='enabled' shows only toggle.enabled === true
- filter='disabled' shows only toggle.enabled === false
- Search and filter work together (combine both filters)

---

### Flow 7: Toggle Update Fails

**Given:** User is admin on development dashboard  
**When:** User clicks toggle switch for "experimental_feature"  
**And:** API request fails (network error or server error)  
**Then:** Toggle switch stops loading  
**And:** Toggle switch reverts to original position  
**And:** Error notification/toast displays  
**And:** Error message reads "Failed to update toggle: [error details]"  
**And:** User can try again  

**UI Elements to Verify:**
- Loading spinner appears during update
- Error state handled gracefully (no crash)
- Toggle reverts to original state on error
- User can reattempt toggle after failure

**Assertions:**
- updatingToggleId set to toggle.id during update
- On error, updatingToggleId set back to null
- Toggle enabled state does not change on error
- Error message displayed to user (toast, alert, or other)
- onToggle can be called again after error

---

## Component Interaction Tests

### Dashboard Component

**Prop: `toggles`**
- When `toggles` is empty array: Empty state renders
- When `toggles` has items: List of ToggleRow components renders
- When `toggles` length is 10: Shows 10 ToggleRow components

**Prop: `currentResource`**
- Badge displays currentResource.displayName
- Badge color matches currentResource.environmentType
- Production warning shows when environmentType is 'production'

**Prop: `userRole`**
- When 'admin': No "Read-Only" badge, switches enabled
- When 'read-only': "Read-Only" badge displays, switches disabled

**Prop: `isLoading`**
- When true: Loading skeletons render (5 placeholder cards)
- When false and toggles exist: Real toggle list renders
- When false and toggles empty: Empty state renders

**Prop: `error`**
- When error is null: Normal dashboard renders
- When error has value: Error state renders with message
- Error state shows AlertCircle icon and error text

**Prop: `updatingToggleId`**
- When null: All toggle switches enabled (except read-only)
- When set to specific id: That toggle shows loading spinner, switch disabled
- Other toggles remain interactive

**Prop: `onToggle`**
- When toggle switch clicked: onToggle called with (toggleId, currentState)
- Receives correct toggle id
- Receives correct current state (boolean)
- Called once per click (not multiple times)

### ToggleRow Component

**Prop: `toggle`**
- Displays toggle.name in monospace font
- Displays toggle.description if provided
- Shows "Enabled" badge when toggle.enabled is true
- Shows "Disabled" badge when toggle.enabled is false
- Displays toggle.lastModifiedBy if provided
- Displays toggle.lastModifiedAt formatted if provided

**Prop: `userRole`**
- When 'admin': Toggle switch enabled
- When 'read-only': Toggle switch disabled with tooltip

**Prop: `isUpdating`**
- When true: Switch shows Loader2 spinner, switch disabled
- When false: Switch enabled (unless read-only)

**Prop: `onToggle`**
- When switch clicked: onToggle called with (toggle.id, toggle.enabled)
- Not called if switch disabled (read-only or updating)

### ProductionConfirmation Component

**Prop: `isOpen`**
- When true: Modal renders and displays
- When false: Modal hidden/unmounted

**Prop: `toggleName`**
- Displays in modal as feature name in monospace font

**Prop: `currentState` and `newState`**
- Shows state transition with arrow (→)
- Current state badge color matches state (green=enabled, gray=disabled)
- New state badge color matches state

**Prop: `onConfirm`**
- When "Confirm Change" clicked and checkbox checked: onConfirm called
- Not called if checkbox not checked
- Not called if "Cancel" clicked

**Prop: `onCancel`**
- When "Cancel" button clicked: onCancel called
- When dialog closed (X or outside click): onCancel called
- Checkbox state resets to unchecked

---

## Edge Cases

### 1. No Toggles in Resource
**Scenario:** Resource exists but has no feature toggles configured  
**Expected:** Empty state displays: "No Feature Toggles" with message about adding in Azure Portal  
**Assertion:** Empty state shows when toggles.length === 0 and !isLoading and !error

### 2. Very Long Toggle Names
**Scenario:** Toggle name is 100+ characters  
**Expected:** Name wraps to multiple lines or truncates with ellipsis  
**Assertion:** Layout remains intact, no overflow issues

### 3. Toggle with No Description
**Scenario:** Toggle object has undefined or empty description  
**Expected:** Description section not rendered, toggle displays without spacing issues  
**Assertion:** Optional description handled gracefully

### 4. Toggle with No Last Modified Info
**Scenario:** Toggle has no lastModifiedBy or lastModifiedAt  
**Expected:** Last modified section not displayed or shows "Never modified"  
**Assertion:** Optional metadata handled gracefully

### 5. Rapid Toggle Clicks
**Scenario:** User clicks toggle multiple times quickly  
**Expected:** Only first click processed, subsequent clicks ignored while updating  
**Assertion:** onToggle called once, switch disabled until update completes

### 6. Search Returns No Results
**Scenario:** User searches for "xyz" but no toggles match  
**Expected:** Shows "No toggles match your search criteria" with "Clear Filters" button  
**Assertion:** Empty result state distinct from empty toggles state

### 7. Production Confirmation Cancelled
**Scenario:** User opens production modal, then clicks "Cancel"  
**Expected:** Modal closes, toggle state unchanged, no API call made  
**Assertion:** onCancel called, modal closes, toggle remains in original state

### 8. Combined Search and Filter
**Scenario:** User searches "feature" AND filters by "Enabled"  
**Expected:** Shows only enabled toggles that contain "feature" in name  
**Assertion:** Both filters apply simultaneously, count reflects combined filter

### 9. Loading State on Initial Load
**Scenario:** Dashboard first renders while fetching toggles  
**Expected:** Shows 5 loading skeleton cards, no error or empty state  
**Assertion:** isLoading prop shows skeletons, prevents premature empty state

### 10. Error Loading Toggles
**Scenario:** API fails to fetch toggles (network error, auth error)  
**Expected:** Error state displays with heading "Failed to Load Toggles" and error message  
**Assertion:** error prop triggers error state, shows AlertCircle icon and message

---

## Sample Test Data

Use these scenarios to test different dashboard states:

### Toggle 1: Enabled Feature
```json
{
  "id": "toggle-001",
  "name": "enable_dark_mode",
  "description": "Allows users to switch to dark theme",
  "enabled": true,
  "lastModifiedBy": "Sarah Chen",
  "lastModifiedAt": "2026-01-28T14:30:00Z"
}
```

### Toggle 2: Disabled Feature
```json
{
  "id": "toggle-002",
  "name": "experimental_checkout",
  "description": "New checkout flow with one-click purchase",
  "enabled": false,
  "lastModifiedBy": "Michael Rodriguez",
  "lastModifiedAt": "2026-01-27T09:15:00Z"
}
```

### Toggle 3: No Metadata
```json
{
  "id": "toggle-003",
  "name": "beta_analytics_dashboard",
  "enabled": false
}
```

### Development Resource
```json
{
  "id": "res-001",
  "displayName": "Development",
  "environmentType": "development"
}
```

### Production Resource
```json
{
  "id": "res-003",
  "displayName": "Production",
  "environmentType": "production"
}
```

### Dashboard State: Loading
```json
{
  "toggles": [],
  "currentResource": {"id": "res-001", "displayName": "Development", "environmentType": "development"},
  "userRole": "admin",
  "isLoading": true,
  "error": null,
  "updatingToggleId": null
}
```

### Dashboard State: Error
```json
{
  "toggles": [],
  "currentResource": {"id": "res-001", "displayName": "Development", "environmentType": "development"},
  "userRole": "admin",
  "isLoading": false,
  "error": "Failed to connect to Azure App Configuration. Please check your connection settings.",
  "updatingToggleId": null
}
```

### Dashboard State: Normal with 3 Toggles
```json
{
  "toggles": [
    {"id": "toggle-001", "name": "feature_a", "enabled": true},
    {"id": "toggle-002", "name": "feature_b", "enabled": false},
    {"id": "toggle-003", "name": "feature_c", "enabled": true}
  ],
  "currentResource": {"id": "res-001", "displayName": "Staging", "environmentType": "staging"},
  "userRole": "admin",
  "isLoading": false,
  "error": null,
  "updatingToggleId": null
}
```

---

## Integration Points to Test

### 1. Toggle State Update API
- onToggle callback triggers API call to Azure App Configuration
- API receives toggle ID and new state
- API updates feature flag in Azure
- Success response updates local toggle state
- Failure response reverts toggle and shows error

### 2. Production Confirmation Flow
- Check if currentResource.environmentType === 'production'
- If production, open modal before API call
- If non-production, proceed directly with API call
- Modal confirmation required before update proceeds

### 3. Real-Time State Updates
- Toggle state updates immediately in UI (optimistic)
- If API fails, revert to previous state
- Last modified info updates after successful change
- Other users see changes after refresh (polling or websocket)

### 4. Search and Filter Logic
- Search filters by toggle name (case-insensitive substring match)
- State filter checks toggle.enabled property
- Filters combine (AND logic)
- Filtered count updates dynamically

---

## Accessibility Tests

### Keyboard Navigation
- Tab key navigates through search input, filter buttons, toggle switches
- Enter/Space toggles switch when focused (admin only)
- Arrow keys navigate through filter button group
- Escape key closes production modal

### Screen Reader Support
- Toggle switches have accessible labels (e.g., "Toggle enable_dark_mode")
- Current state announced: "enabled" or "disabled"
- Loading state announced: "Updating toggle"
- Production warning announced with role="alert"
- Modal title and description announced when opened

### Color Contrast
- Badge text meets WCAG AA contrast in all environments
- Toggle switch visible in light and dark mode
- Disabled switches visually distinct from enabled
- Filter button states clear and distinguishable

### Focus Management
- Focus visible on all interactive elements
- Focus moves to modal when opened
- Focus returns to toggle switch when modal closed
- Focus not trapped outside modal when modal open

---

## Done When

- [ ] All 7 key user flows have passing tests
- [ ] Dashboard component renders correctly for all states (loading, error, empty, populated)
- [ ] ToggleRow component renders correctly for all prop combinations
- [ ] ProductionConfirmation modal works correctly
- [ ] Admin users can toggle features
- [ ] Read-only users see disabled switches
- [ ] Production environment requires confirmation
- [ ] Search filters toggles by name
- [ ] State filter works (All/Enabled/Disabled)
- [ ] Combined search and filter works
- [ ] Toggle updates handle success and error
- [ ] Loading states display correctly
- [ ] Toggle count displays correct pluralization
- [ ] Environment badges show correct colors
- [ ] Edge cases covered
- [ ] Accessibility requirements met
- [ ] Tests are framework-agnostic and well-documented

---

## Notes

- These tests should be written **before** implementing the dashboard feature (TDD)
- Focus on **user behavior** and **expected outcomes**, not implementation details
- Test both **happy paths** (success) and **unhappy paths** (errors)
- Ensure tests are **deterministic** (same result every time)
- Use **mocks/stubs** for Azure API calls
- Test production confirmation flow separately from regular toggle flow
- Verify proper state management during async operations
- Test that optimistic updates revert on error
