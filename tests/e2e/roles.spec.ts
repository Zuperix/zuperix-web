import { test, expect } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';

test.describe.configure({ mode: 'serial' });

function newRoleModal(page: import('@playwright/test').Page) {
  return page
    .getByRole('heading', { name: /^New Role$/i })
    .locator('xpath=ancestor::div[contains(@class, "bg-gray-900")][1]');
}

test('roles page shows built-in role inventory', async ({ page }) => {
  await page.goto('/admin/roles');

  await expect(page.getByRole('heading', { name: /Role Management/i })).toBeVisible();
  await expect(page.getByText(/Manage system-wide and workspace-specific roles and permissions\./i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Create Role/i })).toBeVisible();

  await expect(page.getByRole('button', { name: /Role Management/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Permissions List/i })).toBeVisible();

  await expect(page.getByRole('row', { name: /SUPER_ADMIN/i })).toBeVisible();
  await expect(page.getByRole('row', { name: /\bADMIN\b.*WORKSPACE/i })).toBeVisible();
  await expect(page.getByRole('row', { name: /\bEDITOR\b.*WORKSPACE/i })).toBeVisible();
  await expect(page.getByRole('row', { name: /\bVIEWER\b.*WORKSPACE/i })).toBeVisible();
});

test('create and delete workspace role (cleanup)', async ({ page }) => {
  await page.goto('/admin/roles');
  await dismissTransientOverlays(page);
  await expect(page.getByRole('heading', { name: /Role Management/i })).toBeVisible();

  const roleName = `E2E Role ${Date.now()}`;

  await page.getByRole('button', { name: /Create Role/i }).click();
  const modal = newRoleModal(page);

  await expect(modal.getByRole('heading', { name: /^New Role$/i })).toBeVisible();
  await modal.getByPlaceholder('e.g. Asset Reviewer').fill(roleName);
  await modal.locator('select').selectOption({ label: 'Workspace Role' });
  await modal.getByRole('checkbox').first().check();
  await modal.getByRole('button', { name: /^Create Role$/i }).click();
  await expect(modal).toBeHidden();

  const row = page.getByRole('row', { name: new RegExp(roleName, 'i') });
  await expect(row).toBeVisible({ timeout: 20000 });

  await row.getByRole('button', { name: `Delete ${roleName}` }).click();
  const deleteModal = page.getByRole('dialog');
  await expect(deleteModal).toBeVisible();
  await deleteModal.getByRole('button', { name: /^Delete permanently$/i }).click();

  await expect(page.getByRole('row', { name: new RegExp(roleName, 'i') })).toBeHidden({ timeout: 20000 });
});
