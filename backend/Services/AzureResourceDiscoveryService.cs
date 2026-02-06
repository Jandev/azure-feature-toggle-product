using Azure;
using Azure.Core;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.AppConfiguration;
using Azure.ResourceManager.Resources;
using AzureFeatureToggleApi.Models;
using System.Security.Claims;

namespace AzureFeatureToggleApi.Services;

public interface IAzureResourceDiscoveryService
{
    Task<List<DiscoveredResource>> DiscoverAppConfigurationResourcesAsync(string userToken);
    Task<List<SubscriptionInfo>> ListSubscriptionsAsync(string userToken);
}

public class AzureResourceDiscoveryService : IAzureResourceDiscoveryService
{
    private readonly ILogger<AzureResourceDiscoveryService> _logger;

    public AzureResourceDiscoveryService(ILogger<AzureResourceDiscoveryService> logger)
    {
        _logger = logger;
    }

    public async Task<List<SubscriptionInfo>> ListSubscriptionsAsync(string userToken)
    {
        try
        {
            // Use the user's token to authenticate to Azure Resource Manager
            var credential = new OnBehalfOfCredential(userToken);
            var armClient = new ArmClient(credential);
            
            var subscriptions = new List<SubscriptionInfo>();

            await foreach (var subscription in armClient.GetSubscriptions().GetAllAsync())
            {
                subscriptions.Add(new SubscriptionInfo
                {
                    SubscriptionId = subscription.Data.SubscriptionId,
                    Name = subscription.Data.DisplayName,
                    State = subscription.Data.State?.ToString() ?? "Unknown"
                });
            }

            _logger.LogInformation("Found {Count} subscriptions", subscriptions.Count);
            return subscriptions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list subscriptions");
            throw;
        }
    }

    public async Task<List<DiscoveredResource>> DiscoverAppConfigurationResourcesAsync(string userToken)
    {
        try
        {
            // Use the user's token to authenticate to Azure Resource Manager
            var credential = new OnBehalfOfCredential(userToken);
            var armClient = new ArmClient(credential);

            var discoveredResources = new List<DiscoveredResource>();

            // Iterate through all subscriptions
            await foreach (var subscription in armClient.GetSubscriptions().GetAllAsync())
            {
                try
                {
                    _logger.LogInformation("Scanning subscription: {SubscriptionName} ({SubscriptionId})", 
                        subscription.Data.DisplayName, 
                        subscription.Data.SubscriptionId);

                    // Get all App Configuration stores in this subscription
                    await foreach (var appConfig in subscription.GetAppConfigurationStoresAsync())
                    {
                        try
                        {
                            var data = appConfig.Data;
                            
                            // Extract resource group name from the ID
                            // Format: /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/...
                            var resourceGroupName = ExtractResourceGroupName(data.Id.ToString());

                            // Determine environment type based on tags or name
                            var environmentType = DetermineEnvironmentType(data.Name, data.Tags);

                            var discoveredResource = new DiscoveredResource
                            {
                                Id = Guid.NewGuid().ToString(),
                                DisplayName = data.Name,
                                ResourceName = data.Name,
                                ResourceGroup = resourceGroupName,
                                SubscriptionId = subscription.Data.SubscriptionId,
                                Endpoint = data.Endpoint,
                                Location = data.Location.Name,
                                EnvironmentType = environmentType,
                                Tags = data.Tags?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value) ?? new Dictionary<string, string>()
                            };

                            discoveredResources.Add(discoveredResource);

                            _logger.LogInformation("Discovered App Configuration: {Name} in {ResourceGroup}", 
                                data.Name, 
                                resourceGroupName);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to process App Configuration resource: {ResourceId}", 
                                appConfig.Id);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to scan subscription: {SubscriptionId}", 
                        subscription.Data.SubscriptionId);
                }
            }

            _logger.LogInformation("Total App Configuration resources discovered: {Count}", discoveredResources.Count);
            return discoveredResources;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover App Configuration resources");
            throw;
        }
    }

    private string ExtractResourceGroupName(string resourceId)
    {
        // Parse: /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/...
        var parts = resourceId.Split('/', StringSplitOptions.RemoveEmptyEntries);
        for (int i = 0; i < parts.Length - 1; i++)
        {
            if (parts[i].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase))
            {
                return parts[i + 1];
            }
        }
        return "Unknown";
    }

    private string DetermineEnvironmentType(string resourceName, IDictionary<string, string>? tags)
    {
        // Check tags first
        if (tags != null)
        {
            if (tags.TryGetValue("environment", out var envTag))
            {
                var envLower = envTag.ToLowerInvariant();
                if (envLower.Contains("prod")) return "production";
                if (envLower.Contains("stag")) return "staging";
                if (envLower.Contains("dev")) return "development";
            }

            if (tags.TryGetValue("Environment", out var envTag2))
            {
                var envLower = envTag2.ToLowerInvariant();
                if (envLower.Contains("prod")) return "production";
                if (envLower.Contains("stag")) return "staging";
                if (envLower.Contains("dev")) return "development";
            }
        }

        // Fall back to name-based detection
        var nameLower = resourceName.ToLowerInvariant();
        if (nameLower.Contains("prod")) return "production";
        if (nameLower.Contains("stag")) return "staging";
        if (nameLower.Contains("dev")) return "development";
        if (nameLower.Contains("test")) return "development";

        return "development"; // Default to development
    }
}

// Helper class to create credential from user token
internal class OnBehalfOfCredential : TokenCredential
{
    private readonly string _accessToken;

    public OnBehalfOfCredential(string accessToken)
    {
        _accessToken = accessToken;
    }

    public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
    {
        // Return the user's token for on-behalf-of flow
        // Note: In production, you'd use Microsoft.Identity.Web's ITokenAcquisition
        // to properly handle on-behalf-of flow with token exchange
        return new AccessToken(_accessToken, DateTimeOffset.UtcNow.AddHours(1));
    }

    public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken)
    {
        return new ValueTask<AccessToken>(GetToken(requestContext, cancellationToken));
    }
}
