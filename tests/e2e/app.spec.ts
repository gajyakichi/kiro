import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe('Electron E2E', () => {
  test('Should launch the application', async () => {
    // Launch Electron app
    // We point to the main.js entry point
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../electron/main.js')],
      env: { 
        ...(process.env as Record<string, string>),
        // Ensure we don't start a concurrent next dev server if logic exists in main.js
        // But main.js likely relies on a running server in dev.
        // For CI/Test, usually we want to point to the built artifacts or handle the dev server.
      }
    });

    // Check if app has launched
    const appPath = await electronApp.evaluate(async ({ app }) => {
      // This runs in the main Electron process, parameter here is always
      // the result of the require('electron') in the main app script.
      return app.getAppPath();
    });
    console.log(`App Path: ${appPath}`);

    // Get the first window that opens
    const window = await electronApp.firstWindow();
    
    // Check title (Kiro)
    // Note: Title might depend on <title> tag in index.html or set by main.js
    const title = await window.title();
    console.log(`Window Title: ${title}`);
    
    // Ensure window is visible
    const isVisible = await electronApp.evaluate(async ({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0];
        return win.isVisible();
    });
    expect(isVisible).toBe(true);

    // Screenshot for artifacts
    await window.screenshot({ path: 'test-results/launch-screenshot.png' });

    await electronApp.close();
  });
});
