# Azure Feature Toggle Tool

A full-stack application for managing Azure App Configuration feature flags with automatic resource discovery, audit logging, and role-based access control.

## 🚀 Quick Start for New Team Members

**For first-time setup, see the [New Team Member Onboarding Checklist](ONBOARDING.md) for a detailed step-by-step guide.**

### TL;DR

1. **Clone the repository**
2. **Get Azure AD credentials** from your team lead:
   - Azure AD Tenant ID
   - Azure AD Client ID
3. **Run the setup script**:
   ```bash
   ./setup.sh
   ```
4. **Start the application** (in separate terminals):
   ```bash
   # Terminal 1
   cd backend && dotnet run
   
   # Terminal 2
   cd frontend && npm run dev
   ```
5. **Open** `http://localhost:5173` and sign in with your Microsoft account

That's it! The app will automatically discover your Azure App Configuration resources.

---

## Features

- **Automatic Resource Discovery**: Automatically discovers all Azure App Configuration resources from your Azure subscriptions
- **Feature Toggle Management**: Enable/disable feature flags with production safeguards
- **Audit Logging**: Track all changes with user attribution and timestamps
- **Azure AD Authentication**: Secure authentication using Microsoft Identity Platform
- **Role-Based Access**: Automatic role detection (Admin/Read-Only) based on Azure permissions

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v3
- **Backend**: ASP.NET Core 10 Web API
- **Authentication**: Azure AD OAuth with MSAL
- **Cloud**: Azure App Configuration, Azure Resource Manager

## Prerequisites

- **Node.js** 18+ and npm
- **.NET SDK** 10.0+
- **Azure Subscription** with App Configuration resources
- **Azure AD App Registration** with required permissions

## Azure AD App Registration Setup

### 1. Create App Registration

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
3. Name: `Azure Feature Toggle Tool`
4. Supported account types: `Accounts in this organizational directory only`
5. Redirect URI: 
   - Platform: `Single-page application (SPA)`
   - URI: `http://localhost:5173`
6. Click "Register"

### 2. Configure API Permissions

Add the following delegated permissions:

| API | Permission | Type | Admin Consent |
|-----|------------|------|---------------|
| Microsoft Graph | `User.Read` | Delegated | No |
| Microsoft Graph | `openid` | Delegated | No |
| Microsoft Graph | `profile` | Delegated | No |
| Microsoft Graph | `email` | Delegated | No |
| Azure Service Management | `user_impersonation` | Delegated | **Yes** |

**Important**: An admin must grant consent for `user_impersonation`.

### 3. Note Your IDs

- **Application (client) ID**: Found on the Overview page
- **Directory (tenant) ID**: Found on the Overview page

## Local Development Setup

### Quick Setup (Recommended for New Team Members)

Run the automated setup script to configure everything in one go:

```bash
./setup.sh
```

The script will:
- Check prerequisites (.NET SDK, Node.js)
- Prompt for your Azure AD Tenant ID and Client ID
- Configure backend user secrets
- Create frontend `.env.local` file
- Install all dependencies
- Build both projects

**Then start the application:**

Terminal 1 - Backend:
```bash
cd backend
dotnet run
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### Manual Setup (Alternative)

If you prefer to set up manually or need to troubleshoot:

#### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Set user secrets** (replace with your actual values):
   ```bash
   dotnet user-secrets set "AzureAd:TenantId" "your-tenant-id-here"
   dotnet user-secrets set "AzureAd:ClientId" "your-client-id-here"
   ```

   **Note**: User secrets are stored in your user profile directory (`~/.microsoft/usersecrets/`) and are never committed to Git. This is the recommended way to store sensitive configuration in .NET.

3. **Restore dependencies**:
   ```bash
   dotnet restore
   ```

4. **Run the backend**:
   ```bash
   dotnet run
   ```

   The API will be available at `http://localhost:5000`

#### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Create `.env.local`** (copy from example):
   ```bash
   cp .env.example .env.local
   ```

3. **Edit `.env.local`** with your values:
   ```env
   VITE_AZURE_CLIENT_ID=your-client-id-here
   VITE_AZURE_TENANT_ID=your-tenant-id-here
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

   **Note**: `.env.local` is gitignored and will never be committed. Always use `.env.local` for sensitive values, never `.env`.

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Run the frontend**:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Usage

### First Login

1. Open `http://localhost:5173` in your browser
2. Click "Sign in with Microsoft"
3. Authenticate with your Azure AD account
4. Grant consent for requested permissions (first time only)

### Resource Discovery

On first login, the app automatically:
1. Scans all your Azure subscriptions
2. Discovers all App Configuration resources
3. Detects environment types (Development/Staging/Production)
4. Displays resources in the Resource Configuration panel

### Managing Feature Toggles

1. **Select a resource** from the Resource Configuration panel
2. **View toggles** on the Dashboard page
3. **Enable/Disable** toggles with the switch
   - Production changes require confirmation
4. **Search** toggles by name or description
5. **Filter** by status (All/Enabled/Disabled)

### Viewing Audit Logs

1. Navigate to the **Audit Log** page
2. View all changes with:
   - User who made the change
   - Timestamp
   - Toggle name
   - Old and new values
3. Filter by date range (Last 24h, 7 days, 30 days, All time)

## Security

### Secrets Management

This project uses secure storage for sensitive configuration values to prevent credential leaks.

#### Backend - .NET User Secrets

User secrets are stored outside the project directory in your user profile:

