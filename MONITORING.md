# Production Monitoring with Checkly

This guide explains how to set up Checkly for continuous monitoring of your Mise production site.

## Why Checkly?

Checkly runs your Playwright tests as synthetic monitoring checks every 5-10 minutes, alerting you immediately if something breaks in production.

## Setup Steps

### 1. Create a Checkly Account

1. Go to [checkly.com](https://www.checkly.com) and sign up (free tier available)
2. Verify your email

### 2. Install the Checkly CLI

```bash
npm install -D checkly
npx checkly login
```

### 3. Initialize Checkly in Your Project

```bash
npx checkly init
```

This creates a `checkly.config.ts` file and a `__checks__` directory.

### 4. Configure Your Checks

Edit `checkly.config.ts`:

```typescript
import { defineConfig } from 'checkly';

export default defineConfig({
  projectName: 'Mise Recipe App',
  logicalId: 'mise-monitoring',
  repoUrl: 'https://github.com/your-username/mise-frontend',
  checks: {
    activated: true,
    muted: false,
    runtimeId: '2024.10',
    frequency: 10, // Check every 10 minutes
    locations: ['us-east-1', 'eu-west-1'],
    tags: ['mise', 'production'],
    checkMatch: '**/__checks__/**/*.check.ts',
    browserChecks: {
      frequency: 10,
      testMatch: '**/__checks__/**/*.spec.ts',
    },
  },
  cli: {
    runLocation: 'us-east-1',
  },
});
```

### 5. Create Monitoring Checks

Create a file `__checks__/production.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.CHECKLY_TEST_URL || 'https://mise-frontend-alpha.vercel.app';

test.describe('Production Health Checks', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'just the recipe' })).toBeVisible();
  });

  test('can enter recipe URL', async ({ page }) => {
    await page.goto(BASE_URL);
    const input = page.getByRole('textbox', { name: /Recipe URL/i });
    await expect(input).toBeVisible();
    await input.fill('https://example.com/recipe');
    await expect(page.getByRole('button', { name: 'Clean' })).toBeEnabled();
  });

  test('language switching works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('combobox').selectOption('es');
    await expect(page.getByRole('heading', { name: 'solo la receta' })).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Privacy' }).click();
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });
});
```

### 6. Deploy Your Checks

```bash
npx checkly deploy
```

### 7. Set Up Alerts

In the Checkly dashboard:

1. Go to **Alerting** > **Channels**
2. Add email, Slack, or PagerDuty alerts
3. Configure alert conditions (e.g., alert after 2 consecutive failures)

### 8. View Your Dashboard

The Checkly dashboard shows:
- Check status (passing/failing)
- Response times
- Failure logs with screenshots
- Performance trends

## Recommended Monitoring Schedule

| Check Type | Frequency | Description |
|------------|-----------|-------------|
| Homepage load | Every 5 min | Basic availability |
| Auth flow | Every 10 min | Clerk integration |
| Recipe input | Every 10 min | Core functionality |
| Legal pages | Every hour | Compliance pages |

## Costs

- **Free tier**: 50,000 check runs/month (plenty for monitoring)
- **Team tier**: $60/month for more checks and retention

## Local Testing

Test your monitoring checks locally:

```bash
npx checkly test
```

## Integration with CI

Add to your GitHub Actions workflow:

```yaml
- name: Run Checkly checks
  run: npx checkly test --reporter=cli
  env:
    CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
    CHECKLY_ACCOUNT_ID: ${{ secrets.CHECKLY_ACCOUNT_ID }}
```
