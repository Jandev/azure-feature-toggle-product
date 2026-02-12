import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { PublicClientApplication, InteractionStatus } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
import { MsalProvider, useMsal, useAccount, useIsAuthenticated } from '@azure/msal-react';
import { createMsalConfig, loginRequest, createApiRequest } from '@/lib/authConfig';
import { loadConfig, getConfig } from '@/lib/config';
import type { User, AuthenticationState } from '@/types';

// MSAL instance - will be created after config is loaded
let msalInstance: PublicClientApplication | null = null;

interface AuthContextType extends AuthenticationState {
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // Load runtime config first
        const config = await loadConfig();
        console.log('[Auth] Config loaded, creating MSAL instance');
        
        // Create MSAL instance with runtime config
        const msalConfig = createMsalConfig(config);
        msalInstance = new PublicClientApplication(msalConfig);
        
        // Initialize MSAL
        await msalInstance.initialize();
        
        // Handle redirect promise to process authentication callbacks
        await msalInstance.handleRedirectPromise();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize authentication');
      }
    }
    
    initialize();
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Authentication Error</p>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{initError}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized || !msalInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </MsalProvider>
  );
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || null);
  const isAuthenticated = useIsAuthenticated();
  
  const [authState, setAuthState] = useState<AuthenticationState>({
    status: 'idle',
    user: null,
    error: null,
    isAuthenticated: false,
  });

  const fetchUserInfo = useCallback(async (accountInfo: AccountInfo) => {
    try {
      // For now, we'll use the account info from MSAL
      // In production, you might want to call your backend to get the role
      const user: User = {
        id: accountInfo.localAccountId,
        name: accountInfo.name || accountInfo.username,
        email: accountInfo.username,
        role: 'admin', // TODO: Fetch from backend based on RBAC
      };

      setAuthState({
        status: 'success',
        user,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setAuthState({
        status: 'error',
        user: null,
        error: 'Failed to fetch user information',
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      if (isAuthenticated && account) {
        // User is authenticated, fetch additional user info
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with external MSAL state is a valid use case
        fetchUserInfo(account);
      } else {
        // Not authenticated
        setAuthState({
          status: 'idle',
          user: null,
          error: null,
          isAuthenticated: false,
        });
      }
    }
  }, [isAuthenticated, account, inProgress, fetchUserInfo]);

  const login = async () => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading', error: null }));
      
      console.log('Starting login flow with redirect...');
      // Use redirect instead of popup - more reliable
      await instance.loginRedirect(loginRequest);
      
      // After redirect, user will come back and MSAL will handle the callback
    } catch (error) {
      console.error('Login failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState({
        status: 'error',
        user: null,
        error: errorMessage,
        isAuthenticated: false,
      });
      
      throw error;
    }
  };

  const logout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    });
    setAuthState({
      status: 'idle',
      user: null,
      error: null,
      isAuthenticated: false,
    });
  };

  // Get access token for calling the backend API
  // The backend will use OBO flow to exchange this for Management/App Config tokens
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!account) return null;

    try {
      console.log('[Auth] Acquiring API access token...');
      const apiRequest = createApiRequest(getConfig());
      const response = await instance.acquireTokenSilent({
        scopes: apiRequest.scopes,
        account,
      });
      console.log('[Auth] API access token acquired successfully');
      return response.accessToken;
    } catch (error) {
      console.error('[Auth] Failed to acquire API access token silently:', error);
      // If silent token acquisition fails, redirect for interactive auth
      console.log('[Auth] Redirecting for interactive API token acquisition...');
      const apiRequest = createApiRequest(getConfig());
      await instance.acquireTokenRedirect({
        scopes: apiRequest.scopes,
        account,
      });
      return null; // Will redirect, so this won't be reached
    }
  }, [account, instance]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    getAccessToken,
    isLoading: inProgress !== InteractionStatus.None || authState.status === 'loading',
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
