import { expect, Page } from '@playwright/test';

export async function expectShowing(page: Page, shown: number, total: number) {
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toHaveText(new RegExp(`Showing\\s+${shown}\\s+out of\\s+${total}\\s+assets`, 'i'), {
    timeout: 20000,
  });
}

export async function clearAllFilters(page: Page) {
  const clearAll = page.locator('div.flex.flex-wrap.gap-2').getByRole('button', { name: /Clear all/i });
  await expect(clearAll).toBeVisible();
  await clearAll.click();
  await expect(page).toHaveURL(/\/$/);
  await expectShowing(page, 20, 535);
}

export async function expectImageToLoad(page: Page, selector: string) {
  const img = page.locator(selector);
  await expect(img).toBeVisible({ timeout: 20000 });
  
  await expect(async () => {
    const isLoaded = await img.evaluate((el: HTMLImageElement) => {
      return el.complete && el.naturalWidth > 0;
    });
    if (!isLoaded) {
      throw new Error(`Image at selector "${selector}" did not load correctly (naturalWidth is 0)`);
    }
  }).toPass({ timeout: 10000 });
}
