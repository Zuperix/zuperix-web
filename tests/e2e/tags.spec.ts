import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

function tagCard(page: Page, name: RegExp) {
  return page
    .getByRole('heading', { name })
    .locator('xpath=ancestor::div[contains(@class, "bg-gray-900/40")][1]');
}

test('tags page shows tag inventory', async ({ page }) => {
  await page.goto('/settings/tags');

  await expect(page.getByRole('link', { name: /Back to Settings/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Tags & Labels/i })).toBeVisible();
  await expect(page.getByText(/Clean up your library and see how your tags are being used\./i)).toBeVisible();
  await expect(page.getByPlaceholder('Find a tag...')).toBeVisible();

  await expect(page.getByRole('heading', { name: /^argentinian$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^atmosphere$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^board$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^clouds$/i })).toBeVisible();

  await expect(tagCard(page, /^argentinian$/i).getByText(/1 Assets/i)).toBeVisible();
  await expect(tagCard(page, /^background$/i).getByText(/0 Assets/i)).toBeVisible();
  await expect(tagCard(page, /^clouds$/i).getByText(/2 Assets/i)).toBeVisible();
});

test('tags page search filters visible tags', async ({ page }) => {
  await page.goto('/settings/tags');

  const search = page.getByPlaceholder('Find a tag...');
  await search.fill('arg');

  await expect(page.getByRole('heading', { name: /^argentinian$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^board$/i })).toBeHidden();
  await expect(page.getByRole('heading', { name: /^clouds$/i })).toBeHidden();

  await search.fill('no-such-tag');
  await expect(page.getByText('No tags found', { exact: true })).toBeVisible();
});
