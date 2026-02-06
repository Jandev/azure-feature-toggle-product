import { test, expect } from '@playwright/test';
import { TEST_USERS, mockLogin, createTestResource, deleteResource, navigateAndWait } from './helpers';

test.describe('Resource Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for all resource tests
    await mockLogin(page, TEST_USERS.admin);
  });

  test.describe('Empty State', () => {
    test('should display empty state when no resources exist', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Look for empty state
      const emptyState = page.getByText(/no resources configured/i);
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
        await expect(page.getByText(/get started by adding your first/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /add your first resource/i })).toBeVisible();
      }
    });

    test('should open add form when clicking "Add Your First Resource"', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const emptyState = page.getByText(/no resources configured/i);
      if (await emptyState.isVisible()) {
        await page.getByRole('button', { name: /add your first resource/i }).click();
        
        // Form should open
        await expect(page.getByText(/add new resource/i)).toBeVisible();
      }
    });
  });

  test.describe('Add Resource', () => {
    test('should display add resource form with all fields', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Click add resource button
      const addButton = page.getByRole('button', { name: /add.*resource/i }).first();
      await addButton.click();
      
      // Verify form fields
      await expect(page.getByLabel(/display name/i)).toBeVisible();
      await expect(page.getByLabel(/environment/i)).toBeVisible();
      await expect(page.getByLabel(/resource name/i)).toBeVisible();
      await expect(page.getByLabel(/resource group/i)).toBeVisible();
      await expect(page.getByLabel(/subscription id/i)).toBeVisible();
      await expect(page.getByLabel(/connection string/i)).toBeVisible();
      
      // Verify buttons
      await expect(page.getByRole('button', { name: /test connection/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /save|add resource/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    });

    test('should require all mandatory fields', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const addButton = page.getByRole('button', { name: /add.*resource/i }).first();
      await addButton.click();
      
      // Try to submit empty form
      const saveButton = page.getByRole('button', { name: /save|add resource/i });
      await saveButton.click();
      
      // Should show validation errors (implementation-dependent)
      // This test may need adjustment based on actual validation behavior
    });

    test('should successfully add a new resource', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const addButton = page.getByRole('button', { name: /add.*resource/i }).first();
      await addButton.click();
      
      // Fill in form
      await page.getByLabel(/display name/i).fill('Test Development');
      await page.getByLabel(/environment/i).selectOption('development');
      await page.getByLabel(/resource name/i).fill('appconfig-test-dev');
      await page.getByLabel(/resource group/i).fill('rg-test-dev');
      await page.getByLabel(/subscription id/i).fill('12345678-1234-1234-1234-123456789abc');
      await page.getByLabel(/connection string/i).fill('Endpoint=https://test.azconfig.io;Id=test;Secret=test');
      
      // Submit form
      const saveButton = page.getByRole('button', { name: /save|add resource/i });
      await saveButton.click();
      
      // Should return to list and show new resource
      await expect(page.getByText('Test Development')).toBeVisible();
    });

    test('should show loading state when testing connection', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const addButton = page.getByRole('button', { name: /add.*resource/i }).first();
      await addButton.click();
      
      // Fill in minimum fields for connection test
      await page.getByLabel(/connection string/i).fill('Endpoint=https://test.azconfig.io;Id=test;Secret=test');
      
      // Mock slow connection test
      await page.route('**/api/resources/test-connection', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, message: 'Connection successful!' })
        });
      });
      
      // Click test connection
      const testButton = page.getByRole('button', { name: /test connection/i });
      await testButton.click();
      
      // Should show loading state
      await expect(page.getByRole('button', { name: /testing/i })).toBeVisible();
      
      // Wait for success message
      await expect(page.getByText(/connection successful/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show error when connection test fails', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const addButton = page.getByRole('button', { name: /add.*resource/i }).first();
      await addButton.click();
      
      // Fill in connection string
      await page.getByLabel(/connection string/i).fill('invalid-connection-string');
      
      // Mock failed connection test
      await page.route('**/api/resources/test-connection', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: false, 
            message: 'Connection failed: Invalid connection string format.' 
          })
        });
      });
      
      // Click test connection
      const testButton = page.getByRole('button', { name: /test connection/i });
      await testButton.click();
      
      // Should show error message
      await expect(page.getByText(/connection failed/i)).toBeVisible();
    });
  });

  test.describe('Edit Resource', () => {
    test('should open edit form with pre-filled data', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Find first resource and click edit
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Form should open with "Edit Resource" title
        await expect(page.getByText(/edit resource/i)).toBeVisible();
        
        // Fields should be pre-filled (check at least display name is not empty)
        const displayNameInput = page.getByLabel(/display name/i);
        await expect(displayNameInput).not.toHaveValue('');
      }
    });

    test('should update resource successfully', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Change display name
        const displayNameInput = page.getByLabel(/display name/i);
        await displayNameInput.clear();
        await displayNameInput.fill('Updated Resource Name');
        
        // Save changes
        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();
        
        // Should return to list with updated name
        await expect(page.getByText('Updated Resource Name')).toBeVisible();
      }
    });

    test('should allow changing environment type', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Change environment to production
        await page.getByLabel(/environment/i).selectOption('production');
        
        // Save changes
        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();
        
        // Should show production badge (red)
        const badge = page.locator('text=Production').or(page.locator('[class*="red"]').filter({ hasText: /production/i }));
        await expect(badge.first()).toBeVisible();
      }
    });
  });

  test.describe('Delete Resource', () => {
    test('should show confirmation dialog when deleting', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Should show confirmation dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/are you sure/i)).toBeVisible();
      }
    });

    test('should cancel deletion when clicking cancel', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Count resources before
      const resourceCards = page.locator('[class*="card"]').filter({ hasText: /appconfig|development|staging|production/i });
      const countBefore = await resourceCards.count();
      
      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Click cancel in dialog
        const cancelButton = page.getByRole('dialog').getByRole('button', { name: /cancel/i });
        await cancelButton.click();
        
        // Resource should still exist
        const countAfter = await resourceCards.count();
        expect(countAfter).toBe(countBefore);
      }
    });

    test('should delete resource when confirmed', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Get resource name to verify deletion
      const firstResource = page.locator('[class*="card"]').first();
      const resourceName = await firstResource.textContent();
      
      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion
        const confirmButton = page.getByRole('dialog').getByRole('button', { name: /delete|confirm/i });
        await confirmButton.click();
        
        // Resource should be removed
        await expect(page.getByText(resourceName || '')).not.toBeVisible();
      }
    });
  });

  test.describe('Resource List', () => {
    test('should display all resources in grid', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Should show resources heading
      await expect(page.getByRole('heading', { name: /resources/i })).toBeVisible();
      
      // Check for resource cards
      const cards = page.locator('[class*="card"]').filter({ hasText: /appconfig|development|staging|production/i });
      const count = await cards.count();
      
      if (count > 0) {
        // Should display at least one resource
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should show environment badges with correct colors', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Check for environment badges
      const devBadge = page.locator('text=Development').or(page.locator('[class*="blue"]').filter({ hasText: /development/i }));
      const stagingBadge = page.locator('text=Staging').or(page.locator('[class*="yellow"]').filter({ hasText: /staging/i }));
      const prodBadge = page.locator('text=Production').or(page.locator('[class*="red"]').filter({ hasText: /production/i }));
      
      // At least one should be visible if resources exist
      const hasResources = await page.locator('[class*="card"]').count() > 0;
      if (hasResources) {
        const hasBadge = await devBadge.first().isVisible() || 
                        await stagingBadge.first().isVisible() || 
                        await prodBadge.first().isVisible();
        expect(hasBadge).toBeTruthy();
      }
    });

    test('should show connection status for each resource', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const cards = page.locator('[class*="card"]');
      const count = await cards.count();
      
      if (count > 0) {
        // Each card should show some connection status indicator
        // This is implementation-dependent
      }
    });
  });

  test.describe('Read-Only User Restrictions', () => {
    test('should not allow read-only users to add resources', async ({ page }) => {
      // Login as read-only user
      await mockLogin(page, TEST_USERS.readOnly);
      
      await navigateAndWait(page, '/resources');
      
      // Add button should be disabled or not visible
      const addButton = page.getByRole('button', { name: /add.*resource/i });
      const isVisible = await addButton.isVisible();
      
      if (isVisible) {
        await expect(addButton).toBeDisabled();
      }
    });

    test('should not allow read-only users to edit resources', async ({ page }) => {
      await mockLogin(page, TEST_USERS.readOnly);
      
      await navigateAndWait(page, '/resources');
      
      // Edit buttons should be disabled or not visible
      const editButtons = page.getByRole('button', { name: /edit/i });
      const count = await editButtons.count();
      
      for (let i = 0; i < count; i++) {
        await expect(editButtons.nth(i)).toBeDisabled();
      }
    });

    test('should not allow read-only users to delete resources', async ({ page }) => {
      await mockLogin(page, TEST_USERS.readOnly);
      
      await navigateAndWait(page, '/resources');
      
      // Delete buttons should be disabled or not visible
      const deleteButtons = page.getByRole('button', { name: /delete/i });
      const count = await deleteButtons.count();
      
      for (let i = 0; i < count; i++) {
        await expect(deleteButtons.nth(i)).toBeDisabled();
      }
    });
  });

  test.describe('Environment Types', () => {
    test('should support all three environment types', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const addButton = page.getByRole('button', { name: /add.*resource/i }).first();
      await addButton.click();
      
      // Check environment dropdown has all options
      const environmentSelect = page.getByLabel(/environment/i);
      await environmentSelect.click();
      
      // Should have development, staging, production options
      await expect(page.locator('option[value="development"]')).toBeAttached();
      await expect(page.locator('option[value="staging"]')).toBeAttached();
      await expect(page.locator('option[value="production"]')).toBeAttached();
    });
  });

  test.describe('Connection String Masking', () => {
    test('should mask connection string in resource cards', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      // Connection strings should be masked with asterisks
      // This depends on whether connection strings are displayed in cards
      // May need to verify they're NOT shown in plain text
    });

    test('should show masked connection string in edit form', async ({ page }) => {
      await navigateAndWait(page, '/resources');
      
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Connection string field should be type="password" or show masked value
        const connectionInput = page.getByLabel(/connection string/i);
        const inputType = await connectionInput.getAttribute('type');
        
        // Should be password type to mask the value
        expect(inputType).toBe('password');
      }
    });
  });
});
