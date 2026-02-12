# CI/CD Setup Guide

This guide explains how to set up GitHub Actions CI/CD for deploying to Azure.

## Quick Start (Automated)

The easiest way to set up CI/CD is using the setup script:

```bash
./scripts/setup-cicd.sh
```

This script will:
1. Create a service principal for GitHub Actions
2. Assign required Azure roles (Contributor, RBAC Administrator, Application Administrator)
3. Create OIDC federated credentials for secure GitHub authentication
4. Create Terraform state storage (Azure Storage Account)
5. Configure GitHub secrets
6. Create GitHub environments (production, staging)

### Script Options

```bash
./scripts/setup-cicd.sh [OPTIONS]

Options:
  --github-repo REPO     GitHub repository (format: owner/repo)
                         Default: auto-detect from git remote
  --sp-name NAME         Service principal name
                         Default: github-feature-toggle-deployer
  --location LOCATION    Azure region for resources
                         Default: westeurope
  --skip-github          Skip GitHub configuration (only create Azure resources)
  --dry-run              Show what would be done without making changes
  -h, --help             Show help message
```

### Example Usage

```bash
# Auto-detect everything (recommended)
./scripts/setup-cicd.sh

# Specify GitHub repo explicitly
./scripts/setup-cicd.sh --github-repo myorg/my-repo

# Preview what would be done
./scripts/setup-cicd.sh --dry-run

# Only create Azure resources
./scripts/setup-cicd.sh --skip-github
```

### Prerequisites

- Azure CLI installed and logged in (`az login`)
- GitHub CLI installed and logged in (`gh auth login`)
- Owner/Contributor access to an Azure subscription
- Admin access to the GitHub repository

---

## Manual Setup

If you prefer to set up CI/CD manually, follow these steps:

### Step 1: Create Service Principal

```bash
# Set your subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal with Contributor role
az ad sp create-for-rbac \
  --name "github-feature-toggle-deployer" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID" \
  --query "{clientId:appId,tenantId:tenant}" \
  -o json
```

Save the `clientId` - you'll need it for the next steps.

### Step 2: Assign Additional Roles

```bash
SP_CLIENT_ID="<client-id-from-step-1>"

# Role Based Access Control Administrator (for role assignments)
az role assignment create \
  --assignee $SP_CLIENT_ID \
  --role "Role Based Access Control Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

# Application Administrator (for Azure AD app registration)
az role assignment create \
  --assignee $SP_CLIENT_ID \
  --role "Application Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"
```

### Step 3: Configure OIDC Federated Credentials

```bash
# Get the application object ID
SP_OBJECT_ID=$(az ad app show --id $SP_CLIENT_ID --query id -o tsv)

# Your GitHub repository
GITHUB_REPO="YourOrg/azure-feature-toggle-product"

# Create federated credential for main branch
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/applications/$SP_OBJECT_ID/federatedIdentityCredentials" \
  --body "{
    \"name\": \"github-main\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:$GITHUB_REPO:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }"

# Create federated credential for production environment
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/applications/$SP_OBJECT_ID/federatedIdentityCredentials" \
  --body "{
    \"name\": \"github-production-env\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:$GITHUB_REPO:environment:production\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }"
```

### Step 4: Create Terraform State Storage

```bash
# Create resource group
az group create \
  --name rg-terraform-state \
  --location westeurope

# Create storage account (name must be globally unique)
STORAGE_NAME="stfeaturetogglestate$(openssl rand -hex 2)"
az storage account create \
  --name $STORAGE_NAME \
  --resource-group rg-terraform-state \
  --location westeurope \
  --sku Standard_LRS

# Create blob container
az storage container create \
  --name tfstate \
  --account-name $STORAGE_NAME \
  --auth-mode login

# Grant access to service principal
az role assignment create \
  --assignee $SP_CLIENT_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-terraform-state/providers/Microsoft.Storage/storageAccounts/$STORAGE_NAME"

echo "Storage account: $STORAGE_NAME"
```

### Step 5: Configure GitHub Secrets

