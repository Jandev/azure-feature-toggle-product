using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AzureFeatureToggleApi.Models;
using AzureFeatureToggleApi.Services;
using System.Security.Claims;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
    private readonly IAzureAppConfigService _azureService;
    private readonly IAzureResourceDiscoveryService _discoveryService;
    private readonly ILogger<ResourcesController> _logger;

    public ResourcesController(
        IAzureAppConfigService azureService,
        IAzureResourceDiscoveryService discoveryService,
        ILogger<ResourcesController> logger)
    {
        _azureService = azureService;
        _discoveryService = discoveryService;
        _logger = logger;
    }

    [HttpGet("discover")]
    [AllowAnonymous] // Allow anonymous access for now - we validate the management token manually
    public async Task<ActionResult<List<DiscoveredResource>>> DiscoverResources()
    {
        try
        {
            // Extract the management token from custom header
            var managementToken = Request.Headers["X-Management-Token"].ToString();
            if (string.IsNullOrEmpty(managementToken))
            {
                _logger.LogWarning("No management token provided in X-Management-Token header");
                return Unauthorized(new { error = "No management token provided" });
            }

            _logger.LogInformation("Discovering App Configuration resources for authenticated user");
            var resources = await _discoveryService.DiscoverAppConfigurationResourcesAsync(managementToken);
            
            _logger.LogInformation("Discovery completed. Found {Count} resources", resources.Count);
            return Ok(resources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover App Configuration resources");
            return StatusCode(500, new { error = "Failed to discover resources", details = ex.Message });
        }
    }

    [HttpGet("subscriptions")]
    [AllowAnonymous] // Allow anonymous access for now - we validate the management token manually
    public async Task<ActionResult<List<SubscriptionInfo>>> ListSubscriptions()
    {
        try
        {
            // Extract the management token from custom header
            var managementToken = Request.Headers["X-Management-Token"].ToString();
            if (string.IsNullOrEmpty(managementToken))
            {
                _logger.LogWarning("No management token provided in X-Management-Token header");
                return Unauthorized(new { error = "No management token provided" });
            }

            var subscriptions = await _discoveryService.ListSubscriptionsAsync(managementToken);
            return Ok(subscriptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list subscriptions");
            return StatusCode(500, new { error = "Failed to list subscriptions", details = ex.Message });
        }
    }

    [HttpPost("test-connection")]
    [Authorize]
    public async Task<ActionResult<ConnectionTestResult>> TestConnection([FromBody] TestConnectionRequest request)
    {
        var result = await _azureService.TestConnectionAsync(request.Endpoint);
        return Ok(result);
    }

    [HttpPost("{resourceId}/check-permissions")]
    [Authorize]
    public async Task<ActionResult<UserRoleResponse>> CheckPermissions(
        string resourceId,
        [FromBody] AppConfigResource resource)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                     User.FindFirst("oid")?.Value ?? 
                     "unknown";
        
        var role = await _azureService.GetUserRoleForResourceAsync(
            resource.Endpoint,
            resource.SubscriptionId,
            resource.ResourceGroup,
            resource.ResourceName,
            userId);

        return Ok(new UserRoleResponse { Role = role });
    }
}

public record TestConnectionRequest(string Endpoint);
public record UserRoleResponse
{
    public string Role { get; set; } = "read-only";
}
