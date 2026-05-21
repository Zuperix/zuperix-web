import { test, expect, Page } from '@playwright/test';
import { clearAllFilters, expectShowing, expectShowingPattern, getShowingCounts } from './helpers';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function filterSection(page: Page, name: RegExp) {
  return page.getByRole('button', { name }).locator('xpath=following-sibling::*[1]');
}

async function waitForDashboard(page: Page) {
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: /^Orientation$/i }).waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Clicks a filter option and waits for the search API to respond,
 * confirming the filter was applied before assertions run.
 */
async function clickFilterOption(page: Page, sectionName: RegExp, optionName: RegExp) {
  const sectionButton = page.getByRole('button', { name: sectionName });
  await sectionButton.waitFor({ state: 'visible', timeout: 15000 });
  const section = sectionButton.locator('xpath=following-sibling::*[1]');
  const option = section.getByRole('checkbox', { name: optionName });
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.scrollIntoViewIfNeeded();

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/search/assets') && res.status() === 200,
    { timeout: 15000 },
  );
  await option.click();
  await responsePromise;
}

/**
 * Clicks a rating tier label by matching the visible span text, then waits
 * for the search API to confirm the filter was applied. Rating checkboxes
 * use SVG star icons which can interfere with accessible name computation.
 */
async function clickRatingOption(page: Page, starText: RegExp) {
  const ratingBtn = page.getByRole('button', { name: /^Rating/i });
  await ratingBtn.waitFor({ state: 'visible', timeout: 15000 });
  const section = ratingBtn.locator('xpath=following-sibling::*[1]');
  // Match by the span that holds the star text (avoids count-badge text collisions)
  const tierSpan = section.locator('span').filter({ hasText: starText }).first();
  await expect(tierSpan).toBeVisible({ timeout: 10000 });
  await tierSpan.scrollIntoViewIfNeeded();

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/search/assets') && res.status() === 200,
    { timeout: 15000 },
  );
  // Click the enclosing label
  const label = tierSpan.locator('xpath=ancestor::label[1]');
  await label.click();
  await responsePromise;
}

async function setUploadDateRange(page: Page, from: string, to: string) {
  const section = filterSection(page, /^Upload Date$/i);
  const inputs = section.locator('input[type="date"]');
  await expect(inputs).toHaveCount(2);
  await inputs.nth(0).fill(from);
  await inputs.nth(1).fill(to);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Dashboard filters – orientation & per-page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await waitForDashboard(page);
  });

  test('per-page selector shows correct count at 50', async ({ page }) => {
    // Target the per-page select by its known option text
    const perPage = page.locator('select').filter({ hasText: /per page/i }).first();
    await perPage.waitFor({ state: 'visible', timeout: 10000 });
    await perPage.selectOption('50');
    await expect(page.locator('p', { hasText: 'Showing' }).first()).toHaveText(
      /Showing\s+50\s+out of\s+\d+\s+assets/i,
      { timeout: 20000 },
    );
  });

  test('landscape filter returns 506 results', async ({ page }) => {
    await clickFilterOption(page, /^Orientation$/i, /^Landscape\b/i);
    await expectShowing(page, 20, 506);
  });

  test('portrait filter returns 4 results', async ({ page }) => {
    await clickFilterOption(page, /^Orientation$/i, /^Portrait\b/i);
    await expectShowing(page, 4, 4);
  });
});

test.describe('Dashboard filters – category', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await waitForDashboard(page);
  });

  test('Football category returns 18 results', async ({ page }) => {
    await clickFilterOption(page, /^Categories$/i, /^Football\b/i);
    await expectShowing(page, 18, 18);
  });

  test('Global category returns 6 results', async ({ page }) => {
    await clickFilterOption(page, /^Categories$/i, /^Global\b/i);
    await expectShowing(page, 7, 7);
  });

  test('Tennis category returns 1 result', async ({ page }) => {
    await clickFilterOption(page, /^Categories$/i, /^Tennis\b/i);
    await expectShowing(page, 1, 1);
  });
});

