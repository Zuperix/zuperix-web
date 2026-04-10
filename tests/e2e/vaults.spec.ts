import { test, expect } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';

test.describe.configure({ mode: 'serial' });

const vaultName = `e2e test vault ${Date.now()}`;
const updatedVaultName = `${vaultName} updated`;

test('vaults page loads and shows UI elements', async ({ page }) => {
  await page.goto('/vaults');

  await expect(page.getByRole('heading', { name: /Vaults/i })).toBeVisible();
  await expect(page.getByText(/Securely group assets and manage member-level access controls/i)).toBeVisible();
  await expect(page.getByPlaceholder('Search vaults...')).toBeVisible();
  await expect(page.getByRole('button', { name: /New Vault/i })).toBeVisible();
});

test('create vault form opens and has expected fields', async ({ page }) => {
  await page.goto('/vaults');
  await expect(page.getByRole('heading', { name: /Vaults/i })).toBeVisible();

  await page.getByRole('button', { name: /New Vault/i }).click();

  await expect(page.getByRole('heading', { name: /Create New Vault/i })).toBeVisible();
  await expect(page.getByPlaceholder('Marketing Assets, Q2 Product Launch, etc.')).toBeVisible();
  await expect(page.getByPlaceholder('What kind of assets are in this vault?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Create Vault/i })).toBeVisible();

  const formHeader = page.getByRole('heading', { name: /Create New Vault/i });
  await formHeader.locator('..').locator('button').click();
  await expect(page.getByRole('heading', { name: /Create New Vault/i })).toBeHidden();
});

test('create new vault', async ({ page }) => {
  await page.goto('/vaults');

  await page.getByRole('button', { name: /New Vault/i }).click();
  await page.getByPlaceholder('Marketing Assets, Q2 Product Launch, etc.').fill(vaultName);
  await page.getByPlaceholder('What kind of assets are in this vault?').fill('This is a test vault created by e2e tests.');
  await page.getByRole('button', { name: /Create Vault/i }).click();

  await expect(page.getByRole('heading', { name: vaultName })).toBeVisible({ timeout: 10000 });
});

test('edit vault', async ({ page }) => {
  await page.goto('/vaults');
  await dismissTransientOverlays(page);

  const vaultCard = page.locator('.group.flex.flex-col').filter({ hasText: vaultName });
  await expect(vaultCard).toBeVisible({ timeout: 10000 });

  await vaultCard.hover();
  await vaultCard.getByRole('button', { name: /Edit Vault/i }).click();

  await expect(page.getByRole('heading', { name: `Edit Vault: ${vaultName}` })).toBeVisible();
  await page.getByPlaceholder('Marketing Assets, Q2 Product Launch, etc.').fill(updatedVaultName);
  await page.getByRole('button', { name: /Save Changes/i }).click();

  await expect(page.getByRole('heading', { name: updatedVaultName })).toBeVisible({ timeout: 10000 });
});

test('navigate to vault assets via Open button', async ({ page }) => {
  await page.goto('/vaults');

  const vaultCard = page.locator('.group.flex.flex-col').filter({ hasText: updatedVaultName });
  await vaultCard.getByText(/Open/i).click();

  await expect(page).toHaveURL(/\/vaults\/[a-zA-Z0-9-]+/);
  await expect(page.getByRole('heading', { name: updatedVaultName })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Back to Vaults/i)).toBeVisible();
});

test('delete vault', async ({ page }) => {
  await page.goto('/vaults');
  await dismissTransientOverlays(page);

  const vaultCard = page.locator('.group.flex.flex-col').filter({ hasText: updatedVaultName });
  await expect(vaultCard).toBeVisible({ timeout: 10000 });

  await vaultCard.hover();
  await vaultCard.getByRole('button', { name: /Delete Vault/i }).click();

  // Handle custom modal
  await expect(page.getByRole('heading', { name: /Delete Vault/i })).toBeVisible();
  await page.getByRole('button', { name: /Delete Vault Forever/i }).click();

  // List should no longer contain the vault
  await expect(page.getByRole('heading', { name: updatedVaultName })).toBeHidden({ timeout: 10000 });
});
