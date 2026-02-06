# Azure Feature Toggle Tool — Complete Implementation Instructions

> **Implementation Approach:** One-shot (all milestones in one session)
> **Provide alongside:** `product-overview.md` for full product context

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Implementation Overview

This product consists of **5 milestones**:

1. **Foundation** — Design tokens, data model, routing, application shell
2. **Authentication** — Azure AD login, role-based access control
3. **Resource Configuration** — CRUD for Azure App Configuration resources
4. **Feature Toggle Dashboard** — Core toggle management with role-based UI
5. **Audit Log** — Change tracking and filtering

All instructions are combined below for complete implementation in one session.

---

# Milestone 1: Foundation

## Goal

Set up the foundational elements: design tokens, data model types, routing structure, and application shell.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

**Colors:**
- Primary: Orange (Tailwind `orange`)
- Secondary: Slate (Tailwind `slate`)  
- Neutral: Stone (Tailwind `stone`)

**Typography:**
- Heading: Outfit (Google Fonts)
- Body: Outfit (Google Fonts)
- Mono: JetBrains Mono (Google Fonts)

**Setup Instructions:**

See `product-plan/design-system/tokens.css` for CSS custom properties.

See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration examples.

See `product-plan/design-system/fonts.md` for Google Fonts import code.

### 2. Data Model Types

Create TypeScript interfaces for your core entities:

**Core Entities:**
- `User` — Users with role-based permissions (read-only or admin)
- `AppConfigResource` — Azure App Configuration resources
- `FeatureToggle` — Feature flags within resources
- `AuditLogEntry` — Change history records

See `product-plan/data-model/types.ts` for complete interface definitions.

See `product-plan/data-model/README.md` for entity relationships and design decisions.

Use `product-plan/data-model/sample-data.json` for testing before real APIs are built.

### 3. Routing Structure

Create routes for each section:

- `/` or `/dashboard` → Feature Toggle Dashboard
- `/resources` → Resource Configuration
- `/audit-log` → Audit Log
- `/settings` → Settings (placeholder for now)
- `/login` → Authentication (if separate page)

### 4. Application Shell

The application shell provides persistent navigation and layout structure.

**Copy shell components from `product-plan/shell/components/`:**

- `AppShell.tsx` — Main layout wrapper with sidebar and top nav
- `TopNav.tsx` — Header with logo, resource switcher, user menu
- `Sidebar.tsx` — Collapsible navigation sidebar
- `ResourceSwitcher.tsx` — Dropdown to switch between Azure resources
- `UserMenu.tsx` — User info and logout dropdown

**Wire Up Navigation:**

The Sidebar component expects navigation items. Connect these to your routing:

1. **Dashboard** (home icon) → Feature Toggle Dashboard (`/` or `/dashboard`)
2. **Resources** (server icon) → Resource Configuration (`/resources`)
3. **Audit Log** (list icon) → View change history (`/audit-log`)
4. **Settings** (gear icon) → User settings (`/settings`)

**Resource Switcher Integration:**

The ResourceSwitcher expects:
- `currentResource` — Currently selected Azure App Configuration resource
- `resources` — Array of all configured resources
- `onResourceChange` — Callback when user switches resource

You'll need to:
- Fetch configured resources from your backend
- Store the currently selected resource (global state or context)
- Handle resource switching (update state, refetch toggles)

**User Menu Integration:**

The UserMenu expects:
- `userName` — Current user's name
- `userEmail` — Current user's email
- `userRole` — Either `'read-only'` or `'admin'`
- `onLogout` — Callback to sign out

Connect this to your authentication system.

**Sidebar Collapse State:**

The sidebar collapse state persists to localStorage. The AppShell component handles this automatically.

**Responsive Behavior:**

On mobile (<768px), the sidebar becomes an overlay/drawer. The shell components handle this automatically.

## Files to Reference

- `product-plan/design-system/` — Design tokens
- `product-plan/data-model/` — Type definitions and sample data
- `product-plan/shell/README.md` — Shell design intent and specifications
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts applied globally)
- [ ] Data model types are defined in your codebase
- [ ] Routes exist for all sections (can be placeholder pages for now)
- [ ] Shell renders with correct branding and layout
- [ ] Sidebar navigation links to correct routes
- [ ] Active section is highlighted in sidebar
- [ ] Resource switcher displays (even if empty/"No resources configured")
- [ ] User menu shows current user info
- [ ] Sidebar collapse/expand works and persists
- [ ] Responsive on mobile (sidebar becomes drawer)
- [ ] Shell works in both light and dark mode

