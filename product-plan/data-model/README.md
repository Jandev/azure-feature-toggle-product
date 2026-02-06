# Data Model

This directory contains the core entity definitions and sample data for the Azure Feature Toggle Tool.

## Entities

### User
Represents a person using the tool with role-based permissions.

**Attributes:**
- `id` — Unique identifier
- `name` — User's full name
- `email` — User's email address
- `role` — Either `'read-only'` or `'admin'`
- `avatarUrl` — Optional profile picture URL

**Relationships:**
- A User creates AuditLogEntry records when they make changes

### AppConfigResource
Represents an Azure App Configuration resource that the tool connects to.

**Attributes:**
- `id` — Unique identifier
- `displayName` — Human-readable name (e.g., "Development", "Production")
- `environmentType` — One of `'development'`, `'staging'`, or `'production'`
- `resourceName` — Azure resource name
- `resourceGroup` — Azure resource group name
- `connectionString` — Connection string (store securely, mask in UI)
- `subscriptionId` — Azure subscription ID
- `connectionStatus` — Connection state: `'unknown'`, `'testing'`, `'connected'`, or `'error'`
- Timestamps: `lastTested`, `createdAt`, `updatedAt`

**Relationships:**
- An AppConfigResource contains many FeatureToggles

### FeatureToggle
Represents a feature flag within an Azure App Configuration resource.

**Attributes:**
- `id` — Unique identifier (feature key)
- `name` — Feature key/name
- `description` — Optional description of what the toggle controls
- `enabled` — Current state (true/false)
- `lastModifiedBy` — User who last changed it
- `lastModifiedAt` — Timestamp of last change
- `resourceId` — Foreign key to AppConfigResource

**Relationships:**
- A FeatureToggle belongs to an AppConfigResource
- Changes to a FeatureToggle create AuditLogEntry records

### AuditLogEntry
Represents a record of a feature toggle change for accountability.

**Attributes:**
- `id` — Unique identifier
- `timestamp` — When the change occurred (ISO 8601)
- `userId`, `userName`, `userEmail` — User who made the change
- `action` — Either `'enabled'` or `'disabled'`
- `toggleId`, `toggleName` — Which toggle was changed
- `resourceId`, `resourceName`, `environmentType` — Where it happened
- `previousState`, `newState` — State before and after

**Relationships:**
- An AuditLogEntry references a User (who made the change)
- An AuditLogEntry references a FeatureToggle (what was changed)
- An AuditLogEntry references an AppConfigResource (where it happened)

## Key Relationships

```
User (1) ──→ (many) AuditLogEntry
AppConfigResource (1) ──→ (many) FeatureToggle
FeatureToggle (1) ──→ (many) AuditLogEntry
```

## Design Decisions

- **Simple role system**: Only two roles (`read-only` and `admin`) to keep permissions straightforward
- **Timestamps use ISO 8601**: All dates/times are stored as ISO 8601 strings for consistency
- **Connection strings stored securely**: Never display full connection strings in the UI
- **Simple toggles**: Feature toggles are on/off switches with no complex targeting rules (v1 scope)
- **Audit everything**: Every toggle change creates an audit log entry for accountability

## Usage

Import the types in your code:

```typescript
import type { User, AppConfigResource, FeatureToggle, AuditLogEntry } from './types';
```

Use the sample data for testing before real APIs are built:

```typescript
import sampleData from './sample-data.json';
```
