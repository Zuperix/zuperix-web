import { test, expect, Page } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Global Cleanup — standalone describe so it NEVER runs concurrently with tests
// that create adv_ fields. Run manually: -g "Global Cleanup"
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Advanced Metadata: Global Cleanup', () => {
  test('Global Cleanup: Delete all adv_ fields', async ({ page }) => {
    test.setTimeout(300000);
    await page.goto('/settings/metadata');
    await dismissTransientOverlays(page);
    await page.waitForSelector('h1');

    let deleted = 0;
    for (let i = 0; i < 100; i++) {
      const heading = page.getByRole('heading', { name: /^adv_/ }).first();
      try {
        await heading.waitFor({ state: 'visible', timeout: 2000 });
      } catch {
        break;
      }

      const fieldName = await heading.innerText();
      const card = page.locator('div.group').filter({
        has: page.getByRole('heading', { name: fieldName, exact: true }),
      }).first();

      const deleteResponse = page.waitForResponse(
        (res) => res.url().includes('/metadata/fields/') && res.request().method() === 'DELETE',
      );

      await card.locator('button[title="Delete Field"]').click({ force: true });
      await page.getByRole('dialog').getByRole('button', { name: /Delete Field/i }).click();
      await deleteResponse;
      await expect(card).toBeHidden();
      deleted++;
      console.log(`Global Cleanup: deleted "${fieldName}"`);
    }

    console.log(`Global Cleanup: ${deleted} field(s) total`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Main suite — each test uses a unique prefix, so they're safe to run in parallel
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Advanced Metadata & Complex Types', () => {
  test.describe.configure({ mode: 'serial' });

  let testPrefix: string;
  let assetIdsToCleanup: string[] = [];

  test.beforeEach(async () => {
    testPrefix = `adv_${Math.random().toString(36).substring(2, 7)}`;
    assetIdsToCleanup = [];
  });

  test.afterEach(async ({ page }) => {
    for (const assetId of assetIdsToCleanup) {
      try {
        await page.goto(`/assets/${assetId}`);
        await dismissTransientOverlays(page);
        const deleteBtn = page.locator('button[title="Delete"]').first();
        await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
        const deleteResponse = page.waitForResponse(
          (res) => res.url().includes('/assets/') && res.request().method() === 'DELETE',
        );
        await deleteBtn.click();
        await page.getByRole('button', { name: /Delete permanently/i }).click();
        await deleteResponse;
        console.log(`Cleanup: asset ${assetId} deleted`);
      } catch (e: any) {
        console.error(`Cleanup: asset ${assetId} error — ${e.message}`);
      }
    }

    try {
      await page.goto('/settings/metadata');
      await page.waitForSelector('h1');

      for (let i = 0; i < 15; i++) {
        const heading = page.getByRole('heading', { name: new RegExp(`^${testPrefix}_`) }).first();
        try {
          await heading.waitFor({ state: 'visible', timeout: 2000 });
        } catch {
          break;
        }

        const fieldName = await heading.innerText();
        const card = page.locator('div.group').filter({
          has: page.getByRole('heading', { name: fieldName, exact: true }),
        }).first();

        const deleteResponse = page.waitForResponse(
          (res) => res.url().includes('/metadata/fields/') && res.request().method() === 'DELETE',
        );

        await card.locator('button[title="Delete Field"]').click({ force: true });
        await page.getByRole('dialog').getByRole('button', { name: /Delete Field/i }).click();
        await deleteResponse;
        await expect(card).toBeHidden();
        console.log(`Cleanup: field "${fieldName}" deleted`);
      }
    } catch (e: any) {
      console.error(`Cleanup: field error — ${e.message}`);
    }

    for (const suffix of ['', '_a1', '_a2']) {
      const txt = path.join(__dirname, `test_${testPrefix}${suffix}.txt`);
      if (fs.existsSync(txt)) fs.unlinkSync(txt);
    }
    const csv = path.join(__dirname, `import_${testPrefix}.csv`);
    if (fs.existsSync(csv)) fs.unlinkSync(csv);
  });

  const FIELD_TYPES = [
    { type: 'string',   label: 'Short Text',        value: 'Hello World' },
    { type: 'text',     label: 'Long Text',          value: 'This is a much longer text for testing.' },
    { type: 'integer',  label: 'Number (Integer)',   value: '123' },
    { type: 'float',    label: 'Number (Decimal)',   value: '123.45' },
    { type: 'boolean',  label: 'Checkbox / Toggle',  value: true },
    { type: 'date',     label: 'Date',               value: '2026-05-20' },
    { type: 'datetime', label: 'Date & Time',        value: '2026-05-20T14:30' },
    { type: 'url',      label: 'URL',                value: 'https://zuperix.com' },
    { type: 'email',    label: 'Email',              value: 'test@zuperix.com' },
  ];

  // MetadataFieldInput renders placeholder as lowercase, so match accordingly.
  const getMetadataInput = (page: Page, label: string) =>
    page.getByLabel(label, { exact: true })
      .or(page.getByPlaceholder(`Enter ${label.toLowerCase()}...`))
      .first();

  async function uploadTempAsset(page: Page, fileName: string): Promise<string> {
    await page.goto('/');
    await dismissTransientOverlays(page);
    await page.getByRole('button', { name: /^Upload$/i }).click();
    const uploadModal = page.locator('div.fixed', { has: page.getByRole('heading', { name: /Bulk Upload/i }) });
    await expect(uploadModal).toBeVisible();

    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, 'temp asset content');
    await uploadModal.locator('input[type="file"]').setInputFiles(filePath);
    await expect(uploadModal.getByText(fileName)).toBeVisible();

    const finalizePromise = page.waitForResponse(
      (res) => (res.url().includes('/finalize') || res.url().includes('/complete')) && res.request().method() === 'POST',
    );
    await uploadModal.getByRole('button', { name: /^Upload \d+ file(s)?$/i }).click({ force: true });
    const finalizeRes = await finalizePromise;
    const body = await finalizeRes.json();
    const assetId: string = (body.data || body).id;

    await expect(uploadModal.getByTestId('upload-status-text')).toContainText('1 / 1 complete', { timeout: 30000 });
    await uploadModal.getByRole('button', { name: /Close|Cancel/i }).click();
    await expect(uploadModal).toBeHidden();

    console.log(`Uploaded temp asset: ${assetId} (${fileName})`);
    return assetId;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Test: Asset page renders correct input types per field type
  // Uploads 2 assets so the second hasn't been visited before (clean state),
  // navigates to it, verifies each field's HTML input type, edits & saves.
  // ─────────────────────────────────────────────────────────────────────────────
  test('Asset Page: Metadata fields render correct input types', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/settings/metadata');
    await dismissTransientOverlays(page);

    for (const field of FIELD_TYPES) {
      const uniqueLabel = `${testPrefix}_${field.label}`;
      await page.getByPlaceholder(/e\.g\. Photographer Name/i).fill(uniqueLabel);
      await page.locator('select').first().selectOption({ label: field.label });
      await page.getByRole('button', { name: /Add Field/i }).click();
      await expect(page.getByRole('heading', { name: uniqueLabel })).toBeVisible({ timeout: 15000 });
    }

    const asset1Id = await uploadTempAsset(page, `test_${testPrefix}_a1.txt`);
    assetIdsToCleanup.push(asset1Id);

    const asset2Id = await uploadTempAsset(page, `test_${testPrefix}_a2.txt`);
    assetIdsToCleanup.push(asset2Id);

    await page.goto(`/assets/${asset2Id}`);
    await dismissTransientOverlays(page);
    
    // Guard: Wait for React hydration of metadata section
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Custom Metadata/i)).toBeVisible({ timeout: 20000 });

    // Show empty fields — waitFor ensures the section is rendered before the click
    const showEmptyToggle = page.locator('div').filter({ hasText: /^Show empty$/ }).getByRole('button');
    try {
      await showEmptyToggle.waitFor({ state: 'visible', timeout: 5000 });
      await showEmptyToggle.click();
    } catch { /* fields already visible */ }

    for (const field of FIELD_TYPES) {
      const uniqueLabel = `${testPrefix}_${field.label}`;

      if (field.type === 'boolean') {
        const checkbox = page.getByLabel(uniqueLabel, { exact: true });
        await expect(checkbox).toHaveAttribute('type', 'checkbox');
        await checkbox.check({ force: true });

      } else if (field.type === 'date') {
        const input = page.getByLabel(uniqueLabel, { exact: true });
        await expect(input).toHaveAttribute('type', 'date');
        await input.fill(field.value.toString());

      } else if (field.type === 'datetime') {
        const input = page.getByLabel(uniqueLabel, { exact: true });
        await expect(input).toHaveAttribute('type', 'datetime-local');
        await input.fill(field.value.toString());

      } else if (field.type === 'integer') {
        const input = page.getByLabel(uniqueLabel, { exact: true });
        await expect(input).toHaveAttribute('type', 'number');
        await expect(input).toHaveAttribute('step', '1');
        await input.fill(field.value.toString());

      } else if (field.type === 'float') {
        const input = page.getByLabel(uniqueLabel, { exact: true });
        await expect(input).toHaveAttribute('type', 'number');
        await expect(input).toHaveAttribute('step', '0.01');
        await input.fill(field.value.toString());

      } else if (field.type === 'text') {
        const labelEl = page.getByLabel(uniqueLabel, { exact: true });
        await expect(labelEl).toBeVisible();
        const tagName = await labelEl.evaluate((el: Element) => el.tagName.toLowerCase());
        expect(tagName).toBe('textarea');
        await labelEl.fill(field.value.toString());

      } else if (field.type === 'email') {
        const input = page.getByLabel(uniqueLabel, { exact: true });
        await expect(input).toHaveAttribute('type', 'email');
        await input.fill(field.value.toString());

      } else {
        const input = getMetadataInput(page, uniqueLabel);
        await input.fill(field.value.toString());
      }
    }

    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    const saveResponse = page.waitForResponse(
      (res) => res.url().includes('/metadata') && res.request().method() === 'PUT',
    );
    await saveBtn.click();
    await saveResponse;

    await page.reload();
    await expect(page.getByText(/Custom Metadata/i)).toBeVisible({ timeout: 20000 });
    try {
      await showEmptyToggle.waitFor({ state: 'visible', timeout: 5000 });
      await showEmptyToggle.click();
    } catch { /* already visible */ }

    await expect(getMetadataInput(page, `${testPrefix}_Number (Integer)`)).toHaveValue(/^123(?:\.0+)?$/);
    await expect(getMetadataInput(page, `${testPrefix}_Number (Decimal)`)).toHaveValue(/^123\.45(?:0+)?$/);
    await expect(getMetadataInput(page, `${testPrefix}_Short Text`)).toHaveValue('Hello World');
    await expect(getMetadataInput(page, `${testPrefix}_Email`)).toHaveValue('test@zuperix.com');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test: Full metadata lifecycle — UI creation, upload with pre-set metadata, CSV import
  // ─────────────────────────────────────────────────────────────────────────────
  test('Metadata Full Cycle: Multi-type UI & CSV Import', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('/settings/metadata');
    await dismissTransientOverlays(page);

    for (const field of FIELD_TYPES) {
      const uniqueLabel = `${testPrefix}_${field.label}`;
      await page.getByPlaceholder(/e\.g\. Photographer Name/i).fill(uniqueLabel);
      await page.locator('select').first().selectOption({ label: field.label });
      await page.getByRole('button', { name: /Add Field/i }).click();
      await expect(page.getByRole('heading', { name: uniqueLabel })).toBeVisible({ timeout: 15000 });
    }

    await page.goto('/');
    await dismissTransientOverlays(page);
    await page.getByRole('button', { name: /^Upload$/i }).click();
    const uploadModal = page.locator('div.fixed', { has: page.getByRole('heading', { name: /Bulk Upload/i }) });
    await expect(uploadModal).toBeVisible();

    const testFileName = `test_${testPrefix}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, 'metadata test file content');

    await uploadModal.locator('input[type="file"]').setInputFiles(testFilePath);
    await expect(uploadModal.getByText(testFileName)).toBeVisible();
    await page.getByRole('button', { name: /Initial Metadata/i }).click();

    // metadataFields loaded async — wait for the first field before filling
    const firstFieldLabel = `${testPrefix}_${FIELD_TYPES[0].label}`;
    await expect(page.getByLabel(firstFieldLabel, { exact: true })).toBeVisible({ timeout: 15000 });

    for (const field of FIELD_TYPES) {
      const uniqueLabel = `${testPrefix}_${field.label}`;
      const locator = getMetadataInput(page, uniqueLabel);
      if (field.type === 'boolean') {
        if (field.value) await locator.check({ force: true });
        else await locator.uncheck({ force: true });
      } else {
        await locator.fill(field.value.toString());
      }
    }

    const uploadButton = uploadModal.getByRole('button', { name: /^Upload \d+ file(s)?$/i });
    await expect(uploadButton).toBeEnabled();

    const finalizePromise = page.waitForResponse(
      (res) => (res.url().includes('/finalize') || res.url().includes('/complete')) && res.request().method() === 'POST',
    );
    await uploadButton.click({ force: true });

    const finalizeRes = await finalizePromise;
    const finalizeBody = await finalizeRes.json();
    const capturedId: string = (finalizeBody.data || finalizeBody).id;
    assetIdsToCleanup.push(capturedId);
    console.log(`Captured asset ID: ${capturedId}`);

    await expect(uploadModal.getByTestId('upload-status-text')).toContainText('1 / 1 complete', { timeout: 45000 });
    await uploadModal.getByRole('button', { name: /Close|Cancel/i }).click();
    await expect(uploadModal).toBeHidden();

    await page.goto('/');
    await dismissTransientOverlays(page);
    await page.waitForSelector('[data-asset-id]', { state: 'visible', timeout: 20000 });

    const assetCard = page.locator('[data-asset-id]', { hasText: testFileName }).first();
    await expect(assetCard).toBeVisible({ timeout: 30000 });
    await assetCard.click();
    await expect(page).toHaveURL(/\/assets\/[0-9a-f-]+/i, { timeout: 30000 });

    const assetId = page.url().split('/assets/')[1]?.split(/[?#]/)[0];
    expect(assetId).toBeTruthy();
    if (assetId && !assetIdsToCleanup.includes(assetId)) assetIdsToCleanup.push(assetId);

    // Guard: Wait for React hydration of metadata section
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Custom Metadata/i)).toBeVisible({ timeout: 30000 });
    const showEmptyToggle = page.locator('div').filter({ hasText: /^Show empty$/ }).getByRole('button');

    for (const field of FIELD_TYPES) {
      const uniqueLabel = `${testPrefix}_${field.label}`;
      const locator = getMetadataInput(page, uniqueLabel);
      if (!(await locator.isVisible())) {
        try {
          await showEmptyToggle.waitFor({ state: 'visible', timeout: 3000 });
          await showEmptyToggle.click();
        } catch { /* already visible */ }
      }

      if (field.type === 'boolean') {
        await expect(page.getByText(uniqueLabel, { exact: true })).toBeVisible({ timeout: 30000 });
      } else if (field.type === 'integer') {
        await expect(locator).toHaveValue(/^123(?:\.0+)?$/, { timeout: 30000 });
      } else if (field.type === 'float') {
        await expect(locator).toHaveValue(/^123\.45(?:0+)?$/, { timeout: 30000 });
      } else if (field.type === 'date') {
        await expect(locator).toHaveValue(/^2026-05-20(?:T.*)?$/, { timeout: 30000 });
      } else if (field.type === 'datetime') {
        await expect(locator).toHaveValue(/^2026-05-20T/, { timeout: 30000 });
      } else {
        await expect(locator).toHaveValue(field.value.toString(), { timeout: 30000 });
      }
    }

    const csvValues = FIELD_TYPES.map(f => {
      if (f.type === 'boolean') return 'false';
      if (f.type === 'integer') return '999';
      if (f.type === 'float') return '999.99';
      if (f.type === 'date') return '2026-06-01';
      if (f.type === 'datetime') return '2026-06-01T12:00:00.000Z';
      return `New_${f.value}`;
    });

    const headers = ['asset_id', ...FIELD_TYPES.map(f => `${testPrefix}_${f.label}`.toLowerCase().replace(/[^a-z0-9]/g, '_'))];
    const csvContent = [headers.join(','), [assetId, ...csvValues].join(',')].join('\n');
    const csvPath = path.join(__dirname, `import_${testPrefix}.csv`);
    fs.writeFileSync(csvPath, csvContent);

    await page.goto('/settings/metadata');
    await page.getByRole('button', { name: /Bulk Import \(CSV\)/i }).click();
    await page.locator('input[type="file"][accept=".csv"]').setInputFiles(csvPath);
    await expect(page.getByRole('button', { name: /Start Import/i })).toBeEnabled();
    await page.getByRole('button', { name: /Start Import/i }).click();
    await expect(page.getByText(/Bulk Import Started/i).first()).toBeVisible();

    await expect(async () => {
      await page.goto(`/assets/${assetId}`);
      await expect(page.getByText(/Custom Metadata/i)).toBeVisible({ timeout: 10000 });
      const intInput = getMetadataInput(page, `${testPrefix}_Number (Integer)`);
      await expect(intInput).toHaveValue(/^999(?:\.0+)?$/, { timeout: 5000 });
    }).toPass({ intervals: [2000, 5000, 10000], timeout: 60000 });
  });
});
