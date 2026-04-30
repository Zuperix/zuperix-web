import { test, expect } from '@playwright/test';
import { dismissTransientOverlays } from './helpers';

test.describe('Asset Transcription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Assets/i }).first()).toBeVisible();
  });

  test('should display transcript and support content search', async ({ page }) => {
    await dismissTransientOverlays(page);

    // 1. Search for the video asset
    const searchInput = page.getByPlaceholder(/Search assets, metadata, tags/i);
    await searchInput.fill('ai transcipt demo.mp4');
    await searchInput.press('Enter');

    await expect(page.locator('p', { hasText: /Showing/i }).first()).toBeVisible();
    
    const assetCard = page.getByRole('heading', { name: /ai transci?pt demo\.mp4/i }).first();
    await assetCard.click();

    await expect(page.getByRole('heading', { level: 1, name: /ai transci?pt demo\.mp4/i })).toBeVisible({ timeout: 15000 });

    // 3. Open Transcript Tab
    const transcriptTab = page.getByRole('button', { name: 'Transcript' });
    await expect(transcriptTab).toBeVisible();
    await transcriptTab.click();

    // 4. Verify Transcript Visibility
    // The transcript segments have a specific structure, let's look for timestamps
    const firstSegment = page.locator('div.flex.items-start.gap-4').first();
    await expect(firstSegment).toBeVisible({ timeout: 15000 });
    await expect(firstSegment).toContainText(/\d{1,2}:\d{2}/); // Matches timestamp pattern like 0:00

    // 5. Test Search in Transcript
    const transcriptSearchInput = page.getByPlaceholder('Search in transcript...');
    await expect(transcriptSearchInput).toBeVisible();

    // Pick a word that is likely in the transcript based on the screenshot ("productivity")
    const searchWord = 'productivity';
    await transcriptSearchInput.fill(searchWord);

    // Verify highlighting (segments with yellow background)
    const highlightedSegment = page.locator('mark.bg-yellow-300, mark.dark\\:bg-yellow-600').first();
    await expect(highlightedSegment).toBeVisible();
    await expect(highlightedSegment).toContainText(new RegExp(searchWord, 'i'));

    // Verify match count
    const searchContainer = page.locator('div.relative.flex-1.group');
    const matchCount = searchContainer.locator('span').filter({ hasText: /\d+\/\d+/ });
    await expect(matchCount).toBeVisible();
    await expect(matchCount).toContainText(/\d+\/\d+/);

    // 6. Test Navigation between matches
    const nextMatchBtn = searchContainer.locator('button:has(svg)').nth(1); // Second small button in search header is 'Next'
    const prevMatchBtn = searchContainer.locator('button:has(svg)').nth(0); // First small button is 'Prev'
    
    await nextMatchBtn.click();
    
    // After clicking next, the match count should update (e.g., from 1/X to 2/X)
    // If there is only 1 match, it will stay 1/1
    const matchText = await matchCount.textContent();
    const [current, total] = (matchText || '').split('/').map(Number);
    
    if (total > 1) {
      await expect(matchCount).toContainText(/2\/\d+/);
      await prevMatchBtn.click();
      await expect(matchCount).toContainText(/1\/\d+/);
    }

    // 7. Test clearing search
    const clearSearchBtn = searchContainer.locator('button:has(svg.h-4.w-4)');
    await clearSearchBtn.click();
    
    // expect().toHaveValue() will retry until the state update is reflected in the DOM
    await expect(transcriptSearchInput).toHaveValue('', { timeout: 7000 });
    await expect(highlightedSegment).not.toBeVisible();
  });
});
