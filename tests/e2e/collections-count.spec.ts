import { test, expect } from '@playwright/test';
import { expectShowing } from './helpers';

test.describe('collection asset counts', () => {
  test('verify asset counts on cards match dashboard results', async ({ page }) => {
    await page.goto('/collections');
    await expect(page.getByRole('heading', { name: /My Collections/i })).toBeVisible();

    const targetCollections = [/do_not_delete_test_collection/i, /do_no_delete_test_collection/i];

    for (const nameRegex of targetCollections) {
      const card = page.locator('div.group').filter({ 
        has: page.getByRole('heading', { name: nameRegex, level: 3 }) 
      }).first();
      
      await expect(card).toBeVisible({ timeout: 15000 });

      const countText = await card.locator('span:has-text(" Assets")').textContent();
      if (!countText) continue;

      const expectedCount = parseInt(countText.split(' ')[0], 10);
      await card.getByRole('link', { name: /View/i }).click();

      const shown = Math.min(20, expectedCount);
      await expectShowing(page, shown, expectedCount);

      await page.goto('/collections');
      await expect(page.getByRole('heading', { name: /My Collections/i })).toBeVisible();
    }
  });
});
