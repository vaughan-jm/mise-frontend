/**
 * Mise - Recipe Cleaning App (Refactored)
 *
 * This is the refactored version of Mise.jsx using modular components,
 * proper state management with contexts, and improved error handling.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Contexts
import { useAuth } from './contexts/AuthContext.jsx';
import { useLanguage } from './contexts/LanguageContext.jsx';

// Hooks
import { useRecipe } from './hooks/useRecipe.js';
import { useSavedRecipes } from './hooks/useSavedRecipes.js';

// Components
import Header from './components/ui/Header.jsx';
import Modal from './components/ui/Modal.jsx';
import LoadingSpinner from './components/ui/LoadingSpinner.jsx';
import FeedbackModal from './components/ui/FeedbackModal.jsx';
import PricingModal from './components/ui/PricingModal.jsx';
import TranslateToast from './components/ui/TranslateToast.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import RecipeInput from './components/recipe/RecipeInput.jsx';
import RecipeCard from './components/recipe/RecipeCard.jsx';
import RecipeList from './components/recipe/RecipeList.jsx';
import PrepPhase from './components/cooking/PrepPhase.jsx';
import CookPhase from './components/cooking/CookPhase.jsx';

// Services and utilities
import api from './services/api.js';
import colors from './constants/colors.js';
import {
  ENDPOINTS,
  INPUT_MODES,
  PHASES,
  LOADING_MESSAGE_INTERVAL,
  TOAST_DURATION,
} from './constants/index.js';

export default function Mise() {
  // Auth context
  const {
    user,
    isAuthenticated,
    recipesRemaining,
    updateRecipesRemaining,
    logout,
  } = useAuth();

  // Language context
  const { language, t, loadingMessages } = useLanguage();

  // Recipe hook
  const recipe = useRecipe({
    language,
    onRecipesRemainingChange: updateRecipesRemaining,
  });

  // Saved recipes hook
  const {
    savedRecipes,
    saving: savingRecipe,
    saveRecipe,
    deleteRecipe,
    isRecipeSaved,
  } = useSavedRecipes({ isAuthenticated });

  // UI state
  const [inputMode, setInputMode] = useState(INPUT_MODES.URL);
  const [url, setUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [photos, setPhotos] = useState([]);

  // Modal visibility
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showSaved, setShowSaved] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Additional state
  const [plans, setPlans] = useState(null);
  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [translateToast, setTranslateToast] = useState(null);
  const [hasRatedThisSession, setHasRatedThisSession] = useState(false);
  const [userRating, setUserRating] = useState(null);

  // Loading message rotation
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingIndex, setLoadingIndex] = useState(0);

  // Refs
  const topRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load initial data
  useEffect(() => {
    api.get(ENDPOINTS.PAYMENTS.PLANS).then(setPlans);
    api.get(ENDPOINTS.RATINGS_SUMMARY).then(data => setRatingsSummary(data.display));
  }, []);

  // Scroll to top when cooking progress changes
  useEffect(() => {
    if (topRef.current && recipe.recipe) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [recipe.completedIngredients, recipe.completedSteps, recipe.phase]);

  // Rotate loading messages
  useEffect(() => {
    if (!recipe.loading) {
      setLoadingIndex(0);
      return;
    }

    const messages = inputMode === INPUT_MODES.URL
      ? loadingMessages.url
      : inputMode === INPUT_MODES.YOUTUBE
        ? loadingMessages.youtube
        : loadingMessages.photo;

    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      setLoadingIndex(prev => {
        const next = prev + 1;
        if (next < messages.length) {
          setLoadingMessage(messages[next]);
          return next;
        }
        return prev;
      });
    }, LOADING_MESSAGE_INTERVAL);

    return () => clearInterval(interval);
  }, [recipe.loading, inputMode, loadingMessages]);

  // Handle language change with translation
  const handleLanguageChange = useCallback(async (newLang) => {
    if (recipe.recipe && newLang !== language) {
      const result = await recipe.translateRecipe(newLang);
      if (result.upgradeRequired) {
        setTranslateToast({ show: true, language: newLang });
        setTimeout(() => setTranslateToast(null), TOAST_DURATION);
      }
    }
  }, [recipe, language]);

  // Handle recipe submission based on input mode
  const handleSubmit = useCallback(async () => {
    let result;

    switch (inputMode) {
      case INPUT_MODES.URL:
        result = await recipe.fetchFromUrl(url);
        break;
      case INPUT_MODES.PHOTO:
        result = await recipe.processPhotos(photos);
        if (result.success) setPhotos([]);
        break;
      case INPUT_MODES.YOUTUBE:
        result = await recipe.processYoutube(youtubeUrl);
        if (result.success) setYoutubeUrl('');
        break;
    }

    if (result?.requiresSignup) {
      setShowAuth(true);
      setAuthMode('signup');
    } else if (result?.upgrade) {
      setShowPricing(true);
    }
  }, [inputMode, url, photos, youtubeUrl, recipe]);

  // Handle photo selection
  const handlePhotoSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newPhotos = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotos.push(event.target.result);
        if (newPhotos.length === files.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle save current recipe
  const handleSaveRecipe = useCallback(async () => {
    if (!isAuthenticated || !recipe.recipe) return;
    await saveRecipe(recipe.recipe);
  }, [isAuthenticated, recipe.recipe, saveRecipe]);

  // Handle load saved recipe
  const handleLoadRecipe = useCallback((savedRecipe) => {
    recipe.loadRecipe(savedRecipe);
    setShowSaved(false);
  }, [recipe]);

  // Handle rating submission
  const handleRate = useCallback(async (stars) => {
    setUserRating(stars);
    setHasRatedThisSession(true);
    await api.post(ENDPOINTS.RATING, { stars });
    const data = await api.get(ENDPOINTS.RATINGS_SUMMARY);
    setRatingsSummary(data.display);
  }, []);

  // Handle feedback submission
  const handleFeedback = useCallback(async (message) => {
    await api.post(ENDPOINTS.FEEDBACK, { message, type: 'idea' });
  }, []);

  // Handle plan upgrade
  const handleUpgrade = useCallback(async (plan) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    const data = await api.post(ENDPOINTS.PAYMENTS.CHECKOUT, { plan });
    if (data.url) window.location.href = data.url;
  }, [isAuthenticated]);

  // Reset to home
  const handleReset = useCallback(() => {
    recipe.resetAll();
    setUrl('');
    setYoutubeUrl('');
    setPhotos([]);
    setHasRatedThisSession(false);
    setUserRating(null);
  }, [recipe]);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: colors.text,
    },
    content: {
      maxWidth: '500px',
      margin: '0 auto',
      padding: '16px',
    },
    heroSection: {
      padding: '30px 20px',
      textAlign: 'center',
    },
    heroTitle: {
      fontSize: '24px',
      fontWeight: '300',
      marginBottom: '8px',
      letterSpacing: '-0.5px',
    },
    heroSubtitle: {
      fontSize: '14px',
      color: colors.muted,
      maxWidth: '280px',
      margin: '0 auto',
      lineHeight: 1.6,
    },
    heroButtons: {
      marginTop: '24px',
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    loadingSection: {
      padding: '60px 20px',
      textAlign: 'center',
    },
    spinner: {
      width: '36px',
      height: '36px',
      border: `2px solid ${colors.border}`,
      borderTopColor: colors.accent,
      borderRadius: '50%',
      margin: '0 auto 20px',
      animation: 'spin 0.7s linear infinite',
    },
    loadingText: {
      color: colors.text,
      fontSize: '15px',
      marginBottom: '8px',
      minHeight: '24px',
    },
    loadingSubtext: {
      color: colors.muted,
      fontSize: '12px',
    },
    feedbackLink: {
      marginTop: '40px',
      background: 'none',
      border: 'none',
      color: colors.dim,
      fontSize: '11px',
      cursor: 'pointer',
      opacity: 0.7,
      transition: 'opacity 0.2s',
    },
    recipeSection: {
      position: 'relative',
    },
    tipsSection: {
      marginTop: '24px',
      background: `${colors.warm}15`,
      padding: '14px 16px',
      borderRadius: '12px',
      borderLeft: `3px solid ${colors.warm}`,
    },
    tipsTitle: {
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: colors.warm,
      marginBottom: '8px',
      fontWeight: '600',
    },
    tipsList: {
      margin: 0,
      padding: '0 0 0 16px',
      fontSize: '13px',
      color: colors.text,
      lineHeight: 1.5,
    },
    bottomFeedback: {
      marginTop: '32px',
      textAlign: 'center',
    },
  };

  // Render saved recipes view
  if (showSaved) {
    return (
      <div style={styles.container}>
        <RecipeList
          recipes={savedRecipes}
          onLoad={handleLoadRecipe}
          onDelete={deleteRecipe}
          onBack={() => setShowSaved(false)}
          txt={t}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Keyframe animation for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <Header
        ratingsSummary={ratingsSummary}
        savedRecipes={savedRecipes}
        onShowSaved={() => setShowSaved(true)}
        onShowAuth={() => setShowAuth(true)}
        onLogoClick={handleReset}
      />

      {/* Input Section - shown when no recipe and not loading */}
      {!recipe.recipe && !recipe.loading && (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
          <RecipeInput
            inputMode={inputMode}
            onModeChange={setInputMode}
            onSubmit={handleSubmit}
            loading={recipe.loading}
            txt={t}
            url={url}
            onUrlChange={setUrl}
            photos={photos}
            onPhotosChange={setPhotos}
            youtubeUrl={youtubeUrl}
            onYoutubeUrlChange={setYoutubeUrl}
            error={recipe.error}
            fileInputRef={fileInputRef}
            onPhotoSelect={handlePhotoSelect}
          />
        </div>
      )}

      {/* Hero Section - shown when no recipe */}
      {!recipe.recipe && !recipe.loading && (
        <div style={styles.heroSection}>
          <h1 style={styles.heroTitle}>{t.justTheRecipe}</h1>
          <p style={styles.heroSubtitle}>{t.worksWithAny}</p>
          <div style={styles.heroButtons}>
            {!isAuthenticated && (
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {t.signIn}
              </button>
            )}
            <button
              onClick={() => setShowPricing(true)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.accent,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {t.upgrade} →
            </button>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            style={styles.feedbackLink}
            onMouseEnter={e => e.target.style.opacity = 1}
            onMouseLeave={e => e.target.style.opacity = 0.7}
          >
            {t.gotFeatureIdea}
          </button>
        </div>
      )}

      {/* Loading State */}
      {recipe.loading && (
        <div style={styles.loadingSection}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>{loadingMessage}</p>
          <p style={styles.loadingSubtext}>
            {inputMode === INPUT_MODES.URL ? t.usuallySeconds : t.usuallySecondsPhoto} ☕
          </p>
        </div>
      )}

      {/* Recipe Display */}
      {recipe.recipe && !recipe.loading && (
        <div style={{ ...styles.content, ...styles.recipeSection }}>
          <div ref={topRef} />

          {/* Recipe Card with info and controls */}
          <RecipeCard
            recipe={recipe.recipe}
            servings={recipe.servings}
            isScaled={recipe.isScaled}
            isSaved={isRecipeSaved(recipe.recipe)}
            onSave={handleSaveRecipe}
            onAdjustServings={recipe.adjustServings}
            translating={recipe.translating}
            txt={t}
            user={user}
            savingRecipe={savingRecipe}
            onBack={handleReset}
            onShowAuth={() => setShowAuth(true)}
          />

          {/* Phase Toggle */}
          <div style={{
            display: 'flex',
            marginBottom: '16px',
            background: colors.card,
            borderRadius: '10px',
            padding: '4px',
            border: `1px solid ${colors.border}`,
          }}>
            <button
              onClick={() => recipe.setPhase(PHASES.PREP)}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '13px',
                fontWeight: '500',
                background: recipe.phase === PHASES.PREP ? colors.accent : 'transparent',
                color: recipe.phase === PHASES.PREP ? colors.bg : colors.muted,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              aria-pressed={recipe.phase === PHASES.PREP}
            >
              1. {t.prep} {recipe.ingredientsDone > 0 && `(${recipe.ingredientsDone}/${recipe.recipe.ingredients?.length})`}
            </button>
            <button
              onClick={() => recipe.setPhase(PHASES.COOK)}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '13px',
                fontWeight: '500',
                background: recipe.phase === PHASES.COOK ? colors.accent : 'transparent',
                color: recipe.phase === PHASES.COOK ? colors.bg : colors.muted,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              aria-pressed={recipe.phase === PHASES.COOK}
            >
              2. {t.cook} {recipe.stepsDone > 0 && `(${recipe.stepsDone}/${recipe.recipe.steps?.length})`}
            </button>
          </div>

          {/* Prep Phase */}
          {recipe.phase === PHASES.PREP && (
            <PrepPhase
              ingredients={recipe.recipe.ingredients || []}
              completedIngredients={recipe.completedIngredients}
              onComplete={recipe.completeIngredient}
              onUndo={recipe.undoLastIngredient}
              scaleIngredient={recipe.scaleIngredient}
              txt={t}
            />
          )}

          {/* Cook Phase */}
          {recipe.phase === PHASES.COOK && (
            <CookPhase
              steps={recipe.recipe.steps || []}
              completedSteps={recipe.completedSteps}
              onComplete={recipe.completeStep}
              onUndo={recipe.undoLastStep}
              onReset={() => {
                recipe.resetCookingState();
                setHasRatedThisSession(false);
                setUserRating(null);
              }}
              scaleIngredient={recipe.scaleIngredient}
              txt={t}
              hasRatedThisSession={hasRatedThisSession}
              onRate={handleRate}
              userRating={userRating}
            />
          )}

          {/* Tips Section */}
          {recipe.recipe.tips?.length > 0 && recipe.recipe.tips[0] && (
            <div style={styles.tipsSection}>
              <h3 style={styles.tipsTitle}>💡 {t.tips}</h3>
              <ul style={styles.tipsList}>
                {recipe.recipe.tips.filter(tip => tip).map((tip, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback Link */}
          <div style={styles.bottomFeedback}>
            <button
              onClick={() => setShowFeedback(true)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.dim,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              💡 {t.suggestFeature}
            </button>
          </div>
        </div>
      )}

      {/* Translation Toast */}
      <TranslateToast
        show={translateToast?.show}
        language={translateToast?.language}
        onUpgrade={() => {
          setTranslateToast(null);
          setShowPricing(true);
        }}
        onDismiss={() => setTranslateToast(null)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        initialMode={authMode}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedback}
        userEmail={user?.email}
      />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        plans={plans}
        onSelectPlan={handleUpgrade}
        currentPlan={user?.plan}
      />
    </div>
  );
}
