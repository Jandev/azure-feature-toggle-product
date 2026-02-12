#!/usr/bin/env bash
#
# Grant admin consent for Azure AD application API permissions
#
# Usage:
#   ./scripts/grant-admin-consent.sh [--app-name NAME]
#
# Options:
#   --app-name NAME   Name of the Azure AD application (default: auto-detect from terraform)
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Application Administrator or Global Administrator role
#
# The script will:
#   1. Find the application by name (or from Terraform output)
#   2. Grant admin consent for all configured API permissions
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
APP_NAME=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --app-name)
            APP_NAME="$2"
            shift 2
            ;;
        -h|--help)
            head -20 "$0" | tail -16
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo "=== Grant Admin Consent for Azure AD Application ==="
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
echo "Logged in as: $CURRENT_USER"
echo "Tenant ID: $TENANT_ID"
echo ""

# Try to find the application
if [[ -z "$APP_NAME" ]]; then
    # Try to get from Terraform output
    if [[ -d "terraform" ]] && command -v terraform &> /dev/null; then
        echo "Attempting to get app client ID from Terraform..."
        CLIENT_ID=$(cd terraform && terraform output -raw azure_ad_client_id 2>/dev/null || echo "")
        if [[ -n "$CLIENT_ID" ]]; then
            echo -e "${GREEN}Found client ID from Terraform: $CLIENT_ID${NC}"
        fi
    fi
    
    # If still not found, look for common app names
    if [[ -z "${CLIENT_ID:-}" ]]; then
        echo "Searching for Azure AD applications..."
        # Search for applications with common project names
        for name in "FeatureFlagToggler" "Azure Feature Toggle" "feature-toggle"; do
            CLIENT_ID=$(az ad app list --display-name "$name" --query "[0].appId" -o tsv 2>/dev/null || echo "")
            if [[ -n "$CLIENT_ID" ]]; then
                APP_NAME="$name"
                echo -e "${GREEN}Found application: $name${NC}"
                break
            fi
        done
    fi
else
    # Get client ID from provided app name
    CLIENT_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")
fi

if [[ -z "${CLIENT_ID:-}" ]]; then
    echo -e "${RED}Error: Could not find Azure AD application${NC}"
    echo ""
    echo "Please specify the application name:"
    echo "  $0 --app-name \"Your App Name\""
    echo ""
    echo "Or list your applications:"
    echo "  az ad app list --query \"[].{name:displayName, appId:appId}\" -o table"
    exit 1
fi

# Get application details
echo ""
echo "Application Details:"
APP_INFO=$(az ad app show --id "$CLIENT_ID" --query "{name:displayName, appId:appId, objectId:id}" -o json)
APP_DISPLAY_NAME=$(echo "$APP_INFO" | jq -r '.name')
APP_OBJECT_ID=$(echo "$APP_INFO" | jq -r '.objectId')
echo "  Display Name: $APP_DISPLAY_NAME"
echo "  Client ID: $CLIENT_ID"
echo "  Object ID: $APP_OBJECT_ID"
echo ""

# List current API permissions
echo "Configured API Permissions:"
az ad app show --id "$CLIENT_ID" --query "requiredResourceAccess[].{api:resourceAppId, permissions:resourceAccess[].id}" -o json | jq -r '
    .[] | 
    "  API: \(.api)\n    Permissions: \(.permissions | join(", "))"
'
echo ""

# Confirm before proceeding
echo -e "${YELLOW}This will grant admin consent for all API permissions configured on this application.${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Grant admin consent
echo ""
echo "Granting admin consent..."
if az ad app permission admin-consent --id "$CLIENT_ID"; then
    echo ""
    echo -e "${GREEN}Admin consent granted successfully!${NC}"
    echo ""
    echo "The following permissions have been consented:"
    echo "  - Microsoft Graph: User.Read, openid, profile, email"
    echo "  - Azure Service Management: user_impersonation"
    echo "  - Azure App Configuration: KeyValue.Read, KeyValue.Write"
else
    echo ""
    echo -e "${RED}Failed to grant admin consent${NC}"
    echo ""
    echo "You may need:"
    echo "  1. Application Administrator or Global Administrator role"
    echo "  2. Or ask your tenant admin to grant consent via Azure Portal:"
    echo "     https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/$CLIENT_ID"
    exit 1
fi
