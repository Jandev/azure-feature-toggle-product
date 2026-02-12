#!/usr/bin/env bash
#
# Set up Azure AD application for local development
#
# Usage:
#   ./scripts/setup-azure-ad.sh [OPTIONS]
#
# Options:
#   --app-name NAME        Application display name
#                          Default: FeatureFlagToggler
#   --skip-env-files       Skip creating .env files
#   --dry-run              Show what would be done without making changes
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Application Administrator role (to create app registrations)
#
# This script will:
#   1. Create an Azure AD application registration
#   2. Configure SPA redirect URIs for local development
#   3. Set up required API permissions
#   4. Create a service principal
#   5. Grant admin consent (if you have the permissions)
#   6. Create local .env files with the configuration
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
APP_NAME="FeatureFlagToggler"
SKIP_ENV_FILES=false
DRY_RUN=false

# Well-known API IDs
MICROSOFT_GRAPH_API_ID="00000003-0000-0000-c000-000000000000"
AZURE_SERVICE_MGMT_API_ID="797f4846-ba00-4fd7-ba43-dac1f8f63013"
AZURE_APP_CONFIG_API_ID="35ffadb3-7fc1-497e-b61b-381d28e744cc"

# Permission IDs
GRAPH_USER_READ="e1fe6dd8-ba31-4d61-89e7-88639da4683d"
GRAPH_OPENID="37f7f235-527c-4136-accd-4a02d197296e"
GRAPH_PROFILE="14dad69e-099b-42c9-810b-d002981feec1"
GRAPH_EMAIL="64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0"
AZURE_MGMT_USER_IMPERSONATION="41094075-9dad-400e-a0bd-54e686782033"
APPCONFIG_KEYVALUE_READ="8d17f7f7-030c-4b57-8129-cfb5a16433cd"
APPCONFIG_KEYVALUE_WRITE="77967a14-4f88-4960-84da-e8f71f761ac2"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --app-name)
            APP_NAME="$2"
            shift 2
            ;;
        --skip-env-files)
            SKIP_ENV_FILES=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            head -28 "$0" | tail -25
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo "=== Azure AD Setup for Local Development ==="
echo ""

# Check Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Azure CLI${NC}"
    echo "Run: az login"
    exit 1
fi

# Get current user info
CURRENT_USER=$(az ad signed-in-user show --query userPrincipalName -o tsv 2>/dev/null || echo "unknown")
TENANT_ID=$(az account show --query tenantId -o tsv)
TENANT_NAME=$(az account show --query tenantDisplayName -o tsv 2>/dev/null || echo "unknown")

echo -e "${BLUE}Azure Account:${NC}"
echo "  Logged in as: $CURRENT_USER"
echo "  Tenant ID: $TENANT_ID"
echo "  Tenant Name: $TENANT_NAME"
echo ""

echo -e "${BLUE}Configuration:${NC}"
echo "  Application Name: $APP_NAME"
echo "  Skip .env files: $SKIP_ENV_FILES"
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

# Step 1: Check if application already exists
echo -e "${BLUE}Step 1: Check for Existing Application${NC}"

CLIENT_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [[ -n "$CLIENT_ID" ]]; then
    echo -e "${GREEN}Application already exists: $APP_NAME${NC}"
    echo "  Client ID: $CLIENT_ID"
    APP_OBJECT_ID=$(az ad app show --id "$CLIENT_ID" --query id -o tsv)
    echo "  Object ID: $APP_OBJECT_ID"
    
    read -p "Update existing application? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping application update."
        SKIP_APP_UPDATE=true
    else
        SKIP_APP_UPDATE=false
    fi
else
    SKIP_APP_UPDATE=false
    echo "No existing application found."
fi
echo ""

