import { test, expect } from '@playwright/test';
import { expectImageToLoad } from './helpers';

const IMAGE_ASSET_ID = '4c3daa17-58ba-44cb-b959-0df308eee4f4'; // img_687.jpg
const PDF_ASSET_ID = 'bfceb165-73a2-4e36-bafc-f14cbe4fbd1a';   // sample.pdf
const THREE_D_ASSET_ID = 'ea4cab64-ab65-458b-8db1-8e6ed998fae5'; // Astronaut.glb

test.describe('Asset Previews', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Assets/i }).first()).toBeVisible();
  });

  test('grid view shows loaded image previews', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search assets/i);
    await searchInput.fill('img_687');
    await searchInput.press('Enter');

    const assetCard = page.locator(`[data-asset-id="${IMAGE_ASSET_ID}"]`);
    await expect(assetCard).toBeVisible({ timeout: 20000 });

    await expectImageToLoad(page, `[data-asset-id="${IMAGE_ASSET_ID}"] img`);
  });

  test('asset detail page shows large image preview', async ({ page }) => {
    await page.goto(`/assets/${IMAGE_ASSET_ID}`);

    await expectImageToLoad(page, 'main img[alt="img_687.jpg"]');
  });

  test('asset detail page shows PDF preview', async ({ page }) => {
    await page.goto(`/assets/${PDF_ASSET_ID}`);

    // PdfPreview uses an iframe or similar, let's check for the canvas/iframe
    // Based on page.tsx, it renders PdfPreview component
    const pdfPreview = page.locator('canvas').or(page.locator('iframe')).first();
    await expect(pdfPreview).toBeVisible({ timeout: 15000 });
  });

  test('asset detail page shows 3D preview', async ({ page }) => {
    await page.goto(`/assets/${THREE_D_ASSET_ID}`);

    const threeDPreview = page.locator('model-viewer').or(page.locator('canvas')).first();
    await expect(threeDPreview).toBeVisible({ timeout: 15000 });
  });

  test('similar assets show previews on detail page', async ({ page }) => {
    await page.goto(`/assets/${IMAGE_ASSET_ID}`);

    const similarSection = page.getByRole('heading', { name: /Discovery/i });
    // Similarity might take time to compute/load, let's wait a bit
    await expect(similarSection).toBeVisible({ timeout: 20000 });
    await similarSection.scrollIntoViewIfNeeded();

    // Check if we have at least one similar asset card
    const similarCard = page.locator('section:has-text("Discovery") a[href^="/assets/"]').first();
    await expect(similarCard).toBeVisible({ timeout: 15000 });

    // If it's an image, verify it loads. Otherwise verify the icon shows.
    const similarImage = similarCard.locator('img').first();
    const isImage = await similarImage.isVisible();

    if (isImage) {
      // Use a unique selector for the first image
      await expectImageToLoad(page, 'section:has-text("Discovery") img >> nth=0');
    } else {
      // Should show a file-type icon
      await expect(similarCard.locator('svg')).toBeVisible();
    }
  });

  test('search results show correct previews in grid', async ({ page }) => {
    // Perform a search
    const searchInput = page.getByPlaceholder(/Search assets/i);
    await searchInput.fill('img_687');
    await searchInput.press('Enter');

    // Verify the specific image appears in results and loads
    await expect(page.locator(`[data-asset-id="${IMAGE_ASSET_ID}"]`)).toBeVisible();
    await expectImageToLoad(page, `[data-asset-id="${IMAGE_ASSET_ID}"] img`);
  });

  test('Analytics Most Popular Assets show previews', async ({ page }) => {
    // Navigate to Analytics
    await page.goto('/admin/analytics');

    // Check if the Popular Assets section is visible
    const popularSection = page.getByText(/Most Popular Assets/i);
    await expect(popularSection).toBeVisible({ timeout: 15000 });
    await popularSection.scrollIntoViewIfNeeded();

    // Verify that at least one asset in the popular list has a loading image
    // (Assuming there is at least one image in the top 5 during E2E)
    const topAssetCard = page.locator('div.grid.grid-cols-1 >> a[href^="/assets/"]').first();
    await expect(topAssetCard).toBeVisible({ timeout: 20000 });

    // Wait for actual previews (not placeholders)
    // We check for CustomImage inside the card for images, or DocumentIcon for others.
    // If it's an image, it should have an 'img' tag.
    const previewImage = topAssetCard.locator('img');
    const isImage = await previewImage.isVisible();

    if (isImage) {
      await expectImageToLoad(page, 'div.grid.grid-cols-1 >> a[href^="/assets/"] img >> nth=0');
    } else {
      // Should show the DocumentIcon placeholder we added
      await expect(topAssetCard.locator('svg')).toBeVisible();
    }
  });
});
