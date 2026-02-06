# Testing Guide

This directory contains end-to-end (E2E) tests for the Azure Feature Toggle Tool using Playwright.

## Test Structure

```
tests/
├── auth.spec.ts          # Authentication and session tests
├── resources.spec.ts     # Resource CRUD operations tests
├── dashboard.spec.ts     # Feature toggle dashboard tests
├── audit-log.spec.ts     # Audit log viewing and filtering tests
└── helpers.ts            # Shared test utilities and helpers
```

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **Dependencies** installed: `npm install`
3. **Playwright browsers** installed: `npx playwright install`

## Running Tests

### Run all tests (headless)
```bash
npm test
```

### Run tests with UI mode (recommended for development)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific test file
```bash
npx playwright test auth.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test --grep "admin"
```

### View test report
```bash
npm run test:report
```

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- ✅ Login page display and interaction
- ✅ Protected route access control
- ✅ User session management
- ✅ Sign out functionality
- ✅ Session persistence across page refreshes
- ✅ Role-based access (admin vs read-only)

### Resource Configuration Tests (`resources.spec.ts`)
- ✅ Empty state display
- ✅ Add new resource with validation
- ✅ Edit existing resource
- ✅ Delete resource with confirmation
- ✅ Connection testing (success and failure)
- ✅ Environment badges (development, staging, production)
- ✅ Read-only user restrictions
- ✅ Connection string masking

### Feature Toggle Dashboard Tests (`dashboard.spec.ts`)
- ✅ Dashboard display with toggles
- ✅ Admin toggle switching in non-production
- ✅ Production confirmation modal
- ✅ Read-only user restrictions
- ✅ Search functionality
- ✅ Filter by state (all/enabled/disabled)
- ✅ Combined search and filter
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states

### Audit Log Tests (`audit-log.spec.ts`)
- ✅ View audit log entries
- ✅ Chronological ordering (newest first)
- ✅ User avatars with initials
- ✅ Action and environment badges
- ✅ State transitions display
- ✅ Relative timestamps
- ✅ Filter by date range, environment, action, toggle name
- ✅ Combined filters
- ✅ Export to CSV and JSON
- ✅ Empty states
- ✅ Pagination (if applicable)

## Test Helpers

The `helpers.ts` file provides utility functions:

- `mockLogin(page, user)` - Simulate user login
- `navigateAndWait(page, path)` - Navigate and wait for page load
- `fillFieldByLabel(page, label, value)` - Fill form fields
- `clickButton(page, text)` - Click buttons by text
- `createTestResource(page, data)` - Helper to create test resources
- `deleteResource(page, displayName)` - Helper to delete resources

## Configuration

The tests are configured in `playwright.config.ts`:

- **Browser**: Chromium (can be extended to Firefox, WebKit)
- **Base URL**: http://localhost:3000
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { mockLogin, TEST_USERS } from './helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page, TEST_USERS.admin);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/your-page');
    
    // Your test assertions
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

### Best Practices

1. **Use descriptive test names**: Clearly describe what the test does
2. **Use semantic locators**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
3. **Mock API calls**: Use `page.route()` to mock backend responses
4. **Clean up**: Ensure tests don't leave behind test data
5. **Avoid hard waits**: Use Playwright's auto-waiting instead of `waitForTimeout`
6. **Test user flows**: Focus on real user scenarios, not implementation details

## Mock Data

Test users are defined in `helpers.ts`:

```typescript
TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN'
  },
  readOnly: {
    email: 'readonly@test.com',
    name: 'Read Only User',
    role: 'READ_ONLY'
  }
}
```

## Debugging Tests

### Use UI Mode (Recommended)
```bash
npm run test:ui
```

### Use Debug Mode
```bash
npm run test:debug
```

### Add Debug Statement in Test
```typescript
await page.pause(); // Pauses test execution
```

### View Screenshots and Traces
After a test failure, screenshots and traces are saved in `test-results/`:
```bash
npx playwright show-trace test-results/*/trace.zip
```

## CI/CD Integration

The tests are configured to run in CI with:
- `forbidOnly: true` - Fails build if `.only` is left in tests
- `retries: 2` - Retries failed tests twice
- `workers: 1` - Runs tests serially (can be adjusted)

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Known Issues and Limitations

1. **Authentication**: Tests currently use mock authentication. Real OAuth flows require additional setup.
2. **Azure Integration**: API calls to Azure are mocked. Integration tests with real Azure resources should be separate.
3. **Database**: Tests assume a test database. Consider using a separate test database or mocking Prisma calls.

## Future Improvements

- [ ] Add visual regression tests
- [ ] Add accessibility (a11y) tests
- [ ] Add performance tests
- [ ] Implement real Azure AD authentication for tests
- [ ] Add API integration tests
- [ ] Increase test coverage to 90%+

## Troubleshooting

### Tests fail with "Target closed" error
- Ensure your dev server is running: `npm run dev`
- Check that port 3000 is available

### Tests are slow
- Use `test:ui` mode to see what's causing delays
- Check for unnecessary `waitForTimeout` calls
- Verify network requests aren't timing out

### Can't see what's happening
- Run tests in headed mode: `npm run test:headed`
- Use UI mode: `npm run test:ui`
- Add screenshots: `await page.screenshot({ path: 'debug.png' })`

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Philosophy](https://playwright.dev/docs/test-philosophy)
- [Debugging Tests](https://playwright.dev/docs/debug)

## Questions or Issues?

If you encounter issues with tests or have questions:
1. Check this README
2. Review Playwright documentation
3. Check existing test examples in this directory
4. Open an issue on the project repository
