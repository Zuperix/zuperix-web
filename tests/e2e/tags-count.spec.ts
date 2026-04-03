import { test, expect } from '@playwright/test';
import { expectShowing } from './helpers';

test.describe('tag asset counts', () => {
  test('verify asset counts on tag cards match dashboard results', async ({ page }) => {
    // 1. Go to Tags management
    await page.goto('/settings/tags');
    await expect(page.getByRole('heading', { name: /Tags & Labels/i })).toBeVisible();

    // 2. Wait for tag cards to load
    const tagCards = page.locator('div.group').filter({ has: page.getByRole('heading', { level: 4 }) });
    await expect(tagCards.first()).toBeVisible({ timeout: 15000 });
    
    const count = await tagCards.count();
    
    // 3. We only test cards that have assets (and thus a 'View' link)
    const cardsWithAssets = tagCards.filter({ has: page.getByRole('link', { name: /^View$/i }) });
    const matchCount = await cardsWithAssets.count();
    
    if (matchCount === 0) {
      console.log('No tags with assets found to verify.');
      return;
    }

    const testCount = Math.min(matchCount, 3);

    for (let i = 0; i < testCount; i++) {
      const card = cardsWithAssets.nth(i);
      const name = await card.locator('h4').textContent();
      const countText = await card.locator('span:has-text(" Assets")').textContent();
      
      if (!countText) continue;

      const expectedCount = parseInt(countText.split(' ')[0], 10);
      
      // 4. Click 'View'
      await card.getByRole('link', { name: /^View$/i }).click();

      // 5. Verify dashboard showing X out of expectedCount
      const shown = Math.min(20, expectedCount);
      await expectShowing(page, shown, expectedCount);

      // 6. Go back
      await page.goto('/settings/tags');
      await expect(page.getByRole('heading', { name: /Tags & Labels/i })).toBeVisible();
    }
  });
});
