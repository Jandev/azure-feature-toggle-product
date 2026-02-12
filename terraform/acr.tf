# Azure Container Registry

resource "azurerm_container_registry" "main" {
  # ACR names must be alphanumeric only - remove hyphens and use lowercase
  name                = "acr${replace(var.project_name, "-", "")}${replace(var.environment, "-", "")}${local.resource_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = local.common_tags
}

# Build and push Docker image to ACR using null_resource
resource "null_resource" "docker_build_push" {
  count = var.build_and_push_image ? 1 : 0

  triggers = {
    # Rebuild when Dockerfile or source changes
    dockerfile_hash = filesha256("${var.source_path}/Dockerfile")
    # Force rebuild on each apply - remove this line if you want to cache
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      # Login to ACR
      az acr login --name ${azurerm_container_registry.main.name}
      
      # Build and push the image
      docker build -t ${azurerm_container_registry.main.login_server}/${var.project_name}:${var.container_image_tag} ${var.source_path}
      docker push ${azurerm_container_registry.main.login_server}/${var.project_name}:${var.container_image_tag}
    EOT
  }

  depends_on = [azurerm_container_registry.main]
}
