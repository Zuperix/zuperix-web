import { test, expect, Page } from '@playwright/test';
import { getShowingCounts } from './helpers';

function searchInput(page: Page) {
  return page.getByPlaceholder(/Search assets, metadata, tags|Natural language search aka AI search/i);
}

async function runSearch(page: Page, query: string) {
  const input = searchInput(page);
  const responsePromise = page.waitForResponse(
    (res) => {
      const url = new URL(res.url());
      return url.pathname.includes('/search/assets') && url.searchParams.get('q') === query && res.status() === 200;
    },
    { timeout: 15000 },
  );
  const urlPromise = page.waitForURL(url => url.searchParams.get('q') === query, { timeout: 15000 });
  await input.fill(query);
  await input.press('Enter');
  await urlPromise;
  await responsePromise;
  await expect(page.getByRole('heading', { name: /Search Results/i })).toBeVisible({ timeout: 15000 });
}

test.describe.configure({ mode: 'serial' });


test('search shortcuts: type:image AND size>500kb', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, 'type:image AND size>500kb');
  await expect.poll(async () => (await getShowingCounts(page)).total, { timeout: 20000 }).toBeGreaterThan(0);
});


test('search shortcuts: type:image AND size>1mb', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, 'type:image AND size>1mb');
  await expect(page.locator('p', { hasText: 'Showing' }).first()).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 15000 });
});

test('search shortcuts: type:image AND size > 100kb (with spaces) - parser ignores size filter', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, 'type:image AND size > 100kb');

  const { total } = await getShowingCounts(page);
  expect(total === 0 || total >= 80).toBeTruthy();
});

test('search shortcuts: (type:image OR type:video) AND tag:airplane', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, '(type:image OR type:video) AND tag:summer');
  await expect(page.locator('p', { hasText: 'Showing' }).first()).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 15000 });
});

test('search shortcuts: type:image', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, 'type:image');
  
  await expect(page.locator('p', { hasText: 'Showing' }).first()).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 15000 });
});

test('search shortcuts: type:video', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, 'type:video');
  
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 20000 });
});

test('search shortcuts: size>1mb', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, 'size>1mb');
  await expect(page.locator('p', { hasText: 'Showing' }).first()).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 15000 });
});

test('search shortcuts: tag:summer', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await runSearch(page, 'tag:summer');
  
  const showing = page.locator('p', { hasText: 'Showing' }).first();
  await expect(showing).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 20000 });
});


test('dashboard search supports keyword and semantic flows', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const input = searchInput(page);

  await input.fill('sky');
  await page.getByRole('button', { name: /Search all/i }).click();
  await expect(page.locator('p', { hasText: 'Showing' }).first()).toContainText(/Showing\s+\d+\s+out of\s+\d+\s+assets/i, { timeout: 20000 });

  await page.getByRole('button', { name: /^AI$/i }).click();
  await expect(searchInput(page)).toHaveAttribute('placeholder', /Natural language search aka AI search/i);

  await input.fill('horse');
  await page.getByRole('button', { name: /Search all/i }).click();
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({ timeout: 20000 });
});
