import type { Configuration, PopupRequest } from '@azure/msal-browser';
import { getConfig, type AppConfig } from './config';

// Create MSAL configuration using runtime config
export function createMsalConfig(config: AppConfig): Configuration {
  return {
    auth: {
      clientId: config.clientId,
      authority: config.authority,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage',
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case 0: // Error
              console.error(message);
              break;
            case 1: // Warning
              console.warn(message);
              break;
            case 2: // Info
              console.info(message);
              break;
            case 3: // Verbose
              console.debug(message);
              break;
          }
        },
      },
    },
  };
}

// Scopes for login - just basic user info
export const loginRequest: PopupRequest = {
  scopes: [
    'User.Read', 
    'openid', 
    'profile', 
    'email',
  ],
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

// API scopes - for calling our backend API
// The backend will use OBO (On-Behalf-Of) flow to exchange this token
// for Azure Management and App Configuration tokens
export function createApiRequest(config: AppConfig) {
  return {
    scopes: [`api://${config.clientId}/access_as_user`],
  };
}

// Convenience function to get API request with current config
export function getApiRequest() {
  return createApiRequest(getConfig());
}