```bash
GITHUB_REPO="YourOrg/azure-feature-toggle-product"
TENANT_ID=$(az account show --query tenantId -o tsv)

gh secret set AZURE_CLIENT_ID --body "$SP_CLIENT_ID" --repo $GITHUB_REPO
gh secret set AZURE_TENANT_ID --body "$TENANT_ID" --repo $GITHUB_REPO
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID" --repo $GITHUB_REPO
gh secret set TF_STATE_RESOURCE_GROUP --body "rg-terraform-state" --repo $GITHUB_REPO
gh secret set TF_STATE_STORAGE_ACCOUNT --body "$STORAGE_NAME" --repo $GITHUB_REPO
```

### Step 6: Create GitHub Environments

```bash
gh api repos/$GITHUB_REPO/environments/production --method PUT
gh api repos/$GITHUB_REPO/environments/staging --method PUT
```

---

## Workflow Overview

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:

| Job | Description |
|-----|-------------|
| `backend` | Build and test .NET backend |
| `frontend` | Build and lint React frontend |
| `terraform` | Validate Terraform configuration |
| `docker` | Build Docker image |

### Deploy Workflow (`.github/workflows/deploy.yml`)

Manual trigger with options:

| Input | Options | Description |
|-------|---------|-------------|
| `environment` | production, staging | Target environment |
| `action` | deploy, plan, destroy | What to do |

**Jobs:**
1. `terraform` - Provisions/updates Azure infrastructure
2. `build-and-push` - Builds Docker image and pushes to ACR
3. `deploy` - Updates Container App with new image

---

## Running Deployments

### Via GitHub UI

1. Go to **Actions** tab
2. Select **Deploy to Azure** workflow
3. Click **Run workflow**
4. Select environment and action
5. Click **Run workflow**

### Via GitHub CLI

```bash
# Deploy to production
gh workflow run deploy.yml -f environment=production -f action=deploy

# Plan changes for staging
gh workflow run deploy.yml -f environment=staging -f action=plan
```

---

## Required Secrets Reference

| Secret | Description | How to Get |
|--------|-------------|------------|
| `AZURE_CLIENT_ID` | Service principal app ID | `az ad sp list --display-name github-feature-toggle-deployer --query "[0].appId" -o tsv` |
| `AZURE_TENANT_ID` | Azure AD tenant ID | `az account show --query tenantId -o tsv` |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `az account show --query id -o tsv` |
| `TF_STATE_RESOURCE_GROUP` | RG containing state storage | `rg-terraform-state` |
| `TF_STATE_STORAGE_ACCOUNT` | Storage account name | Check `.cicd-config.json` or Azure Portal |

---

## Troubleshooting

### "AADSTS700016: Application not found"

The service principal may not exist:

```bash
az ad sp list --display-name github-feature-toggle-deployer
```

### "OIDC token exchange failed"

Check federated credentials:

```bash
SP_CLIENT_ID=$(az ad sp list --display-name github-feature-toggle-deployer --query "[0].appId" -o tsv)
az ad app federated-credential list --id $SP_CLIENT_ID
```

Verify the `subject` matches your repository and branch/environment.

### "AuthorizationFailed" on Terraform

The service principal needs Contributor role:

```bash
az role assignment list --assignee $SP_CLIENT_ID --output table
```

### "Storage blob data access denied"

Grant Storage Blob Data Contributor role:

```bash
az role assignment create \
  --assignee $SP_CLIENT_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-terraform-state/providers/Microsoft.Storage/storageAccounts/$STORAGE_NAME"
```

---

## Clean Up

To remove CI/CD infrastructure:

```bash
# Get service principal ID
SP_CLIENT_ID=$(az ad sp list --display-name github-feature-toggle-deployer --query "[0].appId" -o tsv)

# Delete service principal
az ad app delete --id $SP_CLIENT_ID

# Delete Terraform state storage (WARNING: loses all state!)
az group delete --name rg-terraform-state --yes
```

---

## Related Scripts

- [`scripts/setup-cicd.sh`](./scripts/setup-cicd.sh) - Full CI/CD setup (recommended)
- [`scripts/grant-admin-consent.sh`](./scripts/grant-admin-consent.sh) - Grant admin consent after deployment
- [`scripts/setup-azure-ad.sh`](./scripts/setup-azure-ad.sh) - Azure AD setup for local development
