import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const categoriesHeadingPattern = /Category Management/i;

test('category page shows category hierarchy', async ({ page }) => {
  await page.goto('/categories');

  await expect(page.getByRole('heading', { name: categoriesHeadingPattern })).toBeVisible();
  await expect(page.getByText(/Manage hierarchical labels to organize your global asset library\./i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Root Category/i })).toBeVisible();

  const global = page.getByText('Global', { exact: true });
  const football = page.getByText('Football', { exact: true });
  const tennis = page.getByText('Tennis', { exact: true });

  await expect(global).toBeVisible();
  await expect(football).toBeVisible();
  await expect(tennis).toBeVisible();
  await expect(page.getByText('System', { exact: true })).toBeVisible();

  const footballRow = football.locator('xpath=ancestor::div[contains(@class, "group flex items-center justify-between")][1]');
  await footballRow.getByRole('button').first().click();

  const uefa = page.getByText('UEFA Tournaments', { exact: true });
  await expect(uefa).toBeVisible();

  const globalBox = await global.boundingBox();
  const footballBox = await football.boundingBox();
  const uefaBox = await uefa.boundingBox();
  const tennisBox = await tennis.boundingBox();

  expect(globalBox).not.toBeNull();
  expect(footballBox).not.toBeNull();
  expect(uefaBox).not.toBeNull();
  expect(tennisBox).not.toBeNull();

  expect(uefaBox!.x).toBeGreaterThan(footballBox!.x);
  expect(globalBox!.x).toBeLessThan(uefaBox!.x);
  expect(tennisBox!.x).toBeLessThan(uefaBox!.x);
});

test('create and delete category (cleanup)', async ({ page }) => {
  await page.goto('/categories');
  await expect(page.getByRole('heading', { name: categoriesHeadingPattern })).toBeVisible();

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
