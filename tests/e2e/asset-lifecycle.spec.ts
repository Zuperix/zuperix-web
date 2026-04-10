import { test, expect } from '@playwright/test';
import fs from 'fs';
import { expectShowingPattern, dismissTransientOverlays } from './helpers';

test.describe.configure({ mode: 'serial' });

test('upload and delete asset (cleanup)', async ({ page }, testInfo) => {
  await page.goto('');
  await dismissTransientOverlays(page);

  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  const fileName = `e2e-upload-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  const filePath = testInfo.outputPath(fileName);
  fs.writeFileSync(filePath, 'e2e upload test');

  await page.getByRole('button', { name: /^Upload$/i }).click();
  const modalHeader = page.getByText('Bulk Upload');
  await expect(modalHeader).toBeVisible();
  const modal = page.locator('div.fixed', { has: page.getByRole('heading', { name: /Bulk Upload/i }) });
  await expect(modal).toBeVisible();

  await modal.locator('input[type="file"]').setInputFiles(filePath);
  await expect(modal.getByText(fileName)).toBeVisible({ timeout: 10000 });

  await modal.getByRole('button', { name: /^Upload \d+ file(s)?$/i }).click({ force: true });
  await expect(modal.getByText(/1\s*\/\s*1 complete/i)).toBeVisible({ timeout: 20000 });

  await modal.getByRole('button', { name: /Close|Cancel/i }).click();
  await expect(modal).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();


  await expectShowingPattern(page);

  const assetTitle = page.getByRole('heading', { level: 3 }).first();
  await expect(assetTitle).toHaveText(/^e2e-upload-/i, { timeout: 20000 });
  const card = assetTitle.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")][1]');

  await card.getByRole('button', { name: /Delete/i }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Delete permanently/i }).click();

  await page.reload();
  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();
  await expectShowingPattern(page);

});
