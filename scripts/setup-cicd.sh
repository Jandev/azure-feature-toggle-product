#!/usr/bin/env bash
#
# Set up CI/CD for Azure Feature Toggle Manager
#
# Usage:
#   ./scripts/setup-cicd.sh [OPTIONS]
#
# Options:
#   --github-repo REPO     GitHub repository (format: owner/repo)
#                          Default: auto-detect from git remote
#   --sp-name NAME         Service principal name
#                          Default: github-feature-toggle-deployer
#   --location LOCATION    Azure region for resources
#                          Default: westeurope
#   --skip-github          Skip GitHub configuration (only create Azure resources)
#   --dry-run              Show what would be done without making changes
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - GitHub CLI installed and logged in (gh auth login)
#   - Owner/Contributor access to an Azure subscription
#   - Admin access to the GitHub repository
#
# This script will:
#   1. Create a service principal for GitHub Actions
#   2. Assign required Azure roles
#   3. Create OIDC federated credentials for GitHub
#   4. Create Terraform state storage
#   5. Configure GitHub secrets
#   6. Create GitHub environments
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
GITHUB_REPO=""
SP_NAME="github-feature-toggle-deployer"
LOCATION="westeurope"
SKIP_GITHUB=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --github-repo)
            GITHUB_REPO="$2"
            shift 2
            ;;
        --sp-name)
            SP_NAME="$2"
            shift 2
            ;;
        --location)
            LOCATION="$2"
            shift 2
            ;;
        --skip-github)
            SKIP_GITHUB=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            head -35 "$0" | tail -32
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo "=== CI/CD Setup for Azure Feature Toggle Manager ==="
echo ""

# Check Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Azure CLI${NC}"
    echo "Run: az login"
    exit 1
fi

# Check GitHub CLI is installed (if not skipping GitHub)
if [[ "$SKIP_GITHUB" == "false" ]] && ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if logged in to GitHub (if not skipping GitHub)
if [[ "$SKIP_GITHUB" == "false" ]] && ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not logged in to GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get Azure account info
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)

echo -e "${BLUE}Azure Account:${NC}"
echo "  Subscription: $SUBSCRIPTION_NAME"
echo "  Subscription ID: $SUBSCRIPTION_ID"
echo "  Tenant ID: $TENANT_ID"
echo ""

# Auto-detect GitHub repo if not provided
if [[ -z "$GITHUB_REPO" ]] && [[ "$SKIP_GITHUB" == "false" ]]; then
    if git remote get-url origin &> /dev/null; then
        REMOTE_URL=$(git remote get-url origin)
        # Extract owner/repo from various formats
        if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
            GITHUB_REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
        fi
    fi
    
    if [[ -z "$GITHUB_REPO" ]]; then
        echo -e "${RED}Error: Could not auto-detect GitHub repository${NC}"
        echo "Please specify with: --github-repo owner/repo"
        exit 1
    fi
fi

if [[ "$SKIP_GITHUB" == "false" ]]; then
    echo -e "${BLUE}GitHub Repository:${NC} $GITHUB_REPO"
    echo ""
fi

# Summary of what will be done
echo -e "${BLUE}Configuration Summary:${NC}"
echo "  Service Principal: $SP_NAME"
echo "  Location: $LOCATION"
echo "  Skip GitHub: $SKIP_GITHUB"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}DRY RUN - No changes will be made${NC}"
    echo ""
fi

# Confirm before proceeding
read -p "Continue with setup? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# Function to run or show command
run_cmd() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} $*"
    else
        eval "$@"
    fi
}

# Step 1: Create or get service principal
echo -e "${BLUE}Step 1: Service Principal${NC}"

# Check if SP already exists
SP_CLIENT_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [[ -n "$SP_CLIENT_ID" ]]; then
    echo -e "${GREEN}Service principal already exists: $SP_NAME${NC}"
    echo "  Client ID: $SP_CLIENT_ID"
else
    echo "Creating service principal: $SP_NAME"
    if [[ "$DRY_RUN" == "false" ]]; then
        SP_OUTPUT=$(az ad sp create-for-rbac \
            --name "$SP_NAME" \
            --role Contributor \
            --scopes "/subscriptions/$SUBSCRIPTION_ID" \
            --query "{clientId:appId,tenantId:tenant}" \
            -o json)
        SP_CLIENT_ID=$(echo "$SP_OUTPUT" | jq -r '.clientId')
        echo -e "${GREEN}Created service principal${NC}"
        echo "  Client ID: $SP_CLIENT_ID"
    else
        echo -e "${YELLOW}[DRY RUN] Would create service principal${NC}"
        SP_CLIENT_ID="<client-id-placeholder>"
    fi
fi
echo ""

