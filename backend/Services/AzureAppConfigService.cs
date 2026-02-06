using Azure;
using Azure.Data.AppConfiguration;
using Azure.Identity;
using AzureFeatureToggleApi.Models;

namespace AzureFeatureToggleApi.Services;

public interface IAzureAppConfigService
{
    Task<ConnectionTestResult> TestConnectionAsync(string endpoint);
    Task<List<FeatureToggle>> GetFeatureTogglesAsync(string endpoint, string resourceId);
    Task<FeatureToggle?> UpdateFeatureToggleAsync(string endpoint, string resourceId, string toggleId, bool enabled, string userId, string userName);
    Task<List<AuditLogEntry>> GetAuditLogsAsync(string endpoint, string resourceId, DateTime? startDate = null);
    Task<string> GetUserRoleForResourceAsync(string endpoint, string subscriptionId, string resourceGroup, string resourceName, string userId);
}

public class AzureAppConfigService : IAzureAppConfigService
{
    private readonly ILogger<AzureAppConfigService> _logger;
    private readonly DefaultAzureCredential _credential;

    public AzureAppConfigService(ILogger<AzureAppConfigService> logger)
    {
        _logger = logger;
        _credential = new DefaultAzureCredential();
    }

    public async Task<ConnectionTestResult> TestConnectionAsync(string endpoint)
    {
        try
        {
            var client = new ConfigurationClient(new Uri(endpoint), _credential);
            
            // Try to list one setting to verify connection
            await foreach (var setting in client.GetConfigurationSettingsAsync(new SettingSelector { KeyFilter = "*" }).AsPages(pageSizeHint: 1))
            {
                // If we can read at least the first page, connection is good
                return new ConnectionTestResult
                {
                    Success = true,
                    Message = "Connection successful! Resource is accessible.",
                    Timestamp = DateTime.UtcNow
                };
            }

            return new ConnectionTestResult
            {
                Success = true,
                Message = "Connection successful! Resource is accessible.",
                Timestamp = DateTime.UtcNow
            };
        }
        catch (RequestFailedException ex) when (ex.Status == 403)
        {
            _logger.LogError(ex, "Access denied to App Configuration resource: {Endpoint}", endpoint);
            return new ConnectionTestResult
            {
                Success = false,
                Message = "Connection failed: Access denied. Ensure you have proper RBAC permissions.",
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to App Configuration resource: {Endpoint}", endpoint);
            return new ConnectionTestResult
            {
                Success = false,
                Message = $"Connection failed: {ex.Message}",
                Timestamp = DateTime.UtcNow
            };
        }
    }

    public async Task<List<FeatureToggle>> GetFeatureTogglesAsync(string endpoint, string resourceId)
    {
        try
        {
            var client = new ConfigurationClient(new Uri(endpoint), _credential);
            var toggles = new List<FeatureToggle>();

            // Feature flags in Azure App Configuration have keys that start with ".appconfig.featureflag/"
            await foreach (var setting in client.GetConfigurationSettingsAsync(
                new SettingSelector { KeyFilter = ".appconfig.featureflag/*" }))
            {
                // Parse the feature flag
                var featureName = setting.Key.Replace(".appconfig.featureflag/", "");
                
                // Note: Azure App Configuration stores feature flags as JSON
                // For simplicity, we're checking if it's enabled
                var enabled = IsFeatureEnabled(setting.Value);

                toggles.Add(new FeatureToggle
                {
                    Id = setting.Key,
                    Name = featureName,
                    Enabled = enabled,
                    LastModifiedAt = setting.LastModified?.DateTime,
                    ResourceId = resourceId
                });
            }

            return toggles;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve feature toggles from {Endpoint}", endpoint);
            throw;
        }
    }

    public async Task<FeatureToggle?> UpdateFeatureToggleAsync(
        string endpoint, 
        string resourceId, 
        string toggleId, 
        bool enabled, 
        string userId, 
        string userName)
    {
        try
        {
            var client = new ConfigurationClient(new Uri(endpoint), _credential);
            
            // Get the current setting
            var setting = await client.GetConfigurationSettingAsync(toggleId);
            
            // Update the feature flag value
            var updatedValue = UpdateFeatureFlagValue(setting.Value.Value, enabled);
            setting.Value.Value = updatedValue;
            
            // Set the updated setting
            await client.SetConfigurationSettingAsync(setting.Value);
            
            // Get the updated setting to return
            var updated = await client.GetConfigurationSettingAsync(toggleId);
            var featureName = toggleId.Replace(".appconfig.featureflag/", "");
            
            return new FeatureToggle
            {
                Id = updated.Value.Key,
                Name = featureName,
                Enabled = enabled,
                LastModifiedBy = userName,
                LastModifiedAt = DateTime.UtcNow,
                ResourceId = resourceId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update feature toggle {ToggleId}", toggleId);
            throw;
        }
    }

    public async Task<List<AuditLogEntry>> GetAuditLogsAsync(
        string endpoint, 
        string resourceId, 
        DateTime? startDate = null)
    {
        try
        {
            var client = new ConfigurationClient(new Uri(endpoint), _credential);
            var logs = new List<AuditLogEntry>();

            // Get revisions for feature flags
            var selector = new SettingSelector
            {
                KeyFilter = ".appconfig.featureflag/*"
            };

            await foreach (var revision in client.GetRevisionsAsync(selector))
            {
                // Filter by date if specified
                if (startDate.HasValue && revision.LastModified < startDate.Value)
                    continue;

                var featureName = revision.Key.Replace(".appconfig.featureflag/", "");
                var enabled = IsFeatureEnabled(revision.Value);

                // Note: Azure App Configuration doesn't store who made the change
                // In a real implementation, you might want to correlate with Azure Activity Logs
                logs.Add(new AuditLogEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = revision.LastModified?.DateTime ?? DateTime.UtcNow,
                    ToggleId = revision.Key,
                    ToggleName = featureName,
                    ResourceId = resourceId,
                    NewState = enabled,
                    Action = enabled ? "enabled" : "disabled",
                    UserId = "system", // Would need Activity Logs integration for real user
                    UserName = "System",
                    UserEmail = ""
                });
            }

            return logs.OrderByDescending(l => l.Timestamp).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audit logs from {Endpoint}", endpoint);
            throw;
        }
    }

    public async Task<string> GetUserRoleForResourceAsync(
        string endpoint, 
        string subscriptionId, 
        string resourceGroup, 
        string resourceName, 
        string userId)
    {
        // This is a simplified version - in production, you would:
        // 1. Use Azure.ResourceManager to check RBAC assignments
        // 2. Check if user has write permissions on the resource
        // 3. Return "admin" if they have write, "read-only" otherwise
        
        // For now, we'll try to write a test value to determine permissions
        try
        {
            var client = new ConfigurationClient(new Uri(endpoint), _credential);
            
            // Try to set a test configuration
            var testKey = $"_rbac_test_{Guid.NewGuid()}";
            await client.SetConfigurationSettingAsync(testKey, "test");
            
            // If successful, delete the test key
            await client.DeleteConfigurationSettingAsync(testKey);
            
            return "admin";
        }
        catch (RequestFailedException ex) when (ex.Status == 403)
        {
            // If we get forbidden, user has read-only access
            return "read-only";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not determine user role, defaulting to read-only");
            return "read-only";
        }
    }

    private bool IsFeatureEnabled(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return false;

        try
        {
            // Azure App Configuration stores feature flags as JSON with an "enabled" property
            // Simple check: look for "enabled":true in the JSON
            return value.Contains("\"enabled\":true", StringComparison.OrdinalIgnoreCase) ||
                   value.Contains("\"enabled\": true", StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private string UpdateFeatureFlagValue(string currentValue, bool enabled)
    {
        // Simple JSON manipulation - in production, use System.Text.Json
        if (enabled)
        {
            return currentValue
                .Replace("\"enabled\":false", "\"enabled\":true")
                .Replace("\"enabled\": false", "\"enabled\": true");
        }
        else
        {
            return currentValue
                .Replace("\"enabled\":true", "\"enabled\":false")
                .Replace("\"enabled\": true", "\"enabled\": false");
        }
    }
}
