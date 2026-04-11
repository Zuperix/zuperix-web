import { test, expect } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';

test.describe('Guest Upload Links', () => {
  test('should open guest link dialog from dashboard and generate a link', async ({ page }) => {
    // Navigate to homepage (which will be redirected to dashboard if authenticated by global setup)
    await page.goto('/');
    await dismissTransientOverlays(page);

    // Wait for the workspace to load
    await expect(page.getByRole('heading', { name: /^Assets$/i })).toBeVisible();

    // Click the share link button next to Upload
    await page.locator('button[aria-haspopup="true"]').click();
    const generateLinkButton = page.getByRole('button', { name: /Generate Upload Link/i });
    await expect(generateLinkButton).toBeVisible();
    await generateLinkButton.click();

    // The dialog should appear
    await expect(page.locator('text=Generate Public Upload Link')).toBeVisible();

    // Configure and Generate
    await page.fill('input[placeholder="e.g. Guest Uploads - Campaign June"]', 'E2E Test Link');
    await page.fill('input[placeholder="Unlimited"]', '5');
    await page.click('button:has-text("Generate Link")');

    // Wait for success
    await expect(page.locator('text=Link Generated Successfully')).toBeVisible({ timeout: 10000 });

    const linkInput = page.locator('input[readonly]');
    const publicUrl = await linkInput.inputValue();
    expect(publicUrl).toContain('/guest-uploads/');

    // Log out or use fresh context for guest upload
    const guestContext = await page.context().browser()!.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto(publicUrl);
    await expect(guestPage.locator('text=Upload to')).toBeVisible({ timeout: 10000 });
    await expect(guestPage.locator('text=Click or drop files here')).toBeVisible();

    await guestContext.close();
  });
});
