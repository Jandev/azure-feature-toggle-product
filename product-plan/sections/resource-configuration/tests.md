# Resource Configuration Section — Test-Writing Instructions

These instructions are **framework-agnostic** and describe **what to test** rather than **how to test**. Adapt them to your testing framework (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

---

## Overview

Write tests for the resource configuration feature before implementing it (TDD approach). These tests ensure users can add, edit, and delete Azure App Configuration resources, test connections, handle errors gracefully, and manage multiple resources across different environments.

## Key User Flows to Test

### Flow 1: Add First Resource (Empty State)

**Given:** User has no resources configured  
**When:** User lands on the resource configuration page  
**Then:** User sees empty state card with heading "No Resources Configured"  
**And:** User sees description "Get started by adding your first Azure App Configuration resource."  
**And:** User sees button "Add Your First Resource"  
**When:** User clicks "Add Your First Resource" button  
**Then:** ResourceForm modal/page opens in "add" mode  
**And:** Form displays title "Add New Resource"  
**And:** All fields are empty except environment type (defaults to "development")  

**UI Elements to Verify:**
- Empty state card with server icon (orange background)
- Heading "No Resources Configured" displays
- Description text is present
- Button text is "Add Your First Resource" with orange background
- Form opens when button clicked

**Assertions:**
- Empty state only renders when resources array is empty
- Button is clickable and not disabled
- Clicking button triggers onAdd callback
- Form initializes with correct default values

---

### Flow 2: Add Resource with Successful Connection Test

**Given:** User is on the resource form (add mode)  
**When:** User fills in all required fields:
  - Display Name: "Development Environment"
  - Environment Type: "development" (selected)
  - Azure Resource Name: "appconfig-dev-eastus"
  - Resource Group: "rg-featuretoggle-dev"
  - Connection String: "Endpoint=https://dev.azconfig.io;Id=xxx;Secret=xxx"
**And:** User clicks "Test Connection" button  
**Then:** Button shows loading state "Testing..." with spinner  
**And:** Button is disabled during test  
**When:** Connection test succeeds  
**Then:** Success alert displays with green background  
**And:** Success alert shows checkmark icon  
**And:** Success message reads "Connection successful! Resource is accessible."  
**And:** "Test Connection" button is re-enabled  
**When:** User clicks "Add Resource" button  
**Then:** Resource is added to the list  
**And:** User returns to resource list view  
**And:** New resource card displays with all entered information  

**UI Elements to Verify:**
- All form fields render with correct labels and placeholders
- Required fields marked with red asterisk (*)
- Environment type buttons display as badges (blue/yellow/red)
- Connection string field is type="password" (masked)
- "Test Connection" button exists and is clickable
- Success alert has green border and background
- "Add Resource" button has orange background
- Cancel button is available

**Assertions:**
- Form validates required fields before submission
- Test Connection button disabled when isTesting is true
- Test result displays when testResult prop is provided
- Success state shows CheckCircle2 icon
- onTest callback receives current form data
- onSave callback receives complete form data
- Form resets/closes after successful save

---

### Flow 3: Connection Test Fails with Clear Error

**Given:** User is on the resource form with fields filled  
**When:** User clicks "Test Connection" button  
**And:** Connection test fails (invalid connection string)  
**Then:** Error alert displays with red background  
**And:** Error alert shows alert circle icon  
**And:** Error message reads "Connection failed: Invalid connection string format."  
**And:** User can correct the connection string  
**When:** User clicks "Test Connection" again  
**Then:** Button shows loading state again  
**And:** Previous error message is replaced  

**UI Elements to Verify:**
- Error alert has red border and background
- Error alert has AlertCircle icon
- Error message is visible and readable
- Form remains open and editable
- "Test Connection" button is re-enabled after error
- "Add Resource" button remains clickable (though not recommended)

**Assertions:**
- Error state renders when testResult.success is false
- Error message displays testResult.message
- User can retry test connection multiple times
- Previous test result is replaced with new result
- Form data is preserved during test failures

---

### Flow 4: Edit Existing Resource

**Given:** User has resources configured  
**And:** User is viewing the resource list  
**When:** User clicks "Edit" button on a resource card  
**Then:** ResourceForm opens in "edit" mode  
**And:** Form displays title "Edit Resource"  
**And:** All fields are pre-filled with existing resource data  
**And:** Connection string field shows masked characters  
**When:** User modifies "Display Name" to "Production Environment"  
**And:** User changes environment type to "production"  
**And:** User clicks "Test Connection" (optional)  
**And:** User clicks "Save Changes" button  
**Then:** Resource is updated in the list  
**And:** User returns to resource list view  
**And:** Updated resource card displays new information  
**And:** Production badge displays with red background  

**UI Elements to Verify:**
- Edit button has Edit icon and "Edit" text
- Form title is "Edit Resource" not "Add New Resource"
- Description text says "Update resource configuration"
- Save button text is "Save Changes" not "Add Resource"
- All form fields contain existing values
- Environment type shows currently selected option highlighted

**Assertions:**
- Form initializes with initialData prop values
- mode prop is "edit"
- onEdit callback receives resource object
- Form validation still applies to edited fields
- Save button text changes based on mode
- Updated data is passed to onSave callback

---

### Flow 5: Delete Resource

**Given:** User has resources configured  
**And:** User is viewing the resource list  
**When:** User clicks delete button (trash icon) on a resource card  
**Then:** Confirmation modal should appear (handled by parent component)  
**When:** User confirms deletion  
**Then:** Resource is removed from the list  
**And:** Resource count updates  
**And:** If last resource deleted, empty state displays again  

**UI Elements to Verify:**
- Delete button shows Trash2 icon
- Delete button has red text color (hover state)
- Button is clickable
- Resource card is removed from grid after deletion

**Assertions:**
- onDelete callback receives correct resource object
- Resource is removed from resources array
- Empty state appears when resources.length === 0
- Grid layout adjusts correctly when resource removed

---

### Flow 6: Add Multiple Resources Across Environments

**Given:** User has one resource configured (development)  
**When:** User clicks "Add New Resource" button  
**And:** User adds a staging resource  
**And:** User saves and returns to list  
**When:** User clicks "Add New Resource" button again  
**And:** User adds a production resource  
**And:** User saves and returns to list  
**Then:** Resource list displays 3 resources  
**And:** Each resource has correct environment badge color:
  - Development: Blue badge
  - Staging: Yellow badge
  - Production: Red badge
**And:** Heading shows "Azure App Configuration Resources"  
**And:** Subheading shows "Manage connections to your Azure resources"  

**UI Elements to Verify:**
- "Add New Resource" button visible in header when resources exist
- Resource cards displayed in grid (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
- Each card shows connection status icon (connected/error)
- Each card shows last tested timestamp
- Environment badges have correct colors

**Assertions:**
- Multiple resources can coexist
- Each resource has unique id
- Environment colors correctly applied based on environmentType
- Connection status icons render based on connectionStatus value
- Last tested timestamp formats correctly as locale string

---

### Flow 7: Field Validation Errors

**Given:** User is on the resource form  
**When:** User leaves display name empty  
**And:** User clicks "Add Resource" button  
**Then:** Error message displays below display name field  
**And:** Error text reads validation message (e.g., "Display name is required")  
**And:** Field has red border (border-red-500)  
**And:** Form does not submit  
**When:** User fills in display name  
**Then:** Error message disappears  
**And:** Red border is removed  

**UI Elements to Verify:**
- Error messages display below respective fields
- Error text is red (text-red-600 dark:text-red-400)
- Invalid fields have red border
- Form does not submit with validation errors
- Validation errors clear when user corrects field

**Assertions:**
- errors prop object contains field name to error message mapping
- Error message renders when errors[fieldName] exists
- Border color changes based on errors prop
- onSave callback not called when validation fails
- Required fields: displayName, resourceName, resourceGroup, connectionString
- Optional field: subscriptionId

---

## Component Interaction Tests

### ResourceList Component

**Prop: `resources`**
- When `resources` is empty array: Empty state renders
- When `resources` has items: Grid of resource cards renders
- When `resources` length is 1: Shows 1 card in grid
- When `resources` length is 3+: Shows responsive grid layout

**Prop: `onAdd`**
- When "Add Your First Resource" clicked: onAdd callback called
- When "Add New Resource" clicked: onAdd callback called
- Callback receives no parameters

**Prop: `onEdit`**
- When "Edit" button clicked: onEdit callback called once
- Callback receives the specific resource object
- Correct resource passed (verified by id)

**Prop: `onDelete`**
- When delete (trash) button clicked: onDelete callback called once
- Callback receives the specific resource object
- Correct resource passed (verified by id)

### ResourceForm Component

**Prop: `mode`**
- When `mode` is 'add': Title shows "Add New Resource", button shows "Add Resource"
- When `mode` is 'edit': Title shows "Edit Resource", button shows "Save Changes"

**Prop: `initialData`**
- When provided: All fields pre-filled with data values
- When not provided: All fields empty except environmentType defaults to 'development'

**Prop: `isTesting`**
- When true: "Test Connection" button shows "Testing..." with spinner, button disabled
- When false: Button shows "Test Connection", button enabled

**Prop: `testResult`**
- When null: No alert displays
- When testResult.success is true: Green success alert renders with CheckCircle2 icon
- When testResult.success is false: Red error alert renders with AlertCircle icon
- Alert displays testResult.message text

**Prop: `errors`**
- When errors object has field key: Error message displays below field, field has red border
- When errors object is empty: No error messages display
- Multiple fields can have errors simultaneously

**Prop: `onSave`**
- When form submitted: onSave callback receives complete ResourceFormData object
- All field values included in data
- Callback not called if form prevented default (validation fails)

**Prop: `onTest`**
- When "Test Connection" clicked: onTest callback receives current form data
- Form data includes all current field values (even if unchanged)

**Prop: `onCancel`**
- When "Cancel" button clicked: onCancel callback called
- When X (close) button clicked: onCancel callback called
- No parameters passed to callback

---

## Edge Cases

### 1. Very Long Resource Names
**Scenario:** User enters resource name with 100+ characters  
**Expected:** Text truncates with ellipsis in card view, full text visible in form  
**Assertion:** Card title has `truncate` class, full text stored in data

### 2. Connection Test Timeout
**Scenario:** Connection test takes longer than expected (30+ seconds)  
**Expected:** Error message displays: "Connection failed: Request timed out. Please check your network connection."  
**Assertion:** Timeout error handled gracefully, user can retry

### 3. Special Characters in Connection String
**Scenario:** Connection string contains semicolons, equals signs, special characters  
**Expected:** Field accepts all characters, stores correctly, masks in password field  
**Assertion:** No parsing errors, connection string stored as-is

### 4. Missing Required Fields
**Scenario:** User clicks "Add Resource" with only display name filled  
**Expected:** Multiple error messages display for all missing required fields  
**Assertion:** Validation checks all required fields, displays all errors simultaneously

### 5. Network Error During Connection Test
**Scenario:** User loses internet connection during test  
**Expected:** Error message: "Unable to connect to authentication service. Please check your internet connection."  
**Assertion:** Network errors caught and displayed with user-friendly message

### 6. Duplicate Resource Names
**Scenario:** User tries to add resource with same name as existing one  
**Expected:** Validation error (if enforced) or both resources coexist with different IDs  
**Assertion:** System handles duplicates based on business rules (allow or prevent)

### 7. Cancel Form with Unsaved Changes
**Scenario:** User fills in form, then clicks Cancel  
**Expected:** Form closes, no data saved, user returns to list unchanged  
**Assertion:** onCancel called, no onSave triggered, form data discarded

### 8. Empty Subscription ID
**Scenario:** User leaves subscription ID field empty  
**Expected:** Form accepts empty value (field is optional)  
**Assertion:** Validation passes, empty string saved for subscriptionId

---

## Sample Test Data

Use these scenarios to test different resource configurations:

### Resource 1: Development (Connected)
```json
{
  "id": "res-001",
  "displayName": "Development",
  "environmentType": "development",
  "resourceName": "appconfig-dev-eastus",
  "resourceGroup": "rg-featuretoggle-dev",
  "connectionString": "Endpoint=https://dev.azconfig.io;Id=dev-id;Secret=dev-secret",
  "subscriptionId": "12345678-1234-1234-1234-123456789abc",
  "connectionStatus": "connected",
  "lastTested": "2026-01-28T10:30:00Z"
}
```

### Resource 2: Staging (Connected)
```json
{
  "id": "res-002",
  "displayName": "Staging",
  "environmentType": "staging",
  "resourceName": "appconfig-staging-westus",
  "resourceGroup": "rg-featuretoggle-staging",
  "connectionString": "Endpoint=https://staging.azconfig.io;Id=staging-id;Secret=staging-secret",
  "subscriptionId": "12345678-1234-1234-1234-123456789abc",
  "connectionStatus": "connected",
  "lastTested": "2026-01-28T09:15:00Z"
}
```

### Resource 3: Production (Error)
```json
{
  "id": "res-003",
  "displayName": "Production",
  "environmentType": "production",
  "resourceName": "appconfig-prod-eastus2",
  "resourceGroup": "rg-featuretoggle-prod",
  "connectionString": "Endpoint=https://prod.azconfig.io;Id=prod-id;Secret=invalid",
  "subscriptionId": "12345678-1234-1234-1234-123456789abc",
  "connectionStatus": "error",
  "lastTested": "2026-01-28T08:00:00Z"
}
```

### Test Result: Success
```json
{
  "success": true,
  "message": "Connection successful! Resource is accessible."
}
```

### Test Result: Invalid Connection String
```json
{
  "success": false,
  "message": "Connection failed: Invalid connection string format."
}
```

### Test Result: Insufficient Permissions
```json
{
  "success": false,
  "message": "Connection failed: Insufficient permissions to access this resource."
}
```

### Test Result: Resource Not Found
```json
{
  "success": false,
  "message": "Connection failed: Resource not found. Please verify the resource name."
}
```

### Validation Errors
```json
{
  "displayName": "Display name is required",
  "resourceName": "Resource name must be a valid Azure resource name",
  "connectionString": "Connection string is required"
}
```

---

## Integration Points to Test

### 1. Azure App Configuration API Connection
- Form submits connection details to Azure API
- API validates connection string format
- API tests resource accessibility
- Success/failure response handled correctly

### 2. Resource Persistence
- Resources saved to database/storage after successful test
- Resource list fetched on page load
- Updated resources saved with new values
- Deleted resources removed from storage

### 3. Connection Status Updates
- Connection status tested periodically or on-demand
- Status updates reflected in UI (connected/error icons)
- Last tested timestamp updates after each test
- Status persists across page refreshes

### 4. Form State Management
- Form data updates on field change
- Form resets after successful save
- Form retains data during validation errors
- Form closes/resets on cancel

---

## Accessibility Tests

### Keyboard Navigation
- Tab key navigates through all form fields in logical order
- Enter key submits form when focus is on submit button
- Escape key closes form (if modal)
- Focus visible on all interactive elements

### Screen Reader Support
- Labels associated with inputs via htmlFor/id
- Required fields announced with "required"
- Error messages announced immediately with role="alert"
- Button states announced (e.g., "Testing, button disabled")
- Success/error alerts announced immediately

### Color Contrast
- Error text meets WCAG AA contrast (4.5:1 minimum)
- Environment badges readable in light and dark mode
- Button text readable in all states
- Disabled button states visually distinct

### Form Labels
- All inputs have visible labels
- Required fields marked visually (asterisk)
- Placeholder text provides helpful examples
- Helper text explains connection string location

---

## Done When

- [ ] All 7 key user flows have passing tests
- [ ] ResourceList component renders correctly for all prop combinations
- [ ] ResourceForm component renders correctly for all prop combinations
- [ ] Empty state displays correctly
- [ ] Form validation works for all fields
- [ ] Connection testing flow works (loading, success, error states)
- [ ] All prop callbacks are called with correct parameters
- [ ] Edge cases are covered (long names, timeouts, errors)
- [ ] Environment badge colors correct for all types
- [ ] Connection status icons display correctly
- [ ] Accessibility requirements are met
- [ ] Tests are framework-agnostic and well-documented

---

## Notes

- These tests should be written **before** implementing the resource configuration feature (TDD)
- Focus on **user behavior** and **expected outcomes**, not implementation details
- Test both **happy paths** (success) and **unhappy paths** (errors)
- Ensure tests are **deterministic** (same result every time)
- Use **mocks/stubs** for Azure API calls and external services
- Test connection testing as a separate async flow with loading states
- Verify proper cleanup when forms are cancelled or closed
