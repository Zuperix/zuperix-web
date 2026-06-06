import { test, expect } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';

const runKey = `e2e-wf-${Math.random().toString(36).substring(2, 7)}`;

test.describe('Workflow Template Builder E2E Tests', () => {
  test.describe('Workflow Builder Actions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings/workflows');
      await dismissTransientOverlays(page);
      await expect(page.getByRole('heading', { name: /^Workflow Management$/i })).toBeVisible();
    });

    test('should build and configure a complete approval pipeline with trigger conditions', async ({ page }) => {
      await page.getByRole('button', { name: /Create Template/i }).first().click();
      await expect(page.locator('text=New Workflow Template')).toBeVisible();

      await page.fill('input[placeholder="e.g. Legal & Marketing Review"]', `Marketing Approval Pipeline - ${runKey}`);
      await page.fill('textarea[placeholder="Detail the purpose of this workflow..."]', 'E2E automated testing pipeline template.');
      await page.locator('form button[type="submit"]').click();

      await expect(page.locator('text=Workflow template created')).toBeVisible();

      const wfHeader = page.locator(`h3:has-text("Marketing Approval Pipeline - ${runKey}")`);
      await expect(wfHeader).toBeVisible();
      await wfHeader.click();

      await page.getByRole('button', { name: /Add Condition Rule/i }).click();

      const factorSelect = page.locator('select').filter({ hasText: 'File Size' }).first();
      await expect(factorSelect).toBeVisible();
      await factorSelect.selectOption('mime_type');

      const mimeSelect = page.locator('select').filter({ hasText: 'Select Media Type...' }).first();
      await expect(mimeSelect).toBeVisible();
      await mimeSelect.selectOption('image/png');

      await page.getByRole('button', { name: /Add New Step/i }).click();

      await expect(page.locator('select').filter({ hasText: 'PNG Image' }).first()).toBeVisible();

      const stageInput = page.locator('input[placeholder="Enter stage name..."]').first();
      await expect(stageInput).toBeVisible();
      await stageInput.fill('E2E Stage 1 - Marketing Review');

      const roleSelect = page.locator('select').filter({ hasText: 'Select Role' }).first();
      await expect(roleSelect).toBeVisible();
      await roleSelect.selectOption({ index: 1 });

      await page.getByRole('button', { name: /Save All Changes/i }).click();
      await expect(page.locator('text=All changes saved successfully')).toBeVisible();

      await page.reload();
      await dismissTransientOverlays(page);
      await expect(page.getByRole('heading', { name: /^Workflow Management$/i })).toBeVisible();

      const savedWfHeader = page.locator(`h3:has-text("Marketing Approval Pipeline - ${runKey}")`);
      await savedWfHeader.click();

      await expect(page.locator('select').filter({ hasText: 'PNG Image' }).first()).toBeVisible();
      await expect(page.locator('input[value="E2E Stage 1 - Marketing Review"]').first()).toBeVisible();
    });
  });

  test.describe('Teardown Flow', () => {
    test('should clean up generated E2E workflow templates', async ({ page }) => {
      await page.goto('/settings/workflows');
      await dismissTransientOverlays(page);

      const e2eHeaders = page.locator('h3:has-text("Marketing Approval Pipeline - e2e-wf-")');
      
      await expect(async () => {
        const count = await e2eHeaders.count();
        if (count > 0) {
          const firstHeader = e2eHeaders.first();
          const templateItem = page.locator('div.group.bg-gray-900\\/40').filter({ has: firstHeader });
          
          const deleteButton = templateItem.locator('button').first();
          await expect(deleteButton).toBeVisible();
          await deleteButton.click();

          const confirmButton = page.getByRole('button', { name: /^Delete permanently$/i });
          await expect(confirmButton).toBeVisible();
          await confirmButton.click();

          await expect(page.locator('text=Workflow template deleted successfully')).toBeVisible();
          throw new Error('Continuing E2E templates cleanup loop...');
        }
      }).toPass({ timeout: 25000, intervals: [1000] }).catch(() => {});
    });
  });
});
