using Microsoft.AspNetCore.Mvc;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }

    [HttpGet("ready")]
    public IActionResult Ready()
    {
        // Could add dependency checks here (e.g., Azure AD availability)
        return Ok(new { status = "ready", timestamp = DateTime.UtcNow });
    }
}
