# Milestone 3: Resource Configuration

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Milestone 2 (Authentication) complete

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
