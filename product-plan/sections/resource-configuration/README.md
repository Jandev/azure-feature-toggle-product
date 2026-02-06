# Resource Configuration Section

Configure and manage connections to Azure App Configuration resources.

## Overview

The resource configuration section allows users to configure and manage connections to Azure App Configuration resources within their subscription. Users can add multiple resources from one or more resource groups, all within the same Azure subscription. Each resource can be labeled with an environment type (development, staging, production) for easy identification.

## Components

### ResourceList
Main view showing all configured Azure App Configuration resources.

**Features:**
- Grid/list of configured resources with connection status
- Each resource card displays:
  - Display name and environment badge
  - Resource name and resource group
  - Connection status indicator (connected/error)
  - Last tested timestamp
  - Edit and Delete actions
- "Add New Resource" button
- Empty state with helpful onboarding message

**Props:**
- `resources` — Array of AppConfigResource objects
- `onAdd` — Callback when user clicks "Add New Resource"
- `onEdit` — Callback when user clicks edit button (receives resource)
- `onDelete` — Callback when user clicks delete button (receives resource)

### ResourceForm
Form to add a new resource or edit an existing one.

**Features:**
- Display name input field
- Environment type selector (Development/Staging/Production) with visual badges
- Azure resource name field
- Resource group field
- Connection string field (masked/password type)
- Subscription ID field
- "Test Connection" button with loading state
- Connection test result feedback (success/error)
- Save and Cancel buttons
- Field validation with error messages

**Props:**
- `mode` — 'add' | 'edit'
- `initialData` — Optional ResourceFormData for edit mode
- `isTesting` — Boolean indicating connection test in progress
- `testResult` — ConnectionTestResult object or null
- `errors` — Object mapping field names to error messages
- `onSave` — Callback when user saves (receives form data)
- `onTest` — Callback when user tests connection (receives form data)
- `onCancel` — Callback when user cancels

## Data Types

See `types.ts` for complete interface definitions:
- `AppConfigResource` — Resource configuration with connection details
- `ResourceFormData` — Form input data
- `ConnectionTestResult` — Test connection result with success flag and message
- `ResourceListState` — State for resource list view
- `ResourceFormState` — State for resource form view
- `EnvironmentType` — 'development' | 'staging' | 'production'
- `ConnectionStatus` — 'unknown' | 'testing' | 'connected' | 'error'

See `sample-data.json` for test data with multiple resource examples and various states.

## Implementation Notes

**Connection Testing:**
1. User fills in resource details
2. Clicks "Test Connection"
3. Form validates required fields
4. Makes API call to Azure App Configuration
5. Shows success or error feedback
6. User can save only after successful test (recommended)

**Environment Color Coding:**
- Development: Blue badge
- Staging: Yellow badge  
- Production: Red badge

**Validation Rules:**
- Display name: Required, 1-50 characters
- Resource name: Required, valid Azure resource name format
- Resource group: Required, valid Azure resource group name
- Connection string: Required, valid Azure App Configuration format
- Subscription ID: Optional

**Error Handling:**
- Invalid connection string: "Connection failed: Invalid connection string format."
- Network timeout: "Connection failed: Request timed out. Please check your network connection."
- Insufficient permissions: "Connection failed: Insufficient permissions to access this resource."
- Resource not found: "Connection failed: Resource not found. Please verify the resource name."

## Dependencies

- **lucide-react** — Icons (Server, Edit, Trash2, CheckCircle2, XCircle, AlertCircle, Loader2, X)
- **shadcn/ui** — UI Components
  - Install via: `npx shadcn@latest add badge button card input label`

## Integration Example

```tsx
const [resources, setResources] = useState<AppConfigResource[]>([]);
const [formState, setFormState] = useState<ResourceFormState | null>(null);

const handleAdd = () => {
  setFormState({
    mode: 'add',
    data: {
      displayName: '',
      environmentType: 'development',
      resourceName: '',
      resourceGroup: '',
      connectionString: '',
      subscriptionId: '',
    },
    isSubmitting: false,
    isTesting: false,
    testResult: null,
    errors: {},
  });
};

const handleEdit = (resource: AppConfigResource) => {
  setFormState({
    mode: 'edit',
    data: {
      displayName: resource.displayName,
      environmentType: resource.environmentType,
      resourceName: resource.resourceName,
      resourceGroup: resource.resourceGroup,
      connectionString: resource.connectionString,
      subscriptionId: resource.subscriptionId,
    },
    isSubmitting: false,
    isTesting: false,
    testResult: null,
    errors: {},
  });
};

const handleTest = async (data: ResourceFormData) => {
  setFormState((prev) => ({ ...prev!, isTesting: true }));
  
  try {
    // Test Azure connection
    const result = await testAzureConnection(data.connectionString);
    setFormState((prev) => ({
      ...prev!,
      isTesting: false,
      testResult: {
        success: true,
        message: 'Connection successful! Resource is accessible.',
        timestamp: new Date().toISOString(),
      },
    }));
  } catch (error) {
    setFormState((prev) => ({
      ...prev!,
      isTesting: false,
      testResult: {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    }));
  }
};

const handleSave = async (data: ResourceFormData) => {
  // Validate and save resource
  // Add to resources list
  // Close form
};

return (
  <>
    {!formState ? (
      <ResourceList
        resources={resources}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ) : (
      <ResourceForm
        mode={formState.mode}
        initialData={formState.data}
        isTesting={formState.isTesting}
        testResult={formState.testResult}
        errors={formState.errors}
        onSave={handleSave}
        onTest={handleTest}
        onCancel={() => setFormState(null)}
      />
    )}
  </>
);
```

## User Flows

1. **Add First Resource (Empty State)**: User sees empty state → Clicks "Add Your First Resource" → Fills form → Tests connection → Saves → Returns to list with new resource

2. **Add Additional Resource**: User on resource list → Clicks "Add New Resource" → Fills form → Tests connection → Saves → Returns to updated list

3. **Edit Existing Resource**: User clicks "Edit" on card → Form opens with pre-filled values → Modifies fields → Tests if credentials changed → Saves → Returns to list

4. **Delete Resource**: User clicks "Delete" → Confirmation modal → Confirms → Resource removed → Success message

5. **Test Connection Fails**: User enters details → Tests connection → Sees error → Corrects issue → Tests again successfully

See the section specification for complete flow details.
