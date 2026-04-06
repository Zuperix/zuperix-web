import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe.configure({ mode: 'serial' });

const vaultName = `E2E Vault ${Date.now()}`;
const fileName = `vault-test-${Date.now()}.txt`;

test.describe('Vault Operations', () => {
  let createdVaultId: string | null = null;

  test('setup: create a test vault', async ({ page }) => {
    await page.goto('/vaults');
    await page.getByRole('button', { name: /New Vault/i }).click();
    await page.getByPlaceholder('Marketing Assets, Q2 Product Launch, etc.').fill(vaultName);
    await page.getByPlaceholder('What kind of assets are in this vault?').fill('Vault for e2e testing of upload and visibility.');
    await page.getByRole('button', { name: /Create Vault/i }).click();

    await expect(page.getByRole('heading', { name: vaultName })).toBeVisible({ timeout: 15000 });
    
    const vaultCard = page.locator('.group.flex.flex-col').filter({ hasText: vaultName });
    await vaultCard.click();
    
    await expect(page).toHaveURL(/\/vaults\/[a-zA-Z0-9-]+/);
    createdVaultId = page.url().split('/').pop() || null;
  });

  test('upload asset directly into the vault', async ({ page }, testInfo) => {
    await page.goto('/'); // Go to dashboard
    
    // Create dummy file
    const filePath = testInfo.outputPath(fileName);
    fs.writeFileSync(filePath, 'this is a vaulted asset content');

    await page.getByRole('button', { name: /^Upload$/i }).click();
    const modal = page.locator('div.fixed', { has: page.getByText('Bulk Upload') });
    await expect(modal).toBeVisible();

    // Select the vault from the dropdown
    // Based on the source code, it's the second select (or find by label/text)
    const vaultSelect = modal.locator('select').nth(1); // 0 is category, 1 is vault
    await vaultSelect.selectOption({ label: vaultName });

    // Upload the file
    await modal.locator('input[type="file"]').setInputFiles(filePath);
    await expect(modal.getByText(fileName)).toBeVisible({ timeout: 10000 });

    await modal.getByRole('button', { name: /^Upload \d+ file(s)?$/i }).click();
    await expect(modal.getByText(/1\s*\/\s*1 complete/i)).toBeVisible({ timeout: 30000 });

    await modal.getByRole('button', { name: /Close|Cancel/i }).click();
    await expect(modal).toBeHidden();
  });

  test('verify asset visibility: hidden from main dashboard by default', async ({ page }) => {
    await page.goto('/');
    await page.reload(); // Ensure fresh data
    
    // Wait for some assets to load
    await page.waitForTimeout(2000); 

    // The asset should NOT be visible in the main grid
    const assetCard = page.getByRole('heading', { level: 3, name: fileName });
    await expect(assetCard).toBeHidden({ timeout: 5000 });
  });

  test('verify asset visibility: visible inside the vault', async ({ page }) => {
    await page.goto('/vaults');
    
    const vaultCard = page.locator('.group.flex.flex-col').filter({ hasText: vaultName });
    await vaultCard.click();

    await expect(page.getByRole('heading', { name: vaultName })).toBeVisible();
    
    // Check if the asset is in the vault content grid
    const assetCard = page.getByRole('heading', { level: 3, name: fileName });
    await expect(assetCard).toBeVisible({ timeout: 10000 });

    // Click it to go to single asset page
    await assetCard.click();
    await expect(page).toHaveURL(/.*\/assets\/.*/);
    await expect(page.getByRole('heading', { name: fileName })).toBeVisible();
    
    // Verify it shows "Vaulted" or relevant lock icon / metadata if possible
    // (This depends on current UI, but we at least verified accessibility)
  });

  test('cleanup: remove asset from vault and delete everything', async ({ page }) => {
    // 1. Navigate back to vault
    await page.goto('/vaults');
    const vaultCard = page.locator('.group.flex.flex-col', { hasText: vaultName });
    await vaultCard.click();

    // 2. Select asset and delete it (from the vault details view)
    // The asset card in AssetGrid has a specific structure
    const assetCard = page.locator('div[data-asset-id]', { hasText: fileName });
    await assetCard.scrollIntoViewIfNeeded();
    await assetCard.hover();
    
    // The delete button has title="Delete"
    await assetCard.getByRole('button', { name: /Delete/i }).first().click();
    
    // Confirm remove in the modal
    // The modal doesn't have role="dialog", so we look for its unique heading
    const removeModal = page.locator('div', { has: page.getByRole('heading', { name: /Remove Asset from Vault/i }) });
    await expect(removeModal).toBeVisible();
    await removeModal.getByRole('button', { name: /Remove Asset/i }).click();
    
    await expect(assetCard).toBeHidden({ timeout: 15000 });

    // 3. Delete the vault itself
    await page.goto('/vaults');
    const finalVaultCard = page.locator('.group.flex.flex-col', { hasText: vaultName });
    await expect(finalVaultCard).toBeVisible({ timeout: 10000 });
    await finalVaultCard.hover();
    
    // The delete button on the card has title="Delete Vault"
    await finalVaultCard.getByRole('button', { name: /Delete Vault/i }).click();
    
    // Handle delete confirmation
    const deleteModal = page.locator('div', { has: page.getByRole('heading', { name: /Delete Vault/i }) });
    await expect(deleteModal).toBeVisible();
    await deleteModal.getByRole('button', { name: /Delete Vault Forever/i }).click();

    await expect(page.getByRole('heading', { name: vaultName })).toBeHidden({ timeout: 15000 });
  });
});
