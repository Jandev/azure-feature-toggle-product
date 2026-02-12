# Azure AD App Registration

# Well-known Microsoft API IDs
locals {
  microsoft_graph_api_id          = "00000003-0000-0000-c000-000000000000"
  azure_service_management_api_id = "797f4846-ba00-4fd7-ba43-dac1f8f63013"
  azure_app_configuration_api_id  = "35ffadb3-7fc1-497e-b61b-381d28e744cc"

  # Microsoft Graph delegated permission IDs
  graph_user_read_id = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"
  graph_openid_id    = "37f7f235-527c-4136-accd-4a02d197296e"
  graph_profile_id   = "14dad69e-099b-42c9-810b-d002981feec1"
  graph_email_id     = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0"

  # Azure Service Management delegated permission ID
  azure_mgmt_user_impersonation_id = "41094075-9dad-400e-a0bd-54e686782033"

  # Azure App Configuration delegated permission IDs
  appconfig_keyvalue_read_id  = "8d17f7f7-030c-4b57-8129-cfb5a16433cd"
  appconfig_keyvalue_write_id = "77967a14-4f88-4960-84da-e8f71f761ac2"
}

# Generate a unique scope ID
resource "random_uuid" "access_as_user_scope" {}

# Azure AD Application
resource "azuread_application" "main" {
  display_name     = var.app_display_name
  sign_in_audience = "AzureADMyOrg"

  # Expose an API with access_as_user scope
  api {
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Allows the application to access Azure Feature Toggle Manager on behalf of the signed-in user."
      admin_consent_display_name = "Access Azure Feature Toggle Manager"
      enabled                    = true
      id                         = random_uuid.access_as_user_scope.result
      type                       = "User"
      user_consent_description   = "Allow the application to access Azure Feature Toggle Manager on your behalf."
      user_consent_display_name  = "Access Azure Feature Toggle Manager"
      value                      = "access_as_user"
    }
  }

  # SPA configuration with redirect URIs
  # The Container App URL will be added after it's created
  single_page_application {
    redirect_uris = var.additional_redirect_uris
  }

  # Microsoft Graph API permissions (delegated)
  required_resource_access {
    resource_app_id = local.microsoft_graph_api_id

    resource_access {
      id   = local.graph_user_read_id
      type = "Scope"
    }
    resource_access {
      id   = local.graph_openid_id
      type = "Scope"
    }
    resource_access {
      id   = local.graph_profile_id
      type = "Scope"
    }
    resource_access {
      id   = local.graph_email_id
      type = "Scope"
    }
  }

  # Azure Service Management API permissions (delegated)
  required_resource_access {
    resource_app_id = local.azure_service_management_api_id

    resource_access {
      id   = local.azure_mgmt_user_impersonation_id
      type = "Scope"
    }
  }

  # Azure App Configuration API permissions (delegated)
  required_resource_access {
    resource_app_id = local.azure_app_configuration_api_id

    resource_access {
      id   = local.appconfig_keyvalue_read_id
      type = "Scope"
    }
    resource_access {
      id   = local.appconfig_keyvalue_write_id
      type = "Scope"
    }
  }

  # Web configuration for client credentials (OBO flow)
  web {
    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = false
    }
  }

  # Set the Application ID URI
  identifier_uris = ["api://${random_uuid.app_id_placeholder.result}"]

  lifecycle {
    ignore_changes = [identifier_uris]
  }
}

# Placeholder for Application ID URI (will be updated after creation)
resource "random_uuid" "app_id_placeholder" {}

# Update the Application ID URI to use the actual client ID
resource "null_resource" "update_app_id_uri" {
  triggers = {
    app_id = azuread_application.main.client_id
  }

  provisioner "local-exec" {
    command = <<-EOT
      az ad app update \
        --id ${azuread_application.main.client_id} \
        --identifier-uris "api://${azuread_application.main.client_id}"
    EOT
  }

  depends_on = [azuread_application.main]
}

# Service Principal for the application
resource "azuread_service_principal" "main" {
  client_id                    = azuread_application.main.client_id
  app_role_assignment_required = false

  feature_tags {
    enterprise = true
    gallery    = false
  }
}

# Client Secret for the application (required for OBO flow)
resource "azuread_application_password" "main" {
  application_id = azuread_application.main.id
  display_name   = "Terraform managed - ${var.environment}"
  end_date       = timeadd(timestamp(), "8760h") # 1 year

  lifecycle {
    ignore_changes = [end_date]
  }
}

# Update redirect URIs after Container App is created
resource "null_resource" "update_redirect_uris" {
  triggers = {
    container_app_fqdn = azurerm_container_app.main.latest_revision_fqdn
    app_id             = azuread_application.main.client_id
  }

  provisioner "local-exec" {
    command = <<-EOT
      # Get the Container App URL
      CONTAINER_APP_URL="https://${azurerm_container_app.main.ingress[0].fqdn}"
      
      # Build the redirect URIs list
      REDIRECT_URIS=$(cat <<EOF
      [
        "$CONTAINER_APP_URL",
        ${join(",\n        ", formatlist("\"%s\"", var.additional_redirect_uris))}
      ]
      EOF
      )
      
      # Update the app registration with the new redirect URIs
      az ad app update \
        --id ${azuread_application.main.client_id} \
        --set spa/redirectUris="$REDIRECT_URIS"
    EOT
  }

  depends_on = [
    azurerm_container_app.main,
    azuread_application.main
  ]
}

# Grant admin consent for API permissions (optional - may require elevated privileges)
# Uncomment if you have the necessary permissions
# resource "null_resource" "grant_admin_consent" {
#   triggers = {
#     app_id = azuread_application.main.client_id
#   }
#
#   provisioner "local-exec" {
#     command = <<-EOT
#       az ad app permission admin-consent --id ${azuread_application.main.client_id}
#     EOT
#   }
#
#   depends_on = [
#     azuread_service_principal.main,
#     null_resource.update_redirect_uris
#   ]
# }
