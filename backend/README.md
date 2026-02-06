# Azure Feature Toggle API

ASP.NET Core Web API for managing Azure App Configuration feature toggles.

## Configuration

Before running, configure Azure AD in `appsettings.Development.json`:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Domain": "your-domain.onmicrosoft.com",
    "TenantId": "common",
    "ClientId": "your-spa-app-client-id"
  }
}
```

## Running

```bash
dotnet restore
dotnet run
```

The API will be available at:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001
- Swagger UI: http://localhost:5000/swagger

## API Endpoints

### Resources
- `POST /api/resources/test-connection` - Test Azure App Configuration connection
- `POST /api/resources/{resourceId}/check-permissions` - Check user RBAC permissions

### Toggles
- `GET /api/toggles?endpoint={endpoint}&resourceId={resourceId}` - Get all feature toggles
- `PUT /api/toggles/{toggleId}` - Update a feature toggle

### Audit Logs
- `GET /api/auditlogs?endpoint={endpoint}&resourceId={resourceId}&startDate={date}` - Get audit logs

## Authentication

All endpoints require Azure AD authentication. The API validates JWT tokens from the frontend SPA.

## Azure Permissions

The API uses `DefaultAzureCredential` which tries:
1. Managed Identity (in Azure)
2. Azure CLI credential (local development)

Ensure you're logged in with Azure CLI:

```bash
az login
az account set --subscription <your-subscription-id>
```

## Development

The API requires the following RBAC permissions on App Configuration resources:
- Read: `Microsoft.AppConfiguration/configurationStores/data/read`
- Write: `Microsoft.AppConfiguration/configurationStores/data/write`
