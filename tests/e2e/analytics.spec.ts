import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

function parseNumber(text: string) {
  return Number(text.replace(/[^0-9.]/g, ''));
}

test('analytics page shows system metrics and recent activity', async ({ page }) => {
  await page.goto('/admin/analytics');

  await expect(page.getByRole('heading', { name: /System Analytics/i })).toBeVisible();
  await expect(page.getByText(/Real-time performance and system growth metrics/i)).toBeVisible();
  await expect(page.getByText(/Last 30 Days/i)).toBeVisible();

  const kpiValues = page.locator('div.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4.gap-6 h3');
  await expect(kpiValues).toHaveCount(4);

  const totalStorage = parseNumber((await kpiValues.nth(0).textContent()) ?? '');
  const totalAssets = parseNumber((await kpiValues.nth(1).textContent()) ?? '');
  const totalUsers = parseNumber((await kpiValues.nth(2).textContent()) ?? '');
  const activeUsers = parseNumber((await kpiValues.nth(3).textContent()) ?? '');

  expect(totalStorage).toBeGreaterThanOrEqual(50);
  expect(totalStorage).toBeLessThanOrEqual(200);
  expect(totalAssets).toBeGreaterThan(50);
  expect(totalUsers).toBeGreaterThanOrEqual(1);
  expect(totalUsers).toBeLessThanOrEqual(10);
  expect(activeUsers).toBeGreaterThanOrEqual(1);
  expect(activeUsers).toBeLessThanOrEqual(5);

  await expect(page.getByRole('heading', { name: /System Performance/i })).toBeVisible();
  await expect(page.getByText(/Asset views and downloads over the last 30 days/i)).toBeVisible();
  await expect(page.getByText(/^Views$/i)).toBeVisible();
  await expect(page.getByText(/^Downloads$/i)).toBeVisible();

  await expect(page.getByRole('heading', { name: /Recent Work Activity/i })).toBeVisible();
  await expect(page.getByText(/Latest user login sessions/i)).toBeVisible();

  // const activityLinks = page.locator('a[href="/admin/users"]');
  // await expect(activityLinks.first()).toBeVisible();
  // expect(await activityLinks.count()).toBeGreaterThan(0);

  // const firstActivity = activityLinks.first();
  // await expect(firstActivity.getByText(/Test User/i)).toBeVisible();
  // await expect(firstActivity.getByText(/@/i)).toBeVisible();
  // await expect(firstActivity.locator('text=/^\\d{1,2}:\\d{2}$/').first()).toBeVisible();

  await expect(page.getByRole('heading', { name: /Most Popular Assets/i })).toBeVisible();
  await expect(page.getByText(/Assets with highest engagement across the system/i)).toBeVisible();
});
