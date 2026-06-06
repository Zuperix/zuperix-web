import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authDir = path.join(__dirname, '../.auth');
const authFile = path.join(authDir, 'user.json');

const email = process.env.PLAYWRIGHT_TEST_EMAIL;
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

if (!email || !password) {
  throw new Error('Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD in environment.');
}

setup('authenticate', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  await page.goto('/login');
  
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();

  await page.waitForTimeout(2000);

  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible({ timeout: 15000 });

  // Ensure "Main Workspace" is selected as the active workspace for all subsequent tests
  const switcherButton = page.locator('button').filter({ hasText: /Workspace/i }).first();
  
  // If the switcher button is not visible, the sidebar is collapsed.
  // Click the "Toggle sidebar" hamburger button to expand it.
  const isSwitcherVisible = await switcherButton.isVisible();
  if (!isSwitcherVisible) {
    const toggleSidebarBtn = page.getByRole('button', { name: /Toggle sidebar/i });
    if (await toggleSidebarBtn.isVisible()) {
      await toggleSidebarBtn.click();
      await page.waitForTimeout(500); // Wait for expand transition
    }
  }

  await expect(switcherButton).toBeVisible({ timeout: 10000 });
  const buttonText = await switcherButton.textContent();
  if (buttonText && !buttonText.includes('Main Workspace')) {
    await switcherButton.click();
    const mainWorkspaceOption = page.locator('div.absolute button').filter({ hasText: 'Main Workspace' }).first();
    await mainWorkspaceOption.scrollIntoViewIfNeeded();
    await expect(mainWorkspaceOption).toBeVisible({ timeout: 5000 });
    await mainWorkspaceOption.click();
    await page.waitForTimeout(1500); // Wait for the switch to apply and save to localStorage
  }

  await page.context().storageState({ path: authFile });
});
