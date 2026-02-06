# Azure AD Configuration - Complete ✅

## Configuration Summary

All Azure AD settings have been configured and persisted for the Azure Feature Toggle Tool.

### Tenant Information

- **Tenant ID**: `YOUR_TENANT_ID`
- **Tenant Domain**: `YOUR_TENANT_DOMAIN`
- **Tenant Display Name**: YOUR_ORGANIZATION

### App Registration Details

- **Application Name**: FeatureFlagToggler
- **Application (Client) ID**: `YOUR_CLIENT_ID`
- **Object ID**: `YOUR_APP_OBJECT_ID`
- **Service Principal ID**: `YOUR_SERVICE_PRINCIPAL_ID`
- **Sign-in Audience**: AzureADMyOrg (Single tenant)

### Configured User

- **Name**: YOUR_NAME
- **User Principal Name**: `YOUR_UPN`
- **Email**: `YOUR_EMAIL`
- **Object ID**: `YOUR_USER_OBJECT_ID`
- **Assignment Status**: ✅ Assigned to application
- **Assigned Date**: 2026-02-05 20:16:39 UTC

## What Was Configured

### 1. ✅ SPA Redirect URIs

Configured for local development:

- `http://localhost:5173`
- `http://localhost:5173/auth/callback`

### 2. ✅ API Permissions (Microsoft Graph)

All delegated permissions configured with admin consent granted:

- **User.Read** (e1fe6dd8-ba31-4d61-89e7-88639da4683d) - Read user profile
- **openid** (37f7f235-527c-4136-accd-4a02d197296e) - Sign users in
- **profile** (14dad69e-099b-42c9-810b-d002981feec1) - View users' basic profile
- **email** (64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0) - View users' email address

**Admin Consent**: ✅ Granted

### 3. ✅ User Assignment

YOUR_NAME is assigned to the application with default user access.

### 4. ✅ Application Configuration Files

**Frontend** (`/frontend/.env.local`):

```env
VITE_AZURE_CLIENT_ID=YOUR_CLIENT_ID
VITE_AZURE_TENANT_ID=YOUR_TENANT_ID
VITE_API_BASE_URL=http://localhost:5000
```

**Backend** (`/backend/appsettings.json`):

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "YOUR_TENANT_ID",
    "ClientId": "YOUR_CLIENT_ID",
    "Audience": "YOUR_CLIENT_ID"
  }
}
```

## Testing the Configuration

### Start the Application

```bash
# Terminal 1: Start backend
cd backend
dotnet run
# Should start on: http://localhost:5000

# Terminal 2: Start frontend
cd frontend
npm run dev
# Should start on: http://localhost:5173
```

### Test Authentication Flow

1. **Navigate to** http://localhost:5173
2. **Expected**: Redirected to `/login` page
3. **Click**: "Sign in with Microsoft" button
4. **Expected**: Microsoft login popup appears
5. **Login with**: YOUR_EMAIL
6. **Expected**: OAuth consent screen (first time only)
7. **Expected**: Successful redirect to `/dashboard`
8. **Verify**: User name "YOUR_NAME" appears in top navigation
9. **Verify**: User can navigate between pages
10. **Test**: Logout button returns to login page

### Expected User Experience

```
┌─────────────────────────────────────┐
│  Azure Feature Toggle Tool          │
│                                     │
│  [Sign in with Microsoft]           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Microsoft Login                    │
│  YOUR_EMAIL              │
│  [Password field]                   │
│  [Sign in]                          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Dashboard - YOUR_NAME ▾         │
│  ├─ Dashboard                       │
│  ├─ Resources                       │
│  ├─ Audit Log                       │
│  └─ Settings                        │
└─────────────────────────────────────┘
```

## Future Enhancements (Optional)

### Custom App Roles

For role-based access control, you can add custom app roles:

```json
{
  "appRoles": [
    {
      "allowedMemberTypes": ["User"],
      "description": "Administrators can view and modify all feature toggles",
      "displayName": "Administrator",
      "id": "<unique-guid>",
      "isEnabled": true,
      "value": "Admin"
    },
    {
      "allowedMemberTypes": ["User"],
      "description": "Read-only users can only view feature toggles",
      "displayName": "Read Only",
      "id": "<unique-guid>",
      "isEnabled": true,
      "value": "ReadOnly"
    }
  ]
}
```

Then assign users to specific roles via:

```bash
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/YOUR_SERVICE_PRINCIPAL_ID/appRoleAssignments" \
  --body '{"principalId":"YOUR_USER_OBJECT_ID","resourceId":"YOUR_SERVICE_PRINCIPAL_ID","appRoleId":"<role-guid>"}'
```

### Production Redirect URIs

When deploying to production, add your production URLs:

```bash
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/YOUR_APP_OBJECT_ID" \
  --body '{
    "spa": {
      "redirectUris": [
        "http://localhost:5173",
        "http://localhost:5173/auth/callback",
        "https://your-production-domain.com",
        "https://your-production-domain.com/auth/callback"
      ]
    }
  }'
```

## Troubleshooting

### Issue: "AADSTS50011: The redirect URI specified in the request does not match"

**Solution**: Verify redirect URIs are exactly `http://localhost:5173` (no trailing slash)

### Issue: "AADSTS65001: The user or administrator has not consented"

**Solution**: Admin consent was already granted, but if needed:

```bash
az ad app permission admin-consent --id YOUR_CLIENT_ID
```

### Issue: "AADSTS700016: Application not found"

**Solution**: Check VITE_AZURE_CLIENT_ID in `.env.local` matches `YOUR_CLIENT_ID`

### Issue: User can't access application

**Solution**: User is already assigned. If assignment was removed, reassign:

```bash
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/YOUR_SERVICE_PRINCIPAL_ID/appRoleAssignedTo" \
  --body '{
    "principalId": "YOUR_USER_OBJECT_ID",
    "resourceId": "YOUR_SERVICE_PRINCIPAL_ID",
    "appRoleId": "00000000-0000-0000-0000-000000000000"
  }'
```

## Azure CLI Commands Reference

View app configuration:

```bash
az ad app show --id YOUR_CLIENT_ID
```

View service principal:

```bash
az ad sp show --id YOUR_SERVICE_PRINCIPAL_ID
```

List app role assignments:

```bash
az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/YOUR_SERVICE_PRINCIPAL_ID/appRoleAssignedTo"
```

View user details:

```bash
az ad user show --id YOUR_USER_OBJECT_ID
```

## Summary

✅ **All Azure AD configuration is complete and persisted**
✅ **YOUR_NAME has access to the application**
✅ **Ready to test authentication flow**

The application is now fully configured and ready for local development and testing!
