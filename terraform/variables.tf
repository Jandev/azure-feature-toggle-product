# Input Variables for Azure Feature Toggle Manager

variable "project_name" {
  description = "Name of the project, used in resource naming"
  type        = string
  default     = "featuretoggle"
}

variable "environment" {
  description = "Environment name (dev, staging, prod, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod", "production"], var.environment)
    error_message = "Environment must be dev, staging, prod, or production."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "westeurope"
}

variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
}

variable "resource_suffix" {
  description = "Optional suffix for resource names (for uniqueness). If not provided, a random suffix is generated."
  type        = string
  default     = ""
}

variable "container_image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "container_cpu" {
  description = "CPU cores for the container (e.g., 0.5, 1, 2)"
  type        = number
  default     = 0.5
}

variable "container_memory" {
  description = "Memory for the container in Gi (e.g., 1, 2)"
  type        = string
  default     = "1Gi"
}

variable "min_replicas" {
  description = "Minimum number of container replicas"
  type        = number
  default     = 0
}

variable "max_replicas" {
  description = "Maximum number of container replicas"
  type        = number
  default     = 3
}

variable "app_display_name" {
  description = "Display name for the Azure AD App Registration"
  type        = string
  default     = "Azure Feature Toggle Manager"
}

variable "additional_redirect_uris" {
  description = "Additional redirect URIs for the app registration (e.g., localhost for development)"
  type        = list(string)
  default     = ["http://localhost:5173/"]
}

variable "build_and_push_image" {
  description = "Whether to build and push the Docker image to ACR. Set to false if you want to push manually."
  type        = bool
  default     = true
}

variable "source_path" {
  description = "Path to the source code directory (relative to terraform directory or absolute)"
  type        = string
  default     = ".."
}

# Key Vault configuration
variable "key_vault_purge_protection" {
  description = "Enable purge protection for Key Vault (recommended for production, but prevents immediate deletion)"
  type        = bool
  default     = false
}

variable "key_vault_soft_delete_days" {
  description = "Number of days to retain soft-deleted secrets (7-90)"
  type        = number
  default     = 7

  validation {
    condition     = var.key_vault_soft_delete_days >= 7 && var.key_vault_soft_delete_days <= 90
    error_message = "Soft delete retention must be between 7 and 90 days."
  }
}
