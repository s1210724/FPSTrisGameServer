const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/ui',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  reporter: [['list'], ['junit', { outputFile: 'reports/junit/playwright-junit.xml' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 5000,
    navigationTimeout: 10000,
  },
  webServer: {
    command: 'node scripts/start-server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
