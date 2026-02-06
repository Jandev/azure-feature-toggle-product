import { Page } from '@playwright/test';

/**
 * Test utilities for authentication and session management
 */

export interface TestUser {
  email: string;
  name: string;
  role: 'READ_ONLY' | 'ADMIN';
}

export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  readOnly: {
    email: 'readonly@test.com',
    name: 'Read Only User',
    role: 'READ_ONLY' as const,
  },
};

/**
 * Mock authentication by directly setting session cookie
 * In a real test environment, you would use Azure AD test accounts
 */
export async function mockLogin(page: Page, user: TestUser) {
  // For now, navigate to login page
  // In a real implementation, you would mock the OAuth flow or use test credentials
  await page.goto('/login');
  
  // Store user info in localStorage to simulate logged-in state
  await page.evaluate((userData) => {
    localStorage.setItem('test-user', JSON.stringify(userData));
  }, user);
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Fill a form field by label
 */
export async function fillFieldByLabel(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

/**
 * Click a button by text
 */
export async function clickButton(page: Page, text: string) {
  await page.getByRole('button', { name: text }).click();
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message: string) {
  await page.getByText(message).waitFor({ state: 'visible' });
}

/**
 * Create a test resource
 */
export async function createTestResource(page: Page, data: {
  displayName: string;
  environment: 'development' | 'staging' | 'production';
  resourceName: string;
  resourceGroup: string;
  subscriptionId: string;
  connectionString: string;
}) {
  await navigateAndWait(page, '/resources');
  await clickButton(page, 'Add Resource');
  
  await fillFieldByLabel(page, 'Display Name', data.displayName);
  await page.getByLabel('Environment').selectOption(data.environment);
  await fillFieldByLabel(page, 'Resource Name', data.resourceName);
  await fillFieldByLabel(page, 'Resource Group', data.resourceGroup);
  await fillFieldByLabel(page, 'Subscription ID', data.subscriptionId);
  await fillFieldByLabel(page, 'Connection String', data.connectionString);
  
  await clickButton(page, 'Save');
}

/**
 * Delete a resource by name
 */
export async function deleteResource(page: Page, displayName: string) {
  await navigateAndWait(page, '/resources');
  
  const resourceCard = page.locator(`text=${displayName}`).locator('..');
  await resourceCard.getByRole('button', { name: 'Delete' }).click();
  
  // Confirm deletion
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData() {
  // This would connect to the test database and clean up
  // For now, it's a placeholder
  console.log('Cleaning up test data...');
}
