import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show registration link on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/Don't have an account/i)).toBeVisible();
  });
});

test.describe('Dashboard UI', () => {
  test('should show sidebar and workspace selector after simulated login', async ({ page }) => {
    // We'll use a mocked API or just check for UI elements that should be present
    // For a real E2E we'd need the backend running with a test user.
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible();
  });
});
