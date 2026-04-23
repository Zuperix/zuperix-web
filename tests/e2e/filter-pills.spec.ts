import { test, expect, Page } from '@playwright/test';
import { clearAllFilters, expectShowingPattern } from './helpers';

function filterSection(page: Page, name: RegExp) {
  return page.getByRole('button', { name }).locator('xpath=following-sibling::*[1]');
}

async function clickFilterOption(page: Page, sectionName: RegExp, optionName: RegExp) {
  const sectionButton = page.getByRole('button', { name: sectionName });
  await expect(sectionButton).toBeVisible();
  
  // Ensure section is expanded (check for aria-expanded if possible, or just click)
  const isExpanded = await sectionButton.getAttribute('aria-expanded');
  if (isExpanded === 'false') {
    await sectionButton.click();
  } else if (isExpanded === null) {
     // If not an accordion, just make sure it's there
  }

  const section = filterSection(page, sectionName);
  const checkbox = section.getByRole('checkbox', { name: optionName });
  await expect(checkbox).toBeVisible({ timeout: 10000 });
  await checkbox.click();
}

/**
 * Asserts that no filter pills contain UUID-like strings.
 */
async function expectNoUuidPills(page: Page) {
  const pills = page.locator('div.flex.flex-wrap.gap-2 span.font-semibold');
  const count = await pills.count();
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  
  for (let i = 0; i < count; i++) {
    const text = await pills.nth(i).textContent();
    expect(text).not.toMatch(uuidRegex);
  }
}

async function expectPillWithText(page: Page, label: string, value: string) {
  const pill = page.locator('div.flex.flex-wrap.gap-2 > div', { hasText: new RegExp(`${label}:`, 'i') });
  await expect(pill).toBeVisible();
  await expect(pill).toContainText(value);
}

test.describe('Filter Pills Label Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();
  });

  test('category filter pill shows human readable name', async ({ page }) => {
    // Select a category (e.g., Global)
    await clickFilterOption(page, /^Categories$/i, /^Global\b/i);
    await expectShowingPattern(page);
    
    // Verify pill
    await expectPillWithText(page, 'Category', 'Global');
    await expectNoUuidPills(page);
  });

  test('file type filter pill shows human readable name', async ({ page }) => {
    await clickFilterOption(page, /^File Type$/i, /^JPEG Image\b/i);
    await expectShowingPattern(page);
    
    await expectPillWithText(page, 'File Type', 'JPEG Image');
    await expectNoUuidPills(page);
  });

  test('orientation filter pill shows human readable name', async ({ page }) => {
    await clickFilterOption(page, /^Orientation$/i, /^Landscape\b/i);
    await expectShowingPattern(page);
    
    await expectPillWithText(page, 'Orientation', 'Landscape');
    await expectNoUuidPills(page);
  });

  test('tag filter pill shows tag name', async ({ page }) => {
    // We assume there is at least one tag. In seed data we usually have 'Nature' or similar.
    // Let's find first available tag if any.
    const tagSection = filterSection(page, /^Tags$/i);
    const firstTag = tagSection.getByRole('checkbox').first();
    
    if (await firstTag.isVisible()) {
      const label = await firstTag.textContent();
      const tagName = label?.replace(/\(\d+\)$/, '').trim() || '';
      await firstTag.click();
      await expectShowingPattern(page);
      await expectPillWithText(page, 'Tag', tagName);
      await expectNoUuidPills(page);
    }
  });

  test('multiple filters show correct pills and no UUIDs', async ({ page }) => {
    await clickFilterOption(page, /^Categories$/i, /^Global\b/i);
    await clickFilterOption(page, /^Orientation$/i, /^Portrait\b/i);
    
    await expectPillWithText(page, 'Category', 'Global');
    await expectPillWithText(page, 'Orientation', 'Portrait');
    await expectNoUuidPills(page);
    
    // Clear all and verify pills are gone
    await clearAllFilters(page);
    await expect(page.locator('div.flex.flex-wrap.gap-2 span.font-semibold')).toHaveCount(0);
  });
});
