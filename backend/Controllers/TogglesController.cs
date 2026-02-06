using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AzureFeatureToggleApi.Models;
using AzureFeatureToggleApi.Services;
using System.Security.Claims;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TogglesController : ControllerBase
{
    private readonly IAzureAppConfigService _azureService;
    private readonly ILogger<TogglesController> _logger;

    public TogglesController(
        IAzureAppConfigService azureService,
        ILogger<TogglesController> logger)
    {
        _azureService = azureService;
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

        var toggles = await _azureService.GetFeatureTogglesAsync(endpoint, resourceId);
        return Ok(toggles);
    }

    [HttpPut("{toggleId}")]
    public async Task<ActionResult<FeatureToggle>> UpdateToggle(
        string toggleId,
        [FromBody] UpdateToggleRequest request)
    {
        // URL decode the toggleId in case it contains encoded characters like %2F
        toggleId = Uri.UnescapeDataString(toggleId);
        
        // Since we're not using [Authorize], User claims won't be available
        // For now, use placeholder values - in production, you'd validate the token
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                     User.FindFirst("oid")?.Value ?? 
                     "demo-user";
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? 
                       User.Identity?.Name ?? 
                       request.UserName ?? 
                       "Demo User";

        var result = await _azureService.UpdateFeatureToggleAsync(
            request.Endpoint,
            request.ResourceId,
            toggleId,
            request.Enabled,
            userId,
            userName);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }
}

public record UpdateToggleRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public string? UserName { get; set; }
}
