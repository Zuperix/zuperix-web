import { test, expect, Page } from '@playwright/test';
import { clearAllFilters, expectShowing, expectShowingPattern, getShowingCounts } from './helpers';


function filterSection(page: Page, name: RegExp) {
  return page.getByRole('button', { name }).locator('xpath=following-sibling::*[1]');
}

async function clickFilterOption(page: Page, sectionName: RegExp, optionName: RegExp) {
  const sectionButton = page.getByRole('button', { name: sectionName });
  await sectionButton.waitFor({ state: 'visible' });

  const section = sectionButton.locator('xpath=following-sibling::*[1]');
  const option = section.getByRole('checkbox', { name: optionName });
  await expect(option).toBeVisible();
  await option.click();
}

async function setUploadDateRange(page: Page, from: string, to: string) {
  const section = filterSection(page, /^Upload Date$/i);
  const inputs = section.locator('input[type="date"]');

  await expect(inputs).toHaveCount(2);
  await inputs.nth(0).fill(from);
  await inputs.nth(1).fill(to);
}

test.describe.configure({ mode: 'serial' });

test('dashboard filters update results', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  // Per-page selector: switch to 50 per page and verify showing count
  const perPage = page.getByRole('combobox').first();
  await perPage.selectOption('50');
  const showingAfter50 = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showingAfter50).toHaveText(/Showing\s+50\s+out of\s+\d+\s+assets/i, { timeout: 20000 });

  // Orientation: Landscape -> 20 out of 489
  await perPage.selectOption('20');
  await expect(page.locator('p', { hasText: 'Showing' }).first()).toBeVisible();
  await clickFilterOption(page, /^Orientation$/i, /^Landscape\b/i);
  await expectShowing(page, 20, 489);

  // Category: Global -> 20 out of 72
  await clickFilterOption(page, /^Category$/i, /^Global\b/i);
  await expectShowing(page, 20, 72);

  // File Type: JPEG Image -> 20 out of 67
  await clickFilterOption(page, /^File Type$/i, /^JPEG Image\b/i);
  await expectShowing(page, 20, 67);

  await clickFilterOption(page, /^File Type$/i, /^PNG Image\b/i);
  await expectShowing(page, 20, 72);

  await clearAllFilters(page);
  await clickFilterOption(page, /^Status$/i, /^Archived\b/i);
  await expectShowing(page, 9, 9);

  await clearAllFilters(page);
  await clickFilterOption(page, /^Asset Lifecycle$/i, /^Released\b/i);
  await expectShowingPattern(page);

  await clearAllFilters(page);
  await clickFilterOption(page, /^Asset Lifecycle$/i, /^Expired\b/i);
  await expectShowing(page, 1, 1);

  await clearAllFilters(page);
  await clickFilterOption(page, /^Brand/i, /^Sony\b/i);
  await expectShowing(page, 1, 1);

  await clearAllFilters(page);
  await clickFilterOption(page, /^Rating/i, /^4 Stars\+/i);
  await expectShowing(page, 6, 6);

  await clearAllFilters(page);
  await setUploadDateRange(page, '2025-01-28', '2026-04-28');
  const { shown } = await getShowingCounts(page);
  expect(shown).toBe(20);

});
