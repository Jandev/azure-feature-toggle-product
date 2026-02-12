# CI/CD Setup Guide

This guide explains how to set up GitHub Actions CI/CD for deploying to Azure.

## Prerequisites

- Azure CLI installed and logged in (`az login`)
- GitHub CLI installed and logged in (`gh auth login`)
- Owner/Contributor access to an Azure subscription
- Admin access to the GitHub repository

## Step 1: Create Service Principal for GitHub Actions

Create a service principal that GitHub Actions will use to deploy to Azure:

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

Save the `clientId` and `tenantId` from the output - you'll need them for GitHub secrets.

## Step 2: Configure OIDC Federated Credentials

Instead of storing a client secret, we use OIDC federation for secure authentication. This allows GitHub Actions to authenticate without long-lived credentials.

```bash
# Get the service principal's application object ID
SP_CLIENT_ID="<client-id-from-step-1>"
SP_OBJECT_ID=$(az ad app show --id $SP_CLIENT_ID --query id -o tsv)

# Your GitHub repository (format: owner/repo)
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

# Create federated credential for staging environment (optional)
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/applications/$SP_OBJECT_ID/federatedIdentityCredentials" \
  --body "{
    \"name\": \"github-staging-env\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:$GITHUB_REPO:environment:staging\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }"
```

## Step 3: Create Terraform State Storage

Terraform needs a remote backend to store state files. Create an Azure Storage Account:

```bash
# Create resource group for Terraform state
az group create \
  --name rg-terraform-state \
  --location westeurope

# Create storage account (name must be globally unique, 3-24 lowercase alphanumeric)
STORAGE_NAME="stfeaturetogglestate$(openssl rand -hex 3)"
az storage account create \
  --name $STORAGE_NAME \
  --resource-group rg-terraform-state \
  --location westeurope \
  --sku Standard_LRS \
  --kind StorageV2

# Create blob container for state files
az storage container create \
  --name tfstate \
  --account-name $STORAGE_NAME \
  --auth-mode login

# Grant the service principal access to the storage account
az role assignment create \
  --assignee $SP_CLIENT_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-terraform-state/providers/Microsoft.Storage/storageAccounts/$STORAGE_NAME"

echo "Storage account created: $STORAGE_NAME"
```

## Step 4: Configure GitHub Secrets

Set the required secrets in your GitHub repository:

```bash
GITHUB_REPO="YourOrg/azure-feature-toggle-product"

# Azure credentials
gh secret set AZURE_CLIENT_ID --body "$SP_CLIENT_ID" --repo $GITHUB_REPO
gh secret set AZURE_TENANT_ID --body "$(az account show --query tenantId -o tsv)" --repo $GITHUB_REPO
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID" --repo $GITHUB_REPO

# Terraform state storage
gh secret set TF_STATE_RESOURCE_GROUP --body "rg-terraform-state" --repo $GITHUB_REPO
gh secret set TF_STATE_STORAGE_ACCOUNT --body "$STORAGE_NAME" --repo $GITHUB_REPO
```

Verify secrets were created:

```bash
gh secret list --repo $GITHUB_REPO
```

Expected output:
```
AZURE_CLIENT_ID          Updated 2024-XX-XX
AZURE_SUBSCRIPTION_ID    Updated 2024-XX-XX
AZURE_TENANT_ID          Updated 2024-XX-XX
TF_STATE_RESOURCE_GROUP  Updated 2024-XX-XX
TF_STATE_STORAGE_ACCOUNT Updated 2024-XX-XX
```

## Step 5: Create GitHub Environments

Create deployment environments for the workflow:

```bash
# Create production environment
gh api repos/$GITHUB_REPO/environments/production --method PUT

# Create staging environment
gh api repos/$GITHUB_REPO/environments/staging --method PUT
```

### Optional: Add Environment Protection Rules

You can add protection rules (like required reviewers) via the GitHub UI:
1. Go to Repository Settings > Environments
2. Click on `production`
3. Add "Required reviewers" if desired
4. Enable "Wait timer" for delayed deployments

## Step 6: Verify Setup

### Test CI Workflow

Push a commit or open a PR to trigger the CI workflow:

```bash
git commit --allow-empty -m "Test CI workflow"
git push
```

Check the Actions tab in GitHub to see the workflow run.

### Test Deployment Workflow

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Deploy to Azure** workflow
4. Click **Run workflow**
5. Select environment (`production` or `staging`)
6. Select action (`plan` to preview, `deploy` to apply)
7. Click **Run workflow**

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

## Troubleshooting

### "AADSTS700016: Application not found"

The service principal may not exist or the client ID is wrong:

```bash
az ad sp show --id $SP_CLIENT_ID
```

### "OIDC token exchange failed"

Check federated credentials are configured correctly:

```bash
az ad app federated-credential list --id $SP_CLIENT_ID
```

Verify the `subject` matches your repository and branch/environment.

### "AuthorizationFailed" on Terraform

The service principal needs Contributor role:

```bash
az role assignment list --assignee $SP_CLIENT_ID --output table
```

### "Storage blob data access denied"

The service principal needs Storage Blob Data Contributor role on the state storage:

```bash
az role assignment create \
  --assignee $SP_CLIENT_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-terraform-state/providers/Microsoft.Storage/storageAccounts/$STORAGE_NAME"
```

## Required Secrets Reference

| Secret | Description | Example |
|--------|-------------|---------|
| `AZURE_CLIENT_ID` | Service principal app ID | `b6d94f03-34a3-4715-ad9e-...` |
| `AZURE_TENANT_ID` | Azure AD tenant ID | `2922d4aa-0a79-40da-...` |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `1b05e170-95fc-40d8-...` |
| `TF_STATE_RESOURCE_GROUP` | RG containing state storage | `rg-terraform-state` |
| `TF_STATE_STORAGE_ACCOUNT` | Storage account name | `stfeaturetogglestate` |

## Clean Up

To remove the CI/CD infrastructure:

```bash
# Delete service principal
az ad app delete --id $SP_CLIENT_ID

# Delete Terraform state storage (WARNING: loses all state!)
az group delete --name rg-terraform-state --yes
```
