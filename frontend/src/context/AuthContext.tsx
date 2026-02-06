import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { PublicClientApplication, InteractionStatus } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
import { MsalProvider, useMsal, useAccount, useIsAuthenticated } from '@azure/msal-react';
import { msalConfig, loginRequest, azureManagementRequest } from '@/lib/authConfig';
import type { User, AuthenticationState } from '@/types';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL - this will be a promise that resolves when ready
const msalInitPromise = msalInstance.initialize();

// Handle redirect promise to process authentication callbacks
msalInitPromise.then(() => {
  msalInstance.handleRedirectPromise().catch((error) => {
    console.error('Error handling redirect:', error);
  });
});

interface AuthContextType extends AuthenticationState {
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  getManagementToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    msalInitPromise.then(() => {
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
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

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      if (isAuthenticated && account) {
        // User is authenticated, fetch additional user info
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
  }, [isAuthenticated, account, inProgress]);

  const fetchUserInfo = async (account: AccountInfo) => {
    try {
      // For now, we'll use the account info from MSAL
      // In production, you might want to call your backend to get the role
      const user: User = {
        id: account.localAccountId,
        name: account.name || account.username,
        email: account.username,
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
  };

  const login = async () => {
    try {
      setAuthState(prev => ({ ...prev, status: 'loading', error: null }));
      
      console.log('Starting login flow with redirect...');
      // Use redirect instead of popup - more reliable
      await instance.loginRedirect(loginRequest);
      
      // After redirect, user will come back and MSAL will handle the callback
    } catch (error: any) {
      console.error('Login failed:', error);
      
      setAuthState({
        status: 'error',
        user: null,
        error: error.message || 'Login failed',
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

  const getAccessToken = async (): Promise<string | null> => {
    if (!account) return null;

    try {
      console.log('[Auth] Acquiring access token...');
      const response = await instance.acquireTokenSilent({
        scopes: loginRequest.scopes, // Use login scopes (User.Read is sufficient for validation)
        account,
      });
      console.log('[Auth] Access token acquired successfully');
      return response.accessToken;
    } catch (error) {
      console.error('[Auth] Failed to acquire access token silently:', error);
      // If silent token acquisition fails, try interactive
      try {
        console.log('[Auth] Trying interactive access token acquisition...');
        const response = await instance.acquireTokenPopup({
          scopes: loginRequest.scopes,
          account,
        });
        console.log('[Auth] Access token acquired via popup');
        return response.accessToken;
      } catch (popupError) {
        console.error('[Auth] Failed to acquire access token via popup:', popupError);
        return null;
      }
    }
  };

  const getManagementToken = async (): Promise<string | null> => {
    if (!account) return null;

    try {
      console.log('[Auth] Acquiring Azure Management token...');
      const response = await instance.acquireTokenSilent({
        scopes: azureManagementRequest.scopes,
        account,
      });
      console.log('[Auth] Azure Management token acquired successfully');
      return response.accessToken;
    } catch (error) {
      console.error('[Auth] Failed to acquire management token silently:', error);
      // If silent token acquisition fails, try interactive
      try {
        console.log('[Auth] Trying interactive token acquisition...');
        const response = await instance.acquireTokenPopup({
          scopes: azureManagementRequest.scopes,
          account,
        });
        console.log('[Auth] Azure Management token acquired via popup');
        return response.accessToken;
      } catch (popupError) {
        console.error('[Auth] Failed to acquire management token via popup:', popupError);
        return null;
      }
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    getAccessToken,
    getManagementToken,
    isLoading: inProgress !== InteractionStatus.None || authState.status === 'loading',
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
