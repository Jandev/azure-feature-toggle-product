# Milestone 2: Authentication

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

## Goal

Implement user authentication with Azure AD / Microsoft login and role-based access control (read-only vs. admin).

## Overview

The authentication section handles user login and establishes their identity and permissions within the Azure Feature Toggle Tool. This is the entry point to the application and determines whether users have read-only or read-write access to feature toggles.

**Key Functionality:**
- User login with Microsoft / Azure AD authentication
- Retrieve user identity and role (read-only or admin)
- Display authentication states (loading, success, error)
- Session management and expiry handling
- Redirect to dashboard after successful login

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/authentication/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

The test instructions are framework-agnostic — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section component from `product-plan/sections/authentication/components/`:

- `LoginScreen.tsx` — Login UI with Microsoft sign-in button and state handling

**Props Interface:**

```typescript
interface LoginScreenProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  successMessage?: string;
  onLogin: () => void;
}
```

### Data Layer

The component expects these data shapes (from `types.ts`):

```typescript
type UserRole = 'read-only' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthenticationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;
}
```

You'll need to:
- Set up Azure AD / Microsoft OAuth integration
- Create API endpoint to exchange auth code for user info
- Fetch user role from your database or identity provider
- Store authentication state globally (Context, Redux, Zustand, etc.)
- Handle session storage and expiry

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onLogin` | Called when user clicks "Sign in with Microsoft". Should initiate OAuth flow. |

### Authentication Flow

**Backend Integration:**

1. **Initiate OAuth:** When user clicks "Sign in with Microsoft", redirect to Microsoft OAuth consent screen
2. **Callback handling:** Microsoft redirects back with auth code
3. **Token exchange:** Exchange auth code for access token
4. **Fetch user info:** Get user email and name from Microsoft Graph API
5. **Retrieve role:** Look up user in your database to get their role (read-only or admin)
6. **Create session:** Issue session token/cookie
7. **Return user:** Send User object back to frontend

**Frontend State:**

- Set `status: 'loading'` when login initiated
- On success: Set `user` and `isAuthenticated: true`, redirect to dashboard
- On error: Set `error` message and `status: 'error'`

### Session Management

Implement session handling:

- **Session storage:** Store authentication state in secure HTTP-only cookie or localStorage (with token)
- **Session expiry:** Check session validity on app load and before API calls
- **Automatic logout:** Redirect to login when session expires
- **Refresh tokens:** Implement token refresh if needed

### Error Handling

Handle these error scenarios:

- **Network error:** "Unable to connect to authentication service. Please check your internet connection."
- **Invalid credentials:** "Authentication failed. Please check your credentials and try again."
- **Unauthorized access:** "Your account does not have access to this application. Please contact your administrator."
- **Session expired:** "Your session has expired. Please log in again."

### Empty States

Not applicable for this section — authentication is always the first step.

## Files to Reference

- `product-plan/sections/authentication/README.md` — Feature overview and design intent
- `product-plan/sections/authentication/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/authentication/components/` — React components
- `product-plan/sections/authentication/types.ts` — TypeScript interfaces
- `product-plan/sections/authentication/sample-data.json` — Test data

## Expected User Flows

When fully implemented, users should be able to complete these flows:

### Flow 1: Successful Login

1. User lands on login screen
2. User clicks "Sign in with Microsoft" button
3. User authenticates via Azure AD (external consent screen)
4. System retrieves user information and role
5. **Outcome:** Success message displays briefly, user redirects to Dashboard with appropriate permissions

### Flow 2: Failed Login - Network Error

1. User lands on login screen
2. User clicks "Sign in with Microsoft"
3. Network error occurs during OAuth redirect
4. **Outcome:** Error message displays: "Unable to connect to authentication service. Please check your internet connection and try again."

### Flow 3: Failed Login - Unauthorized User

1. User lands on login screen
2. User clicks "Sign in with Microsoft"
3. User authenticates successfully with Microsoft
4. System determines user does not have access (not in allowed list)
5. **Outcome:** Error message displays: "Your account does not have access to this application. Please contact your administrator."

### Flow 4: Session Expired

1. User is working in the application
2. Session expires (time-based)
3. User attempts an action (e.g., toggle a feature)
4. **Outcome:** System detects expired session, redirects to login with message "Your session has expired. Please log in again."

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] User can click "Sign in with Microsoft" to initiate OAuth
- [ ] OAuth flow completes successfully with Microsoft
- [ ] User role is retrieved from backend
- [ ] Session is created and stored securely
- [ ] User redirects to dashboard after successful login
- [ ] Loading spinner shows during authentication
- [ ] Error messages display for failed login attempts
- [ ] Session expiry is detected and handled
- [ ] Login screen matches the visual design
- [ ] Responsive on mobile
