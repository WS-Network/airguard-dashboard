/**
 * Airguard Playwright MCP Initialization Script
 *
 * This script runs on every page load when using Playwright MCP.
 * It sets up the testing environment for Airguard dashboard.
 */

export default async ({ page }) => {
  console.log('[Airguard Init] Setting up test environment...');

  // Grant geolocation permissions for GPS testing
  await page.context().grantPermissions(['geolocation']);

  // Set mock GPS location (Beirut, Lebanon - matches test data)
  await page.context().setGeolocation({
    latitude: 33.888630,
    longitude: 35.495480,
    accuracy: 10
  });
  console.log('[Airguard Init] Geolocation set to Beirut');

  // Add custom test headers
  await page.setExtraHTTPHeaders({
    'X-Test-Environment': 'playwright-mcp',
    'X-Test-Session': Date.now().toString()
  });

  // Inject test utilities into page context
  await page.addInitScript(() => {
    // Mark as test environment
    (window as any).TEST_MODE = true;
    (window as any).PLAYWRIGHT_MCP = true;

    // Helper to wait for network idle
    (window as any).waitForNetworkIdle = () => {
      return new Promise(resolve => {
        let timeout: NodeJS.Timeout;
        const check = () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => resolve(true), 500);
        };
        window.addEventListener('load', check);
        check();
      });
    };

    // Helper to get auth token
    (window as any).getAuthToken = () => {
      return localStorage.getItem('authToken');
    };

    // Helper to check if logged in
    (window as any).isLoggedIn = () => {
      return !!localStorage.getItem('authToken');
    };

    // Log test environment ready
    console.log('[Airguard Test] Environment initialized');
  });

  // Set default timeouts
  page.setDefaultTimeout(10000); // 10 seconds
  page.setDefaultNavigationTimeout(15000); // 15 seconds

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[Browser Error]', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.error('[Page Error]', error.message);
  });

  console.log('[Airguard Init] Setup complete ✅');
};
