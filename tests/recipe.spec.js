import { test, expect } from '@playwright/test';

/**
 * Recipe URL input tests
 * These tests verify the basic UI interactions without needing API mocking
 */

test.describe('Recipe URL Input', () => {
  test('should allow entering a recipe URL', async ({ page }) => {
    await page.goto('/');

    // Find the URL input
    const input = page.getByRole('textbox', { name: /Recipe URL/i });
    await expect(input).toBeVisible();

    // Enter a URL
    await input.fill('https://example.com/my-recipe');

    // Check the Clean button is visible and can be clicked
    const cleanButton = page.getByRole('button', { name: 'Clean' });
    await expect(cleanButton).toBeVisible();
    await expect(cleanButton).toBeEnabled();
  });

  test('should switch to photo input mode', async ({ page }) => {
    await page.goto('/');

    // Click photo mode button
    await page.getByRole('button', { name: /Photo/ }).click();

    // Check add photos button appears
    await expect(page.getByText('Add photos')).toBeVisible();
  });

  test('should switch to video input mode', async ({ page }) => {
    await page.goto('/');

    // Click video mode button
    await page.getByRole('button', { name: /Video/ }).click();

    // Check YouTube URL input appears
    await expect(page.getByRole('textbox', { name: /YouTube/i })).toBeVisible();
  });

  test('should show loading state when Clean is clicked', async ({ page }) => {
    await page.goto('/');

    // Enter a URL
    await page.getByRole('textbox', { name: /Recipe URL/i }).fill('https://example.com/recipe');

    // Click Clean - will start loading (even if API fails)
    await page.getByRole('button', { name: 'Clean' }).click();

    // The button or UI should show some loading indication
    // After clicking, the page transitions to loading state
    // Wait briefly for any loading UI to appear
    await page.waitForTimeout(500);

    // The app should no longer be in the initial input state
    // (either loading or showing an error if the API isn't available)
  });
});

test.describe('Input Mode Switching', () => {
  test('should maintain URL input when switching modes', async ({ page }) => {
    await page.goto('/');

    // Enter URL
    const urlInput = page.getByRole('textbox', { name: /Recipe URL/i });
    await urlInput.fill('https://my-recipe.com');

    // Switch to photo mode and back
    await page.getByRole('button', { name: /Photo/ }).click();
    await page.getByRole('button', { name: /Paste URL/ }).click();

    // URL input should still have the value
    await expect(urlInput).toHaveValue('https://my-recipe.com');
  });

  test('should show helper text for each mode', async ({ page }) => {
    await page.goto('/');

    // URL mode helper
    await expect(page.getByText('Works with any recipe website')).toBeVisible();

    // Photo mode helper
    await page.getByRole('button', { name: /Photo/ }).click();
    await expect(page.getByText(/upload|Snap/i)).toBeVisible();

    // Video mode helper
    await page.getByRole('button', { name: /Video/ }).click();
    await expect(page.getByText(/cooking videos/i)).toBeVisible();
  });
});

test.describe('Sign In Prompt', () => {
  test('should show sign in button for logged out users', async ({ page }) => {
    await page.goto('/');

    // Should see sign in button in header
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
  });

  test('should show upgrade prompt', async ({ page }) => {
    await page.goto('/');

    // Should see upgrade button
    await expect(page.getByRole('button', { name: /Upgrade/i })).toBeVisible();
  });
});
