import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('collections page shows create form controls', async ({ page }) => {
  await page.goto('/collections');

  await expect(page.getByRole('heading', { name: /My Collections/i })).toBeVisible();
  await expect(page.getByText(/Curate and group your favorite assets for quick access and sharing\./i)).toBeVisible();
  await expect(page.getByPlaceholder('Search collections...')).toBeVisible();
  await expect(page.getByRole('button', { name: /New Collection/i })).toBeVisible();

  await page.getByRole('button', { name: /New Collection/i }).click();
  const form = page
    .getByRole('heading', { name: /^Create Collection$/i })
    .locator('xpath=ancestor::div[contains(@class, "bg-gray-900/60")][1]');

  await expect(form.getByRole('heading', { name: /^Create Collection$/i })).toBeVisible();
  await expect(form.getByPlaceholder('Inspiration, Q4 Campaign, etc.')).toBeVisible();
  await expect(form.getByPlaceholder('What is this collection for?')).toBeVisible();
  await expect(form.getByRole('checkbox', { name: /Smart Collection/i })).toBeVisible();
  await expect(form.getByRole('checkbox', { name: /Global Collection/i })).toBeVisible();
  await expect(form.getByRole('button', { name: /^Create Collection$/i })).toBeVisible();
});

test('create and delete collection (cleanup)', async ({ page }) => {
  await page.goto('/collections');
  await expect(page.getByRole('heading', { name: /My Collections/i })).toBeVisible();

  const collectionName = `e2e-collection-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const description = 'e2e collection description';

  await page.getByRole('button', { name: /New Collection/i }).click();
  const form = page
    .getByRole('heading', { name: /^Create Collection$/i })
    .locator('xpath=ancestor::div[contains(@class, "bg-gray-900/60")][1]');
  await form.getByPlaceholder('Inspiration, Q4 Campaign, etc.').fill(collectionName);
  await form.getByPlaceholder('What is this collection for?').fill(description);
  await form.getByRole('button', { name: /^Create Collection$/i }).click();

  const collectionCard = page.locator('div').filter({ has: page.getByRole('heading', { name: collectionName }) }).first();
  await expect(page.getByRole('heading', { name: collectionName })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(description, { exact: true })).toBeVisible();

  await collectionCard.hover();
  page.once('dialog', dialog => dialog.accept());
  await collectionCard.getByRole('button', { name: `Delete ${collectionName}` }).click();

  await expect(page.getByRole('heading', { name: collectionName })).toBeHidden({ timeout: 20000 });
});
