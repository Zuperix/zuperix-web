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
