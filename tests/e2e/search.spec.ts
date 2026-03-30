import { test, expect, Page } from '@playwright/test';
import { expectShowing } from './helpers';

function searchInput(page: Page) {
  return page.getByPlaceholder(/Search assets, metadata, tags|Natural language search aka AI search/i);
}

function searchSuggestions(page: Page) {
  return page.locator('button').filter({ has: page.locator('span.text-sm.font-semibold') });
}

test.describe.configure({ mode: 'serial' });


test('search shortcuts: type:image AND size>500kb', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('type:image AND size>500kb');
  await input.press('Enter');
  await expectShowing(page, 20, 31);
});


test('search shortcuts: type:image AND size>100kb', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('type:image AND size>100kb');
  await input.press('Enter');
  await expectShowing(page, 20, 83);
});

test('search shortcuts: type:image AND size > 100kb (with spaces) - parser ignores size filter', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('type:image AND size > 100kb');
  await input.press('Enter');

  await expectShowing(page, 20, 535);
});

test('search shortcuts: (type:image OR type:video) AND tag:airplane', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('(type:image OR type:video) AND tag:airplane');
  await input.press('Enter');
  await expectShowing(page, 1, 1);
});

test('search shortcuts: type:image', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('type:image');
  await input.press('Enter');
  
  await expectShowing(page, 20, 527);
});

test('search shortcuts: type:video', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('type:video');
  await input.press('Enter');
  
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 20000 });
});

test('search shortcuts: size>1mb', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('size>1mb');
  await input.press('Enter');
  
await expectShowing(page, 20, 23);
});

test('search shortcuts: tag:airplane', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);
  await input.fill('tag:airplane');
  await input.press('Enter');
  
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 20000 });
});


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
  await expectShowing(page, 20, 64);

  await input.fill('castle');
  await expect(page.getByText(/Semantic Matches/i)).toBeVisible();
  await page.getByRole('button', { name: /Search all for "castle"/i }).click();
  await expect(page.getByRole('heading', { name: 'img_298.jpg', exact: true }).first()).toBeVisible();

  await input.fill('horse');
  await expect(page.getByText(/Semantic Matches/i)).toBeVisible();
  await page.getByRole('button', { name: /Search all for "horse"/i }).click();
  await expect(page.getByRole('heading', { name: 'img_659.jpg', exact: true }).first()).toBeVisible();
});
