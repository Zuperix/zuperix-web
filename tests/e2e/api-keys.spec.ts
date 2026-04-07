import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

function createKeyModal(page: Page) {
  return page
    .getByRole('heading', { name: /^New API Key$/i })
    .locator('xpath=ancestor::div[contains(@class, "fixed")][1]');
}

function revokeKeyModal(page: Page) {
  return page
    .getByRole('heading', { name: /^Revoke API Key\?$/i })
    .locator('xpath=ancestor::div[contains(@class, "fixed")][1]');
}

test('api keys page renders correctly', async ({ page }) => {
  await page.goto('/admin/api-keys');

  await expect(page.getByRole('heading', { name: /^API Keys$/i })).toBeVisible();
  await expect(page.getByText(/Manage API keys for programmatic access to your assets\./i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Create Key/i })).toBeVisible();
});

test('create and revoke api key \(cleanup\)', async ({ page }) => {
  await page.goto('/admin/api-keys');
  await expect(page.getByRole('heading', { name: /^API Keys$/i })).toBeVisible();

  const keyName = `E2E API Key ${Date.now()}`;

  await page.getByRole('button', { name: /Create Key/i }).click();
  const modal = createKeyModal(page);

  await expect(modal.getByRole('heading', { name: /^New API Key$/i })).toBeVisible();
  await modal.getByPlaceholder('e.g. Mobile App Production').fill(keyName);
  await modal.getByRole('button', { name: /^Generate Key$/i }).click();

  await expect(page.getByText(/API Key Created Successfully/i)).toBeVisible();
  await page.getByRole('button', { name: /I have saved this key/i }).click();

  const row = page.getByRole('row', { name: new RegExp(keyName, 'i') });
  await expect(row).toBeVisible({ timeout: 20000 });

  await row.getByTitle('Revoke Key').click();
  const revokeModal = revokeKeyModal(page);

  await expect(revokeModal.getByRole('heading', { name: /^Revoke API Key\?$/i })).toBeVisible();
  await revokeModal.getByPlaceholder('REVOKE').fill('REVOKE');
  await revokeModal.getByRole('button', { name: /^REVOKE$/i }).click();

  await expect(row).toBeHidden({ timeout: 20000 });
});