# Get the application object ID (needed for federated credentials)
if [[ "$DRY_RUN" == "false" ]] && [[ -n "$SP_CLIENT_ID" ]]; then
    SP_OBJECT_ID=$(az ad app show --id "$SP_CLIENT_ID" --query id -o tsv 2>/dev/null || echo "")
fi

# Step 2: Assign additional roles
echo -e "${BLUE}Step 2: Assign Additional Roles${NC}"

ROLES=(
    "Role Based Access Control Administrator"
    "Application Administrator"
)

for ROLE in "${ROLES[@]}"; do
    echo "Checking role: $ROLE"
    EXISTING=$(az role assignment list \
        --assignee "$SP_CLIENT_ID" \
        --role "$ROLE" \
        --scope "/subscriptions/$SUBSCRIPTION_ID" \
        --query "[0].id" -o tsv 2>/dev/null || echo "")
    
    if [[ -n "$EXISTING" ]]; then
        echo -e "  ${GREEN}Already assigned${NC}"
    else
        echo "  Assigning role..."
        run_cmd "az role assignment create \
            --assignee '$SP_CLIENT_ID' \
            --role '$ROLE' \
            --scope '/subscriptions/$SUBSCRIPTION_ID' > /dev/null"
        echo -e "  ${GREEN}Assigned${NC}"
    fi
done
echo ""

# Step 3: Create OIDC federated credentials
if [[ "$SKIP_GITHUB" == "false" ]]; then
    echo -e "${BLUE}Step 3: OIDC Federated Credentials${NC}"
    
    # Define credentials to create
    CREDENTIALS=(
        "github-main:ref:refs/heads/main"
        "github-production-env:environment:production"
        "github-staging-env:environment:staging"
    )
    
    for CRED in "${CREDENTIALS[@]}"; do
        IFS=':' read -r CRED_NAME CRED_TYPE CRED_VALUE <<< "$CRED"
        SUBJECT="repo:$GITHUB_REPO:$CRED_TYPE:$CRED_VALUE"
        
        echo "Checking credential: $CRED_NAME"
        
        # Check if credential exists
        if [[ "$DRY_RUN" == "false" ]]; then
            EXISTING=$(az ad app federated-credential list --id "$SP_CLIENT_ID" \
                --query "[?name=='$CRED_NAME'].id" -o tsv 2>/dev/null || echo "")
        else
            EXISTING=""
        fi
        
        if [[ -n "$EXISTING" ]]; then
            echo -e "  ${GREEN}Already exists${NC}"
        else
            echo "  Creating credential..."
            if [[ "$DRY_RUN" == "false" ]]; then
                az rest --method POST \
                    --uri "https://graph.microsoft.com/v1.0/applications/$SP_OBJECT_ID/federatedIdentityCredentials" \
                    --body "{
                        \"name\": \"$CRED_NAME\",
                        \"issuer\": \"https://token.actions.githubusercontent.com\",
                        \"subject\": \"$SUBJECT\",
                        \"audiences\": [\"api://AzureADTokenExchange\"]
                    }" > /dev/null
                echo -e "  ${GREEN}Created${NC}"
            else
                echo -e "  ${YELLOW}[DRY RUN] Would create credential${NC}"
            fi
        fi
    done
    echo ""
fi

# Step 4: Create Terraform state storage
echo -e "${BLUE}Step 4: Terraform State Storage${NC}"

TF_STATE_RG="rg-terraform-state"
STORAGE_NAME_PREFIX="stfeaturetogglestate"

# Check if resource group exists
RG_EXISTS=$(az group exists --name "$TF_STATE_RG")

if [[ "$RG_EXISTS" == "true" ]]; then
    echo -e "${GREEN}Resource group already exists: $TF_STATE_RG${NC}"
    # Get existing storage account
    STORAGE_NAME=$(az storage account list --resource-group "$TF_STATE_RG" \
        --query "[?starts_with(name, '$STORAGE_NAME_PREFIX')].name" -o tsv | head -1)
    if [[ -n "$STORAGE_NAME" ]]; then
        echo -e "${GREEN}Storage account already exists: $STORAGE_NAME${NC}"
    fi
else
    echo "Creating resource group: $TF_STATE_RG"
    run_cmd "az group create --name '$TF_STATE_RG' --location '$LOCATION' > /dev/null"
fi

if [[ -z "${STORAGE_NAME:-}" ]]; then
    # Generate unique storage name
    STORAGE_SUFFIX=$(openssl rand -hex 2)
    STORAGE_NAME="${STORAGE_NAME_PREFIX}${STORAGE_SUFFIX}"
    
    echo "Creating storage account: $STORAGE_NAME"
    if [[ "$DRY_RUN" == "false" ]]; then
        az storage account create \
            --name "$STORAGE_NAME" \
            --resource-group "$TF_STATE_RG" \
            --location "$LOCATION" \
            --sku Standard_LRS \
            --kind StorageV2 > /dev/null
        echo -e "${GREEN}Created storage account${NC}"
        
        echo "Creating blob container: tfstate"
        az storage container create \
            --name tfstate \
            --account-name "$STORAGE_NAME" \
            --auth-mode login > /dev/null
        echo -e "${GREEN}Created blob container${NC}"
    else
        echo -e "${YELLOW}[DRY RUN] Would create storage account${NC}"
    fi
