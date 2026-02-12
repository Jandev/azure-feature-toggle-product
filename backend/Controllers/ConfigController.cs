using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AzureFeatureToggleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ConfigController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// Returns the public Azure AD configuration needed by the frontend.
    /// These values are not secrets - they are the same values that would be
    /// visible in any SPA's JavaScript bundle.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            clientId = _configuration["AzureAd:ClientId"],
            tenantId = _configuration["AzureAd:TenantId"],
            authority = $"https://login.microsoftonline.com/{_configuration["AzureAd:TenantId"]}"
        });
    }
}
