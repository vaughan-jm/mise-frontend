/**
 * Pare Content Configuration
 *
 * Marketing copy, taglines, and content that might change.
 * Edit this file to update text without touching component code.
 */

/**
 * Hero section content
 */
export const hero = {
  tagline: 'just the recipe',
  subtitle: 'Works with any recipe website',
  ctaText: 'extract',
}

/**
 * Loading messages shown during recipe extraction
 * These rotate to keep users entertained during the ~5-10 second wait
 */
export const loadingMessages = [
  'Reading the recipe...',
  'Skipping the life story...',
  'Ignoring the ads...',
  'Finding the good parts...',
  'Extracting ingredients...',
  'Simplifying steps...',
  'Almost there...',
  'Paring it down...',
]

/**
 * Completion celebration messages
 */
export const completionMessages = [
  'Nicely done!',
  'Bon appétit!',
  'Enjoy your meal!',
  'Well cooked!',
  'Success!',
]

/**
 * Feature highlights for marketing
 */
export const features = [
  {
    title: 'Any URL',
    description: 'Paste any recipe URL and get just the recipe - no ads, no life stories.',
  },
  {
    title: 'Photos',
    description: "Upload photos of recipes from cookbooks, magazines, or handwritten notes.",
  },
  {
    title: 'YouTube',
    description: 'Extract recipes from cooking videos. We watch so you don\'t have to.',
  },
  {
    title: 'Cooking Mode',
    description: 'Tap to mark ingredients and steps as done. Screen stays on while cooking.',
  },
  {
    title: 'Translation',
    description: 'Translate recipes to any of 7 languages. Hindi recipe? Get it in English.',
  },
  {
    title: 'Save Recipes',
    description: 'Build your personal cookbook. Access your saved recipes anytime.',
  },
]

/**
 * FAQ content for pricing/help
 */
export const faq = [
  {
    question: 'How does it work?',
    answer: 'Paste a recipe URL, upload a photo, or share a YouTube link. Our AI reads the content and extracts just the recipe - no ads, no stories, no clutter.',
  },
  {
    question: 'What sites are supported?',
    answer: 'Virtually any recipe website works. We support major sites like AllRecipes, Food Network, Serious Eats, NYT Cooking, and thousands more.',
  },
  {
    question: 'Can I use photos of cookbook pages?',
    answer: 'Yes! Upload photos of recipes from cookbooks, magazines, handwritten cards, or even screenshots. We\'ll extract the text and format it cleanly.',
  },
  {
    question: 'How does translation work?',
    answer: 'Available on Basic and Pro plans. You can translate any recipe to English, Spanish, French, Portuguese, Chinese, Hindi, or Arabic.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. You\'ll keep access until the end of your billing period.',
  },
  {
    question: 'Is my data private?',
    answer: 'Yes. We don\'t sell your data or share your recipes. See our privacy policy for full details.',
  },
]

/**
 * Footer links
 */
export const footerLinks = {
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Refunds', href: '/refund' },
  ],
  support: [
    { label: 'Contact', href: '/contact' },
    { label: 'Pricing', href: '/pricing' },
  ],
}

/**
 * Social links (if needed later)
 */
export const socialLinks = {
  twitter: 'https://twitter.com/parecooking',
  instagram: 'https://instagram.com/parecooking',
}

/**
 * SEO metadata
 */
export const seo = {
  title: 'Pare - Just the Recipe',
  description: 'Extract clean recipes from any website, photo, or YouTube video. No ads, no life stories, just the recipe.',
  keywords: ['recipe extractor', 'recipe cleaner', 'cooking app', 'no ads recipes'],
}

/**
 * Legal page content
 */
export const legal = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'January 2026',
    content: `
## What we collect

When you use Pare, we collect:
- **Account info**: Email address (via Clerk authentication)
- **Usage data**: Recipes extracted, saved recipes
- **Analytics**: Page views, feature usage (via PostHog)
- **Error logs**: Technical errors for debugging (via Sentry)

## How we use it

- To provide the recipe extraction service
- To save your recipes to your account
- To improve the service based on usage patterns
- To contact you about your account if needed

## What we don't do

- We don't sell your data
- We don't share your recipes with other users
- We don't use your content for advertising

## Third parties

We use these services:
- **Clerk** for authentication
- **Stripe** for payments
- **PostHog** for analytics
- **Sentry** for error tracking

## Contact

Questions? Contact us at hello@pare.cooking
    `.trim(),
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'January 2026',
    content: `
## Using Pare

By using Pare, you agree to these terms.

## The service

Pare extracts recipes from URLs, photos, and videos. We use AI to process content and may not always be 100% accurate. Always verify recipes before cooking.

## Your content

- You retain ownership of recipes you save
- We may store recipes you extract to provide the service
- Don't upload illegal or harmful content

## Payments

- Subscriptions are billed monthly or yearly
- Cancel anytime, access continues until billing period ends
- Refunds handled per our refund policy

## Limitations

- Service provided "as is"
- We may modify or discontinue features
- We're not responsible for recipe accuracy

## Contact

Questions? Contact us at hello@pare.cooking
    `.trim(),
  },
  refund: {
    title: 'Refund Policy',
    lastUpdated: 'January 2026',
    content: `
## Our refund policy

We want you to be happy with Pare.

## Requesting a refund

If you're not satisfied, contact us within 7 days of your purchase for a full refund. Email hello@pare.cooking with your account email and reason for refund.

## After 7 days

For requests after 7 days, we'll review on a case-by-case basis. We're generally reasonable.

## Subscriptions

When you cancel, you keep access until your billing period ends. We don't prorate refunds for partial months.

## Contact

Email: hello@pare.cooking
    `.trim(),
  },
}
