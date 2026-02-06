import { test, expect } from '@playwright/test';
import { TEST_USERS, mockLogin, navigateAndWait } from './helpers';

test.describe('Feature Toggle Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock resources and toggles
    await page.route('**/api/resources', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'res-001',
            displayName: 'Development',
            environmentType: 'development',
            resourceName: 'appconfig-dev',
            resourceGroup: 'rg-dev',
            connectionStatus: 'connected'
          },
          {
            id: 'res-002',
            displayName: 'Production',
            environmentType: 'production',
            resourceName: 'appconfig-prod',
            resourceGroup: 'rg-prod',
            connectionStatus: 'connected'
          }
        ])
      });
    });
  });

  test.describe('Admin User - Dashboard View', () => {
    test.beforeEach(async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
    });

    test('should display dashboard with toggles', async ({ page }) => {
      // Mock toggles API
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'toggle-001',
              name: 'enable_dark_mode',
              description: 'Dark mode feature',
              enabled: true,
              lastModifiedBy: 'Sarah Chen',
              lastModifiedAt: new Date().toISOString()
            },
            {
              id: 'toggle-002',
              name: 'experimental_checkout',
              description: 'New checkout flow',
              enabled: false,
              lastModifiedBy: 'Michael Rodriguez',
              lastModifiedAt: new Date().toISOString()
            }
          ])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Verify dashboard elements
      await expect(page.getByRole('heading', { name: /feature toggles/i })).toBeVisible();
      await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
      await expect(page.getByText(/experimental_checkout/i)).toBeVisible();
    });

    test('should show correct toggle count', async ({ page }) => {
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'feature_1', enabled: true },
            { id: 'toggle-002', name: 'feature_2', enabled: false },
            { id: 'toggle-003', name: 'feature_3', enabled: true }
          ])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Should show "3 toggles"
      await expect(page.getByText(/3 toggles/i)).toBeVisible();
    });

    test('should display environment badge with correct color', async ({ page }) => {
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      });

      await navigateAndWait(page, '/dashboard');

      // Should show development badge (blue)
      const badge = page.locator('text=Development').or(page.locator('[class*="blue"]'));
      await expect(badge.first()).toBeVisible();
    });

    test('should allow admin to toggle feature in development', async ({ page }) => {
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'toggle-001',
              name: 'test_feature',
              enabled: false
            }
          ])
        });
      });

      let toggleUpdateCalled = false;
      await page.route('**/api/resources/*/toggles/*', async (route) => {
        if (route.request().method() === 'PUT') {
          toggleUpdateCalled = true;
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              id: 'toggle-001',
              name: 'test_feature',
              enabled: true
            })
          });
        } else {
          await route.continue();
        }
      });

      await navigateAndWait(page, '/dashboard');

      // Find and click toggle switch
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.click();

      // Verify API was called
      await page.waitForTimeout(500);
      expect(toggleUpdateCalled).toBeTruthy();
    });

    test('should NOT show production confirmation for non-production environments', async ({ page }) => {
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'test_feature', enabled: false }
          ])
        });
      });

      await page.route('**/api/resources/*/toggles/*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'toggle-001', name: 'test_feature', enabled: true })
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Click toggle
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.click();

      // Should NOT show production confirmation modal
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Admin User - Production Environment', () => {
    test.beforeEach(async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);
    });

    test('should show production warning banner', async ({ page }) => {
      // Set current resource to production
      await page.evaluate(() => {
        localStorage.setItem('currentResourceId', 'res-002');
      });

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Should show production warning
      await expect(page.getByText(/production environment/i)).toBeVisible();
      await expect(page.getByText(/changes.*will affect.*live users/i)).toBeVisible();
    });

    test('should show confirmation modal when toggling in production', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('currentResourceId', 'res-002');
      });

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'toggle-001',
              name: 'critical_feature',
              enabled: false
            }
          ])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Click toggle switch
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.click();

      // Should show confirmation dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/production environment/i)).toBeVisible();
      await expect(page.getByText(/critical_feature/i)).toBeVisible();
    });

    test('should require checkbox confirmation before enabling production toggle', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('currentResourceId', 'res-002');
      });

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'test_feature', enabled: false }
          ])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Click toggle
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.click();

      // Modal should appear
      await expect(page.getByRole('dialog')).toBeVisible();

      // Confirm button should be disabled initially
      const confirmButton = page.getByRole('button', { name: /confirm/i });
      await expect(confirmButton).toBeDisabled();

      // Check the confirmation checkbox
      const checkbox = page.getByRole('checkbox');
      await checkbox.check();

      // Now confirm button should be enabled
      await expect(confirmButton).toBeEnabled();
    });

    test('should cancel production toggle change', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('currentResourceId', 'res-002');
      });

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'test_feature', enabled: false }
          ])
        });
      });

      let toggleUpdateCalled = false;
      await page.route('**/api/resources/*/toggles/*', async (route) => {
        if (route.request().method() === 'PUT') {
          toggleUpdateCalled = true;
        }
        await route.continue();
      });

      await navigateAndWait(page, '/dashboard');

      // Click toggle
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.click();

      // Cancel in dialog
      const cancelButton = page.getByRole('dialog').getByRole('button', { name: /cancel/i });
      await cancelButton.click();

      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();

      // API should NOT have been called
      expect(toggleUpdateCalled).toBeFalsy();
    });
  });

  test.describe('Read-Only User', () => {
    test.beforeEach(async ({ page }) => {
      await mockLogin(page, TEST_USERS.readOnly);
    });

    test('should show read-only badge', async ({ page }) => {
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Should show read-only badge
      await expect(page.getByText(/read.only/i)).toBeVisible();
    });

    test('should disable all toggle switches for read-only users', async ({ page }) => {
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'feature_1', enabled: true },
            { id: 'toggle-002', name: 'feature_2', enabled: false }
          ])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // All switches should be disabled
      const switches = page.locator('[role="switch"]');
      const count = await switches.count();

      for (let i = 0; i < count; i++) {
        await expect(switches.nth(i)).toBeDisabled();
      }
    });

    test('should show tooltip on hover for read-only users', async ({ page }) => {
      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'test_feature', enabled: true }
          ])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Hover over switch
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.hover();

      // Should show tooltip about read-only access
      // Implementation depends on your tooltip library
    });
  });

  test.describe('Search and Filter', () => {
    test.beforeEach(async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'enable_dark_mode', enabled: true },
            { id: 'toggle-002', name: 'enable_analytics', enabled: true },
            { id: 'toggle-003', name: 'experimental_checkout', enabled: false },
            { id: 'toggle-004', name: 'beta_feature', enabled: false }
          ])
        });
      });
    });

    test('should filter toggles by search query', async ({ page }) => {
      await navigateAndWait(page, '/dashboard');

      // Type in search
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('enable');

      // Should show only toggles matching "enable"
      await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
      await expect(page.getByText(/enable_analytics/i)).toBeVisible();
      await expect(page.getByText(/experimental_checkout/i)).not.toBeVisible();
    });

    test('should filter by enabled state', async ({ page }) => {
      await navigateAndWait(page, '/dashboard');

      // Click "Enabled" filter button
      const enabledButton = page.getByRole('button', { name: /^enabled$/i });
      await enabledButton.click();

      // Should show only enabled toggles
      await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
      await expect(page.getByText(/enable_analytics/i)).toBeVisible();
      await expect(page.getByText(/experimental_checkout/i)).not.toBeVisible();
      await expect(page.getByText(/beta_feature/i)).not.toBeVisible();

      // Count should update
      await expect(page.getByText(/2 toggles/i)).toBeVisible();
    });

    test('should filter by disabled state', async ({ page }) => {
      await navigateAndWait(page, '/dashboard');

      // Click "Disabled" filter button
      const disabledButton = page.getByRole('button', { name: /^disabled$/i });
      await disabledButton.click();

      // Should show only disabled toggles
      await expect(page.getByText(/experimental_checkout/i)).toBeVisible();
      await expect(page.getByText(/beta_feature/i)).toBeVisible();
      await expect(page.getByText(/enable_dark_mode/i)).not.toBeVisible();

      // Count should update
      await expect(page.getByText(/2 toggles/i)).toBeVisible();
    });

    test('should combine search and filter', async ({ page }) => {
      await navigateAndWait(page, '/dashboard');

      // Type search query
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('enable');

      // Apply enabled filter
      const enabledButton = page.getByRole('button', { name: /^enabled$/i });
      await enabledButton.click();

      // Should show only enabled toggles matching "enable"
      await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
      await expect(page.getByText(/enable_analytics/i)).toBeVisible();
      await expect(page.getByText(/experimental/i)).not.toBeVisible();
    });

    test('should clear search', async ({ page }) => {
      await navigateAndWait(page, '/dashboard');

      // Type search
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('experimental');

      // Should filter
      await expect(page.getByText(/experimental_checkout/i)).toBeVisible();
      await expect(page.getByText(/enable_dark_mode/i)).not.toBeVisible();

      // Clear search
      await searchInput.clear();

      // Should show all toggles again
      await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
      await expect(page.getByText(/experimental_checkout/i)).toBeVisible();
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state when no toggles exist', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Should show empty state message
      await expect(page.getByText(/no feature toggles/i)).toBeVisible();
    });

    test('should show no results when search has no matches', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'feature_one', enabled: true }
          ])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Search for non-existent toggle
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('nonexistent_feature');

      // Should show no results message
      await expect(page.getByText(/no toggles match/i)).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading skeletons while fetching toggles', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);

      // Delay the response
      await page.route('**/api/resources/*/toggles', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify([])
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Should show loading skeletons
      const skeletons = page.locator('[class*="animate-pulse"]');
      await expect(skeletons.first()).toBeVisible();
    });

    test('should show loading spinner on individual toggle during update', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'test_feature', enabled: false }
          ])
        });
      });

      // Delay the update
      await page.route('**/api/resources/*/toggles/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'toggle-001', name: 'test_feature', enabled: true })
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Click toggle
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.click();

      // Should show loading spinner
      await expect(page.locator('[class*="animate-spin"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message when toggle update fails', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'toggle-001', name: 'test_feature', enabled: false }
          ])
        });
      });

      // Mock failed update
      await page.route('**/api/resources/*/toggles/*', async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Failed to update toggle' })
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Click toggle
      const toggleSwitch = page.locator('[role="switch"]').first();
      await toggleSwitch.click();

      // Should show error message
      await expect(page.getByText(/failed/i)).toBeVisible();
    });

    test('should show error state when fetching toggles fails', async ({ page }) => {
      await mockLogin(page, TEST_USERS.admin);

      await page.route('**/api/resources/*/toggles', async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Failed to fetch toggles' })
        });
      });

      await navigateAndWait(page, '/dashboard');

      // Should show error state
      await expect(page.getByText(/failed.*load/i)).toBeVisible();
    });
  });
});