# Step 2: Create or update application
if [[ "${SKIP_APP_UPDATE:-false}" == "false" ]]; then
    echo -e "${BLUE}Step 2: Create/Update Application${NC}"
    
    # Build the required resource access JSON
    REQUIRED_RESOURCE_ACCESS='[
        {
            "resourceAppId": "'$MICROSOFT_GRAPH_API_ID'",
            "resourceAccess": [
                {"id": "'$GRAPH_USER_READ'", "type": "Scope"},
                {"id": "'$GRAPH_OPENID'", "type": "Scope"},
                {"id": "'$GRAPH_PROFILE'", "type": "Scope"},
                {"id": "'$GRAPH_EMAIL'", "type": "Scope"}
            ]
        },
        {
            "resourceAppId": "'$AZURE_SERVICE_MGMT_API_ID'",
            "resourceAccess": [
                {"id": "'$AZURE_MGMT_USER_IMPERSONATION'", "type": "Scope"}
            ]
        },
        {
            "resourceAppId": "'$AZURE_APP_CONFIG_API_ID'",
            "resourceAccess": [
                {"id": "'$APPCONFIG_KEYVALUE_READ'", "type": "Scope"},
                {"id": "'$APPCONFIG_KEYVALUE_WRITE'", "type": "Scope"}
            ]
        }
    ]'
    
    if [[ -z "${CLIENT_ID:-}" ]]; then
        echo "Creating new application..."
        if [[ "$DRY_RUN" == "false" ]]; then
            # Create the application
            APP_OUTPUT=$(az ad app create \
                --display-name "$APP_NAME" \
                --sign-in-audience "AzureADMyOrg" \
                --query "{appId:appId,id:id}" \
                -o json)
            
            CLIENT_ID=$(echo "$APP_OUTPUT" | jq -r '.appId')
            APP_OBJECT_ID=$(echo "$APP_OUTPUT" | jq -r '.id')
            
            echo -e "${GREEN}Application created${NC}"
            echo "  Client ID: $CLIENT_ID"
            echo "  Object ID: $APP_OBJECT_ID"
        else
            echo -e "${YELLOW}[DRY RUN] Would create application${NC}"
            CLIENT_ID="<client-id-placeholder>"
            APP_OBJECT_ID="<object-id-placeholder>"
        fi
    fi
    
    # Update redirect URIs
    echo "Configuring SPA redirect URIs..."
    if [[ "$DRY_RUN" == "false" ]]; then
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
            }' > /dev/null
        echo -e "${GREEN}Redirect URIs configured${NC}"
    else
        echo -e "${YELLOW}[DRY RUN] Would configure redirect URIs${NC}"
    fi
    
    # Update API permissions
    echo "Configuring API permissions..."
    if [[ "$DRY_RUN" == "false" ]]; then
        az rest --method PATCH \
            --uri "https://graph.microsoft.com/v1.0/applications/$APP_OBJECT_ID" \
            --headers "Content-Type=application/json" \
            --body "{\"requiredResourceAccess\": $REQUIRED_RESOURCE_ACCESS}" > /dev/null
        echo -e "${GREEN}API permissions configured${NC}"
    else
        echo -e "${YELLOW}[DRY RUN] Would configure API permissions${NC}"
    fi
    
    # Set Application ID URI
    echo "Setting Application ID URI..."
    sleep 5  # Wait for Azure AD replication
    if [[ "$DRY_RUN" == "false" ]]; then
        for i in 1 2 3; do
            if az ad app update --id "$CLIENT_ID" --identifier-uris "api://$CLIENT_ID" 2>/dev/null; then
                echo -e "${GREEN}Application ID URI set${NC}"
                break
            fi
            echo "  Retry $i..."
            sleep 5
        done
    else
        echo -e "${YELLOW}[DRY RUN] Would set Application ID URI${NC}"
    fi
fi
echo ""

# Step 3: Create service principal
echo -e "${BLUE}Step 3: Service Principal${NC}"

SP_ID=$(az ad sp list --filter "appId eq '$CLIENT_ID'" --query "[0].id" -o tsv 2>/dev/null || echo "")

if [[ -n "$SP_ID" ]]; then
    echo -e "${GREEN}Service principal already exists${NC}"
    echo "  Service Principal ID: $SP_ID"
else
    echo "Creating service principal..."
    if [[ "$DRY_RUN" == "false" ]]; then
        SP_OUTPUT=$(az ad sp create --id "$CLIENT_ID" --query id -o tsv)
        SP_ID="$SP_OUTPUT"
        echo -e "${GREEN}Service principal created${NC}"
        echo "  Service Principal ID: $SP_ID"
    else
        echo -e "${YELLOW}[DRY RUN] Would create service principal${NC}"
        SP_ID="<sp-id-placeholder>"
    fi
fi
echo ""

# Step 4: Grant admin consent
echo -e "${BLUE}Step 4: Admin Consent${NC}"

echo "Attempting to grant admin consent..."
if [[ "$DRY_RUN" == "false" ]]; then
    if az ad app permission admin-consent --id "$CLIENT_ID" 2>/dev/null; then
        echo -e "${GREEN}Admin consent granted${NC}"
    else
        echo -e "${YELLOW}Could not grant admin consent automatically${NC}"
        echo "You may need to:"
        echo "  1. Have Application Administrator or Global Administrator role"
        echo "  2. Run: ./scripts/grant-admin-consent.sh"
        echo "  3. Or grant consent via Azure Portal"
    fi
