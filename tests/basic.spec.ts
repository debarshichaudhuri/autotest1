import { test, expect } from '@playwright/test';

test.describe('Groq API Documentation Validation', () => {
  test('Verify Groq API docs page loads and contains correct title', async ({ page }) => {
    // Navigate to the Groq documentation page
    await page.goto('https://console.groq.com/docs/quickstart');

    // Check that the page has loaded successfully by verifying the title
    // This is a minimal basic UI health check to complement our API suite
    await expect(page).toHaveTitle(/Groq/i);

    // Verify a key element on the page exists indicating it's the docs
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });
});
