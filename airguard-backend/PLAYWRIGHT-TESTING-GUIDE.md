# Playwright E2E Testing Setup for Airguard

## Overview

This guide covers setting up end-to-end testing for the ESP32 dongle integration using Playwright.

---

## Option 1: Playwright MCP (AI-Assisted Testing)

### What You Need

1. **Playwright MCP Server** installed and configured
2. AI agent with access to Playwright MCP tools
3. Local environment running (frontend + backend)

### How It Works

1. You describe test scenarios in natural language
2. AI agent (me) executes tests via Playwright MCP
3. Tests run in real browser, interact with actual UI
4. Results reported back immediately

### Example Test Request

**You say**: "Test the GPS pairing flow from login to device creation"

**AI does**:
- Navigates to frontend
- Logs in with credentials
- Clicks through to Device Setup
- Triggers GPS pairing
- Verifies modal updates
- Checks database for device creation
- Reports success/failure with screenshots

### Advantages

- ✅ Rapid test development
- ✅ Natural language test descriptions
- ✅ AI adapts to UI changes
- ✅ Great for exploratory testing

---

## Option 2: Standard Playwright Tests

### Setup

Install Playwright in the frontend project:

```bash
cd airguard-frontend

# Install Playwright
npm install -D @playwright/test

# Initialize Playwright (creates playwright.config.ts)
npx playwright install
```

### Test Structure

```
airguard-frontend/
├── tests/
│   ├── auth.spec.ts           # Login/logout tests
│   ├── gps-pairing.spec.ts    # GPS pairing flow
│   ├── device-setup.spec.ts   # Device setup flow
│   └── fixtures/
│       └── test-data.ts       # Test data and helpers
├── playwright.config.ts       # Playwright configuration
└── package.json
```

### Example Test: GPS Pairing Flow

```typescript
// tests/gps-pairing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('GPS Pairing Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3003');

    // Login
    await page.fill('input[name="email"]', 'demo@airguard.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should complete GPS pairing flow successfully', async ({ page, request }) => {
    // Navigate to Device Setup
    await page.click('text=Device Setup');

    // Click "Use GPS" button
    await page.click('button:has-text("Use GPS")');

    // Verify modal opens
    await expect(page.locator('.gps-modal')).toBeVisible();
    await expect(page.locator('text=Waiting for GPS signal')).toBeVisible();

    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Get session ID from API request
    const sessionResponse = await page.waitForResponse(
      response => response.url().includes('/api/devices/pair/start')
    );
    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.sessionId;

    // Trigger dongle data via backend API
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    await request.post('http://localhost:3001/api/devices/test-dongle', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Wait for modal to update
    await page.waitForSelector('text=GPS Acquired', { timeout: 10000 });

    // Verify GPS data displays
    await expect(page.locator('text=Latitude')).toBeVisible();
    await expect(page.locator('text=33.888')).toBeVisible(); // GPS coordinate

    // Verify IMU data displays
    await expect(page.locator('text=Accelerometer')).toBeVisible();
    await expect(page.locator('text=Gyroscope')).toBeVisible();
    await expect(page.locator('text=Temperature')).toBeVisible();

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);

    // Take screenshot for documentation
    await page.screenshot({ path: 'test-results/gps-pairing-success.png' });
  });

  test('should handle 403 error gracefully', async ({ page }) => {
    // Manually remove organizationId to trigger 403
    // (Or use test user without org)

    await page.click('text=Device Setup');
    await page.click('button:has-text("Use GPS")');

    // Should show error message, not crash
    await expect(page.locator('text=Organization access required')).toBeVisible();

    // Verify no cyclic object error in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('cyclic')) {
        consoleErrors.push(msg.text());
      }
    });

    expect(consoleErrors).toHaveLength(0);
  });

  test('should timeout after 60 seconds', async ({ page }) => {
    await page.click('text=Device Setup');
    await page.click('button:has-text("Use GPS")');

    // Don't trigger dongle - let it timeout
    await expect(page.locator('text=Timeout')).toBeVisible({ timeout: 65000 });
  });
});
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/gps-pairing.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

---

## Option 3: Hybrid Approach (Best of Both)

### Workflow

1. **Use Playwright MCP for development**:
   - Rapid test creation during feature development
   - AI explores edge cases
   - Quick feedback loop

2. **Convert to standard tests for CI/CD**:
   - Take successful MCP tests
   - Convert to TypeScript test files
   - Commit to repository
   - Run in GitHub Actions

3. **Maintain both**:
   - Standard tests in CI/CD pipeline
   - MCP for ad-hoc testing and new features

---

## Recommended Test Coverage

### Critical Paths (Must Test)

1. **Authentication Flow**:
   - Login with valid credentials
   - Login with invalid credentials
   - Logout
   - Token refresh

2. **GPS Pairing Flow**:
   - Successful pairing with test dongle
   - Pairing with real ESP32 (if hardware available)
   - Timeout scenario (no dongle trigger)
   - 403 error handling (no organizationId)
   - Network error handling

3. **Device Management**:
   - Create device via port scan
   - Update device with GPS data
   - View device list
   - Delete device

4. **Data Verification**:
   - All 19 dongle fields populated
   - GPS coordinates correct
   - IMU data displays correctly
   - Database persistence

### Nice-to-Have Tests

- Form validation
- Pagination
- Search/filter
- Responsive design
- Accessibility (a11y)

---

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run backend services before tests
  webServer: [
    {
      command: 'cd ../airguard-backend && docker-compose up -d',
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      port: 3003,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, testing]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          cd ../airguard-backend
          docker-compose up -d
          sleep 10

      - name: Run database migration
        run: |
          cd ../airguard-backend
          npx prisma migrate deploy
          npm run db:fix-orgs

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Helpers & Utilities

```typescript
// tests/fixtures/test-data.ts
export const TEST_USER = {
  email: 'demo@airguard.com',
  password: 'demo123'
};