else
    echo -e "${YELLOW}[DRY RUN] Would attempt to grant admin consent${NC}"
fi
echo ""

# Step 5: Assign current user
echo -e "${BLUE}Step 5: User Assignment${NC}"

CURRENT_USER_ID=$(az ad signed-in-user show --query id -o tsv 2>/dev/null || echo "")

if [[ -n "$CURRENT_USER_ID" ]]; then
    echo "Assigning current user to application..."
    if [[ "$DRY_RUN" == "false" ]]; then
        # Check if already assigned
        EXISTING=$(az rest --method GET \
            --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignedTo" \
            --query "value[?principalId=='$CURRENT_USER_ID'].id" -o tsv 2>/dev/null || echo "")
        
        if [[ -n "$EXISTING" ]]; then
            echo -e "${GREEN}User already assigned${NC}"
        else
            az rest --method POST \
                --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignedTo" \
                --body "{
                    \"principalId\": \"$CURRENT_USER_ID\",
                    \"resourceId\": \"$SP_ID\",
                    \"appRoleId\": \"00000000-0000-0000-0000-000000000000\"
                }" > /dev/null 2>&1 || true
            echo -e "${GREEN}User assigned${NC}"
        fi
    else
        echo -e "${YELLOW}[DRY RUN] Would assign current user${NC}"
    fi
else
    echo -e "${YELLOW}Could not get current user ID${NC}"
fi
echo ""

# Step 6: Create .env files
if [[ "$SKIP_ENV_FILES" == "false" ]]; then
    echo -e "${BLUE}Step 6: Create .env Files${NC}"
    
    # Frontend .env.local
    FRONTEND_ENV="frontend/.env.local"
    echo "Creating $FRONTEND_ENV..."
    if [[ "$DRY_RUN" == "false" ]]; then
        cat > "$FRONTEND_ENV" << EOF
VITE_AZURE_CLIENT_ID=$CLIENT_ID
VITE_AZURE_TENANT_ID=$TENANT_ID
VITE_API_BASE_URL=http://localhost:5000
EOF
        echo -e "${GREEN}Created $FRONTEND_ENV${NC}"
    else
        echo -e "${YELLOW}[DRY RUN] Would create $FRONTEND_ENV${NC}"
    fi
    
    # Backend appsettings.Development.json
    BACKEND_SETTINGS="backend/appsettings.Development.json"
    echo "Creating $BACKEND_SETTINGS..."
    if [[ "$DRY_RUN" == "false" ]]; then
        cat > "$BACKEND_SETTINGS" << EOF
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "$TENANT_ID",
    "ClientId": "$CLIENT_ID",
    "Audience": "$CLIENT_ID"
  }
}
EOF
        echo -e "${GREEN}Created $BACKEND_SETTINGS${NC}"
    else
        echo -e "${YELLOW}[DRY RUN] Would create $BACKEND_SETTINGS${NC}"
    fi
fi
echo ""

# Summary
echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo -e "${BLUE}Application Details:${NC}"
echo "  Display Name: $APP_NAME"
echo "  Client ID: $CLIENT_ID"
echo "  Object ID: ${APP_OBJECT_ID:-unknown}"
echo "  Service Principal ID: ${SP_ID:-unknown}"
echo "  Tenant ID: $TENANT_ID"
echo ""
echo -e "${BLUE}API Permissions:${NC}"
echo "  Microsoft Graph: User.Read, openid, profile, email"
echo "  Azure Service Management: user_impersonation"
echo "  Azure App Configuration: KeyValue.Read, KeyValue.Write"
echo ""
echo -e "${BLUE}Redirect URIs:${NC}"
echo "  http://localhost:5173"
echo "  http://localhost:5173/auth/callback"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start the backend: cd backend && dotnet run"
echo "  2. Start the frontend: cd frontend && npm run dev"
echo "  3. Open http://localhost:5173 and sign in"
echo ""

# Save configuration
CONFIG_FILE=".azure-ad-config.json"
if [[ "$DRY_RUN" == "false" ]]; then
    cat > "$CONFIG_FILE" << EOF
{
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "app_name": "$APP_NAME",
  "client_id": "$CLIENT_ID",
  "object_id": "${APP_OBJECT_ID:-}",
  "service_principal_id": "${SP_ID:-}",
  "tenant_id": "$TENANT_ID"
}
EOF
    echo -e "${GREEN}Configuration saved to: $CONFIG_FILE${NC}"
fi
