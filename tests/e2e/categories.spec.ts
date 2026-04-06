import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('category page shows taxonomy hierarchy', async ({ page }) => {
  await page.goto('/categories');

  await expect(page.getByRole('heading', { name: /Taxonomy Management/i })).toBeVisible();
  await expect(page.getByText(/Manage hierarchical labels to organize your global asset library\./i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Root Category/i })).toBeVisible();

  const global = page.getByText('Global', { exact: true });
  const internet = page.getByText('Internet', { exact: true });
  const test2 = page.getByText('Test2', { exact: true });

  await expect(global).toBeVisible();
  await expect(internet).toBeVisible();
  await expect(test2).toBeVisible();
  await expect(page.getByText('System', { exact: true })).toBeVisible();

  const internetRow = internet.locator('xpath=ancestor::div[contains(@class, "group flex items-center justify-between")][1]');
  await internetRow.getByRole('button').first().click();

  const airtel = page.getByText('Airtel', { exact: true });
  const jio = page.getByText('Jio', { exact: true });
  await expect(airtel).toBeVisible();
  await expect(jio).toBeVisible();

  const airtelRow = airtel.locator('xpath=ancestor::div[contains(@class, "group flex items-center justify-between")][1]');
  await airtelRow.getByRole('button').first().click();

  const circleRaj = page.getByText('Circle-RAJ', { exact: true });
  await expect(circleRaj).toBeVisible();

  const globalBox = await global.boundingBox();
  const internetBox = await internet.boundingBox();
  const airtelBox = await airtel.boundingBox();
  const circleRajBox = await circleRaj.boundingBox();
  const jioBox = await jio.boundingBox();
  const test2Box = await test2.boundingBox();

  expect(globalBox).not.toBeNull();
  expect(internetBox).not.toBeNull();
  expect(airtelBox).not.toBeNull();
  expect(circleRajBox).not.toBeNull();
  expect(jioBox).not.toBeNull();
  expect(test2Box).not.toBeNull();

  expect(airtelBox!.x).toBeGreaterThan(internetBox!.x);
  expect(jioBox!.x).toBeGreaterThan(internetBox!.x);
  expect(circleRajBox!.x).toBeGreaterThan(airtelBox!.x);
  expect(globalBox!.x).toBeLessThan(airtelBox!.x);
  expect(test2Box!.x).toBeLessThan(airtelBox!.x);
});

test('create and delete category (cleanup)', async ({ page }) => {
  await page.goto('/categories');
  await expect(page.getByRole('heading', { name: /Taxonomy Management/i })).toBeVisible();

  const categoryName = `e2e-cat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await page.getByRole('button', { name: /Add Root Category/i }).click();
  await page.getByPlaceholder('Internal ID or Name...').fill(categoryName);
  await page.getByRole('button', { name: /^Create$/i }).click();

  const nameLocator = page.getByText(categoryName, { exact: true });
  await expect(nameLocator).toBeVisible({ timeout: 20000 });

  const row = nameLocator.locator('..').locator('..').locator('..');
  await row.hover();

  await row.getByTitle('Delete').click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: /^Delete Category$/i }).click();

  await expect(page.getByText(categoryName, { exact: true })).toBeHidden({ timeout: 20000 });
});
