using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AzureFeatureToggleApi.Models;
using AzureFeatureToggleApi.Services;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class AuditLogsController : ControllerBase
{
    private readonly IAzureAppConfigService _azureService;
    private readonly ITokenCredentialProvider _tokenProvider;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(
        IAzureAppConfigService azureService,
        ITokenCredentialProvider tokenProvider,
        ILogger<AuditLogsController> logger)
    {
        _azureService = azureService;
        _tokenProvider = tokenProvider;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<AuditLogEntry>>> GetAuditLogs(
        [FromQuery] string endpoint,
        [FromQuery] string resourceId,
        [FromQuery] DateTime? startDate = null)
    {
        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(resourceId))
        {
            return BadRequest("Endpoint and resourceId are required");
        }

        try
        {
            // Get App Configuration credential via OBO flow
            var credential = await _tokenProvider.GetAppConfigCredentialAsync(HttpContext);
            var logs = await _azureService.GetAuditLogsAsync(endpoint, resourceId, credential, startDate);
            return Ok(logs);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authorization failed while getting audit logs");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get audit logs");
            return StatusCode(500, new { error = "Failed to get audit logs", details = ex.Message });
        }
    }
}
