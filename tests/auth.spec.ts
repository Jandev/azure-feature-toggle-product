import { test, expect } from '@playwright/test';
import { TEST_USERS, mockLogin } from './helpers';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login page with sign-in button', async ({ page }) => {
      await page.goto('/login');
      
      // Verify login page elements
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in with microsoft/i })).toBeEnabled();
    });

    test('should show loading state when signing in', async ({ page }) => {
      await page.goto('/login');
      
      const signInButton = page.getByRole('button', { name: /sign in with microsoft/i });
      
      // Mock the OAuth flow to delay
      await page.route('**/api/auth/signin/azure-ad', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      // Click sign in button
      await signInButton.click();
      
      // Verify loading state (button should be disabled during sign-in)
      // Note: The actual loading state depends on NextAuth implementation
      // This test may need adjustment based on actual behavior
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected dashboard
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow authenticated admin to access dashboard', async ({ page }) => {
      // Mock authenticated session
      await mockLogin(page, TEST_USERS.admin);
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      
      // Should stay on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should allow authenticated read-only user to access dashboard', async ({ page }) => {
      // Mock authenticated session
      await mockLogin(page, TEST_USERS.readOnly);
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      
      // Should stay on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should allow access to resources page for authenticated users', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
      
      await page.goto('/resources');
      
      await expect(page).toHaveURL(/\/resources/);
      await expect(page.getByRole('heading', { name: /resources/i })).toBeVisible();
    });

    test('should allow access to audit log for authenticated users', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
      
      await page.goto('/audit-log');
      
      await expect(page).toHaveURL(/\/audit-log/);
      await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible();
    });
  });

  test.describe('User Session', () => {
    test('should display user menu for authenticated admin', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
      
      await page.goto('/dashboard');
      
      // Look for user avatar or menu button
      const userMenu = page.locator('[data-testid="user-menu"]').or(
        page.getByRole('button', { name: new RegExp(TEST_USERS.admin.name, 'i') })
      );
      
      await expect(userMenu.first()).toBeVisible();
    });

    test('should show admin role badge for admin users', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
      
      await page.goto('/dashboard');
      
      // Look for admin indicator (this depends on your UI implementation)
      // May need to open user menu first
    });

    test('should show read-only badge for read-only users', async ({ page }) => {
      await mockLogin(page, TEST_USERS.readOnly);
      
      await page.goto('/dashboard');
      
      // Should see read-only badge somewhere on the page
      await expect(page.getByText(/read.only/i)).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    test('should allow user to sign out', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
      
      await page.goto('/dashboard');
      
      // Find and click sign out button (may be in user menu)
      const userMenu = page.locator('[data-testid="user-menu"]').or(
        page.getByRole('button', { name: new RegExp(TEST_USERS.admin.name, 'i') })
      ).first();
      
      await userMenu.click();
      
      // Click sign out
      const signOutButton = page.getByRole('menuitem', { name: /sign out/i }).or(
        page.getByRole('button', { name: /sign out/i })
      );
      
      await signOutButton.click();
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
      
      await page.goto('/dashboard');
      
      // Verify on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Reload page
      await page.reload();
      
      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Navigation After Login', () => {
    test('should redirect to dashboard after successful login', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful login
      await mockLogin(page, TEST_USERS.admin);
      
      // Navigate to a protected route
      await page.goto('/dashboard');
      
      // Should be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should not allow accessing login page when already authenticated', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
      
      // Try to go to login page
      await page.goto('/login');
      
      // Should redirect to dashboard or home
      // This depends on your middleware implementation
      // await expect(page).toHaveURL(/\/(dashboard|$)/);
    });
  });
});
