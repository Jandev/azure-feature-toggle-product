#!/bin/bash

# Azure Feature Toggle Tool - Setup Script
# This script helps you configure the application for first-time use

set -e

echo "=========================================="
echo "Azure Feature Toggle Tool - Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v dotnet &> /dev/null; then
    echo "ERROR: .NET SDK 10.0+ is required but not installed."
    echo "Please install from: https://dotnet.microsoft.com/download"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js 18+ is required but not installed."
    echo "Please install from: https://nodejs.org/"
    exit 1
fi

echo "✓ Prerequisites found"
echo ""

# Backend Setup
echo "=========================================="
echo "Backend Setup"
echo "=========================================="
echo ""

cd backend

echo "Initializing user secrets (if not already done)..."
dotnet user-secrets init 2>/dev/null || echo "User secrets already initialized"

echo ""
read -p "Enter your Azure AD Tenant ID: " TENANT_ID
read -p "Enter your Azure AD Client ID: " CLIENT_ID

echo ""
echo "Setting user secrets..."
dotnet user-secrets set "AzureAd:TenantId" "$TENANT_ID"
dotnet user-secrets set "AzureAd:ClientId" "$CLIENT_ID"

echo ""
echo "Restoring backend dependencies..."
dotnet restore

echo ""
echo "Building backend..."
dotnet build

echo ""
echo "✓ Backend setup complete!"
echo ""

cd ..

# Frontend Setup
echo "=========================================="
echo "Frontend Setup"
echo "=========================================="
echo ""

cd frontend

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from template..."
    cp .env.example .env.local
    
    # Update .env.local with values
    sed -i.bak "s/your-client-id-here/$CLIENT_ID/g" .env.local
    sed -i.bak "s/your-tenant-id-here/$TENANT_ID/g" .env.local
    rm .env.local.bak
    
    echo "✓ Created .env.local"
else
    echo "⚠ .env.local already exists, skipping..."
fi

echo ""
echo "Installing frontend dependencies..."
npm install

echo ""
echo "✓ Frontend setup complete!"
echo ""

cd ..

# Summary
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  dotnet run"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "User Secrets Location:"
echo "  ~/.microsoft/usersecrets/$(grep UserSecretsId backend/AzureFeatureToggleApi.csproj | sed 's/.*<UserSecretsId>//;s/<\/UserSecretsId>.*//')/secrets.json"
echo ""
echo "To manage user secrets:"
echo "  cd backend"
echo "  dotnet user-secrets list"
echo "  dotnet user-secrets set \"AzureAd:TenantId\" \"new-value\""
echo "  dotnet user-secrets remove \"AzureAd:TenantId\""
echo "  dotnet user-secrets clear"
echo ""
