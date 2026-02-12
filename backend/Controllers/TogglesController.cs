using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AzureFeatureToggleApi.Models;
using AzureFeatureToggleApi.Services;
using System.Security.Claims;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class TogglesController : ControllerBase
{
    private readonly IAzureAppConfigService _azureService;
    private readonly ITokenCredentialProvider _tokenProvider;
    private readonly ILogger<TogglesController> _logger;

    public TogglesController(
        IAzureAppConfigService azureService,
        ITokenCredentialProvider tokenProvider,
        ILogger<TogglesController> logger)
    {
        _azureService = azureService;
        _tokenProvider = tokenProvider;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<FeatureToggle>>> GetToggles(
        [FromQuery] string endpoint,
        [FromQuery] string resourceId)
    {
        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(resourceId))
        {
            return BadRequest("Endpoint and resourceId are required");
        }

        try
        {
            // Get App Configuration credential via OBO flow
            var credential = await _tokenProvider.GetAppConfigCredentialAsync(HttpContext);
            var toggles = await _azureService.GetFeatureTogglesAsync(endpoint, resourceId, credential);
            return Ok(toggles);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authorization failed while getting toggles");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get toggles");
            return StatusCode(500, new { error = "Failed to get toggles", details = ex.Message });
        }
    }

    [HttpPut("{*toggleId}")]
    public async Task<ActionResult<FeatureToggle>> UpdateToggle(
        string toggleId,
        [FromBody] UpdateToggleRequest request)
    {
        _logger.LogInformation("UpdateToggle called with toggleId: {ToggleId}, Raw path: {Path}", 
            toggleId, HttpContext.Request.Path);
        
        try
        {
            // URL decode the toggleId in case it contains encoded characters like %2F
            toggleId = Uri.UnescapeDataString(toggleId);
            
            // Get user info from claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                         User.FindFirst("oid")?.Value ?? 
                         "unknown";
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? 
                           User.FindFirst("name")?.Value ??
                           User.Identity?.Name ?? 
                           request.UserName ?? 
                           "Unknown User";

            // Get App Configuration credential via OBO flow
            var credential = await _tokenProvider.GetAppConfigCredentialAsync(HttpContext);
            var result = await _azureService.UpdateFeatureToggleAsync(
                request.Endpoint,
                request.ResourceId,
                toggleId,
                request.Enabled,
                userId,
                userName,
                credential);

            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authorization failed while updating toggle");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update toggle");
            return StatusCode(500, new { error = "Failed to update toggle", details = ex.Message });
        }
    }
}

public record UpdateToggleRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public string? UserName { get; set; }
}