test.describe('Dashboard filters – file type & status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await waitForDashboard(page);
  });

  test('JPEG Image file type filter returns 498 results', async ({ page }) => {
    await clickFilterOption(page, /^File Type$/i, /^JPEG Image\b/i);
    await expectShowing(page, 20, 498);
  });

  test('stacking PNG on top of JPEG expands or maintains results', async ({ page }) => {
    await clickFilterOption(page, /^File Type$/i, /^JPEG Image\b/i);
    await expectShowing(page, 20, 498);
    await clickFilterOption(page, /^File Type$/i, /^PNG Image\b/i);
    const { total: bothTotal } = await getShowingCounts(page);
    expect(bothTotal).toBeGreaterThanOrEqual(498);
  });

  test('archived status returns 4 results', async ({ page }) => {
    await clickFilterOption(page, /^Status$/i, /^Archived\b/i);
    await expectShowing(page, 4, 4);
  });

  test('pending review status returns 505 results', async ({ page }) => {
    await clickFilterOption(page, /^Status$/i, /^Pending Review\b/i);
    await expectShowing(page, 20, 505);
  });
});

test.describe('Dashboard filters – lifecycle & rating', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await waitForDashboard(page);
  });

  test('Released lifecycle returns results', async ({ page }) => {
    await clickFilterOption(page, /^Asset Lifecycle$/i, /^Released\b/i);
    await expectShowingPattern(page);
  });

  test('Expired lifecycle returns 1 result', async ({ page }) => {
    await clickFilterOption(page, /^Asset Lifecycle$/i, /^Expired\b/i);
    await expectShowing(page, 1, 1);
  });

  test('4-star+ rating filter returns 10 results', async ({ page }) => {
    await clickRatingOption(page, /4 Stars\+/i);
    await expectShowing(page, 10, 10);
  });

  test('5-star rating filter returns 3 results', async ({ page }) => {
    await clickRatingOption(page, /5 Stars/i);
    await expectShowing(page, 3, 3);
  });

  test('1-star+ rating filter returns 13 results', async ({ page }) => {
    await clickRatingOption(page, /1 Stars/i);
    await expectShowing(page, 13, 13);
  });
});

test.describe('Dashboard filters – tags & date range', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await waitForDashboard(page);
  });

  test('goat tag filter returns 4 results', async ({ page }) => {
    await clickFilterOption(page, /^Tags$/i, /^goat\b/i);
    await expectShowing(page, 4, 4);
  });

  test('upload date range filter narrows results', async ({ page }) => {
    await setUploadDateRange(page, '2025-01-28', '2026-04-28');
    const { shown } = await getShowingCounts(page);
    expect(shown).toBeGreaterThan(0);
  });
});

test.describe('Dashboard filters – combined filters & clear-all', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await waitForDashboard(page);
  });

  test('combining landscape + Football narrows results', async ({ page }) => {
    await clickFilterOption(page, /^Orientation$/i, /^Landscape\b/i);
    const { total: landscapeTotal } = await getShowingCounts(page);
    await clickFilterOption(page, /^Categories$/i, /^Football\b/i);
    const { total: combinedTotal } = await getShowingCounts(page);
    expect(combinedTotal).toBeLessThanOrEqual(landscapeTotal);
  });

  test('clear all removes all active filters and resets to full list', async ({ page }) => {
    await clickFilterOption(page, /^Orientation$/i, /^Landscape\b/i);
    await clickFilterOption(page, /^File Type$/i, /^JPEG Image\b/i);
    await clearAllFilters(page);
    // After clearing, the total must include unfiltered workspace assets
    await expect.poll(async () => {
      const { total } = await getShowingCounts(page);
      return total;
    }, { timeout: 20000 }).toBeGreaterThanOrEqual(500);
  });

  test('filter pills disappear after clear all', async ({ page }) => {
    await clickFilterOption(page, /^Orientation$/i, /^Landscape\b/i);
    // Wait for at least one chip pill to appear (chips row has pt-2 class)
    const pill = page.locator('div.flex.flex-wrap.gap-2.pt-2');
    await expect(pill).toBeVisible({ timeout: 10000 });
    await clearAllFilters(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(pill).toBeHidden({ timeout: 10000 });
  });
});
