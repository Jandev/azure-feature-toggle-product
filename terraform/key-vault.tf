# Azure Key Vault for secure secret storage

resource "azurerm_key_vault" "main" {
  name                       = "kv-${var.project_name}-${local.resource_suffix}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = var.key_vault_soft_delete_days
  purge_protection_enabled   = var.key_vault_purge_protection

  # Enable RBAC for access control (recommended over access policies)
  enable_rbac_authorization = true

  tags = local.common_tags
}

# Store the Azure AD client secret in Key Vault
resource "azurerm_key_vault_secret" "client_secret" {
  name         = "azure-ad-client-secret"
  value        = azuread_application_password.main.value
  key_vault_id = azurerm_key_vault.main.id

  # Wait for RBAC role assignment before creating secret
  depends_on = [azurerm_role_assignment.terraform_kv_admin]

  tags = local.common_tags
}

# Role assignment for Terraform to manage Key Vault secrets
resource "azurerm_role_assignment" "terraform_kv_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# User-assigned managed identity for Container App
resource "azurerm_user_assigned_identity" "container_app" {
  name                = "id-${local.name_prefix}-${local.resource_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = local.common_tags
}

# Grant the managed identity access to read secrets from Key Vault
resource "azurerm_role_assignment" "container_app_kv_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.container_app.principal_id
}
