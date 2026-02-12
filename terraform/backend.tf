# Backend configuration for storing Terraform state in Azure Storage
# The actual values are provided via -backend-config in CI/CD

terraform {
  backend "azurerm" {
    # These values are provided via -backend-config flags:
    # - resource_group_name
    # - storage_account_name
    # - container_name
    # - key (state file name)
  }
}
