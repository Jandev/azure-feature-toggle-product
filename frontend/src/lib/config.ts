// Runtime configuration loaded from the backend
// This allows Azure AD settings to be configured via environment variables
// instead of being baked into the JavaScript bundle at build time.

export interface AppConfig {
  clientId: string;
  tenantId: string;
  authority: string;
}

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    cachedConfig = await response.json();
    return cachedConfig!;
  } catch (error) {
    console.error('Failed to load runtime config:', error);
    // Fallback to environment variables for local development
    cachedConfig = {
      clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
      tenantId: import.meta.env.VITE_AZURE_TENANT_ID || '',
      authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    };
    return cachedConfig;
  }
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return cachedConfig;
}
