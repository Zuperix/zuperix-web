import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

function createWebhookModal(page: Page) {
  return page
    .getByRole('heading', { name: /^Create Webhook$/i })
    .locator('xpath=ancestor::div[contains(@class, "fixed")][1]');
}

function deleteWebhookModal(page: Page) {
  return page
    .getByRole('heading', { name: /^Delete Webhook$/i })
    .locator('xpath=ancestor::div[contains(@class, "fixed")][1]');
}

test('webhooks page shows empty inventory state', async ({ page }) => {
  await page.goto('/dashboard/admin/webhooks');

  await expect(page.getByRole('heading', { name: /Webhook Management/i })).toBeVisible();
  await expect(page.getByText(/Configure real-time notifications for system events\./i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Register New Webhook/i })).toBeVisible();
  await expect(page.getByText(/No webhooks registered yet\./i)).toBeVisible();
});

test('create and delete webhook (cleanup)', async ({ page }) => {
  await page.goto('/dashboard/admin/webhooks');
  await expect(page.getByRole('heading', { name: /Webhook Management/i })).toBeVisible();

  const webhookUrl = `https://example.com/e2e-webhook-${Date.now()}`;

  await page.getByRole('button', { name: /Register New Webhook/i }).click();
  const modal = createWebhookModal(page);

  await expect(modal.getByRole('heading', { name: /^Create Webhook$/i })).toBeVisible();
  await modal.getByPlaceholder('https://your-app.com/webhook').fill(webhookUrl);
  await modal.getByRole('button', { name: /^Register Webhook$/i }).click();

  const row = page.getByRole('row', { name: new RegExp(webhookUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  await expect(row).toBeVisible({ timeout: 20000 });

  await row.hover();
  await row.getByTitle('Delete').click();
  const deleteModal = deleteWebhookModal(page);

  await expect(deleteModal.getByRole('heading', { name: /^Delete Webhook$/i })).toBeVisible();
  await deleteModal.getByRole('button', { name: /^Delete Webhook$/i }).click();

  await expect(row).toBeHidden({ timeout: 20000 });
});
