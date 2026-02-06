namespace AzureFeatureToggleApi.Models;

public class AppConfigResource
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string DisplayName { get; set; } = string.Empty;
    public string EnvironmentType { get; set; } = "development"; // development, staging, production
    public string Endpoint { get; set; } = string.Empty;
    public string SubscriptionId { get; set; } = string.Empty;
    public string ResourceGroup { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public string ConnectionStatus { get; set; } = "unknown";
    public DateTime? LastTested { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class FeatureToggle
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Enabled { get; set; }
    public string? LastModifiedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string ResourceId { get; set; } = string.Empty;
}

public class AuditLogEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // "enabled" or "disabled"
    public string ToggleId { get; set; } = string.Empty;
    public string ToggleName { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public string EnvironmentType { get; set; } = string.Empty;
    public bool PreviousState { get; set; }
    public bool NewState { get; set; }
}

public class UserInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "read-only"; // "read-only" or "admin"
}

public class ConnectionTestResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class DiscoveredResource
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string DisplayName { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public string ResourceGroup { get; set; } = string.Empty;
    public string SubscriptionId { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string EnvironmentType { get; set; } = "development";
    public Dictionary<string, string> Tags { get; set; } = new();
}

public class SubscriptionInfo
{
    public string SubscriptionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
}
