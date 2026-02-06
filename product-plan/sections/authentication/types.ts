/**
 * Authentication Section Types
 * Defines the data structures for user authentication and authorization
 */

export type UserRole = 'read-only' | 'admin';

export type AuthenticationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthenticationState {
  status: AuthenticationStatus;
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  // Azure AD handles actual credentials
  // This would typically just trigger the OAuth flow
  provider: 'microsoft';
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface SessionInfo {
  user: User;
  expiresAt: string; // ISO 8601 timestamp
  issuedAt: string; // ISO 8601 timestamp
}
