import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');
  
  // Fill in working credentials
  await page.getByPlaceholder('admin@acme.com').fill('unique-email-1234@example.com');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByRole('button', { name: /Sign In/i }).click();

  // Wait for dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Wait for initial load
  await page.waitForTimeout(2000);

  // Check if "No workspace" message is present
  const noWorkspace = await page.getByText(/Please select or create a workspace/i).isVisible();
  
  if (noWorkspace) {
    // Click workspace switcher in sidebar
    // We can target the button with the placeholder text or icon
    // It's a button inside the Aside/Sidebar
    await page.getByRole('button', { name: /No workspace/i }).or(page.locator('aside button').first()).click();
    
    // Wait for dropdown and select the first workspace
    await page.getByRole('button', { name: /unique company/i }).click();
    
    // Wait for redirect/load
    await expect(page.getByText(/Assets/i)).toBeVisible();
  }

  // Save storage state
  await page.context().storageState({ path: authFile });
});
