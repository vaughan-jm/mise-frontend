import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = {
  async post(path, body, email = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (email) headers['x-user-email'] = email;
    const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    return res.json();
  },
  async get(path, email = null) {
    const headers = {};
    if (email) headers['x-user-email'] = email;
    const res = await fetch(`${API_URL}${path}`, { headers });
    return res.json();
  },
  async delete(path, email) {
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: { 'x-user-email': email } });
    return res.json();
  },
};

export default function Mise() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [inputMode, setInputMode] = useState('url');
  const [url, setUrl] = useState('');
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState('');
  const [servings, setServings] = useState(null);
  const [recipesRemaining, setRecipesRemaining] = useState(3);

  const [phase, setPhase] = useState('prep');
  const [completedIngredients, setCompletedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});

  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [plans, setPlans] = useState(null);

  // Feedback & Rating state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [hasRatedThisSession, setHasRatedThisSession] = useState(false);

  const topRef = useRef(null);

  const urlLoadingMessages = [
    "Scraping off the life story...", "Removing 47 pop-up ads...", "Skipping to the actual recipe...",
    "Evicting sponsored content...", "Finding the recipe under 3000 words of backstory...",
    "Deleting \"my grandmother once said...\"", "Bypassing the newsletter signup...",
    "Ignoring the Pinterest buttons...", "Shooing away auto-play videos...",
    "Translating food blogger to English...", "Rescuing recipe from SEO prison...",
    "Dodging the \"rate this recipe\" popup...", "Skipping the influencer's trip to Tuscany...",
    "Excavating the actual ingredients...", "Filtering out the Amazon affiliate links...",
    "Muting the background music...", "Closing the cookie consent banner...",
    "Scrolling past the kids' birthday party story...", "Ignoring \"jump to recipe\" (we got this)...",
    "Clearing the sticky header forest...", "Defeating the print-friendly paywall...",
    "Extracting signal from noise...", "Almost there, promise...",
  ];

  const photoLoadingMessages = [
    "Reading your cookbook...", "Deciphering handwritten notes...", "Squinting at that smudged ingredient...",
    "Converting grandma's pinch to grams...", "Digitizing deliciousness...", "Translating cookbook to app...",
    "Making sense of \"season to taste\"...", "Interpreting splash-stained pages...", "Extracting the good stuff...",
    "Decoding vintage measurements...", "Parsing that beautiful cursive...", "Figuring out what \"1 tin\" means today...",
    "Adjusting for 1970s portion sizes...", "Reading between the sauce stains...", "Converting \"a knob of butter\" to tbsp...",
    "Interpreting \"cook until done\"...", "Translating \"moderate oven\" to degrees...", "Decrypting family secrets...",
    "Scanning for hidden tips in margins...", "Processing generations of wisdom...", "Making your cookbook immortal...",
    "Almost ready to cook...",
  ];

  useEffect(() => {
    const savedEmail = localStorage.getItem('mise_user_email');
    if (savedEmail) {
      api.get('/api/auth/me', savedEmail).then(data => {
        if (data.user) { setUser(data.user); setRecipesRemaining(data.user.recipesRemaining); loadSavedRecipes(savedEmail); }
      });
    }
    api.get('/api/payments/plans').then(setPlans);
    api.get('/api/ratings/summary').then(data => setRatingsSummary(data.display));
  }, []);

  useEffect(() => {
    if (topRef.current && recipe) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [completedIngredients, completedSteps, phase]);

  useEffect(() => {
    if (!loading) { setLoadingIndex(0); return; }
    const messages = inputMode === 'url' ? urlLoadingMessages : photoLoadingMessages;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      setLoadingIndex(prev => { const next = prev + 1; if (next < messages.length) { setLoadingMessage(messages[next]); return next; } return prev; });
    }, 3000);
    return () => clearInterval(interval);
  }, [loading, inputMode]);

  const loadSavedRecipes = async (userEmail) => {
    const data = await api.get('/api/recipes/saved', userEmail);
    if (data.recipes) setSavedRecipes(data.recipes);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) { setAuthError('Email and password required'); return; }
    setAuthLoading(true); setAuthError('');
    const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const data = await api.post(endpoint, { email, password });
    if (data.error) { setAuthError(data.error); }
    else { localStorage.setItem('mise_user_email', email); setUser(data.user); setRecipesRemaining(data.user.recipesRemaining); setShowAuth(false); setEmail(''); setPassword(''); loadSavedRecipes(email); }
    setAuthLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem('mise_user_email'); setUser(null); setSavedRecipes([]); setShowSaved(false); setRecipesRemaining(3); };

  const handleUpgrade = async (plan) => {
    if (!user) { setShowAuth(true); return; }
    const data = await api.post('/api/payments/create-checkout', { plan, email: user.email });
    if (data.url) window.location.href = data.url;
  };

  const saveCurrentRecipe = async () => {
    if (!user || !recipe) return;
    setSavingRecipe(true);
    await api.post('/api/recipes/save', { recipe }, user.email);
    await loadSavedRecipes(user.email);
    setSavingRecipe(false);
  };

  const deleteRecipe = async (id) => { if (!user) return; await api.delete(`/api/recipes/${id}`, user.email); await loadSavedRecipes(user.email); };

  const loadRecipe = (savedRecipe) => {
    setRecipe(savedRecipe); setServings(savedRecipe.servings); setPhase('prep');
    setCompletedIngredients({}); setCompletedSteps({}); setShowSaved(false);
  };

  const isRecipeSaved = () => recipe && savedRecipes.some(r => r.title === recipe.title);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newPhotos = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => { newPhotos.push(event.target.result); if (newPhotos.length === files.length) setPhotos(prev => [...prev, ...newPhotos]); };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const fetchFromUrl = async () => {
    if (!url.trim()) { setError('Please paste a recipe URL'); return; }
    setLoading(true); setError(''); setRecipe(null); resetCookingState();
    const data = await api.post('/api/recipe/clean-url', { url }, user?.email);
    if (data.error) { if (data.upgrade) setShowPricing(true); setError(data.message || data.error); }
    else { setRecipe(data.recipe); setServings(data.recipe.servings); setRecipesRemaining(data.recipesRemaining); }
    setLoading(false);
  };

  const processPhotos = async () => {
    if (!photos.length) { setError('Please add at least one photo'); return; }
    setLoading(true); setError(''); setRecipe(null); resetCookingState();
    const data = await api.post('/api/recipe/clean-photo', { photos }, user?.email);
    if (data.error) { if (data.upgrade) setShowPricing(true); setError(data.message || data.error); }
    else { setRecipe(data.recipe); setServings(data.recipe.servings); setRecipesRemaining(data.recipesRemaining); setPhotos([]); }
    setLoading(false);
  };

  const resetCookingState = () => { setPhase('prep'); setCompletedIngredients({}); setCompletedSteps({}); };
  const completeIngredient = (i) => setCompletedIngredients(prev => ({ ...prev, [i]: true }));
  const completeStep = (i) => setCompletedSteps(prev => ({ ...prev, [i]: true }));
  const undoLastIngredient = () => { const c = Object.keys(completedIngredients).filter(k => completedIngredients[k]).map(Number); if (c.length) setCompletedIngredients(prev => ({ ...prev, [Math.max(...c)]: false })); };
  const undoLastStep = () => { const c = Object.keys(completedSteps).filter(k => completedSteps[k]).map(Number); if (c.length) setCompletedSteps(prev => ({ ...prev, [Math.max(...c)]: false })); };
  const resetAll = () => { resetCookingState(); setHasRatedThisSession(false); };
  const adjustServings = (n) => { if (n >= 1 && n <= 20) setServings(n); };
  const scaleIngredient = (ing) => {
    if (!recipe?.servings || servings === recipe.servings) return ing;
    const ratio = servings / recipe.servings;
    return ing.replace(/(\d+\.?\d*)/g, (m) => { const n = parseFloat(m) * ratio; return n % 1 === 0 ? n.toString() : n.toFixed(1); });
  };

  // Feedback handlers
  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    await api.post('/api/feedback', { message: feedbackText, type: 'idea' }, user?.email);
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => { setShowFeedback(false); setFeedbackSent(false); }, 2000);
  };

  // Rating handler - instant, no submit button
  const submitRating = async (stars) => {
    setUserRating(stars);
    setHasRatedThisSession(true);
    await api.post('/api/rating', { stars }, user?.email);
    // Refresh summary
    const data = await api.get('/api/ratings/summary');
    setRatingsSummary(data.display);
  };

  const remainingIngredients = recipe?.ingredients?.map((ing, i) => ({ ing, i })).filter(({ i }) => !completedIngredients[i]) || [];
  const remainingSteps = recipe?.steps?.map((step, i) => ({ step, i })).filter(({ i }) => !completedSteps[i]) || [];
  const ingredientsDone = Object.values(completedIngredients).filter(Boolean).length;
  const stepsDone = Object.values(completedSteps).filter(Boolean).length;
  const allIngredientsDone = recipe?.ingredients && ingredientsDone === recipe.ingredients.length;
  const allStepsDone = recipe?.steps && stepsDone === recipe.steps.length;

  useEffect(() => { if (allIngredientsDone && phase === 'prep') setPhase('cook'); }, [allIngredientsDone, phase]);

  const c = {
    bg: '#0d1117', card: '#161b22', cardHover: '#1c2128', accent: '#4ade80', accentDim: '#166534',
    warm: '#fb923c', text: '#e6edf3', muted: '#7d8590', dim: '#484f58', border: '#30363d',
    error: '#f85149', ingredientBg: '#1a2332', ingredientBorder: '#2d4a3e',
  };

  const MiseLogo = ({ size = 32 }) => (
    <svg viewBox="0 0 200 200" width={size} height={size}>
      <rect width="200" height="200" rx="40" fill={c.card}/>
      <path d="M 40 110 Q 40 160 100 160 Q 160 160 160 110" fill="none" stroke={c.accent} strokeWidth="12" strokeLinecap="round"/>
      <circle cx="70" cy="100" r="12" fill={c.accent}/><circle cx="100" cy="88" r="12" fill={c.accent}/><circle cx="130" cy="100" r="12" fill={c.accent}/>
    </svg>
  );

  const Attribution = ({ recipe }) => {
    if (!recipe.source && !recipe.author) return null;
    return (
      <div style={{ padding: '12px 14px', background: c.card, borderRadius: '10px', border: `1px solid ${c.border}`, marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: c.muted, marginBottom: '6px' }}>Original recipe</p>
        <p style={{ fontSize: '14px', color: c.text, lineHeight: 1.4 }}>
          {recipe.author && <span>{recipe.author} · </span>}
          {recipe.sourceUrl ? <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: c.accent, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{recipe.source}</a> : <span style={{ color: c.muted }}>{recipe.source}</span>}
        </p>
      </div>
    );
  };

  // Quick star rating component - tap and done
  const QuickRating = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => submitRating(star)}
          style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
            opacity: userRating >= star ? 1 : 0.3,
            transform: userRating >= star ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.15s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );

  // Feedback modal - minimal and friendly
  if (showFeedback) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: c.card, borderRadius: '16px', padding: '24px', border: `1px solid ${c.border}` }}>
          <button onClick={() => setShowFeedback(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back</button>
          
          {feedbackSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '32px' }}>💚</span>
              <p style={{ fontSize: '16px', marginTop: '12px' }}>Thanks! We read every message.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Got an idea?</h2>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '16px', lineHeight: 1.5 }}>
                We ship updates weekly. Your suggestions become features.
                {user?.email && <span style={{ display: 'block', marginTop: '4px', color: c.dim }}>We'll notify you when we build it.</span>}
              </p>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="What would make mise better?"
                style={{
                  width: '100%', height: '100px', padding: '12px', fontSize: '14px',
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px',
                  color: c.text, resize: 'none', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={submitFeedback}
                disabled={!feedbackText.trim()}
                style={{
                  width: '100%', marginTop: '12px', padding: '12px', fontSize: '14px', fontWeight: '500',
                  background: feedbackText.trim() ? c.accent : c.dim, color: c.bg,
                  border: 'none', borderRadius: '8px', cursor: feedbackText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Pricing modal
  if (showPricing && plans) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, padding: '20px' }}>
        <button onClick={() => setShowPricing(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '20px' }}>← Back</button>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <MiseLogo size={48} />
          <h2 style={{ fontSize: '22px', fontWeight: '600', margin: '16px 0 8px' }}>Upgrade your plan</h2>
          <p style={{ color: c.muted, fontSize: '14px', marginBottom: '24px' }}>Clean more recipes, save them forever</p>
          {['basic', 'unlimited'].map(plan => (
            <div key={plan} style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px', marginBottom: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{plans[plan].name}</h3>
                <span style={{ fontSize: '20px', fontWeight: '600' }}>${plans[plan].price}<span style={{ fontSize: '14px', color: c.muted }}>/mo</span></span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                {plans[plan].features.map((f, i) => <li key={i} style={{ fontSize: '13px', color: c.muted, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: c.accent }}>✓</span> {f}</li>)}
              </ul>
              <button onClick={() => handleUpgrade(plan)} style={{ width: '100%', padding: '12px', background: plan === 'unlimited' ? c.accent : c.cardHover, color: plan === 'unlimited' ? c.bg : c.text, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                {plan === 'unlimited' ? 'Go Unlimited' : 'Get Basic'}
              </button>
            </div>
          ))}
          <p style={{ fontSize: '12px', color: c.dim, marginTop: '16px' }}>Cancel anytime. Secure payment via Stripe.</p>
        </div>
      </div>
    );
  }

  // Auth modal
  if (showAuth) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '340px', background: c.card, borderRadius: '16px', padding: '28px 24px', border: `1px solid ${c.border}` }}>
          <button onClick={() => setShowAuth(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back</button>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px' }}>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p style={{ fontSize: '14px', color: c.muted, marginBottom: '24px' }}>{authMode === 'login' ? 'Sign in to access saved recipes' : 'Get 3 free recipes/month'}</p>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '12px 14px', fontSize: '15px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.text, marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleAuth()} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.text, marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
          {authError && <p style={{ color: c.error, fontSize: '13px', marginBottom: '16px' }}>{authError}</p>}
          <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: '600', background: c.accent, color: c.bg, border: 'none', borderRadius: '8px', cursor: authLoading ? 'wait' : 'pointer', marginBottom: '16px' }}>{authLoading ? '...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}</button>
          <p style={{ textAlign: 'center', fontSize: '14px', color: c.muted }}>{authMode === 'login' ? "No account? " : "Have an account? "}<button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: c.accent, cursor: 'pointer', fontSize: '14px', padding: 0 }}>{authMode === 'login' ? 'Sign up' : 'Sign in'}</button></p>
        </div>
      </div>
    );
  }

  // Saved recipes
  if (showSaved) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text }}>
        <header style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setShowSaved(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', padding: 0 }}>← Back</button>
          <span style={{ fontSize: '13px', color: c.muted }}>{savedRecipes.length} recipes</span>
        </header>
        <div style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Saved Recipes</h2>
          {savedRecipes.length === 0 ? (
            <p style={{ color: c.muted, textAlign: 'center', padding: '40px 0' }}>No saved recipes yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {savedRecipes.map(r => (
                <div key={r.id} style={{ background: c.card, borderRadius: '10px', border: `1px solid ${c.border}`, overflow: 'hidden', display: 'flex' }}>
                  {r.imageUrl && <div style={{ width: '72px', height: '72px', flexShrink: 0, background: `url(${r.imageUrl}) center/cover` }} />}
                  <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px', lineHeight: 1.3 }}>{r.title}</h3>
                    <p style={{ fontSize: '11px', color: c.muted }}>{r.source || 'Cookbook'}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${c.border}` }}>
                    <button onClick={() => loadRecipe(r)} style={{ flex: 1, padding: '0 14px', background: 'none', border: 'none', color: c.accent, fontSize: '12px', cursor: 'pointer', borderBottom: `1px solid ${c.border}` }}>Cook</button>
                    <button onClick={() => deleteRecipe(r.id)} style={{ flex: 1, padding: '0 14px', background: 'none', border: 'none', color: c.error, fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text }}>
      {/* Header */}
      <header style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: c.bg, zIndex: 100 }}>
        <div 
          onClick={() => { setRecipe(null); setUrl(''); setPhotos([]); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <MiseLogo size={28} />
          <span style={{ fontSize: '17px', fontWeight: '300', letterSpacing: '-0.5px' }}>mise</span>
          {/* Discreet rating display */}
          {ratingsSummary && (
            <span style={{ fontSize: '11px', color: c.dim, marginLeft: '4px' }}>{ratingsSummary.text}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: c.muted, background: c.card, padding: '4px 8px', borderRadius: '4px' }}>
            {recipesRemaining === Infinity ? '∞' : recipesRemaining} left
          </span>
          {user ? (
            <>
              <button onClick={() => setShowSaved(true)} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>📚 {savedRecipes.length}</button>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '12px', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: c.accent, border: 'none', color: c.bg, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Sign In</button>
          )}
        </div>
      </header>

      {/* Input Section */}
      {!recipe && !loading && (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', marginBottom: '16px', background: c.card, borderRadius: '10px', padding: '4px', border: `1px solid ${c.border}` }}>
            <button onClick={() => setInputMode('url')} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '500', background: inputMode === 'url' ? c.accent : 'transparent', color: inputMode === 'url' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>🔗 Paste URL</button>
            <button onClick={() => setInputMode('photo')} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '500', background: inputMode === 'photo' ? c.accent : 'transparent', color: inputMode === 'photo' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>📷 Snap Photo</button>
          </div>

          {inputMode === 'url' && (
            <div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste recipe URL..." onKeyDown={e => e.key === 'Enter' && fetchFromUrl()} style={{ flex: 1, padding: '14px 16px', fontSize: '15px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', color: c.text, outline: 'none' }} />
                <button onClick={fetchFromUrl} style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500', background: c.accent, color: c.bg, border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Clean</button>
              </div>
              <p style={{ fontSize: '12px', color: c.dim, textAlign: 'center', marginTop: '12px' }}>Works with any recipe website</p>
            </div>
          )}

          {inputMode === 'photo' && (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              {photos.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {photos.map((photo, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={photo} alt={`Recipe ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${c.border}` }} />
                      <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: c.error, color: '#fff', border: 'none', borderRadius: '50%', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '16px', fontSize: '14px', background: c.card, color: c.text, border: `2px dashed ${c.border}`, borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📷</span> {photos.length === 0 ? 'Add photos' : 'Add more'}
                </button>
                {photos.length > 0 && (
                  <button onClick={processPhotos} style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', background: c.accent, color: c.bg, border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Clean</button>
                )}
              </div>
              <p style={{ fontSize: '12px', color: c.dim, textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>No link? No problem.<br/>Snap your cookbook pages</p>
            </div>
          )}

          {error && <p style={{ textAlign: 'center', color: c.error, marginTop: '12px', fontSize: '13px' }}>{error}</p>}
        </div>
      )}

      {/* Empty State Hero */}
      {!recipe && !loading && (
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '300', marginBottom: '8px', letterSpacing: '-0.5px' }}>just the recipe</h1>
          <p style={{ fontSize: '14px', color: c.muted, maxWidth: '280px', margin: '0 auto', lineHeight: 1.6 }}>Strip the ads, stories, and clutter from any recipe. Online or from your cookbook.</p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user && <button onClick={() => setShowAuth(true)} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '10px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Sign up free</button>}
            <button onClick={() => setShowPricing(true)} style={{ background: 'none', border: 'none', color: c.accent, fontSize: '13px', cursor: 'pointer' }}>View pricing →</button>
          </div>
          
          {/* Discreet feedback link */}
          <button 
            onClick={() => setShowFeedback(true)} 
            style={{ 
              marginTop: '40px', background: 'none', border: 'none', 
              color: c.dim, fontSize: '11px', cursor: 'pointer',
              opacity: 0.7, transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.target.style.opacity = 1}
            onMouseLeave={e => e.target.style.opacity = 0.7}
          >
            💡 Got a feature idea?
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: `2px solid ${c.border}`, borderTopColor: c.accent, borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: c.text, fontSize: '15px', marginBottom: '8px', minHeight: '24px' }}>{loadingMessage}</p>
          <p style={{ color: c.muted, fontSize: '12px' }}>{inputMode === 'url' ? 'Usually 15-25 seconds' : 'Usually 20-30 seconds'} ☕</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Recipe Display */}
      {recipe && !loading && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '16px' }}>
          <div ref={topRef} />
          <button onClick={() => { setRecipe(null); setUrl(''); }} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '13px', cursor: 'pointer', marginBottom: '12px', padding: 0 }}>← New recipe</button>

          {recipe.imageUrl && <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', background: `url(${recipe.imageUrl}) center/cover` }} />}

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, lineHeight: 1.3 }}>{recipe.title}</h2>
              {user && !isRecipeSaved() && (
                <button onClick={saveCurrentRecipe} disabled={savingRecipe} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{savingRecipe ? '...' : '💾 Save'}</button>
              )}
              {user && isRecipeSaved() && <span style={{ background: c.accentDim, color: c.text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', flexShrink: 0 }}>✓ Saved</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: c.muted, marginTop: '8px' }}>
              {recipe.prepTime && <span>⏱ {recipe.prepTime}</span>}
              {recipe.cookTime && <span>🔥 {recipe.cookTime}</span>}
            </div>
            {!user && <button onClick={() => setShowAuth(true)} style={{ marginTop: '8px', background: 'none', border: 'none', color: c.accent, fontSize: '12px', cursor: 'pointer', padding: 0 }}>Sign in to save →</button>}
          </div>

          <Attribution recipe={recipe} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '12px', background: c.card, borderRadius: '10px', marginBottom: '20px', border: `1px solid ${c.border}` }}>
            <span style={{ fontSize: '12px', color: c.muted }}>Servings</span>
            <button onClick={() => adjustServings(servings - 1)} style={{ width: '28px', height: '28px', background: c.cardHover, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.text, fontSize: '14px', cursor: 'pointer' }}>−</button>
            <span style={{ fontSize: '16px', fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{servings}</span>
            <button onClick={() => adjustServings(servings + 1)} style={{ width: '28px', height: '28px', background: c.cardHover, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.text, fontSize: '14px', cursor: 'pointer' }}>+</button>
            {servings !== recipe.servings && <span style={{ fontSize: '10px', color: c.accent }}>scaled</span>}
          </div>

          <div style={{ display: 'flex', marginBottom: '16px', background: c.card, borderRadius: '10px', padding: '4px', border: `1px solid ${c.border}` }}>
            <button onClick={() => setPhase('prep')} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', background: phase === 'prep' ? c.accent : 'transparent', color: phase === 'prep' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>1. Prep {ingredientsDone > 0 && `(${ingredientsDone}/${recipe.ingredients?.length})`}</button>
            <button onClick={() => setPhase('cook')} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', background: phase === 'cook' ? c.accent : 'transparent', color: phase === 'cook' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>2. Cook {stepsDone > 0 && `(${stepsDone}/${recipe.steps?.length})`}</button>
          </div>

          {/* Prep Phase */}
          {phase === 'prep' && (
            <div>
              {ingredientsDone > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 14px', background: c.accentDim, borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px' }}>{ingredientsDone} of {recipe.ingredients?.length} gathered</span>
                  <button onClick={undoLastIngredient} style={{ background: 'none', border: 'none', color: c.text, fontSize: '12px', cursor: 'pointer', opacity: 0.8 }}>Undo</button>
                </div>
              )}
              {remainingIngredients.length > 0 && <p style={{ fontSize: '12px', color: c.muted, marginBottom: '12px', textAlign: 'center' }}>👆 Tap each ingredient as you set it out</p>}
              {remainingIngredients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: c.card, borderRadius: '12px', border: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>✅</span>
                  <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>All ingredients ready!</p>
                  <p style={{ fontSize: '13px', color: c.muted }}>Tap "Cook" to start</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {remainingIngredients.map(({ ing, i }, idx) => (
                    <div key={i} onClick={() => completeIngredient(i)} style={{ padding: '14px 16px', background: idx === 0 ? c.card : c.bg, borderRadius: '10px', border: `1px solid ${idx === 0 ? c.accent : c.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '22px', height: '22px', background: idx === 0 ? c.accent : c.cardHover, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: idx === 0 ? c.bg : c.muted }}>{idx + 1}</span>
                      <span style={{ fontSize: '14px', lineHeight: 1.5, color: idx === 0 ? c.text : c.muted }}>{scaleIngredient(ing)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cook Phase */}
          {phase === 'cook' && (
            <div>
              {stepsDone > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 14px', background: c.accentDim, borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px' }}>{stepsDone} of {recipe.steps?.length} done</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={undoLastStep} style={{ background: 'none', border: 'none', color: c.text, fontSize: '12px', cursor: 'pointer', opacity: 0.8 }}>Undo</button>
                    <button onClick={resetAll} style={{ background: 'none', border: 'none', color: c.text, fontSize: '12px', cursor: 'pointer', opacity: 0.8 }}>Reset</button>
                  </div>
                </div>
              )}
              {remainingSteps.length > 0 && <p style={{ fontSize: '12px', color: c.muted, marginBottom: '12px', textAlign: 'center' }}>👆 Tap each step when complete</p>}
              {remainingSteps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: c.card, borderRadius: '12px', border: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>🎉</span>
                  <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>All done!</p>
                  <p style={{ fontSize: '13px', color: c.muted, marginBottom: '12px' }}>Enjoy your meal</p>
                  
                  {/* Quick rating - only show if not rated this session */}
                  {!hasRatedThisSession && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '12px', color: c.dim, marginBottom: '4px' }}>How was mise?</p>
                      <QuickRating />
                    </div>
                  )}
                  {hasRatedThisSession && (
                    <p style={{ fontSize: '12px', color: c.accent, marginBottom: '16px' }}>Thanks for rating! 💚</p>
                  )}
                  
                  <button onClick={resetAll} style={{ background: c.cardHover, border: `1px solid ${c.border}`, color: c.text, padding: '10px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cook Again</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {remainingSteps.map(({ step, i }, idx) => {
                    const instruction = typeof step === 'object' ? step.instruction : step;
                    const stepIngredients = typeof step === 'object' ? step.ingredients : [];
                    return (
                      <div key={i} onClick={() => completeStep(i)} style={{ padding: '16px', background: idx === 0 ? c.card : c.bg, borderRadius: '12px', border: `1px solid ${idx === 0 ? c.accent : c.border}`, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ width: '24px', height: '24px', background: idx === 0 ? c.accent : c.cardHover, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: '600', color: idx === 0 ? c.bg : c.muted }}>{i + 1}</span>
                          <span style={{ fontSize: '14px', lineHeight: 1.6, color: idx === 0 ? c.text : c.muted }}>{instruction}</span>
                        </div>
                        {stepIngredients?.length > 0 && (
                          <div style={{ marginTop: '12px', marginLeft: '36px', padding: '10px 12px', background: c.ingredientBg, borderRadius: '8px', border: `1px solid ${c.ingredientBorder}` }}>
                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: c.accent, marginBottom: '6px', fontWeight: '600' }}>You'll need:</p>
                            {stepIngredients.map((ing, j) => <p key={j} style={{ fontSize: '13px', color: c.text, marginBottom: j < stepIngredients.length - 1 ? '4px' : 0, lineHeight: 1.4 }}>• {scaleIngredient(ing)}</p>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {recipe.tips?.length > 0 && recipe.tips[0] && (
            <div style={{ marginTop: '24px', background: `${c.warm}15`, padding: '14px 16px', borderRadius: '12px', borderLeft: `3px solid ${c.warm}` }}>
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: c.warm, marginBottom: '8px', fontWeight: '600' }}>💡 Tips</h3>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '13px', color: c.text, lineHeight: 1.5 }}>
                {recipe.tips.filter(t => t).map((tip, i) => <li key={i} style={{ marginBottom: '4px' }}>{tip}</li>)}
              </ul>
            </div>
          )}
          
          {/* Discreet feedback link at bottom of recipe */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button 
              onClick={() => setShowFeedback(true)} 
              style={{ background: 'none', border: 'none', color: c.dim, fontSize: '11px', cursor: 'pointer' }}
            >
              💡 Suggest a feature
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
