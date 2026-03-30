import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const portalName = `e2e test portal ${Date.now()}`;
const portalSlug = `e2e-test-portal-${Date.now()}`;

test('portals page loads and shows UI elements', async ({ page }) => {
  await page.goto('/dashboard/portals');

  await expect(page.getByRole('heading', { name: /Public Portals/i })).toBeVisible();
  await expect(page.getByText(/Create and manage public access portals for your assets/i)).toBeVisible();
  await expect(page.getByPlaceholder('Search portals...')).toBeVisible();
  await expect(page.getByRole('button', { name: /New Portal/i })).toBeVisible();
});

test('create portal form opens and has expected fields', async ({ page }) => {
  await page.goto('/dashboard/portals');
  await expect(page.getByRole('heading', { name: /Public Portals/i })).toBeVisible();

  await page.getByRole('button', { name: /New Portal/i }).click();

  await expect(page.getByRole('heading', { name: /Create New Portal/i })).toBeVisible();
  await expect(page.getByPlaceholder('Marketing Campaign 2026')).toBeVisible();
  await expect(page.getByPlaceholder('marketing-2026')).toBeVisible();
  await expect(page.getByPlaceholder('What is this portal for? Who is it for?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Create Portal/i }).last()).toBeVisible();

  const formHeader = page.getByRole('heading', { name: /Create New Portal/i });
  await formHeader.locator('..').locator('button').click();
  await expect(page.getByRole('heading', { name: /Create New Portal/i })).toBeHidden();
});

test('create portal with timestamped name', async ({ page }) => {
  await page.goto('/dashboard/portals');
  await expect(page.getByRole('heading', { name: /Public Portals/i })).toBeVisible();

  await page.getByRole('button', { name: /New Portal/i }).click();
  await expect(page.getByRole('heading', { name: /Create New Portal/i })).toBeVisible();

  await page.getByPlaceholder('Marketing Campaign 2026').fill(portalName);
  await page.getByPlaceholder('marketing-2026').clear();
  await page.getByPlaceholder('marketing-2026').fill(portalSlug);
  await page.getByPlaceholder('What is this portal for? Who is it for?').fill('E2E test portal description');

  await page.locator('button').filter({ hasText: /^Create Portal$/i }).last().click();

  await expect(page.getByText(/Portal created successfully/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: portalName })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(`/p/${portalSlug}`)).toBeVisible();
});

test('navigate to portal detail page via Assets button', async ({ page }) => {
  await page.goto('/dashboard/portals');
  await expect(page.getByRole('heading', { name: /Public Portals/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: portalName })).toBeVisible({ timeout: 10000 });

  const slugText = `/p/${portalSlug}`;
  const portalCard = page.locator('.group.flex.flex-col').filter({ hasText: slugText });
  await portalCard.getByRole('button', { name: /Assets/i }).click();

  await expect(page.getByRole('heading', { name: portalName })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(slugText)).toBeVisible();
  await expect(page.getByText(/Back to Portals/i)).toBeVisible();
});

test('portal detail page has Page Builder and Raw Assets tabs', async ({ page }) => {
  await page.goto('/dashboard/portals');
  
  const slugText = `/p/${portalSlug}`;
  const portalCard = page.locator('.group.flex.flex-col').filter({ hasText: slugText });
  await expect(portalCard).toBeVisible({ timeout: 10000 });
  await portalCard.getByRole('button', { name: /Assets/i }).click();

  await expect(page.getByRole('button', { name: /Page Builder/i })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /Raw Assets/i })).toBeVisible();

  const pageBuilderTab = page.getByRole('button', { name: /Page Builder/i });
  await expect(pageBuilderTab).toHaveClass(/text-blue-500/);
  await expect(page.getByRole('button', { name: /Save Layout/i })).toBeVisible();

  await page.getByRole('button', { name: /Raw Assets/i }).click();
  await expect(page.getByText(/Included Assets/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Manage shared content/i)).toBeVisible();
});

test('search and add 3 assets to portal', async ({ page }) => {
  await page.goto('/dashboard/portals');
  
  const slugText = `/p/${portalSlug}`;
  const portalCard = page.locator('.group.flex.flex-col').filter({ hasText: slugText });
  await expect(portalCard).toBeVisible({ timeout: 10000 });
  await portalCard.getByRole('button', { name: /Assets/i }).click();

  await expect(page.getByRole('button', { name: /Add Assets/i })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Add Assets/i }).click();
  
  await expect(page.getByRole('heading', { name: /Add Assets from Library/i })).toBeVisible({ timeout: 5000 });

  await page.getByPlaceholder('Search your library...').fill('test');
  await page.getByPlaceholder('Search your library...').press('Enter');

  await expect(page.getByRole('button', { name: /Add to Portal/i }).first()).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /Add to Portal/i }).first().click();
  await expect(page.getByText(/Asset added to portal/i).first()).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /Add to Portal/i }).first().click();
  await expect(page.getByText(/Asset added to portal/i).first()).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /Add to Portal/i }).first().click();
  await expect(page.getByText(/Asset added to portal/i).first()).toBeVisible({ timeout: 10000 });

  const drawerHeader = page.getByRole('heading', { name: /Add Assets from Library/i });
  await drawerHeader.locator('..').locator('button').click();
  await expect(page.getByRole('heading', { name: /Add Assets from Library/i })).toBeHidden();
});

test('delete created portal (cleanup)', async ({ page }) => {
  await page.goto('/dashboard/portals');
  await expect(page.getByRole('heading', { name: /Public Portals/i })).toBeVisible();

  const slugText = `/p/${portalSlug}`;
  const portalCard = page.locator('.group.flex.flex-col').filter({ hasText: slugText });
  await expect(portalCard).toBeVisible({ timeout: 10000 });

  await portalCard.hover();
  const deleteButton = portalCard.locator('button').filter({ has: page.locator('svg') }).first();
  await deleteButton.click();

  await expect(page.getByText(/Are you sure you want to delete/i)).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Delete/i }).click();

  await expect(page.getByText(/Portal deleted successfully/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: portalName })).toBeHidden({ timeout: 10000 });
});