fi

# Grant storage access to service principal
echo "Granting storage access to service principal..."
STORAGE_SCOPE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$TF_STATE_RG/providers/Microsoft.Storage/storageAccounts/$STORAGE_NAME"

EXISTING=$(az role assignment list \
    --assignee "$SP_CLIENT_ID" \
    --role "Storage Blob Data Contributor" \
    --scope "$STORAGE_SCOPE" \
    --query "[0].id" -o tsv 2>/dev/null || echo "")

if [[ -n "$EXISTING" ]]; then
    echo -e "${GREEN}Storage access already granted${NC}"
else
    run_cmd "az role assignment create \
        --assignee '$SP_CLIENT_ID' \
        --role 'Storage Blob Data Contributor' \
        --scope '$STORAGE_SCOPE' > /dev/null"
    echo -e "${GREEN}Storage access granted${NC}"
fi
echo ""

# Step 5: Configure GitHub secrets
if [[ "$SKIP_GITHUB" == "false" ]]; then
    echo -e "${BLUE}Step 5: GitHub Secrets${NC}"
    
    SECRETS=(
        "AZURE_CLIENT_ID:$SP_CLIENT_ID"
        "AZURE_TENANT_ID:$TENANT_ID"
        "AZURE_SUBSCRIPTION_ID:$SUBSCRIPTION_ID"
        "TF_STATE_RESOURCE_GROUP:$TF_STATE_RG"
        "TF_STATE_STORAGE_ACCOUNT:$STORAGE_NAME"
    )
    
    for SECRET in "${SECRETS[@]}"; do
        IFS=':' read -r SECRET_NAME SECRET_VALUE <<< "$SECRET"
        echo "Setting secret: $SECRET_NAME"
        if [[ "$DRY_RUN" == "false" ]]; then
            gh secret set "$SECRET_NAME" --body "$SECRET_VALUE" --repo "$GITHUB_REPO"
            echo -e "  ${GREEN}Set${NC}"
        else
            echo -e "  ${YELLOW}[DRY RUN] Would set to: ${SECRET_VALUE:0:20}...${NC}"
        fi
    done
    echo ""
    
    # Step 6: Create GitHub environments
    echo -e "${BLUE}Step 6: GitHub Environments${NC}"
    
    ENVIRONMENTS=("production" "staging")
    
    for ENV in "${ENVIRONMENTS[@]}"; do
        echo "Creating environment: $ENV"
        if [[ "$DRY_RUN" == "false" ]]; then
            gh api "repos/$GITHUB_REPO/environments/$ENV" --method PUT > /dev/null 2>&1 || true
            echo -e "  ${GREEN}Created${NC}"
        else
            echo -e "  ${YELLOW}[DRY RUN] Would create environment${NC}"
        fi
    done
    echo ""
fi

# Summary
echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo -e "${BLUE}Azure Resources:${NC}"
echo "  Service Principal: $SP_NAME"
echo "  Service Principal Client ID: $SP_CLIENT_ID"
echo "  Terraform State RG: $TF_STATE_RG"
echo "  Terraform State Storage: $STORAGE_NAME"
echo ""

if [[ "$SKIP_GITHUB" == "false" ]]; then
    echo -e "${BLUE}GitHub Configuration:${NC}"
    echo "  Repository: $GITHUB_REPO"
    echo "  Secrets configured: AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID,"
    echo "                      TF_STATE_RESOURCE_GROUP, TF_STATE_STORAGE_ACCOUNT"
    echo "  Environments: production, staging"
    echo ""
fi

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Push code to trigger CI workflow"
echo "  2. Run 'Deploy to Azure' workflow from GitHub Actions"
echo "  3. Grant admin consent: ./scripts/grant-admin-consent.sh"
echo ""

# Save configuration for reference
CONFIG_FILE=".cicd-config.json"
if [[ "$DRY_RUN" == "false" ]]; then
    cat > "$CONFIG_FILE" << EOF
{
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "azure": {
    "subscription_id": "$SUBSCRIPTION_ID",
    "tenant_id": "$TENANT_ID",
    "service_principal_name": "$SP_NAME",
    "service_principal_client_id": "$SP_CLIENT_ID",
    "terraform_state_rg": "$TF_STATE_RG",
    "terraform_state_storage": "$STORAGE_NAME"
  },
  "github": {
    "repository": "$GITHUB_REPO"
  }
}
EOF
    echo -e "${GREEN}Configuration saved to: $CONFIG_FILE${NC}"
fi