---

# Milestone 2: Authentication

## Goal

Implement user authentication with Azure AD / Microsoft login and role-based access control (read-only vs. admin).

## Overview

The authentication section handles user login and establishes their identity and permissions within the Azure Feature Toggle Tool. This is the entry point to the application and determines whether users have read-only or read-write access to feature toggles.

**Key Functionality:**
- User login with Microsoft / Azure AD authentication
- Retrieve user identity and role (read-only or admin)
- Display authentication states (loading, success, error)
- Session management and expiry handling
- Redirect to dashboard after successful login

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/authentication/tests.md` for detailed test-writing instructions including:
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

Copy the section component from `product-plan/sections/authentication/components/`:

- `LoginScreen.tsx` — Login UI with Microsoft sign-in button and state handling

**Props Interface:**

```typescript
interface LoginScreenProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  successMessage?: string;
  onLogin: () => void;
}
```

### Data Layer

The component expects these data shapes (from `types.ts`):

```typescript
type UserRole = 'read-only' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthenticationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;
}
```

You'll need to:
- Set up Azure AD / Microsoft OAuth integration
- Create API endpoint to exchange auth code for user info
- Fetch user role from your database or identity provider
- Store authentication state globally (Context, Redux, Zustand, etc.)
- Handle session storage and expiry

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onLogin` | Called when user clicks "Sign in with Microsoft". Should initiate OAuth flow. |

### Authentication Flow

**Backend Integration:**

1. **Initiate OAuth:** When user clicks "Sign in with Microsoft", redirect to Microsoft OAuth consent screen
2. **Callback handling:** Microsoft redirects back with auth code
3. **Token exchange:** Exchange auth code for access token
4. **Fetch user info:** Get user email and name from Microsoft Graph API
5. **Retrieve role:** Look up user in your database to get their role (read-only or admin)
6. **Create session:** Issue session token/cookie
7. **Return user:** Send User object back to frontend

**Frontend State:**

- Set `status: 'loading'` when login initiated
- On success: Set `user` and `isAuthenticated: true`, redirect to dashboard
- On error: Set `error` message and `status: 'error'`

### Session Management

Implement session handling:

- **Session storage:** Store authentication state in secure HTTP-only cookie or localStorage (with token)
- **Session expiry:** Check session validity on app load and before API calls
- **Automatic logout:** Redirect to login when session expires
- **Refresh tokens:** Implement token refresh if needed

### Error Handling

Handle these error scenarios:

- **Network error:** "Unable to connect to authentication service. Please check your internet connection."
- **Invalid credentials:** "Authentication failed. Please check your credentials and try again."
- **Unauthorized access:** "Your account does not have access to this application. Please contact your administrator."
- **Session expired:** "Your session has expired. Please log in again."

### Empty States

Not applicable for this section — authentication is always the first step.

## Files to Reference

- `product-plan/sections/authentication/README.md` — Feature overview and design intent
- `product-plan/sections/authentication/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/authentication/components/` — React components
- `product-plan/sections/authentication/types.ts` — TypeScript interfaces
- `product-plan/sections/authentication/sample-data.json` — Test data

## Expected User Flows

When fully implemented, users should be able to complete these flows:

### Flow 1: Successful Login

1. User lands on login screen
2. User clicks "Sign in with Microsoft" button
3. User authenticates via Azure AD (external consent screen)
4. System retrieves user information and role
5. **Outcome:** Success message displays briefly, user redirects to Dashboard with appropriate permissions

### Flow 2: Failed Login - Network Error

1. User lands on login screen
2. User clicks "Sign in with Microsoft"
3. Network error occurs during OAuth redirect
4. **Outcome:** Error message displays: "Unable to connect to authentication service. Please check your internet connection and try again."

### Flow 3: Failed Login - Unauthorized User

1. User lands on login screen
2. User clicks "Sign in with Microsoft"
3. User authenticates successfully with Microsoft
4. System determines user does not have access (not in allowed list)
5. **Outcome:** Error message displays: "Your account does not have access to this application. Please contact your administrator."

