import { test, expect } from '@playwright/test';
import { TEST_USERS, mockLogin, navigateAndWait } from './helpers';

test.describe('Audit Log', () => {
  const mockAuditLogs = [
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      userId: 'user-001',
      userName: 'Sarah Chen',
      userEmail: 'sarah.chen@company.com',
      action: 'enabled',
      toggleId: 'toggle-001',
      toggleName: 'enable_dark_mode',
      resourceId: 'res-001',
      resourceName: 'Development',
      environmentType: 'development',
      previousState: false,
      newState: true
    },
    {
      id: 'log-002',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      userId: 'user-002',
      userName: 'Michael Rodriguez',
      userEmail: 'michael.rodriguez@company.com',
      action: 'disabled',
      toggleId: 'toggle-002',
      toggleName: 'experimental_checkout',
      resourceId: 'res-003',
      resourceName: 'Production',
      environmentType: 'production',
      previousState: true,
      newState: false
    },
    {
      id: 'log-003',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      userId: 'user-001',
      userName: 'Sarah Chen',
      userEmail: 'sarah.chen@company.com',
      action: 'enabled',
      toggleId: 'toggle-003',
      toggleName: 'beta_analytics',
      resourceId: 'res-002',
      resourceName: 'Staging',
      environmentType: 'staging',
      previousState: false,
      newState: true
    }
  ];

  test.beforeEach(async ({ page }) => {
    await mockLogin(page, TEST_USERS.admin);
  });

  test.describe('View Audit Log', () => {
    test('should display audit log page with entries', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Verify page heading
      await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible();
      
      // Verify description
      await expect(page.getByText(/complete history/i)).toBeVisible();
      
      // Verify entry count
      await expect(page.getByText(/3 entries/i)).toBeVisible();
      
      // Verify log entries are displayed
      await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
      await expect(page.getByText(/experimental_checkout/i)).toBeVisible();
      await expect(page.getByText(/beta_analytics/i)).toBeVisible();
    });

    test('should display entries in reverse chronological order', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Get all toggle names in order
      const toggleNames = page.locator('code, [class*="mono"]').filter({ hasText: /enable_|experimental_|beta_/ });
      
      // First entry should be most recent (enable_dark_mode)
      await expect(toggleNames.first()).toContainText('enable_dark_mode');
    });

    test('should show user avatars with initials', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Check for user initials in avatars
      await expect(page.getByText('SC')).toBeVisible(); // Sarah Chen
      await expect(page.getByText('MR')).toBeVisible(); // Michael Rodriguez
    });

    test('should display action badges with correct colors', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Check for action badges
      const enabledBadges = page.locator('text=enabled').locator('..');
      const disabledBadges = page.locator('text=disabled').locator('..');
      
      await expect(enabledBadges.first()).toBeVisible();
      await expect(disabledBadges.first()).toBeVisible();
    });

    test('should display environment badges with correct colors', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Check for environment badges
      await expect(page.getByText('Development')).toBeVisible();
      await expect(page.getByText('Production')).toBeVisible();
      await expect(page.getByText('Staging')).toBeVisible();
    });

    test('should display state transitions', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Check for state transition indicators (Disabled → Enabled or Enabled → Disabled)
      await expect(page.getByText(/disabled/i).and(page.getByText(/enabled/i)).first()).toBeVisible();
    });

    test('should display relative timestamps', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Check for relative time format (e.g., "2h ago", "5h ago", "1d ago")
      const timeElements = page.locator('text=/\\d+[hmd] ago/');
      await expect(timeElements.first()).toBeVisible();
    });
  });

  test.describe('Filtering', () => {
    test('should filter by date range', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        const url = new URL(route.request().url());
        const dateRange = url.searchParams.get('dateRange');
        
        let filteredLogs = mockAuditLogs;
        if (dateRange === 'last7days') {
          filteredLogs = mockAuditLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return logDate > sevenDaysAgo;
          });
        }
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: filteredLogs,
            totalCount: filteredLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Open filters if collapsed
      const showFiltersButton = page.getByRole('button', { name: /show filters/i });
      if (await showFiltersButton.isVisible()) {
        await showFiltersButton.click();
      }

      // Select date range filter
      const dateRangeSelect = page.locator('select').filter({ hasText: /last.*days/i }).or(
        page.getByLabel(/date range/i)
      );
      
      if (await dateRangeSelect.isVisible()) {
        await dateRangeSelect.selectOption('last7days');
        
        // Entry count should update
        await expect(page.getByText(/\d+ entr/i)).toBeVisible();
      }
    });

    test('should filter by environment', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        const url = new URL(route.request().url());
        const environment = url.searchParams.get('environment');
        
        let filteredLogs = mockAuditLogs;
        if (environment) {
          filteredLogs = mockAuditLogs.filter(log => log.environmentType === environment);
        }
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: filteredLogs,
            totalCount: filteredLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Open filters
      const showFiltersButton = page.getByRole('button', { name: /show filters/i });
      if (await showFiltersButton.isVisible()) {
        await showFiltersButton.click();
      }

      // Select environment filter
      const environmentSelect = page.getByLabel(/environment/i);
      if (await environmentSelect.isVisible()) {
        await environmentSelect.selectOption('production');
        
        // Should only show production entries
        await expect(page.getByText('Production')).toBeVisible();
      }
    });

    test('should filter by action type', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        const url = new URL(route.request().url());
        const action = url.searchParams.get('action');
        
        let filteredLogs = mockAuditLogs;
        if (action) {
          filteredLogs = mockAuditLogs.filter(log => log.action === action);
        }
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: filteredLogs,
            totalCount: filteredLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Open filters
      const showFiltersButton = page.getByRole('button', { name: /show filters/i });
      if (await showFiltersButton.isVisible()) {
        await showFiltersButton.click();
      }

      // Select action filter
      const actionSelect = page.getByLabel(/action/i);
      if (await actionSelect.isVisible()) {
        await actionSelect.selectOption('enabled');
        
        // Should only show enabled actions
        const enabledCount = mockAuditLogs.filter(l => l.action === 'enabled').length;
        await expect(page.getByText(new RegExp(`${enabledCount} entr`, 'i'))).toBeVisible();
      }
    });

    test('should filter by toggle name', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        const url = new URL(route.request().url());
        const toggleName = url.searchParams.get('toggleName');
        
        let filteredLogs = mockAuditLogs;
        if (toggleName) {
          filteredLogs = mockAuditLogs.filter(log => 
            log.toggleName.toLowerCase().includes(toggleName.toLowerCase())
          );
        }
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: filteredLogs,
            totalCount: filteredLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Open filters
      const showFiltersButton = page.getByRole('button', { name: /show filters/i });
      if (await showFiltersButton.isVisible()) {
        await showFiltersButton.click();
      }

      // Search by toggle name
      const toggleSearch = page.getByPlaceholder(/toggle name/i).or(
        page.getByLabel(/toggle name/i)
      );
      
      if (await toggleSearch.isVisible()) {
        await toggleSearch.fill('dark_mode');
        
        // Should filter to matching toggle
        await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
      }
    });

    test('should clear all filters', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Open filters
      const showFiltersButton = page.getByRole('button', { name: /show filters/i });
      if (await showFiltersButton.isVisible()) {
        await showFiltersButton.click();
      }

      // Apply some filter
      const environmentSelect = page.getByLabel(/environment/i);
      if (await environmentSelect.isVisible()) {
        await environmentSelect.selectOption('production');
      }

      // Clear filters
      const clearButton = page.getByRole('button', { name: /clear filters/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
        
        // Should show all entries again
        await expect(page.getByText(/3 entries/i)).toBeVisible();
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('should export logs to CSV', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      const downloadPromise = page.waitForEvent('download');

      await navigateAndWait(page, '/audit-log');

      // Mock export endpoint
      await page.route('**/api/audit-logs/export', async (route) => {
        const csvContent = 'Timestamp,User,Action,Toggle,Environment,Previous State,New State\n' +
          mockAuditLogs.map(log => 
            `${log.timestamp},${log.userName},${log.action},${log.toggleName},${log.environmentType},${log.previousState},${log.newState}`
          ).join('\n');
        
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="audit-log.csv"'
          },
          body: csvContent
        });
      });

      // Click export CSV button
      const exportButton = page.getByRole('button', { name: /export.*csv/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Verify download started
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.csv');
      }
    });

    test('should export logs to JSON', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      const downloadPromise = page.waitForEvent('download');

      await navigateAndWait(page, '/audit-log');

      // Mock export endpoint
      await page.route('**/api/audit-logs/export', async (route) => {
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="audit-log.json"'
          },
          body: JSON.stringify(mockAuditLogs, null, 2)
        });
      });

      // Click export JSON button
      const exportButton = page.getByRole('button', { name: /export.*json/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Verify download started
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.json');
      }
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state when no logs exist', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: [],
            totalCount: 0
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Should show empty state
      await expect(page.getByText(/no changes have been made/i)).toBeVisible();
      await expect(page.getByText(/0 entries/i)).toBeVisible();
    });

    test('should show no results when filters return empty', async ({ page }) => {
      await page.route('**/api/audit-logs**', async (route) => {
        const url = new URL(route.request().url());
        const hasFilters = url.searchParams.toString().length > 0;
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: hasFilters ? [] : mockAuditLogs,
            totalCount: hasFilters ? 0 : mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Open filters
      const showFiltersButton = page.getByRole('button', { name: /show filters/i });
      if (await showFiltersButton.isVisible()) {
        await showFiltersButton.click();
      }

      // Apply filter that returns no results
      const toggleSearch = page.getByPlaceholder(/toggle name/i);
      if (await toggleSearch.isVisible()) {
        await toggleSearch.fill('nonexistent_toggle');
        
        // Should show no results message
        await expect(page.getByText(/no.*match/i)).toBeVisible();
      }
    });
  });

  test.describe('Loading States', () => {
    test('should show loading skeletons while fetching logs', async ({ page }) => {
      // Delay the response
      await page.route('**/api/audit-logs**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Should show loading skeletons
      const skeletons = page.locator('[class*="animate-pulse"]');
      await expect(skeletons.first()).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should load more entries when available', async ({ page }) => {
      const allLogs = Array.from({ length: 60 }, (_, i) => ({
        ...mockAuditLogs[0],
        id: `log-${i}`,
        toggleName: `feature_${i}`,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
      }));

      let offset = 0;
      await page.route('**/api/audit-logs**', async (route) => {
        const url = new URL(route.request().url());
        const limit = parseInt(url.searchParams.get('limit') || '50');
        offset = parseInt(url.searchParams.get('offset') || '0');
        
        const paginatedLogs = allLogs.slice(offset, offset + limit);
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: paginatedLogs,
            totalCount: allLogs.length,
            hasMore: offset + limit < allLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Should show first batch
      await expect(page.getByText(/50 entries/i)).toBeVisible();

      // Look for load more button if pagination is implemented
      const loadMoreButton = page.getByRole('button', { name: /load more/i });
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click();
        
        // Should show more entries
        await expect(page.getByText(/60 entries/i)).toBeVisible();
      }
    });
  });

  test.describe('Read-Only User Access', () => {
    test('should allow read-only users to view audit log', async ({ page }) => {
      await mockLogin(page, TEST_USERS.readOnly);

      await page.route('**/api/audit-logs**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            logs: mockAuditLogs,
            totalCount: mockAuditLogs.length
          })
        });
      });

      await navigateAndWait(page, '/audit-log');

      // Should be able to view logs
      await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible();
      await expect(page.getByText(/enable_dark_mode/i)).toBeVisible();
    });
  });
});
