import { test, expect } from '@playwright/test';

/**
 * Pare App - Basic loading and UI tests
 */
test.describe('App Loading', () => {
  test('should load the homepage with Pare branding', async ({ page }) => {
    await page.goto('/');

    // Check the Pare branding is visible - h1 "pare" heading
    await expect(page.getByRole('heading', { name: 'pare', level: 1 })).toBeVisible();

    // Check tagline is visible
    await expect(page.getByText('just the recipe.')).toBeVisible();
  });

  test('should show smart input field', async ({ page }) => {
    await page.goto('/');

    // Check input is visible with new placeholder
    await expect(page.getByPlaceholder(/recipe or youtube url/i)).toBeVisible();

    // Check the extract button (arrow) is visible
    await expect(page.getByRole('button', { name: /extract recipe/i })).toBeVisible();
  });

  test('should have camera button for photo upload', async ({ page }) => {
    await page.goto('/');

    // Check camera button for photo upload is visible
    await expect(page.getByRole('button', { name: /upload photos/i })).toBeVisible();

    // Check file input exists (hidden but present)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });
});

test.describe('Navigation', () => {
  test('should show sign in button for logged out users', async ({ page }) => {
    await page.goto('/');

    // Should see sign in button in header
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});

test.describe('Footer Links', () => {
  test('should show all footer links', async ({ page }) => {
    await page.goto('/');

    // Check all footer links are visible (refunds moved to account page)
    await expect(page.getByRole('link', { name: 'privacy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'terms' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'contact' })).toBeVisible();
  });

  test('should navigate to privacy policy page', async ({ page }) => {
    await page.goto('/');

    // Click privacy link
    await page.getByRole('link', { name: 'privacy' }).click();

    // Check privacy policy content is visible
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
  });

  test('should navigate to terms page', async ({ page }) => {
    await page.goto('/');

    // Click terms link
    await page.getByRole('link', { name: 'terms' }).click();

    // Check terms content is visible
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
  });

  test('should navigate to refund page', async ({ page }) => {
    // Navigate directly to refund page (link moved to account page)
    await page.goto('/refund');

    // Check refund policy content is visible
    await expect(page.getByRole('heading', { name: 'Refund Policy', exact: true })).toBeVisible();
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/');

    // Click contact link
    await page.getByRole('link', { name: 'contact' }).click();

    // Check contact form is visible
    await expect(page.getByRole('heading', { name: 'contact' })).toBeVisible();
    await expect(page.getByPlaceholder('your name')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  });
});

test.describe('Pricing Page', () => {
  test('should show pricing tiers', async ({ page }) => {
    await page.goto('/pricing');

    // Check pricing page loads
    await expect(page.getByRole('heading', { name: 'pricing' })).toBeVisible();

    // Check tier cards are visible (use heading role to avoid matching price text)
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Basic' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
  });

  test('should toggle between monthly and yearly billing', async ({ page }) => {
    await page.goto('/pricing');

    // Should have billing toggle
    await expect(page.getByRole('button', { name: 'monthly' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'yearly' })).toBeVisible();

    // Click yearly
    await page.getByRole('button', { name: 'yearly' }).click();

    // Should show yearly prices (check for savings badge - use first() as multiple tiers show savings)
    await expect(page.getByText(/save \d+%/i).first()).toBeVisible();
  });
});

test.describe('404 Page', () => {
  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route-12345');

    // Check 404 content
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('page not found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'go home' })).toBeVisible();
  });
});
