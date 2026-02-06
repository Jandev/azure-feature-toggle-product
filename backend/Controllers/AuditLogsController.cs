using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AzureFeatureToggleApi.Models;
using AzureFeatureToggleApi.Services;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly IAzureAppConfigService _azureService;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(
        IAzureAppConfigService azureService,
        ILogger<AuditLogsController> logger)
    {
        _azureService = azureService;
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

        var logs = await _azureService.GetAuditLogsAsync(endpoint, resourceId, startDate);
        return Ok(logs);
    }
}