export const TEST_DONGLE_DATA = {
  batchId: 'TESTABCD',
  latitude: 33.888630,
  longitude: 35.495480,
  altitude: 79.2,
  accelerometerZ: 9.82,
  temperature: 25.3
};

// Helper to login
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
}

// Helper to get auth token
export async function getAuthToken(page: Page): Promise<string> {
  return await page.evaluate(() => localStorage.getItem('authToken') || '');
}

// Helper to trigger test dongle
export async function triggerTestDongle(request: APIRequestContext, token: string) {
  return await request.post('http://localhost:3001/api/devices/test-dongle', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

---

## Decision Matrix

| Factor | Playwright MCP | Standard Playwright | Hybrid |
|--------|---------------|-------------------|--------|
| **Speed of test creation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **CI/CD integration** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Maintenance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Team adoption** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Flexibility** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Learning curve** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## My Recommendation

**Start with Playwright MCP (if available), then migrate to standard tests:**

### Phase 1: Immediate Testing (Playwright MCP)
- I create and run tests via MCP
- Fast feedback on current implementation
- Identify issues quickly

### Phase 2: Permanent Test Suite (Standard Playwright)
- Convert successful MCP tests to TypeScript files
- Add to repository
- Set up CI/CD integration

### Phase 3: Ongoing (Hybrid)
- Use standard tests in CI/CD
- Use MCP for exploratory testing
- Keep test suite updated

---

## Next Steps

**Choose your approach**:

1. **"Let's use Playwright MCP"**
   - I'll create tests via MCP right now
   - Run them against your local environment
   - Report results immediately

2. **"Set up standard Playwright tests"**
   - I'll create test files in the repository
   - You run them locally to verify
   - We'll add CI/CD later

3. **"Do both (hybrid)"**
   - I'll use MCP to test now
   - Create standard test files for later
   - Best of both worlds

**Which approach do you prefer?**
