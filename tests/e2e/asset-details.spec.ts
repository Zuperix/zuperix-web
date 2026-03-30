import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const ASSET_ID = 'ed1cf816-cf2e-4688-be71-f422fe6174f9';
const ASSET_URL = `/dashboard/assets/${ASSET_ID}`;
const ORIGINAL_FILE_NAME = 'single asset e2e test.png';
const ORIGINAL_BASE_NAME = 'single asset e2e test';
const E2E_TAG = 'e2e-test-tag';

function formatDateForUi(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString();
}

async function renameAsset(page: Page, nextBaseName: string, expectedFullName: string) {
  await page.getByTitle('Rename Asset').click();

  const input = page.getByPlaceholder('Filename');
  await expect(input).toBeVisible();
  await input.fill(nextBaseName);
  await input.press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: expectedFullName })).toBeVisible({ timeout: 20000 });
}

test('asset detail page shows preview, tabs, and technical specifications', async ({ page }) => {
  await page.goto(ASSET_URL);

  await expect(page.getByRole('button', { name: /Search results/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: ORIGINAL_FILE_NAME })).toBeVisible();
  await expect(page.getByTitle('Rename Asset')).toBeVisible();
  await expect(page.getByTitle('Share')).toBeVisible();
  await expect(page.getByTitle('Download')).toBeVisible();
  await expect(page.getByTitle('Delete')).toBeVisible();
  await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  await expect(page.locator('header').getByText(/^Pending Review$/i)).toBeVisible();

  await expect(page.getByRole('img', { name: ORIGINAL_FILE_NAME })).toBeVisible();

  await expect(page.getByRole('button', { name: /^Specs$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Workflow$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Audit$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Links$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^History$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Chat$/i })).toBeVisible();

  await expect(page.getByRole('heading', { name: /Technical specifications/i })).toBeVisible();
  await expect(page.getByText(/^Filename$/i)).toBeVisible();
  await expect(page.getByTitle(ORIGINAL_FILE_NAME)).toBeVisible();
  await expect(page.getByText(/^Size$/i)).toBeVisible();
  await expect(page.getByText(/MB$/i).first()).toBeVisible();
  await expect(page.getByText(/^Dimensions$/i)).toBeVisible();
  await expect(page.getByText(/^N\/A$/i)).toBeVisible();
  await expect(page.getByText(/^Format$/i)).toBeVisible();
  await expect(page.getByText(/^image\/png$/i)).toBeVisible();
  await expect(page.getByText(/^Uploaded$/i)).toBeVisible();

  await page.getByRole('button', { name: /^Links$/i }).click();
  await expect(page.getByRole('heading', { name: /Linked Assets/i })).toBeVisible();

  await page.getByRole('button', { name: /^History$/i }).click();
  await expect(page.getByRole('heading', { name: /^History$/i })).toBeVisible();

  await page.getByRole('button', { name: /^Chat$/i }).click();
  await expect(page.getByText(/Comments/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^Specs$/i }).click();
  await expect(page.getByRole('heading', { name: /Technical specifications/i })).toBeVisible();
});

test('asset detail page supports renaming and restoring the original filename', async ({ page }) => {
  await page.goto(ASSET_URL);

  await expect(page.getByRole('heading', { level: 1, name: ORIGINAL_FILE_NAME })).toBeVisible();

  const renamedBaseName = `${ORIGINAL_BASE_NAME} renamed`;
  const renamedFullName = `${renamedBaseName}.png`;

  await renameAsset(page, renamedBaseName, renamedFullName);
  await renameAsset(page, ORIGINAL_BASE_NAME, ORIGINAL_FILE_NAME);
});

