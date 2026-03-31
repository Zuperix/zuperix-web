import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

function createUserModal(page: Page) {
  return page
    .getByRole('heading', { name: /^Create New User$/i })
    .locator('xpath=ancestor::div[contains(@class, "bg-gray-900")][1]');
}

test('users page shows existing user inventory', async ({ page }) => {
  await page.goto('/admin/users');

  await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
  await expect(page.getByText(/Manage users, their access levels, and workspace assignments\./i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Add New User/i })).toBeVisible();

  const userRow = page.getByRole('row', {
    name: /Test User\s+blaze\.blog18@gmail\.com\s+SUPER ADMIN/i,
  });

  await expect(userRow).toBeVisible();
  await expect(userRow.getByText('Test User', { exact: true })).toBeVisible();
  await expect(userRow.getByText('blaze.blog18@gmail.com', { exact: true })).toBeVisible();
  await expect(userRow.getByText(/SUPER ADMIN/i)).toBeVisible();
  await expect(userRow.getByRole('button', { name: /Manage Access/i })).toBeVisible();
});

test('create user with main workspace admin role (cleanup)', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();

  const userName = `E2E User ${Date.now()}`;
  const userEmail = `e2e-user-${Date.now()}@example.com`;
  const userPassword = 'Password123!';

  await page.getByRole('button', { name: /Add New User/i }).click();
  const modal = createUserModal(page);

  await expect(modal.getByRole('heading', { name: /^Create New User$/i })).toBeVisible();
  await modal.getByPlaceholder('e.g. John Doe').fill(userName);
  await modal.getByPlaceholder('user@example.com').fill(userEmail);
  await modal.getByPlaceholder('Min 8 characters').fill(userPassword);
  await modal.locator('select').nth(0).selectOption({ label: 'Main Workspace' });
  await modal.locator('select').nth(1).selectOption({ label: 'ADMIN' });
  await modal.getByRole('button', { name: /^Create User$/i }).click();

  const row = page.getByRole('row').filter({ hasText: userEmail });
  await expect(row).toBeVisible({ timeout: 20000 });
  await expect(row.getByText(userName, { exact: true })).toBeVisible();

  await row.hover();
  await row.getByTitle('Delete User').click();

  const deleteModal = page.getByRole('dialog');
  await expect(deleteModal).toBeVisible();
  await deleteModal.getByPlaceholder('CONFIRM').fill('CONFIRM');
  await deleteModal.getByRole('button', { name: /^Delete User Permanently$/i }).click();

  await expect(page.getByText(userEmail, { exact: true })).toBeHidden({ timeout: 20000 });
});
