# Authentication Section

User login with Microsoft / Azure AD authentication and role-based access control.

## Overview

The authentication section is the entry point to the Azure Feature Toggle Tool. It handles user login via Microsoft OAuth and establishes user identity and permissions (read-only or admin role).

## Components

### LoginScreen
Full-page login interface with Microsoft authentication.

**Features:**
- Beautiful gradient background
- Application branding and logo
- Microsoft sign-in button with icon
- Loading state (spinner + "Signing in...")
- Success state (checkmark + redirect message)
- Error state (alert icon + error message)
- Help link to contact administrator

**Props:**
- `status` — 'idle' | 'loading' | 'success' | 'error'
- `errorMessage` — Optional error message to display
- `successMessage` — Optional success message (defaults to "Login successful!")
- `onLogin` — Callback when user clicks "Sign in with Microsoft"

## Data Types

See `types.ts` for complete interface definitions:
- `User` — User object with id, name, email, role, avatarUrl
- `AuthenticationState` — Complete auth state with status, user, error, isAuthenticated

See `sample-data.json` for test data with 7 different user scenarios.

## Implementation Notes

**OAuth Flow:**
1. User clicks "Sign in with Microsoft"
2. Set status to 'loading'
3. Redirect to Microsoft OAuth consent screen
4. Microsoft redirects back with auth code
5. Exchange code for access token
6. Fetch user info from Microsoft Graph API
7. Look up user role in your database
8. Create session
9. Set status to 'success', redirect to dashboard

**Error Handling:**
- Network errors: "Unable to connect to authentication service. Please check your internet connection."
- Unauthorized users: "Your account does not have access to this application. Please contact your administrator."
- Session expiry: "Your session has expired. Please log in again."

**Session Management:**
- Store session in secure HTTP-only cookie
- Check session validity on app load
- Redirect to login when expired
- Implement token refresh if needed

## Dependencies

- **lucide-react** — Icons (AlertCircle, CheckCircle2, Loader2)
- **shadcn/ui** — Button, Card components
  - Install via: `npx shadcn@latest add button card`

## Integration Example

```tsx
const [authState, setAuthState] = useState<AuthenticationState>({
  status: 'idle',
  user: null,
  error: null,
  isAuthenticated: false,
});

const handleLogin = async () => {
  setAuthState({ ...authState, status: 'loading' });
  
  try {
    // Initiate OAuth flow
    window.location.href = '/api/auth/microsoft/login';
  } catch (error) {
    setAuthState({
      ...authState,
      status: 'error',
      error: 'Unable to connect to authentication service. Please check your internet connection.',
    });
  }
};

return (
  <LoginScreen
    status={authState.status}
    errorMessage={authState.error || undefined}
    onLogin={handleLogin}
  />
);
```

## User Flows

1. **Successful Login**: User clicks button → OAuth → Success message → Redirect to dashboard
2. **Network Error**: User clicks button → Network fails → Error message displayed
3. **Unauthorized User**: User completes OAuth → Not in allowed list → Error message
4. **Session Expired**: User working in app → Session expires → Redirect to login

See `tests.md` for complete test-writing instructions.
