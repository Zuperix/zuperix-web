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

  await expect(page.getByRole('row', { name: /^SUPER_ADMIN/i })).toBeVisible();
  await expect(page.getByRole('row', { name: /^ADMIN WORKSPACE/i }).first()).toBeVisible();
  await expect(page.getByRole('row', { name: /^EDITOR WORKSPACE/i }).first()).toBeVisible();
  await expect(page.getByRole('row', { name: /^VIEWER WORKSPACE/i }).first()).toBeVisible();
});

test('create and delete workspace role (cleanup)', async ({ page }) => {
  await page.goto('/admin/roles');
  await dismissTransientOverlays(page);
  await expect(page.getByRole('heading', { name: /Role Management/i })).toBeVisible();

  const roleName = `E2E Role ${Date.now()}`;

  await page.evaluate(async ({ roleName }) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Missing auth token');

    const permsRes = await fetch('http://localhost:3000/api/v1/permissions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!permsRes.ok) throw new Error(`Failed to load permissions: ${permsRes.status}`);
    const permissions = await permsRes.json();
    const firstPermissionId = Array.isArray(permissions) ? permissions[0]?.id : permissions?.data?.[0]?.id;
    if (!firstPermissionId) throw new Error('No permissions available');

    const createRes = await fetch('http://localhost:3000/api/v1/roles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: roleName, type: 'WORKSPACE', permissionIds: [firstPermissionId] }),
    });
    if (!createRes.ok) throw new Error(`Failed to create role: ${createRes.status}`);
  }, { roleName });

  await page.reload();
  await dismissTransientOverlays(page);

  const row = page.getByRole('row', { name: new RegExp(roleName, 'i') });
  await expect(row).toBeVisible({ timeout: 20000 });

  await row.getByRole('button', { name: `Delete ${roleName}` }).click({ force: true });
  const deleteModal = page.getByRole('dialog');
  await expect(deleteModal).toBeVisible();
  await deleteModal.getByRole('button', { name: /^Delete permanently$/i }).click({ force: true });

  await expect(page.getByRole('row', { name: new RegExp(roleName, 'i') })).toBeHidden({ timeout: 20000 });
});
