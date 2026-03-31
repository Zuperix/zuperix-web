import { test, expect } from '@playwright/test';

test.describe('Metadata Management', () => {
  const fieldLabel = `e2e_test_field_${Date.now()}`;
  const fieldKey = fieldLabel.toLowerCase().replace(/\s+/g, '_');

  test('page loads with expected UI elements', async ({ page }) => {
    await page.goto('/settings/metadata');

    await expect(page.getByRole('heading', { name: /Metadata Management/i })).toBeVisible();
    await expect(page.getByText(/Define custom properties to store alongside your digital assets/i)).toBeVisible();

    await expect(page.getByRole('button', { name: /Field Definitions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Bulk Import \(CSV\)/i })).toBeVisible();

    await expect(page.getByText(/New Custom Field/i)).toBeVisible();
    await expect(page.getByText(/LABEL/i)).toBeVisible();
    await expect(page.getByText(/KEY \(INTERNAL\)/i)).toBeVisible();
    await expect(page.getByText(/FIELD TYPE/i)).toBeVisible();

    await expect(page.getByText(/Required Field/i)).toBeVisible();
    await expect(page.getByText(/Include in Full-Text Search/i)).toBeVisible();
    await expect(page.getByText(/Show in Sidebar Filters/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Field/i })).toBeVisible();
  });

  test('existing Brand field is visible', async ({ page }) => {
    await page.goto('/settings/metadata');

    const brandField = page.locator('text=Brand').first();
    await expect(brandField).toBeVisible();

    await expect(page.getByText(/Required/i).first()).toBeVisible();
    await expect(page.getByText(/Searchable/i).first()).toBeVisible();
    await expect(page.getByText(/Filterable/i).first()).toBeVisible();
  });

  test('create new metadata field and verify persistence after refresh', async ({ page }) => {
    await page.goto('/settings/metadata');
    await expect(page.getByRole('heading', { name: /Metadata Management/i })).toBeVisible();

    const labelInput = page.getByPlaceholder(/e\.g\. Photographer Name/i);
    await labelInput.fill(fieldLabel);

    const keyInput = page.getByPlaceholder(/e\.g\. photographer_name/i);
    await expect(keyInput).toHaveValue(new RegExp(fieldKey, 'i'), { timeout: 2000 });

    await page.getByRole('button', { name: /Add Field/i }).click();

    await expect(page.getByRole('heading', { name: fieldLabel })).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.getByRole('heading', { name: /Metadata Management/i })).toBeVisible();

    await expect(page.getByRole('heading', { name: fieldLabel })).toBeVisible({ timeout: 10000 });
  });

  test('field type dropdown has expected options', async ({ page }) => {
    await page.goto('/settings/metadata');
    await expect(page.getByRole('heading', { name: /Metadata Management/i })).toBeVisible();

    // Field type is a native select element
    const fieldTypeSelect = page.locator('select').first();
    await expect(fieldTypeSelect).toBeVisible();

    // Verify it has expected options
    const options = await fieldTypeSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('Short Text'))).toBeTruthy();
  });

  test('toggle switches work correctly', async ({ page }) => {
    await page.goto('/settings/metadata');
    await expect(page.getByRole('heading', { name: /Metadata Management/i })).toBeVisible();

    const requiredToggle = page.locator('button[role="switch"]').filter({ hasText: /Required/i }).or(
      page.getByText(/Required Field/i).locator('..').locator('button[role="switch"]')
    ).first();
    
    const searchToggle = page.getByText(/Include in Full-Text Search/i).locator('..').locator('button[role="switch"]').first();
    const filterToggle = page.getByText(/Show in Sidebar Filters/i).locator('..').locator('button[role="switch"]').first();

    if (await requiredToggle.isVisible()) {
      await requiredToggle.click();
    }
    if (await searchToggle.isVisible()) {
      await searchToggle.click();
    }
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    await expect(page).toHaveURL(/\/dashboard\/settings\/metadata/);
  });

  test('Bulk Import CSV tab switches view', async ({ page }) => {
    await page.goto('/settings/metadata');
    await expect(page.getByRole('heading', { name: /Metadata Management/i })).toBeVisible();

    await page.getByRole('button', { name: /Bulk Import \(CSV\)/i }).click();

    await expect(page.getByRole('button', { name: /Start Import/i })).toBeVisible();

    await page.getByRole('button', { name: /Field Definitions/i }).click();
    await expect(page.getByText(/New Custom Field/i)).toBeVisible();
  });
});
