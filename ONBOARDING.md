# New Team Member Onboarding

## Prerequisites

- .NET SDK 10.0+ ([Download](https://dotnet.microsoft.com/download))
- Node.js 18+ ([Download](https://nodejs.org/))
- Git
- Azure AD credentials (tenant ID, client ID, client secret)
- Access to Azure subscription with App Configuration resources

## Quick Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd azure-feature-toggle-product

# Frontend
cd frontend
npm install

# Backend  
cd ../backend
dotnet restore
```

### 2. Configure Backend

```bash
cd backend
dotnet user-secrets set "AzureAd:TenantId" "<your-tenant-id>"
dotnet user-secrets set "AzureAd:ClientId" "<your-client-id>"
dotnet user-secrets set "AzureAd:ClientSecret" "<your-client-secret>"
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local:
# VITE_AZURE_CLIENT_ID=<your-client-id>
# VITE_AZURE_TENANT_ID=<your-tenant-id>
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
dotnet run
# Runs on http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 5. Test Login

1. Open http://localhost:5173
2. Click "Sign in with Microsoft"
3. Login with your Azure AD account
4. Grant consent (first time only)

## Azure Permissions Needed

Contact your Azure admin to ensure you have:

| Role | Scope | Purpose |
|------|-------|---------|
| Reader | Subscription | Discover App Config resources |
| App Configuration Data Reader | App Config resource | Read feature flags |
| App Configuration Data Owner | App Config resource | Write feature flags |

## Project Structure

```
frontend/          # React + Vite + TypeScript
backend/           # ASP.NET Core API
terraform/         # Infrastructure as Code (Azure deployment)
product-plan/      # DesignOS design reference (read-only)
```

## Need Help?

- Main documentation: `README.md`
- Azure deployment: `terraform/README.md`
- Azure AD config reference: `AZURE-AD-CONFIGURATION.md`
