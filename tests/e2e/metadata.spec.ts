import { test, expect } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';

test.describe('Metadata Management', () => {
  const firstAssetSelector = '[data-asset-id]';

  test('UI sanity: page loads with expected elements', async ({ page }) => {
    await page.goto('/settings/metadata');
    await expect(page.getByRole('heading', { name: /Metadata Management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Field/i })).toBeVisible();
  });

  test('Full Metadata lifecycle: Create -> Persistence -> Bulk -> Cleanup', async ({ page }) => {
    const fieldLabel = `e2e_test_field_${Date.now()}`;
    const fieldKey = fieldLabel.toLowerCase().replace(/\s+/g, '_');
    
    // 1. Create Field
    await page.goto('/settings/metadata');
    await page.getByPlaceholder(/e\.g\. Photographer Name/i).fill(fieldLabel);
    await page.getByRole('button', { name: /Add Field/i }).click();
    await expect(page.getByRole('heading', { name: fieldLabel })).toBeVisible({ timeout: 15000 });

    // 2. Discover Asset and Set Metadata
    await page.goto('/');
    await expect(page.locator(firstAssetSelector).first()).toBeVisible({ timeout: 15000 });
    const assetId = await page.locator(firstAssetSelector).first().getAttribute('data-asset-id');
    
    await page.goto(`/assets/${assetId}`);
    
    // Toggle "Show empty" if needed
    const showEmptyToggle = page.locator('div').filter({ hasText: /^Show empty$/ }).getByRole('button');
    await expect(page.getByText(/Custom Metadata/i)).toBeVisible({ timeout: 15000 });
    
    // Each field input has a unique placeholder: "Enter {label}..."
    const getFieldInput = (label: string) => page.getByPlaceholder(`Enter ${label}...`);
    
    const fieldInput = getFieldInput(fieldLabel);
    if (!(await fieldInput.isVisible())) {
      await showEmptyToggle.click();
    }
    
    const dummyValue = `Value_${Date.now()}`;
    await fieldInput.fill(dummyValue);
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.getByText(/Updated/i).or(page.getByText(/Saved/i))).toBeVisible();

    // 3. Verify Persistence after refresh
    await page.reload();
    await expect(page.getByText(/Custom Metadata/i)).toBeVisible({ timeout: 15000 });
    if (!(await getFieldInput(fieldLabel).isVisible())) {
      await showEmptyToggle.click();
    }
    await expect(getFieldInput(fieldLabel)).toHaveValue(dummyValue);

    // 4. Bulk Import Test
    await page.goto('/');
    await expect(page.locator(firstAssetSelector).nth(1)).toBeVisible({ timeout: 15000 });
    const assets = await page.locator(firstAssetSelector).all();
    const assetIds = await Promise.all(assets.slice(0, 3).map(a => a.getAttribute('data-asset-id')));
    
    const csvContent = [
      `asset_id,brand,${fieldKey}`,
      `${assetIds[0]},BrandA,BulkVal1`,
      `${assetIds[1]},BrandB,BulkVal2`,
      `${assetIds[2]},BrandC,BulkVal3`
    ].join('\n');

    const fs = require('fs');
    const path = require('path');
    const tempCsvPath = path.join(__dirname, 'bulk_test.csv');
    fs.writeFileSync(tempCsvPath, csvContent);

    try {
    await page.goto('/settings/metadata');
    await dismissTransientOverlays(page);
    await page.getByRole('button', { name: /Bulk Import \(CSV\)/i }).click();
      
      // Wait for the file input to be present in DOM
      // Use a specific selector to avoid strict mode violation with visual-search-upload
      const fileInput = page.locator('input[type="file"][accept=".csv"]');
      await expect(fileInput).toBeAttached({ timeout: 5000 });
      await fileInput.setInputFiles(tempCsvPath);

      // Wait for the Start Import button to become enabled (file accepted)
      const startImportBtn = page.getByRole('button', { name: /Start Import/i });
      await expect(startImportBtn).toBeEnabled({ timeout: 5000 });
      await startImportBtn.click({ force: true });
      
      // Success Notification
      await expect(page.getByText('Bulk Import Started', { exact: true })).toBeVisible({ timeout: 10000 });

      // Verify one asset
      await page.goto(`/assets/${assetIds[1]}`);
      await expect(page.getByText(/Custom Metadata/i)).toBeVisible({ timeout: 15000 });
      
      const brandInput = getFieldInput('Brand');
      const testFieldInput = getFieldInput(fieldLabel);

      if (!(await brandInput.isVisible())) {
        await showEmptyToggle.click();
      }

      await expect(brandInput).toHaveValue('BrandB');
      await expect(testFieldInput).toHaveValue('BulkVal2');
    } finally {
      if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    }

    // 5. Cleanup (Delete Field)
    await page.goto('/settings/metadata');
    // Use div.group to target the card and avoid matching nested divs containing the heading
    const fieldCard = page.locator('div.group', { has: page.getByRole('heading', { name: fieldLabel }) }).last();
    await fieldCard.getByRole('button', { name: /Delete Field/i }).click({ force: true });
    await page.getByRole('button', { name: /Delete Field/i, includeHidden: false }).filter({ hasText: /Delete Field/i }).click();
    await expect(fieldCard).not.toBeVisible({ timeout: 15000 });
  });

  test('UI elements: field type dropdown', async ({ page }) => {
    await page.goto('/settings/metadata');
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options.some(o => o.includes('Short Text'))).toBeTruthy();
  });
});
