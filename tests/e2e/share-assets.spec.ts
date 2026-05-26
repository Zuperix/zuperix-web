import { test, expect } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';

const runKey = `e2e-${Math.random().toString(36).substring(2, 7)}`;

test.describe('Asset Sharing E2E Tests', () => {
  test.describe('Sharing Action Flows', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await dismissTransientOverlays(page);
      await expect(page.getByRole('heading', { name: /^Assets$/i })).toBeVisible();
      await expect(page.locator('button[title="Secure Share Link"]').first()).toBeVisible({ timeout: 15000 });
    });

    test('should generate an Embed Link for a single asset', async ({ page }) => {
      await page.locator('button[title="Secure Share Link"]').first().click();
      await expect(page.locator('text=Zuperix Share')).toBeVisible();
      await expect(page.getByRole('button', { name: /Embed Link/i })).toHaveClass(/text-indigo-500|dark:text-white|font-black/);
      await page.getByRole('button', { name: /^1 Hour$/i }).click();
      await page.getByRole('button', { name: /Generate Direct Link/i }).click();

      await expect(page.locator('text=Embed URL generated successfully!')).toBeVisible();
      await expect(page.locator('text=Shared Link Created Successfully')).toBeVisible();

      const urlInput = page.locator('p.text-xs.font-mono');
      await expect(urlInput).toBeVisible();
      const generatedUrl = await urlInput.textContent();
      expect(generatedUrl).toContain('assets.zuperix.com');
      expect(generatedUrl).toContain('Expires=');
      expect(generatedUrl).toContain('Signature=');
    });

    test('should generate a Zup Share Link for a single asset', async ({ page }) => {
      await page.locator('button[title="Secure Share Link"]').first().click();
      await expect(page.locator('text=Zuperix Share')).toBeVisible();

      const zupTab = page.getByRole('button', { name: /Zup Share UI/i });
      await zupTab.click();
      await expect(zupTab).toHaveClass(/text-indigo-500|dark:text-white|font-black/);

      await page.fill('input[id="share-title"]', `Single Asset Share - ${runKey}`);
      await page.fill('textarea[id="share-description"]', 'This is a description notes from E2E test.');
      await page.fill('input[id="share-password"]', 'secret123');
      await page.getByRole('button', { name: /Create Zup Share Link/i }).click();

      await expect(page.locator('text=Zup Share page generated!')).toBeVisible();
      await expect(page.locator('text=Shared Link Created Successfully')).toBeVisible();
      await expect(page.locator('text=Password protection is active')).toBeVisible();

      const urlInput = page.locator('p.text-xs.font-mono');
      await expect(urlInput).toBeVisible();
      const generatedUrl = await urlInput.textContent();
      expect(generatedUrl).toContain('/s/');
    });

    test('should generate a Zup Share Link for multiple assets via bulk actions', async ({ page }) => {
      const firstCard = page.locator('[data-asset-id]').first();
      const secondCard = page.locator('[data-asset-id]').nth(1);
      
      const checkbox1 = firstCard.locator('.backdrop-blur-xl.border').first();
      const checkbox2 = secondCard.locator('.backdrop-blur-xl.border').first();
      
      await expect(checkbox1).toBeVisible();
      await expect(checkbox2).toBeVisible();
      await checkbox1.click();
      await checkbox2.click();

      const toolbar = page.locator('div.fixed.bottom-4');
      await expect(toolbar).toBeVisible();

      const shareButton = toolbar.getByRole('button', { name: /Share/i });
      await expect(shareButton).toBeVisible();
      await shareButton.click();

      await expect(page.locator('text=Zuperix Share')).toBeVisible();

      const embedTab = page.getByRole('button', { name: /Embed Link/i });
      await expect(embedTab).toBeDisabled();
      
      const zupTab = page.getByRole('button', { name: /Zup Share UI/i });
      await expect(zupTab).toHaveClass(/text-indigo-500|dark:text-white|font-black/);

      await page.fill('input[id="share-title"]', `Multi Asset Share - ${runKey}`);
      await page.fill('textarea[id="share-description"]', 'Sharing multiple assets together in one link.');
      await page.getByRole('button', { name: /Create Zup Share Link/i }).click();

      await expect(page.locator('text=Zup Share page generated!')).toBeVisible();
      await expect(page.locator('text=Shared Link Created Successfully')).toBeVisible();

      const urlInput = page.locator('p.text-xs.font-mono');
      await expect(urlInput).toBeVisible();
      const generatedUrl = await urlInput.textContent();
      expect(generatedUrl).toContain('/s/');
    });
  });

  test.describe('Cleanup Flow', () => {
    test('should cleanup generated E2E share links', async ({ page }) => {
      await page.goto('/settings/share-links');
      await dismissTransientOverlays(page);

      await page.fill('input[placeholder="Search share links..."]', runKey);

      const trashButtons = page.locator('button[title="Revoke & Deactivate Link"]');
      
      await expect(async () => {
        const count = await trashButtons.count();
        if (count > 0) {
          await trashButtons.first().click();
          await page.getByRole('button', { name: /^Revoke Link$/i }).click();
          await expect(page.locator('text=Share link has been successfully revoked and deactivated.')).toBeVisible();
          await page.locator('text=Dismiss').first().click().catch(() => {});
          throw new Error('More items remaining for cleanup...');
        }
      }).toPass({ timeout: 15000, intervals: [1000] }).catch(() => {});
    });
  });
});
