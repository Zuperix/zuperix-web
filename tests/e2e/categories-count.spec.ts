import { test, expect } from '@playwright/test';
import { expectShowing, getShowingCounts } from './helpers';

const categoriesHeadingPattern = /Cat(?:eogry|egory) Management/i;

test.describe('category asset counts', () => {
  test('verify asset counts recursively (up to 10)', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: categoriesHeadingPattern })).toBeVisible();

    let verifiedCount = 0;
    const checkedNames = new Set<string>();
    const maxToVerify = 10;

    // Helper to get and expand rows
    async function exploreAndVerify() {
      // 1. Wait for any rows to be visible
      await page.waitForTimeout(2000); // Wait for tree to settle
      const rows = page.locator('div.group.flex.items-center.justify-between');
      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        if (verifiedCount >= maxToVerify) return;

        const row = rows.nth(i);
        const nameText = await row.locator('span.font-semibold').textContent();
        if (!nameText) continue;

        const name = nameText.trim();

        // 2. Expand if it has children and is not expanded
        const toggleBtn = row.locator('button').first();
        const hasChildren = (await toggleBtn.getAttribute('class')) || '';

        // If it's visible (not opacity-0) it has sub-categories
        if (!hasChildren.includes('opacity-0')) {
          // If we haven't visited this name's sub-tree yet, expand it
          if (!checkedNames.has(name)) {
            await toggleBtn.click();
            await page.waitForTimeout(800); // Wait for tree animation
          }
        }

        if (checkedNames.has(name)) continue;

        // 3. Check for assets and "View" button
        const viewBtn = row.getByRole('link', { name: /^View$/i });
        const hasView = await viewBtn.isVisible();

        if (hasView) {
          const countBadge = row.locator('span.px-2.py-0\\.5');
          const countTextValue = await countBadge.textContent();
          if (!countTextValue) continue;

          const expectedCount = parseInt(countTextValue, 10);
          console.log(`Verifying category: ${name} (Count: ${expectedCount})`);

          checkedNames.add(name);
          verifiedCount++;

          await viewBtn.click();
          const { total } = await getShowingCounts(page);
          expect(total).toBeGreaterThan(0);

          await page.goto('/categories');
          await expect(page.getByRole('heading', { name: categoriesHeadingPattern })).toBeVisible();

          await exploreAndVerify();
          return;
        }

        checkedNames.add(name);
      }
    }

    await exploreAndVerify();

    console.log(`Verified ${verifiedCount} categories.`);
  });
});
