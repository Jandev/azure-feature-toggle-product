# Authentication Section — Test-Writing Instructions

These instructions are **framework-agnostic** and describe **what to test** rather than **how to test**. Adapt them to your testing framework (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

---

## Overview

Write tests for the authentication feature before implementing it (TDD approach). These tests ensure users can log in via Microsoft OAuth, handle errors gracefully, and establish user sessions correctly.

## Key User Flows to Test

### Flow 1: Successful Login

**Given:** User is on the login page  
**When:** User clicks "Sign in with Microsoft" button  
**And:** User completes Microsoft OAuth flow successfully  
**And:** User has valid access permissions  
**Then:** User sees success message "Login successful!"  
**And:** User sees "Redirecting to dashboard..." text  
**And:** User is redirected to the dashboard page  
**And:** User session is created and stored  

**UI Elements to Verify:**
- Button with text "Sign in with Microsoft" exists and is clickable
- Success message displays with green checkmark icon
- Success message text matches "Login successful!" or custom message
- Secondary text shows "Redirecting to dashboard..."
- Dashboard page loads after redirect

**Assertions:**
- Login button is enabled before click
- Loading spinner appears during authentication
- Button is disabled while loading
- Button text changes to "Signing in..." during load
- Success state renders after OAuth completes
- Session token/cookie is set
- User object contains: id, name, email, role
- Redirect to `/dashboard` or `/` occurs within 2 seconds

---

### Flow 2: Failed Login - Network Error

**Given:** User is on the login page  
**When:** User clicks "Sign in with Microsoft" button  
**And:** Network request fails (no internet or service down)  
**Then:** User sees error message  
**And:** Error message reads "Unable to connect to authentication service. Please check your internet connection."  
**And:** User can try again by clicking the button  

**UI Elements to Verify:**
- Error alert displays with red background
- Error alert has alert icon (AlertCircle)
- Error message text is visible and readable
- Login button remains enabled after error
- Button text returns to "Sign in with Microsoft"

**Assertions:**
- Error state renders when network fails
- Error message is displayed in error alert
- Button is re-enabled after error
- No redirect occurs
- No session is created

---

### Flow 3: Failed Login - Unauthorized User

**Given:** User is on the login page  
**When:** User clicks "Sign in with Microsoft" button  
**And:** User completes Microsoft OAuth successfully  
**But:** User's email is not in the allowed user list  
**Then:** User sees error message  
**And:** Error message reads "Your account does not have access to this application. Please contact your administrator."  
**And:** User is NOT redirected to dashboard  

**UI Elements to Verify:**
- Error alert displays with red background
- Error message mentions lack of access
- "Contact your administrator" link is visible in footer
- Login button is enabled for retry

**Assertions:**
- OAuth completes successfully (token received)
- Backend rejects user based on access list
- Error state renders with appropriate message
- No session is created
- No redirect occurs

---

### Flow 4: Session Expired

**Given:** User is logged in and working in the application  
**When:** Session expires (time-based)  
**And:** User attempts an action (e.g., toggle a feature flag)  
**Then:** System detects expired session  
**And:** User is redirected to login page  
**And:** User sees message "Your session has expired. Please log in again."  

**UI Elements to Verify:**
- Error message displays on login page after redirect
- Error message text matches "Your session has expired. Please log in again."
- Login button is available to sign in again

**Assertions:**
- Session expiry is detected before API call
- User is redirected to `/login`
- Error message is passed via query param or state
- Session/token is cleared from storage

---

### Flow 5: Loading State

**Given:** User is on the login page  
**When:** User clicks "Sign in with Microsoft" button  
**Then:** Button shows loading state immediately  
**And:** Button displays spinner icon  
**And:** Button text changes to "Signing in..."  
**And:** Button is disabled during loading  

**UI Elements to Verify:**
- Button has Loader2 (spinner) icon
- Button text is "Signing in..."
- Button has disabled attribute
- Button appears visually disabled (reduced opacity)

**Assertions:**
- Loading state activates immediately on button click
- Button cannot be clicked again while loading
- Spinner animates (spins)
- State persists until OAuth redirect occurs

---

## Component Interaction Tests

### LoginScreen Component

**Prop: `status`**
- When `status` is 'idle': Button shows "Sign in with Microsoft" and is enabled
- When `status` is 'loading': Button shows "Signing in..." with spinner and is disabled
- When `status` is 'success': Button shows "Signed in" with checkmark and is disabled; success alert displays
- When `status` is 'error': Button returns to "Sign in with Microsoft" and is enabled; error alert displays

**Prop: `errorMessage`**
- When provided and status is 'error': Error message displays in red alert box
- When not provided and status is 'error': No error alert renders

**Prop: `successMessage`**
- When provided and status is 'success': Custom success message displays in green alert
- When not provided and status is 'success': Default "Login successful!" message displays

**Prop: `onLogin`**
- When button is clicked: `onLogin` callback is called once
- When button is disabled (loading/success): `onLogin` is not called

---

## Edge Cases

### 1. Rapid Button Clicks
**Scenario:** User clicks login button multiple times quickly  
**Expected:** Only first click triggers OAuth; subsequent clicks are ignored  
**Assertion:** `onLogin` is called exactly once, not multiple times

### 2. Browser Back Button After Login
**Scenario:** User logs in successfully, then presses browser back button  
**Expected:** User should not return to login page; should stay on dashboard or be redirected forward  
**Assertion:** Login page redirects authenticated users to dashboard

### 3. Long Error Messages
**Scenario:** Backend returns very long error message (100+ characters)  
**Expected:** Error alert wraps text properly and remains readable  
**Assertion:** Error alert does not break layout; text wraps and is fully visible

### 4. Missing OAuth Configuration
**Scenario:** Azure AD OAuth app is not configured (missing client ID)  
**Expected:** Error message displays: "Authentication service is not configured. Please contact your administrator."  
**Assertion:** Friendly error shown instead of technical error

### 5. OAuth State Mismatch
**Scenario:** OAuth callback returns with mismatched state parameter (security check)  
**Expected:** Authentication fails with error: "Authentication failed. Please try again."  
**Assertion:** User remains on login page with error; session is not created

---

## Sample Test Data

Use these scenarios to test different authentication states:

### User 1: Successful Admin Login
```json
{
  "id": "user-001",
  "name": "Sarah Chen",
  "email": "sarah.chen@company.com",
  "role": "admin"
}
```

### User 2: Successful Read-Only Login
```json
{
  "id": "user-002",
  "name": "Michael Rodriguez",
  "email": "michael.rodriguez@company.com",
  "role": "read-only"
}
```

### User 3: Unauthorized User
```json
{
  "email": "external.user@gmail.com",
  "error": "unauthorized",
  "message": "Your account does not have access to this application. Please contact your administrator."
}
```

### User 4: Network Error
```json
{
  "error": "network",
  "message": "Unable to connect to authentication service. Please check your internet connection."
}
```

### User 5: Expired Session
```json
{
  "error": "session_expired",
  "message": "Your session has expired. Please log in again."
}
```

---

## Integration Points to Test

### 1. OAuth Redirect
- Clicking "Sign in with Microsoft" triggers redirect to Microsoft OAuth URL
- OAuth URL includes correct client_id, redirect_uri, scope, state

### 2. OAuth Callback Handling
- Callback route `/auth/callback` handles OAuth response
- Auth code is extracted from query parameters
- Auth code is exchanged for access token
- Access token is used to fetch user profile from Microsoft Graph

### 3. Session Creation
- User profile data is stored in session
- User role is fetched from database and added to session
- Session token/cookie is created with appropriate expiry
- Session is stored (server-side session store or JWT)

### 4. Session Validation
- On app load, session is validated
- Expired sessions trigger redirect to login
- Valid sessions allow access to protected routes

---

## Accessibility Tests

### Keyboard Navigation
- Tab key focuses the login button
- Enter key triggers login when button is focused
- Error messages are announced to screen readers

### Screen Reader Support
- Button has accessible label: "Sign in with Microsoft"
- Loading state is announced: "Signing in, please wait"
- Success state is announced: "Login successful, redirecting"
- Error alerts have role="alert" for immediate announcement

### Color Contrast
- Error text meets WCAG AA contrast ratio (4.5:1 minimum)
- Button text is readable in all states
- Dark mode also meets contrast requirements

---

## Done When

- [ ] All 5 key user flows have passing tests
- [ ] Component renders correctly for all status values
- [ ] All prop variations are tested
- [ ] Edge cases are covered
- [ ] OAuth integration points are tested
- [ ] Session management is tested
- [ ] Accessibility requirements are met
- [ ] Tests are framework-agnostic and well-documented

---

## Notes

- These tests should be written **before** implementing the authentication feature (TDD)
- Focus on **user behavior** and **expected outcomes**, not implementation details
- Test both **happy paths** (success) and **unhappy paths** (errors)
- Ensure tests are **deterministic** (same result every time)
- Use **mocks/stubs** for external services (Microsoft OAuth, API calls)
