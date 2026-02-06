import { AppConfigurationClient } from '@azure/app-configuration';
import { ConnectionTestResult } from '@/types';

/**
 * Test connection to Azure App Configuration
 */
export async function testAzureConnection(
  connectionString: string
): Promise<ConnectionTestResult> {
  try {
    const client = new AppConfigurationClient(connectionString);
    
    // Try to list settings (with filter to limit results)
    const settings = client.listConfigurationSettings({
      keyFilter: '*',
    });
    
    // Try to get the first item to verify connection
    const firstSetting = await settings.next();
    
    return {
      success: true,
      message: 'Connection successful! Resource is accessible.',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Azure connection test failed:', error);
    
    let message = 'Connection failed: ';
    
    if (error.message?.includes('401')) {
      message += 'Invalid credentials or insufficient permissions.';
    } else if (error.message?.includes('404')) {
      message += 'Resource not found. Check the connection string.';
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ETIMEDOUT')) {
      message += 'Network error. Check your internet connection.';
    } else {
      message += error.message || 'Unknown error occurred.';
    }
    
    return {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch feature flags from Azure App Configuration
 */
export async function fetchFeatureFlags(connectionString: string) {
  try {
    const client = new AppConfigurationClient(connectionString);
    
    // Fetch feature flags (they have a specific key prefix)
    const settings = client.listConfigurationSettings({
      keyFilter: '.appconfig.featureflag/*',
    });
    
    const features = [];
    for await (const setting of settings) {
      // Parse feature flag from the setting value
      const featureData = JSON.parse(setting.value || '{}');
      features.push({
        id: setting.key.replace('.appconfig.featureflag/', ''),
        name: setting.key.replace('.appconfig.featureflag/', ''),
        description: featureData.description,
        enabled: featureData.enabled || false,
        key: setting.key,
        etag: setting.etag,
        lastModifiedBy: undefined, // Azure doesn't provide this in basic tier
        lastModifiedAt: setting.lastModified?.toISOString(),
      });
    }
    
    return features;
  } catch (error: any) {
    console.error('Failed to fetch feature flags:', error);
    throw new Error(`Failed to fetch feature flags: ${error.message}`);
  }
}

/**
 * Update a feature flag in Azure App Configuration
 */
export async function updateFeatureFlag(
  connectionString: string,
  featureKey: string,
  enabled: boolean
) {
  try {
    const client = new AppConfigurationClient(connectionString);
    
    // Get the current setting
    const setting = await client.getConfigurationSetting({
      key: featureKey,
    });
    
    // Parse and update the feature flag value
    const featureData = JSON.parse(setting.value || '{}');
    featureData.enabled = enabled;
    
    // Update the setting
    await client.setConfigurationSetting({
      key: featureKey,
      value: JSON.stringify(featureData),
      contentType: setting.contentType,
      label: setting.label,
    });
    
    return {
      success: true,
      message: `Feature flag ${enabled ? 'enabled' : 'disabled'} successfully.`,
    };
  } catch (error: any) {
    console.error('Failed to update feature flag:', error);
    throw new Error(`Failed to update feature flag: ${error.message}`);
  }
}

/**
 * Encrypt connection string for storage (basic implementation)
 * In production, use proper encryption like Azure Key Vault
 */
export function encryptConnectionString(connectionString: string): string {
  // For now, just store as-is
  // TODO: Implement proper encryption in production
  return connectionString;
}

/**
 * Decrypt connection string for use (basic implementation)
 */
export function decryptConnectionString(encryptedString: string): string {
  // For now, just return as-is
  // TODO: Implement proper decryption in production
  return encryptedString;
}
