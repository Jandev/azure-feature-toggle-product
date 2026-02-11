using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Identity.Web;
using Microsoft.Identity.Client;
using System.Net.Http.Headers;

namespace AzureFeatureToggleApi.Services;

/// <summary>
/// Provides Azure credentials using OBO flow to exchange user tokens for specific resource tokens.
/// The OBO flow requires a confidential client (with client secret) to exchange the user's API token
/// for tokens scoped to downstream resources like Azure Management API and App Configuration.
/// </summary>
public interface ITokenCredentialProvider
{
    /// <summary>
    /// Gets a credential for Azure Management API using OBO flow
    /// </summary>
    Task<TokenCredential> GetManagementCredentialAsync(HttpContext httpContext);
    
    /// <summary>
    /// Gets a credential for Azure App Configuration using OBO flow
    /// </summary>
    Task<TokenCredential> GetAppConfigCredentialAsync(HttpContext httpContext);
    
    /// <summary>
    /// Gets the raw management token string (for direct HTTP calls)
    /// </summary>
    Task<string> GetManagementTokenAsync(HttpContext httpContext);
    
    /// <summary>
    /// Extracts the user's API access token from the request
    /// </summary>
    Task<string> GetAccessTokenAsync(HttpContext httpContext);
}

public class TokenCredentialProvider : ITokenCredentialProvider
{
    private readonly ILogger<TokenCredentialProvider> _logger;
    private readonly IConfiguration _configuration;
    private readonly ITokenAcquisition _tokenAcquisition;

    public TokenCredentialProvider(
        ILogger<TokenCredentialProvider> logger,
        IConfiguration configuration,
        ITokenAcquisition tokenAcquisition)
    {
        _logger = logger;
        _configuration = configuration;
        _tokenAcquisition = tokenAcquisition;
    }

    public async Task<TokenCredential> GetManagementCredentialAsync(HttpContext httpContext)
    {
        var token = await GetManagementTokenAsync(httpContext);
        return new UserTokenCredential(token);
    }

    public async Task<string> GetManagementTokenAsync(HttpContext httpContext)
    {
        // For Azure Management API, use user_impersonation scope
        return await AcquireTokenOnBehalfOfAsync(
            httpContext, 
            new[] { "https://management.azure.com/user_impersonation" },
            "Azure Management API"
        );
    }

    public async Task<TokenCredential> GetAppConfigCredentialAsync(HttpContext httpContext)
    {
        // For Azure App Configuration, use the delegated KeyValue scopes
        var token = await AcquireTokenOnBehalfOfAsync(
            httpContext,
            new[] { "https://azconfig.io/KeyValue.Read", "https://azconfig.io/KeyValue.Write" },
            "Azure App Configuration"
        );
        return new UserTokenCredential(token);
    }

    private async Task<string> AcquireTokenOnBehalfOfAsync(
        HttpContext httpContext,
        string[] scopes,
        string resourceName)
    {
        try
        {
            // Extract the user's incoming access token
            var userToken = await GetAccessTokenAsync(httpContext);
            
            if (string.IsNullOrEmpty(userToken))
            {
                _logger.LogError("No user token found for OBO flow");
                throw new UnauthorizedAccessException("User token is required for authentication");
            }

            // Get Azure AD configuration
            var tenantId = _configuration["AzureAd:TenantId"];
            var clientId = _configuration["AzureAd:ClientId"];
            var clientSecret = _configuration["AzureAd:ClientSecret"];
            var authority = $"{_configuration["AzureAd:Instance"]}{tenantId}";

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                _logger.LogError("Azure AD ClientId or ClientSecret not configured. ClientSecret is required for OBO flow.");
                throw new InvalidOperationException("Azure AD ClientId or ClientSecret not configured. The OBO flow requires a client secret.");
            }

            _logger.LogInformation("Building confidential client for OBO flow to {ResourceName} with scopes: {Scopes}", 
                resourceName, string.Join(", ", scopes));
            
            // Build a confidential client application
            var confidentialClient = ConfidentialClientApplicationBuilder
                .Create(clientId)
                .WithClientSecret(clientSecret)
                .WithAuthority(authority)
                .Build();
            
            // Create user assertion from the incoming token
            var userAssertion = new UserAssertion(userToken);
            
            _logger.LogInformation("Acquiring token for {ResourceName} using OBO flow", resourceName);
            
            // Acquire token on behalf of the user
            var result = await confidentialClient
                .AcquireTokenOnBehalfOf(scopes, userAssertion)
                .ExecuteAsync();
            
            _logger.LogInformation("Successfully acquired {ResourceName} token via OBO for user (expires: {ExpiresOn})", 
                resourceName, result.ExpiresOn);
            return result.AccessToken;
        }
        catch (MsalUiRequiredException ex)
        {
            _logger.LogWarning(ex, "User needs to consent for {ResourceName} access. Error: {ErrorCode}", resourceName, ex.ErrorCode);
            throw new UnauthorizedAccessException($"Additional consent required for {resourceName}. Please sign in again.", ex);
        }
        catch (MsalServiceException ex)
        {
            _logger.LogError(ex, "MSAL service exception during OBO flow for {ResourceName}: {ErrorCode} - {Message}", 
                resourceName, ex.ErrorCode, ex.Message);
            throw new UnauthorizedAccessException($"Failed to acquire token for {resourceName}: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to acquire token via OBO flow for {ResourceName}", resourceName);
            throw;
        }
    }

    public async Task<string> GetAccessTokenAsync(HttpContext httpContext)
    {
        try
        {
            // Try to get the access token from the Authorization header
            var authHeader = httpContext.Request.Headers["Authorization"].ToString();
            
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                _logger.LogDebug("Retrieved user token from Authorization header");
                return token;
            }

            // Alternative: Try to get from authentication context
            var accessToken = await httpContext.GetTokenAsync("access_token");
            if (!string.IsNullOrEmpty(accessToken))
            {
                _logger.LogDebug("Retrieved user token from authentication context");
                return accessToken;
            }

            _logger.LogWarning("No access token found in request");
            return string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve access token");
            return string.Empty;
        }
    }
}

/// <summary>
/// TokenCredential implementation that uses a pre-acquired access token
/// </summary>
public class UserTokenCredential : TokenCredential
{
    private readonly string _accessToken;

    public UserTokenCredential(string accessToken)
    {
        _accessToken = accessToken ?? throw new ArgumentNullException(nameof(accessToken));
    }

    public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
    {
        // Return the token with a future expiration (tokens from the frontend should already be valid)
        // In production, you should parse the token to get the actual expiration time
        return new AccessToken(_accessToken, DateTimeOffset.UtcNow.AddHours(1));
    }

    public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken)
    {
        return new ValueTask<AccessToken>(GetToken(requestContext, cancellationToken));
    }
}