### Flow 4: Session Expired

1. User is working in the application
2. Session expires (time-based)
3. User attempts an action (e.g., toggle a feature)
4. **Outcome:** System detects expired session, redirects to login with message "Your session has expired. Please log in again."

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] User can click "Sign in with Microsoft" to initiate OAuth
- [ ] OAuth flow completes successfully with Microsoft
- [ ] User role is retrieved from backend
- [ ] Session is created and stored securely
- [ ] User redirects to dashboard after successful login
- [ ] Loading spinner shows during authentication
- [ ] Error messages display for failed login attempts
- [ ] Session expiry is detected and handled
- [ ] Login screen matches the visual design
- [ ] Responsive on mobile

---

# Milestone 3: Resource Configuration

## Goal

Implement the resource configuration feature — allowing users to add, edit, test, and delete Azure App Configuration resource connections.

## Overview

The resource configuration section allows users to configure and manage connections to Azure App Configuration resources within their subscription. Users can add multiple resources from one or more resource groups, all within the same Azure subscription. Each resource can be labeled with an environment type (development, staging, production) for easy identification.

**Key Functionality:**
- View all configured Azure App Configuration resources
- Add new resource configurations with connection details
- Test connections before saving
- Edit existing resource configurations
- Delete resource configurations with confirmation
- Display environment badges (development=blue, staging=yellow, production=red)
- Show connection status for each resource

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/resource-configuration/tests.md` for detailed test-writing instructions including:
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

Copy the section components from `product-plan/sections/resource-configuration/components/`:

- `ResourceList.tsx` — Grid of resource cards with edit/delete actions
- `ResourceForm.tsx` — Add/edit form with connection testing

**Props Interfaces:**

```typescript
// ResourceList
interface ResourceListProps {
  resources: AppConfigResource[];
  onAdd: () => void;
  onEdit: (resource: AppConfigResource) => void;
  onDelete: (resourceId: string) => void;
}

// ResourceForm
interface ResourceFormProps {
  mode: 'add' | 'edit';
  initialData?: ResourceFormData;
  onSave: (data: ResourceFormData) => Promise<void>;
  onCancel: () => void;
  onTestConnection: (data: ResourceFormData) => Promise<ConnectionTestResult>;
}
```

### Data Layer

The components expect these data shapes (from `types.ts`):

```typescript
type EnvironmentType = 'development' | 'staging' | 'production';
type ConnectionStatus = 'unknown' | 'testing' | 'connected' | 'error';

interface AppConfigResource {
  id: string;
  displayName: string;
  environmentType: EnvironmentType;
  resourceName: string;
  resourceGroup: string;
  connectionString: string; // Store securely, mask in UI
  subscriptionId: string;
  connectionStatus: ConnectionStatus;
  lastTested?: string; // ISO 8601 timestamp
  createdAt: string;
  updatedAt: string;
}
```

You'll need to:
- Create API endpoints for CRUD operations on resources
- Store resources in your database
- Encrypt/secure connection strings (never expose full strings in UI)
- Test Azure connections using the Azure SDK

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onAdd` | Called when user clicks "Add Resource". Opens the form in add mode. |
| `onEdit` | Called when user clicks edit icon on a resource card. Opens form in edit mode with resource data. |
| `onDelete` | Called when user confirms deletion. Should delete resource from database. |
| `onSave` | Called when user submits the form. Should validate, save to database, return promise. |
| `onCancel` | Called when user cancels the form. Close the form/modal. |
| `onTestConnection` | Called when user clicks "Test Connection". Should attempt to connect to Azure resource and return result. |

### Backend Integration

**CRUD Endpoints:**

- `GET /api/resources` — Fetch all configured resources for current user
- `POST /api/resources` — Create new resource configuration
- `PUT /api/resources/:id` — Update existing resource
- `DELETE /api/resources/:id` — Delete resource configuration

**Connection Testing:**

- `POST /api/resources/test-connection` — Test Azure connection
  - Accept connection string and resource name
  - Use Azure SDK to attempt connection
  - Return `{ success: boolean, message: string }`

**Security Considerations:**

- Encrypt connection strings in database
- Never return full connection strings to frontend (mask them)
- Validate Azure credentials server-side
- Only allow users to manage their own resources

### Empty States