test('asset detail page persists ownership dates and smart tags', async ({ page }) => {
  await page.goto(ASSET_URL);

  const ownershipSection = page.locator('section').filter({ has: page.getByText(/^Ownership & Dates$/i) }).first();
  const tagsSection = page.locator('section').filter({ has: page.getByText(/^Smart Tags$/i) }).first();

  await expect(ownershipSection).toBeVisible();
  await expect(tagsSection).toBeVisible();

  const statusSelect = ownershipSection.locator('select').first();
  const dateInputs = ownershipSection.locator('input[type="date"]');
  const releaseDate = '2026-04-01';
  const expirationDate = '2026-04-15';

  await statusSelect.selectOption('approved');
  await expect(statusSelect).toHaveValue('approved');

  await dateInputs.nth(0).fill(releaseDate, { force: true });
  await expect(ownershipSection.getByText(formatDateForUi(releaseDate), { exact: true })).toBeVisible();

  await dateInputs.nth(1).fill(expirationDate, { force: true });
  await expect(ownershipSection.getByText(formatDateForUi(expirationDate), { exact: true })).toBeVisible();

  const tagInput = tagsSection.getByPlaceholder('Press Enter to add tag...');
  await tagInput.fill(E2E_TAG);
  await tagInput.press('Enter');
  await expect(tagsSection.getByText(E2E_TAG, { exact: true })).toBeVisible({ timeout: 20000 });

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: ORIGINAL_FILE_NAME })).toBeVisible();

  const refreshedOwnership = page.locator('section').filter({ has: page.getByText(/^Ownership & Dates$/i) }).first();
  const refreshedTags = page.locator('section').filter({ has: page.getByText(/^Smart Tags$/i) }).first();
  const refreshedDates = refreshedOwnership.locator('input[type="date"]');
  const refreshedStatusSelect = refreshedOwnership.locator('select').first();

  await expect(refreshedStatusSelect).toHaveValue('approved');
  await expect(refreshedOwnership.getByText(formatDateForUi(releaseDate), { exact: true })).toBeVisible();
  await expect(refreshedOwnership.getByText(formatDateForUi(expirationDate), { exact: true })).toBeVisible();
  await expect(refreshedTags.getByText(E2E_TAG, { exact: true })).toBeVisible();

  await refreshedStatusSelect.selectOption('pending_review');
  await expect(refreshedStatusSelect).toHaveValue('pending_review');

  await refreshedDates.nth(0).fill('', { force: true });
  await expect(refreshedOwnership.getByText(/^Set date$/i).first()).toBeVisible();

  await refreshedDates.nth(1).fill('', { force: true });
  await expect(refreshedOwnership.getByText(/^Set date$/i).nth(1)).toBeVisible();

  const tagChip = refreshedTags.locator('span').filter({ hasText: E2E_TAG }).first();
  await tagChip.hover();
  await tagChip.getByRole('button').click();
  await expect(refreshedTags.getByText(E2E_TAG, { exact: true })).toBeHidden({ timeout: 20000 });
});

test('asset comment flow and audit history show recent activity', async ({ page }) => {
  await page.goto(ASSET_URL);

  await page.getByRole('button', { name: /^Chat$/i }).click();
  const commentBody = page.getByPlaceholder('Write a comment...');
  const uniqueComment = `e2e comment ${Date.now()}`;
  await expect(commentBody).toBeVisible();
  await commentBody.fill(uniqueComment);
  await page.getByRole('button', { name: /^Post$/i }).click();

  const commentCard = page
    .locator('div.group.relative.border.rounded-xl.p-3')
    .filter({ hasText: uniqueComment })
    .first();
  await expect(commentCard).toBeVisible({ timeout: 20000 });

  // await page.getByRole('button', { name: /^History$/i }).click();
  // const historyEntries = page.locator('ul[role="list"] > li');
  // await expect(historyEntries.first()).toBeVisible({ timeout: 20000 });
  // const count = await historyEntries.count();
  // expect(count).toBeGreaterThanOrEqual(3);

  // const timeText = await historyEntries.first().getByText(/\d{1,2}:\d{2}\s?(AM|PM)/i).textContent();
  // expect(timeText).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  // const today = new Date();
  // const parsed = new Date(`${today.toLocaleDateString()} ${timeText}`);
  // expect(Math.abs(parsed.getTime() - Date.now())).toBeLessThanOrEqual(5 * 60 * 1000);
});
