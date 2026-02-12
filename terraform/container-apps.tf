# Azure Container Apps Environment and Container App

# Log Analytics Workspace (required for Container Apps)
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.name_prefix}-${local.resource_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = local.common_tags
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${local.name_prefix}-${local.resource_suffix}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = local.common_tags
}

# Container App
resource "azurerm_container_app" "main" {
  name                         = "ca-${local.name_prefix}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  tags = local.common_tags

  # User-assigned managed identity for Key Vault access
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_app.id]
  }

  # Note: Using public ghcr.io image - no registry credentials needed
  # If using a private ghcr.io package, add registry credentials here

  # Client secret from Key Vault using managed identity
  secret {
    name                = "azure-ad-client-secret"
    key_vault_secret_id = azurerm_key_vault_secret.client_secret.versionless_id
    identity            = azurerm_user_assigned_identity.container_app.id
  }

  ingress {
    external_enabled = true
    target_port      = 5173
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = var.project_name
      image  = var.ghcr_image
      cpu    = var.container_cpu
      memory = var.container_memory

      env {
        name  = "AzureAd__Instance"
        value = "https://login.microsoftonline.com/"
      }

      env {
        name  = "AzureAd__TenantId"
        value = var.tenant_id
      }

      env {
        name  = "AzureAd__ClientId"
        value = azuread_application.main.client_id
      }

      env {
        name        = "AzureAd__ClientSecret"
        secret_name = "azure-ad-client-secret"
      }

      # Health probes
      liveness_probe {
        transport        = "HTTP"
        path             = "/api/health"
        port             = 5173
        interval_seconds = 30
      }

      readiness_probe {
        transport        = "HTTP"
        path             = "/api/health"
        port             = 5173
        interval_seconds = 10
      }
    }
  }

  depends_on = [
    azurerm_key_vault_secret.client_secret,
    azurerm_role_assignment.container_app_kv_reader
  ]
}
