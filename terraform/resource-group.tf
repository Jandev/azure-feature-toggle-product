# Resource Group

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.name_prefix}-${local.resource_suffix}"
  location = var.location
  tags     = local.common_tags
}
