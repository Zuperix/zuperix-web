import { test, expect, Page } from '@playwright/test';
import { expectShowing } from './helpers';

function searchInput(page: Page) {
  return page.getByPlaceholder(/Search assets, metadata, tags|Natural language search aka AI search/i);
}

function searchSuggestions(page: Page) {
  return page.locator('button').filter({ has: page.locator('span.text-sm.font-semibold') });
}

test.describe.configure({ mode: 'serial' });

test('dashboard search supports keyword and semantic flows', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);

  await input.fill('sneha');
  await expect(page.getByText(/Suggested Assets/i)).toBeVisible();
  await expect(searchSuggestions(page)).toHaveCount(2);
  await page.getByRole('button', { name: /Search all for "sneha"/i }).click();
  await expectShowing(page, 2, 2);


  await input.fill('liptip');
  await expect(page.getByText(/Suggested Assets/i)).toBeVisible();
  await expect(searchSuggestions(page)).toHaveCount(1);
  await page.getByRole('button', { name: /Search all for "liptip"/i }).click();
  await expectShowing(page, 1, 1);


  await input.fill('mountains');
  await expect(page.getByText(/Suggested Assets/i)).toBeVisible();
  await expect(searchSuggestions(page)).toHaveCount(3);
  await page.getByRole('button', { name: /Search all for "mountains"/i }).click();
  await expectShowing(page, 3, 3);


  await input.fill('airplane');
  await expect(page.getByText(/Suggested Assets/i)).toBeVisible();
  await expect(searchSuggestions(page)).toHaveCount(1);
  await page.getByRole('button', { name: /Search all for "airplane"/i }).click();
  await expectShowing(page, 1, 1);

  await input.fill('airtel');
  await expect(page.getByText(/Suggested Assets/i)).toBeVisible();
  await expect(searchSuggestions(page)).toHaveCount(2);
  await page.getByRole('button', { name: /Search all for "airtel"/i }).click();
  await expectShowing(page, 2, 2);

  await input.fill('medanta');
  await expect(page.getByText(/Suggested Assets/i)).toBeVisible();
  await expect(searchSuggestions(page)).toHaveCount(1);
  await page.getByRole('button', { name: /Search all for "medanta"/i }).click();
  await expectShowing(page, 1, 1);

  await page.getByRole('button', { name: /^AI$/i }).click();
  await expect(searchInput(page)).toHaveAttribute('placeholder', /Natural language search aka AI search/i);

  await input.fill('skyscrappers');
  await expect(page.getByText(/Semantic Matches/i)).toBeVisible();
  await page.getByRole('button', { name: /Search all for "skyscrappers"/i }).click();
  await expectShowing(page, 20, 79);

  await input.fill('castle');
  await expect(page.getByText(/Semantic Matches/i)).toBeVisible();
  await page.getByRole('button', { name: /Search all for "castle"/i }).click();
  await expect(page.getByRole('heading', { name: 'img_298.jpg', exact: true }).first()).toBeVisible();

  await input.fill('horse');
  await expect(page.getByText(/Semantic Matches/i)).toBeVisible();
  await page.getByRole('button', { name: /Search all for "horse"/i }).click();
  await expect(page.getByRole('heading', { name: 'img_659.jpg', exact: true }).first()).toBeVisible();
});
