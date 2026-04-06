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

  // Navigate to login
  await page.goto('/login');
  
  await page.getByPlaceholder('admin@acme.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();

  await expect(page).toHaveURL(/\/$/);
  
  await page.waitForTimeout(2000);

  await expect(page.getByRole('heading', { name: /Assets/i })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
