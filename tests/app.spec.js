import { test, expect } from '@playwright/test';

/**
 * Basic app loading and UI tests
 */
test.describe('App Loading', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check the main title/logo is visible
    await expect(page.getByRole('heading', { name: 'just the recipe' })).toBeVisible();
  });

  test('should show URL input mode by default', async ({ page }) => {
    await page.goto('/');

    // Check URL input is visible
    await expect(page.getByRole('textbox', { name: 'Recipe URL...' })).toBeVisible();

    // Check the Clean button is visible
    await expect(page.getByRole('button', { name: 'Clean' })).toBeVisible();
  });

  test('should allow switching between input modes', async ({ page }) => {
    await page.goto('/');

    // Check all input mode tabs are visible
    await expect(page.getByRole('button', { name: /Paste URL/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Photo/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Video/ })).toBeVisible();

    // Click on Photo mode
    await page.getByRole('button', { name: /Photo/ }).click();

    // Check photo upload area appears
    await expect(page.getByText('Add photos')).toBeVisible();
  });

  test('should show recipes remaining counter', async ({ page }) => {
    await page.goto('/');

    // Should show "left" text with a number
    await expect(page.getByText(/\d+\s*left/)).toBeVisible();
  });

  test('should show language selector', async ({ page }) => {
    await page.goto('/');

    // Check language combobox is visible
    await expect(page.getByRole('combobox')).toBeVisible();
  });
});

test.describe('Language Switching', () => {
  test('should switch to Spanish', async ({ page }) => {
    await page.goto('/');

    // Select Spanish from dropdown
    await page.getByRole('combobox').selectOption('es');

    // Check text changed to Spanish
    await expect(page.getByRole('heading', { name: 'solo la receta' })).toBeVisible();
  });

  test('should switch to French', async ({ page }) => {
    await page.goto('/');

    // Select French from dropdown
    await page.getByRole('combobox').selectOption('fr');

    // Check text changed to French
    await expect(page.getByRole('heading', { name: 'juste la recette' })).toBeVisible();
  });
});

test.describe('Footer Links', () => {
  test('should show privacy policy link', async ({ page }) => {
    await page.goto('/');

    // Check privacy link is visible
    await expect(page.getByRole('button', { name: 'Privacy' })).toBeVisible();
  });

  test('should show terms link', async ({ page }) => {
    await page.goto('/');

    // Check terms link is visible
    await expect(page.getByRole('button', { name: 'Terms' })).toBeVisible();
  });

  test('should show contact link', async ({ page }) => {
    await page.goto('/');

    // Check contact link is visible
    await expect(page.getByRole('button', { name: 'Contact' })).toBeVisible();
  });

  test('should open privacy policy page', async ({ page }) => {
    await page.goto('/');

    // Click privacy link
    await page.getByRole('button', { name: 'Privacy' }).click();

    // Check privacy policy content is visible
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByText('Information We Collect')).toBeVisible();
  });

  test('should open terms page', async ({ page }) => {
    await page.goto('/');

    // Click terms link
    await page.getByRole('button', { name: 'Terms' }).click();

    // Check terms content is visible
    await expect(page.getByText('Terms of Service')).toBeVisible();
  });

  test('should open contact form', async ({ page }) => {
    await page.goto('/');

    // Click contact link
    await page.getByRole('button', { name: 'Contact' }).click();

    // Check contact form is visible
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your email' })).toBeVisible();
  });
});
