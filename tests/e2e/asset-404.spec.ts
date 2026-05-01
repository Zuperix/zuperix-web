import { test, expect } from '@playwright/test';

test('asset detail page shows 404 state for non-existent asset', async ({ page }) => {
  // Navigate to a definitely non-existent asset ID
  await page.goto('/assets/00000000-0000-0000-0000-000000000000');

  // Check for 404 UI elements
  await expect(page.getByRole('heading', { name: 'Asset Not Found' })).toBeVisible();
  await expect(page.getByText(/We couldn't find the asset you're looking for/i)).toBeVisible();
  
  // Check for action buttons
  await expect(page.getByRole('button', { name: /Go Back/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Search Assets/i })).toBeVisible();
  
  // Verify simplified header
  await expect(page.getByRole('button', { name: /Back to Dashboard/i })).toBeVisible();
});
