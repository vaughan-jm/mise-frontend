# UI Component Usage Guide

This guide provides examples for using the newly created modal components.

## FeedbackModal

A modal for collecting user feedback and feature suggestions.

### Props

- `isOpen` (boolean): Whether the modal is open
- `onClose` (function): Callback when modal is closed
- `onSubmit` (async function): Handles feedback submission, receives feedback text
- `userEmail` (string, optional): User email for notification message

### Example

```jsx
import { FeedbackModal } from './components/ui';

function App() {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFeedbackSubmit = async (feedbackText) => {
    await api.post('/api/feedback', {
      message: feedbackText,
      type: 'idea'
    });
  };

  return (
    <>
      <button onClick={() => setShowFeedback(true)}>
        Give Feedback
      </button>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
        userEmail={user?.email}
      />
    </>
  );
}
```

## PricingModal

A modal displaying pricing plans with upgrade options.

### Props

- `isOpen` (boolean): Whether the modal is open
- `onClose` (function): Callback when modal is closed
- `plans` (object): Plans object with basic/pro plan data
- `onSelectPlan` (function): Callback when a plan is selected (receives plan name)
- `currentPlan` (string, optional): Current plan name to highlight

### Example

```jsx
import { PricingModal } from './components/ui';

function App() {
  const [showPricing, setShowPricing] = useState(false);
  const [plans, setPlans] = useState(null);

  // Plans structure:
  // {
  //   basic: {
  //     name: 'Basic',
  //     price: 1.99,
  //     features: ['10 recipes/month', 'Save recipes', 'Basic support']
  //   },
  //   pro: {
  //     name: 'Pro',
  //     price: 4.99,
  //     features: ['Unlimited recipes', 'Translation', 'Priority support']
  //   }
  // }

  const handleSelectPlan = async (planName) => {
    const data = await api.post('/api/payments/create-checkout', {
      plan: planName
    });
    if (data.url) window.location.href = data.url;
  };

  return (
    <>
      <button onClick={() => setShowPricing(true)}>
        Upgrade
      </button>

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        plans={plans}
        onSelectPlan={handleSelectPlan}
        currentPlan={user?.plan}
      />
    </>
  );
}
```

## TranslateToast

A fixed-position toast notification for translation upgrade prompts.

### Props

- `show` (boolean): Whether the toast is visible
- `language` (string): Target language code (e.g., 'es', 'fr')
- `onUpgrade` (function): Callback when upgrade button is clicked
- `onDismiss` (function): Callback when dismiss button is clicked

### Example

```jsx
import { TranslateToast } from './components/ui';

function App() {
  const [translateToast, setTranslateToast] = useState(null);

  const handleUpgradeClick = () => {
    setTranslateToast(null);
    setShowPricing(true);
  };

  return (
    <>
      <TranslateToast
        show={translateToast?.show}
        language={translateToast?.language}
        onUpgrade={handleUpgradeClick}
        onDismiss={() => setTranslateToast(null)}
      />
    </>
  );
}
```

## useLanguage Hook

All components use the `useLanguage` hook for translations.

### Usage

```jsx
import useLanguage from '../hooks/useLanguage';

function MyComponent() {
  const { language, setLanguage, t, languages } = useLanguage();

  return (
    <div>
      <p>{t.welcomeBack}</p>
      <button onClick={() => setLanguage('es')}>
        Switch to Spanish
      </button>
    </div>
  );
}
```

### Available Properties

- `language` (string): Current language code
- `setLanguage` (function): Change language
- `t` (object): Translations for current language (with English fallbacks)
- `languages` (array): Available languages with code, label, and name

## Styling

All components use colors from `/home/user/mise-frontend/src/constants/colors.js`:

- `colors.bg` - Background
- `colors.card` - Card background
- `colors.accent` - Accent color (green)
- `colors.text` - Text color
- `colors.muted` - Muted text
- `colors.border` - Border color
- `colors.error` - Error color

## Accessibility

All components include:
- ARIA labels and roles
- Keyboard navigation support
- Semantic HTML
- Screen reader friendly content