**Location**: `~/.microsoft/usersecrets/8ec2d279-af67-4681-a17e-92f70fc701f6/secrets.json`

**Managing Secrets**:

```bash
cd backend

# List all secrets
dotnet user-secrets list

# Set a secret
dotnet user-secrets set "AzureAd:TenantId" "your-value"
dotnet user-secrets set "AzureAd:ClientId" "your-value"

# Remove a secret
dotnet user-secrets remove "AzureAd:TenantId"

# Clear all secrets
dotnet user-secrets clear
```

**How it works**:
- Secrets automatically loaded when `ASPNETCORE_ENVIRONMENT=Development`
- The `UserSecretsId` in `.csproj` links to the secrets file
- Never committed to Git
- Each developer has their own secrets

#### Frontend - Environment Variables

Frontend secrets are stored in `.env.local`:

**File**: `frontend/.env.local` (gitignored)

**Managing Secrets**:

1. Copy template: `cp frontend/.env.example frontend/.env.local`
2. Edit `.env.local` with your values
3. Restart dev server: `npm run dev`

**Important**:
- ✅ Use `.env.local` for secrets (gitignored)
- ❌ Never use `.env` for sensitive values (may be committed)
- 📝 Update `.env.example` when adding new variables (without actual values)

#### What Gets Committed

| File | Committed? | Contains |
|------|-----------|----------|
| `backend/appsettings.json` | ✅ Yes | Structure only (empty values) |
| `backend/appsettings.Example.json` | ✅ Yes | Template with placeholders |
| `backend/[UserSecretsId]/secrets.json` | ❌ No | Actual secrets |
| `frontend/.env.example` | ✅ Yes | Template with placeholders |
| `frontend/.env.local` | ❌ No | Actual secrets |

### Azure Permissions

Users need:
- **Reader** role on subscriptions (for discovery)
- **App Configuration Data Owner** or **App Configuration Data Reader** on App Config resources

### Authentication Flow

1. User authenticates with Azure AD
2. Frontend receives ID token and access tokens
3. Management token used for resource discovery
4. Secretless connection to Azure services using Azure AD credentials

## Project Structure

```
azure-feature-toggle-product/
├── backend/                          # ASP.NET Core Web API
│   ├── Controllers/                  # API endpoints
│   ├── Services/                     # Business logic
│   ├── Models/                       # Data models
│   ├── appsettings.json             # Non-sensitive config (committed)
│   └── appsettings.Example.json     # Template for configuration
│
├── frontend/                         # React SPA
│   ├── src/
│   │   ├── components/              # UI components
│   │   ├── context/                 # React Context (state)
│   │   ├── lib/                     # Utilities
│   │   └── pages/                   # Page components
│   ├── .env.example                 # Template (committed)
│   └── .env.local                   # Actual secrets (gitignored)
│
└── README.md
```

## Development Notes

### CORS Configuration

The backend allows CORS from `http://localhost:5173` in development. For production:
1. Update `Program.cs` with production frontend URL
2. Update `appsettings.json` or environment-specific config

### Authentication

The app currently uses a simplified auth approach for PoC:
- Controllers don't require `[Authorize]` attribute
- Suitable for development/demo
- **For production**: Re-enable `[Authorize]` and implement proper token validation

### Environment Detection

Resources are automatically categorized by:
1. **Tags**: `Environment` tag value
2. **Name patterns**: Keywords like "dev", "staging", "prod" in resource name
3. **Default**: Development if no matches

## Troubleshooting

### Setup and Configuration Issues

#### "The 'ClientId' option must be provided" or "The 'TenantId' option must be provided"

**Cause**: User secrets not set or not loaded.

**Solution**:
```bash
cd backend

# Check if secrets are set
dotnet user-secrets list

# If empty, set them
dotnet user-secrets set "AzureAd:TenantId" "your-tenant-id"
dotnet user-secrets set "AzureAd:ClientId" "your-client-id"

# Ensure you're running in Development mode
dotnet run  # Uses Development environment by default
```

**Note**: User secrets only load in Development environment. The `launchSettings.json` already sets this.

#### Frontend shows "your-client-id-here" in error messages

**Cause**: `.env.local` not created or not loaded.

**Solution**:
```bash
cd frontend

# Check if file exists
ls -la .env.local

# If missing, copy from template
cp .env.example .env.local

# Edit with actual values
nano .env.local

# Restart dev server
npm run dev
```

#### User secrets file location

User secrets are stored at:
```
~/.microsoft/usersecrets/8ec2d279-af67-4681-a17e-92f70fc701f6/secrets.json
```

You can manually view/edit this file if needed.

### Runtime Errors

### "CORS Missing Allow Origin" Error

**Solution**: Ensure backend is running and restart it after any `Program.cs` changes.

### "401 Unauthorized" Error

**Solution**: Check that Azure AD app registration has the correct permissions and admin consent has been granted.

### "Failed to discover resources"

**Solution**: 
1. Verify you have Reader role on subscriptions
2. Check that `user_impersonation` permission is granted
3. Try signing out and signing back in

### User Secrets Not Loading

**Solution**:
```bash
cd backend
dotnet user-secrets list  # Verify secrets are set
dotnet user-secrets clear # Clear all (if needed)
# Re-add secrets
```

## Contributing

This is a proof-of-concept application. For production use:
1. Re-enable proper authentication/authorization
2. Add comprehensive error handling
3. Implement proper logging and monitoring
4. Add unit and integration tests
5. Secure CORS policy for production domains

## License

[Your License Here]