Implement empty state UI for when no records exist yet:

- **No resources configured:** Show a helpful message and "Add Resource" CTA when the resource list is empty
- **First-time user experience:** Guide users to add their first resource with clear messaging

The ResourceList component includes empty state design — make sure to render it when `resources.length === 0`.

## Files to Reference

- `product-plan/sections/resource-configuration/README.md` — Feature overview and design intent
- `product-plan/sections/resource-configuration/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/resource-configuration/components/` — React components
- `product-plan/sections/resource-configuration/types.ts` — TypeScript interfaces
- `product-plan/sections/resource-configuration/sample-data.json` — Test data

## Expected User Flows

When fully implemented, users should be able to complete these flows:

### Flow 1: Add a New Resource

1. User navigates to Resource Configuration page
2. User sees either empty state or list of existing resources
3. User clicks "Add Resource" button
4. Form opens with empty fields
5. User fills in display name ("Development"), environment type (development), resource name, resource group, connection string
6. User clicks "Test Connection" button
7. **Outcome:** System tests connection, shows success message "Connection successful! Resource is accessible."
8. User clicks "Save" button
9. **Outcome:** Resource is saved to database, appears in list, form closes

### Flow 2: Test Connection Failure

1. User opens add/edit form
2. User enters invalid connection string or incorrect resource name
3. User clicks "Test Connection"
4. **Outcome:** Error message displays: "Connection failed: Invalid connection string or insufficient permissions."
5. User can correct the fields and test again

### Flow 3: Edit an Existing Resource

1. User clicks edit icon on a resource card
2. Form opens pre-filled with existing resource data
3. User modifies the display name or environment type
4. User clicks "Save"
5. **Outcome:** Resource is updated in database, changes reflect in the list, form closes

### Flow 4: Delete a Resource

1. User clicks delete icon on a resource card
2. Confirmation modal appears: "Are you sure you want to delete [Resource Name]? This action cannot be undone."
3. User clicks "Delete" button
4. **Outcome:** Resource is deleted from database, removed from list
5. If this was the last resource, empty state appears

### Flow 5: Empty State to First Resource

1. User has no resources configured yet
2. User sees empty state with message "No Resources Configured" and "Add your first Azure App Configuration resource to get started"
3. User clicks "Add Resource" button
4. User completes the form and saves
5. **Outcome:** Empty state disappears, resource card appears in the list

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] User can view list of all configured resources
- [ ] Empty state displays when no resources exist
- [ ] User can click "Add Resource" to open the form
- [ ] Form validates required fields (display name, resource name, etc.)
- [ ] "Test Connection" button attempts to connect to Azure
- [ ] Connection test shows success or error message
- [ ] User can save a new resource (form closes, resource appears in list)
- [ ] User can edit an existing resource
- [ ] User can delete a resource with confirmation modal
- [ ] Connection strings are masked in the UI (e.g., "Endpoint=...;Id=***;Secret=***")
- [ ] Environment badges are color-coded correctly
- [ ] Matches the visual design
- [ ] Responsive on mobile

---

# Milestone 4: Feature Toggle Dashboard

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

---

# Milestone 5: Audit Log

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

---

## Final Checklist

Once all five milestones are complete, verify:

- [ ] All tests pass (TDD approach followed for each section)
- [ ] Design tokens applied globally (colors, fonts, spacing)
- [ ] All four sections are fully functional and integrated
- [ ] Application shell navigation works correctly
- [ ] Resource switcher updates all relevant views
- [ ] User authentication and role-based access control works
- [ ] Read-only users see disabled controls (not hidden)
- [ ] Production changes require confirmation
- [ ] Empty states render correctly in all sections
- [ ] All CRUD operations work with error handling
- [ ] Audit log captures all toggle changes
- [ ] Responsive design works on mobile
- [ ] Dark mode support works throughout
- [ ] Loading states display during async operations
- [ ] Error messages are helpful and user-friendly

---

## Getting Help

If you encounter issues or have questions:

1. Check the section-specific `README.md` files for design intent
2. Review the `tests.md` files for expected behaviors
3. Examine the sample data JSON files for data structure examples
4. Reference the component source code for prop interfaces
5. Consult Azure SDK documentation for API integration details

The provided UI components are production-ready and styled — focus your implementation effort on the backend, data layer, and integration work.
