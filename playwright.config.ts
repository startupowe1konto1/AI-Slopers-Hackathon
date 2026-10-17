import { defineConfig } from '@playwright/test';

// Ścieżka Kasi na wersji produkcyjnej (service worker działa tylko w buildzie).
// macOS 13 nie ma Chromium z Playwright, więc lokalnie używamy zainstalowanego Chrome.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  fullyParallel: false,
  reporter: [['list']],
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    port: 4174,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  use: {
    baseURL: 'http://localhost:4174',
    viewport: { width: 390, height: 844 },
    channel: process.platform === 'darwin' ? 'chrome' : undefined,
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
});
