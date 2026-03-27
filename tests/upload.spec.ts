import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Asset Upload', () => {
  test('should upload a file successfully', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Click Upload button
    await page.getByRole('button', { name: /Upload/i }).click();

    // Verify Upload Modal is open
    await expect(page.getByText(/Bulk Upload/i)).toBeVisible();

    // Select file to upload
    const filePath = path.join(__dirname, 'test-image.txt');
    await page.setInputFiles('input[type="file"]', filePath);

    // Verify file is in the list
    await expect(page.getByText('test-image.txt')).toBeVisible();

    // Click Upload button inside modal
    await page.getByRole('button', { name: /^Upload 1 file$/i }).click();

    // Wait for "done" status
    // The component shows a CheckCircleIcon when done.
    // We can also check for the "1 / 1 complete" text.
    await expect(page.getByText(/1 \/ 1 complete/i)).toBeVisible({ timeout: 10000 });

    // Close modal
    await page.getByRole('button', { name: /Close/i }).click();

    // Verify AssetGrid contains the new asset
    await expect(page.getByText('test-image.txt')).toBeVisible();
  });
});
