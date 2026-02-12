# Azure AD Configuration

This guide explains how to configure Azure AD authentication for the Azure Feature Toggle Manager.

## Quick Start (Automated)

The easiest way to set up Azure AD for local development is using the setup script:

```bash
./scripts/setup-azure-ad.sh
```

This script will:
1. Create an Azure AD application registration
2. Configure SPA redirect URIs for local development
3. Set up required API permissions
4. Create a service principal
5. Grant admin consent (if you have permissions)
6. Create local `.env` files with the configuration

### Script Options

```bash
./scripts/setup-azure-ad.sh [OPTIONS]

Options:
  --app-name NAME        Application display name (default: FeatureFlagToggler)
  --skip-env-files       Skip creating .env files
  --dry-run              Show what would be done without making changes
  -h, --help             Show help message
```

### Prerequisites

- Azure CLI installed and logged in (`az login`)
- Application Administrator role (to create app registrations)

---

## Manual Setup

If you prefer to set up Azure AD manually, follow these steps:

### Step 1: Create App Registration

```bash
# Login to Azure CLI
az login

# Create the application
az ad app create \
  --display-name "FeatureFlagToggler" \
  --sign-in-audience "AzureADMyOrg" \
  --query "{appId:appId,id:id}" \
  -o json
```

### Step 2: Configure Redirect URIs

```bash
# Get the app object ID
APP_CLIENT_ID="<your-client-id>"
APP_OBJECT_ID=$(az ad app show --id $APP_CLIENT_ID --query id -o tsv)

# Configure SPA redirect URIs
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/$APP_OBJECT_ID" \
  --headers "Content-Type=application/json" \
  --body '{
    "spa": {
      "redirectUris": [
        "http://localhost:5173",
        "http://localhost:5173/auth/callback"
      ]
    }
  }'
```

### Step 3: Create Service Principal

```bash
az ad sp create --id $APP_CLIENT_ID
```

### Step 4: Grant Admin Consent

```bash
az ad app permission admin-consent --id $APP_CLIENT_ID
```

Or use the script:

```bash
./scripts/grant-admin-consent.sh
```

---

## Configuration Summary

### Application Details

| Setting | Value |
|---------|-------|
| Display Name | FeatureFlagToggler |
| Sign-in Audience | AzureADMyOrg (Single tenant) |
| Platform | Single-page application (SPA) |

### Redirect URIs

| Environment | URIs |
|-------------|------|
| Local Development | `http://localhost:5173`, `http://localhost:5173/auth/callback` |
| Production | Auto-configured by Terraform (Container App URL) |

### API Permissions (Delegated)

| API | Permission | Description |
|-----|------------|-------------|
| Microsoft Graph | User.Read | Read user profile |
| Microsoft Graph | openid | Sign users in |
| Microsoft Graph | profile | View users' basic profile |
| Microsoft Graph | email | View users' email address |
| Azure Service Management | user_impersonation | Access Azure resources |
| Azure App Configuration | KeyValue.Read | Read configuration values |
| Azure App Configuration | KeyValue.Write | Write configuration values |

---

## Environment Configuration

### Frontend (`.env.local`)

```env
VITE_AZURE_CLIENT_ID=<your-client-id>
VITE_AZURE_TENANT_ID=<your-tenant-id>
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (`appsettings.Development.json`)

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<your-tenant-id>",
    "ClientId": "<your-client-id>",
    "Audience": "<your-client-id>"
  }
}
```

---

## Testing the Configuration

1. **Start the backend:**
   ```bash
   cd backend
   dotnet run
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open** http://localhost:5173

4. **Click** "Sign in with Microsoft"

5. **Login** with your Azure AD credentials

6. **Verify** you're redirected to the dashboard

---

## Troubleshooting

### "AADSTS50011: The redirect URI specified in the request does not match"

The redirect URI must match exactly. Ensure it's `http://localhost:5173` (no trailing slash).

```bash
# Check current redirect URIs
az ad app show --id $APP_CLIENT_ID --query "spa.redirectUris" -o json
```

### "AADSTS65001: The user or administrator has not consented"

Run the admin consent script:

```bash
./scripts/grant-admin-consent.sh
```

Or grant consent via Azure Portal:
1. Go to Azure Portal > Azure Active Directory > App registrations
2. Select your application
3. Go to API permissions
4. Click "Grant admin consent"

### "AADSTS700016: Application not found"

Check that the client ID in your `.env.local` matches the actual application ID:

```bash
az ad app list --display-name "FeatureFlagToggler" --query "[].appId" -o tsv
```

---

## Azure CLI Commands Reference

```bash
# View application details
az ad app show --id $APP_CLIENT_ID

# List API permissions
az ad app show --id $APP_CLIENT_ID --query "requiredResourceAccess" -o json

# View service principal
az ad sp show --id $APP_CLIENT_ID

# List user assignments
az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/<sp-id>/appRoleAssignedTo"
```

---

## Related Scripts

- [`scripts/setup-azure-ad.sh`](./scripts/setup-azure-ad.sh) - Full Azure AD setup for local development
- [`scripts/grant-admin-consent.sh`](./scripts/grant-admin-consent.sh) - Grant admin consent for API permissions
- [`scripts/setup-cicd.sh`](./scripts/setup-cicd.sh) - Set up CI/CD pipeline (includes service principal)
