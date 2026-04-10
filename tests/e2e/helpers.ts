import { expect, Page } from '@playwright/test';

export async function expectShowing(page: Page, shown: number, total: number) {
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toHaveText(new RegExp(`Showing\\s+${shown}\\s+out of\\s+${total}\\s+assets`, 'i'), {
    timeout: 20000,
  });
}

export async function getShowingCounts(page: Page): Promise<{ shown: number; total: number }> {
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 20000 });
  const text = (await showing.textContent()) || '';
  const match = text.match(/Showing\s+(\d+)\s+out of\s+(\d+)\s+assets/i);
  if (!match) throw new Error(`Unable to parse showing text: ${text}`);
  return { shown: Number(match[1]), total: Number(match[2]) };
}

export async function expectShowingPattern(page: Page) {
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 20000 });
}

export async function dismissTransientOverlays(page: Page) {
  const cookieModal = page.getByRole('heading', { name: /Cookie Preferences/i });
  if (await cookieModal.isVisible()) {
    const accept = page.getByRole('button', { name: /^Accept$/i });
    if (await accept.isVisible()) await accept.click();
  }

  const savedSecret = page.getByRole('button', { name: /I've saved the secret/i });
  if (await savedSecret.isVisible()) {
    await savedSecret.click();
  }

  // Dismiss any sonner toasts that might be overlapping buttons
  const toasts = page.locator('li[data-sonner-toast]');
  const toastCount = await toasts.count();
  for (let i = 0; i < toastCount; i++) {
    const closeBtn = toasts.nth(i).locator('button[data-close-button]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await toasts.nth(i).click({ force: true });
    }
  }
}

export async function clearAllFilters(page: Page) {
  const clearAll = page.locator('div.flex.flex-wrap.gap-2').getByRole('button', { name: /Clear all/i });
  await expect(clearAll).toBeVisible();
  await clearAll.click();
  await expect(page).toHaveURL(/\/$/);
  await expectShowingPattern(page);
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
