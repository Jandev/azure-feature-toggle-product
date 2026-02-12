# Terraform Outputs
# All outputs marked sensitive to prevent exposure in CI logs

# Container App
output "container_app_url" {
  description = "URL of the deployed Container App"
  value       = "https://${azurerm_container_app.main.ingress[0].fqdn}"
  sensitive   = true
}

output "container_app_name" {
  description = "Name of the Container App"
  value       = azurerm_container_app.main.name
  sensitive   = true
}

# Azure AD App Registration
output "client_id" {
  description = "Azure AD Application (Client) ID"
  value       = azuread_application.main.client_id
  sensitive   = true
}

output "tenant_id" {
  description = "Azure AD Tenant ID"
  value       = var.tenant_id
  sensitive   = true
}

output "app_id_uri" {
  description = "Application ID URI for the API"
  value       = "api://${azuread_application.main.client_id}"
  sensitive   = true
}

output "client_secret_name" {
  description = "Name of the client secret (value is sensitive)"
  value       = azuread_application_password.main.display_name
  sensitive   = true
}

# Key Vault
output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
  sensitive   = true
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
  sensitive   = true
}

output "managed_identity_name" {
  description = "Name of the managed identity used by Container App"
  value       = azurerm_user_assigned_identity.container_app.name
  sensitive   = true
}

output "managed_identity_client_id" {
  description = "Client ID of the managed identity"
  value       = azurerm_user_assigned_identity.container_app.client_id
  sensitive   = true
}

# Note: The actual client secret value is stored in Key Vault
# and should not be output for security reasons

# Resource Group
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
  sensitive   = true
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
  sensitive   = true
}

# Summary output for easy copy-paste
output "summary" {
  description = "Summary of deployed resources"
  sensitive   = true
  value       = <<-EOT
    
    ============================================
    Azure Feature Toggle Manager - Deployed
    ============================================
    
    Application URL: https://${azurerm_container_app.main.ingress[0].fqdn}
    
    Azure AD Configuration:
      Tenant ID:   ${var.tenant_id}
      Client ID:   ${azuread_application.main.client_id}
      App ID URI:  api://${azuread_application.main.client_id}
    
    Container Image:
      Image: ${var.ghcr_image}
    
    Key Vault:
      Name: ${azurerm_key_vault.main.name}
      URI:  ${azurerm_key_vault.main.vault_uri}
    
    Managed Identity:
      Name:      ${azurerm_user_assigned_identity.container_app.name}
      Client ID: ${azurerm_user_assigned_identity.container_app.client_id}
    
    Next Steps:
    1. Grant admin consent for API permissions in Azure Portal
       https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/CallAnAPI/appId/${azuread_application.main.client_id}
    
    2. Assign Azure RBAC roles to users:
       - Reader on subscription (for resource discovery)
       - App Configuration Data Owner on App Config resources
    
    ============================================
  EOT
}
