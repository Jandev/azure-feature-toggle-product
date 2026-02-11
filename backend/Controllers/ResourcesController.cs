using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AzureFeatureToggleApi.Models;
using AzureFeatureToggleApi.Services;
using System.Security.Claims;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class ResourcesController : ControllerBase
{
    private readonly IAzureAppConfigService _azureService;
    private readonly IAzureResourceDiscoveryService _discoveryService;
    private readonly ITokenCredentialProvider _tokenProvider;
    private readonly ILogger<ResourcesController> _logger;

    public ResourcesController(
        IAzureAppConfigService azureService,
        IAzureResourceDiscoveryService discoveryService,
        ITokenCredentialProvider tokenProvider,
        ILogger<ResourcesController> logger)
    {
        _azureService = azureService;
        _discoveryService = discoveryService;
        _tokenProvider = tokenProvider;
        _logger = logger;
    }

    [HttpGet("discover")]
    public async Task<ActionResult<List<DiscoveredResource>>> DiscoverResources()
    {
        try
        {
            _logger.LogInformation("Discovering App Configuration resources using OBO flow");
            
            // Get management token via OBO flow
            var managementToken = await _tokenProvider.GetManagementTokenAsync(HttpContext);
            
            var resources = await _discoveryService.DiscoverAppConfigurationResourcesAsync(managementToken);
            
            _logger.LogInformation("Discovery completed. Found {Count} resources", resources.Count);
            return Ok(resources);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authorization failed during resource discovery");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover App Configuration resources");
            return StatusCode(500, new { error = "Failed to discover resources", details = ex.Message });
        }
    }

    [HttpGet("subscriptions")]
    public async Task<ActionResult<List<SubscriptionInfo>>> ListSubscriptions()
    {
        try
        {
            // Get management token via OBO flow
            var managementToken = await _tokenProvider.GetManagementTokenAsync(HttpContext);
            
            var subscriptions = await _discoveryService.ListSubscriptionsAsync(managementToken);
            return Ok(subscriptions);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authorization failed during subscription listing");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list subscriptions");
            return StatusCode(500, new { error = "Failed to list subscriptions", details = ex.Message });
        }
    }

    [HttpPost("test-connection")]
    public async Task<ActionResult<ConnectionTestResult>> TestConnection([FromBody] TestConnectionRequest request)
    {
        try
        {
            // Get App Config credential via OBO flow
            var credential = await _tokenProvider.GetAppConfigCredentialAsync(HttpContext);
            var result = await _azureService.TestConnectionAsync(request.Endpoint, credential);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authorization failed during connection test");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to test connection");
            return StatusCode(500, new { error = "Failed to test connection", details = ex.Message });
        }
    }

    [HttpPost("{resourceId}/check-permissions")]
    public async Task<ActionResult<UserRoleResponse>> CheckPermissions(
        string resourceId,
        [FromBody] AppConfigResource resource)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                         User.FindFirst("oid")?.Value ?? 
                         "unknown";
            
            var credential = await _tokenProvider.GetManagementCredentialAsync(HttpContext);
            var role = await _azureService.GetUserRoleForResourceAsync(
                resource.Endpoint,
                resource.SubscriptionId,
                resource.ResourceGroup,
                resource.ResourceName,
                userId,
                credential);

            return Ok(new UserRoleResponse { Role = role });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authorization failed during permission check");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check permissions");
            return StatusCode(500, new { error = "Failed to check permissions", details = ex.Message });
        }
    }
}

public record TestConnectionRequest(string Endpoint);
public record UserRoleResponse
{
    public string Role { get; set; } = "read-only";
}
