import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const browsers = (process.env.FRUITUI_BROWSERS || 'chromium').split(',');
const chrome = process.env.CHROME_BIN || (!process.env.CI && existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1100 },
    trace: 'retain-on-failure',
  },
  projects: browsers.map(browserName => ({ name: browserName, use: { browserName, ...(browserName === 'chromium' && chrome ? { launchOptions: { executablePath: chrome } } : {}) } })),
  webServer: [{
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  }, {
    command: 'node scripts/serve-host.mjs',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: !process.env.CI,
  }],
});
