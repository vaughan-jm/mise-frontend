import React, { useState, useEffect, useRef } from 'react';
import { useUser, useAuth, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { api, setClerkGetToken, calculateRecipesRemaining, parseServingsToInt, QUOTAS } from './lib/api.js';
import { languages, getTranslations } from './lib/translations.js';

export default function Mise() {
  // Clerk hooks for authentication
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { getToken, signOut } = useAuth();

  // Local user state (synced from backend with subscription info)
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'

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
  const [recipesRemaining, setRecipesRemaining] = useState(10); // 10 free for anonymous users

  const [phase, setPhase] = useState('prep');
  const [completedIngredients, setCompletedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});

  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [plans, setPlans] = useState(null);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [isApiReady, setIsApiReady] = useState(false); // Guards API calls until token is ready

  // Feedback & Rating state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [hasRatedThisSession, setHasRatedThisSession] = useState(false);

  // Legal pages state (privacy, terms, refund)
  const [legalPage, setLegalPage] = useState(null); // null, 'privacy', 'terms', 'refund'

  // Contact form state
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');

  // Admin dashboard state
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminPage, setAdminPage] = useState(1);
  const [adminPagination, setAdminPagination] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  
  // Language state
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mise_language') || 'en';
    }
    return 'en';
  });
  

  // Translations imported from lib/translations.js
  const txt = getTranslations(language);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [translateToast, setTranslateToast] = useState(null); // { show: true, language: 'es' }
  const [translating, setTranslating] = useState(false);
  const [recipeLanguage, setRecipeLanguage] = useState('en'); // Track what language the recipe is in
  
  const translateRecipe = async (targetLang) => {
    if (!recipe || translating) return;
    setTranslating(true);
    
    const data = await api.post('/api/recipe/translate', { 
      recipe, 
      targetLanguage: targetLang 
    });
    
    if (data.error) {
      // If upgrade required, show the toast/pricing
      if (data.error === 'upgrade_required') {
        setTranslateToast({ show: true, language: targetLang });
        setTimeout(() => setTranslateToast(null), 8000);
      } else {
        console.error('Translation error:', data.error);
      }
    } else if (data.recipe) {
      setRecipe(data.recipe);
      setRecipeLanguage(targetLang);
    }
    setTranslating(false);
  };
  
  const changeLanguage = async (code) => {
    const oldLang = language;
    setLanguage(code);
    localStorage.setItem('mise_language', code);
    
    // If recipe is on screen and language changed
    if (recipe && code !== oldLang) {
      // Always try to translate - server will check if paid
      // This way if their subscription status changed, it still works
      translateRecipe(code);
    }
  };

  const topRef = useRef(null);

  // Loading messages are now in the translations object (txt.loadingUrl, txt.loadingPhoto, txt.loadingYoutube)
  const getLoadingMessages = () => {
    const messages = {
      en: {
        url: [
          "Scraping off the life story...", "Removing 47 pop-up ads...", "Skipping to the actual recipe...",
          "Evicting sponsored content...", "Finding the recipe under 3000 words of backstory...",
          "Deleting \"my grandmother once said...\"", "Bypassing the newsletter signup...",
          "Ignoring the Pinterest buttons...", "Shooing away auto-play videos...",
          "Translating food blogger to English...", "Rescuing recipe from SEO prison...",
          "Dodging the \"rate this recipe\" popup...", "Skipping the influencer's trip to Tuscany...",
          "Excavating the actual ingredients...", "Filtering out the Amazon affiliate links...",
          "Almost there, promise...",
        ],
        photo: [
          "Reading your cookbook...", "Deciphering handwritten notes...", "Squinting at that smudged ingredient...",
          "Converting grandma's pinch to grams...", "Digitizing deliciousness...", "Translating cookbook to app...",
          "Making sense of \"season to taste\"...", "Interpreting splash-stained pages...", "Extracting the good stuff...",
          "Decoding vintage measurements...", "Parsing that beautiful cursive...", "Almost ready to cook...",
        ],
        youtube: [
          "Watching the video for you...", "Skipping the 5-minute intro...", "Fast-forwarding through the sponsor...",
          "Catching all the 'pinch of this'...", "Noting the secret techniques...", "Pausing on the good parts...",
          "Translating hand gestures to measurements...", "Listening for hidden tips...", "Almost got the whole recipe...",
        ],
      },
      es: {
        url: [
          "Quitando la historia de vida...", "Eliminando 47 anuncios...", "Saltando a la receta...",
          "Sacando contenido patrocinado...", "Buscando la receta bajo 3000 palabras...",
          "Borrando \"mi abuela decía...\"", "Evitando el registro al boletín...",
          "Ignorando botones de Pinterest...", "Rescatando la receta...", "Casi listo, prometido...",
        ],
        photo: [
          "Leyendo tu libro de cocina...", "Descifrando notas manuscritas...", "Mirando ese ingrediente borroso...",
          "Convirtiendo el pellizco de la abuela a gramos...", "Digitalizando delicia...", "Casi listo para cocinar...",
        ],
        youtube: [
          "Viendo el video por ti...", "Saltando la intro de 5 minutos...", "Avanzando el patrocinio...",
          "Captando cada 'pizca de esto'...", "Notando las técnicas secretas...", "Casi tenemos la receta...",
        ],
      },
      fr: {
        url: [
          "Suppression de l'histoire de vie...", "Suppression de 47 publicités...", "Passage à la recette...",
          "Extraction du contenu sponsorisé...", "Recherche de la recette...", "Presque terminé...",
        ],
        photo: [
          "Lecture de votre livre de cuisine...", "Déchiffrage des notes manuscrites...", "Numérisation...", "Presque prêt...",
        ],
        youtube: [
          "Visionnage de la vidéo...", "Saut de l'intro de 5 minutes...", "Avance rapide du sponsor...", "Presque terminé...",
        ],
      },
      pt: {
        url: [
          "Removendo a história de vida...", "Removendo 47 anúncios...", "Pulando para a receita...",
          "Removendo conteúdo patrocinado...", "Encontrando a receita...", "Quase lá...",
        ],
        photo: [
          "Lendo seu livro de receitas...", "Decifrando notas manuscritas...", "Digitalizando...", "Quase pronto...",
        ],
        youtube: [
          "Assistindo o vídeo para você...", "Pulando a intro de 5 minutos...", "Avançando o patrocínio...", "Quase lá...",
        ],
      },
      zh: {
        url: [
          "正在跳过生活故事...", "正在删除47个弹窗广告...", "正在跳转到食谱...",
          "正在提取食谱...", "快好了...",
        ],
        photo: [
          "正在阅读您的食谱书...", "正在解读手写笔记...", "正在数字化...", "快好了...",
        ],
        youtube: [
          "正在为您观看视频...", "正在跳过5分钟的介绍...", "正在快进广告...", "快好了...",
        ],
      },
      hi: {
        url: [
          "जीवन कहानी हटा रहे हैं...", "47 पॉप-अप विज्ञापन हटा रहे हैं...", "रेसिपी पर जा रहे हैं...",
          "रेसिपी निकाल रहे हैं...", "लगभग हो गया...",
        ],
        photo: [
          "आपकी रसोई की किताब पढ़ रहे हैं...", "हस्तलिखित नोट्स पढ़ रहे हैं...", "डिजिटाइज़ कर रहे हैं...", "लगभग तैयार...",
        ],
        youtube: [
          "आपके लिए वीडियो देख रहे हैं...", "5 मिनट का इंट्रो छोड़ रहे हैं...", "विज्ञापन छोड़ रहे हैं...", "लगभग हो गया...",
        ],
      },
      ar: {
        url: [
          "إزالة قصة الحياة...", "إزالة 47 إعلان...", "الانتقال إلى الوصفة...",
          "استخراج الوصفة...", "تقريباً انتهينا...",
        ],
        photo: [
          "قراءة كتاب الطبخ...", "فك الملاحظات المكتوبة بخط اليد...", "الرقمنة...", "تقريباً جاهز...",
        ],
        youtube: [
          "مشاهدة الفيديو من أجلك...", "تخطي المقدمة...", "تخطي الإعلان...", "تقريباً انتهينا...",
        ],
      },
    };
    
    const lang = messages[language] || messages.en;
    return {
      url: lang.url || messages.en.url,
      photo: lang.photo || messages.en.photo,
      youtube: lang.youtube || messages.en.youtube,
    };
  };

  // Initialize Clerk token getter for API calls
  useEffect(() => {
    setClerkGetToken(getToken);
    setIsApiReady(true);
  }, [getToken]);

  // Sync Clerk user with backend when signed in (guarded by isApiReady to prevent race condition)
  useEffect(() => {
    if (!isClerkLoaded || !isApiReady) return;

    if (isSignedIn && clerkUser) {
      // User is signed in with Clerk, sync with backend
      api.get('/api/auth/me').then(data => {
        if (data.user) {
          setUser(data.user);
          setRecipesRemaining(calculateRecipesRemaining(data.user));
          loadSavedRecipes();
        }
      }).catch(err => {
        console.error('Failed to sync user:', err);
      });
    } else {
      // User is signed out
      setUser(null);
      setSavedRecipes([]);
      setRecipesRemaining(10); // Anonymous limit
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, isApiReady]);

  // Close auth modal when sign-in succeeds
  useEffect(() => {
    if (isSignedIn && showAuth) {
      setShowAuth(false);
    }
  }, [isSignedIn, showAuth]);

  // Load plans and ratings summary on mount
  useEffect(() => {
    // Load plans (v2 format) - keep full structure with monthly/yearly pricing
    api.get('/api/payments/plans').then(data => {
      // v2 returns { basic: {...}, pro: {...} } with nested monthly/yearly
      if (data.basic && data.pro) {
        setPlans({
          basic: {
            name: 'Basic',
            monthly: data.basic.monthly || { price: 1.99 },
            yearly: data.basic.yearly || { price: 14.99, savings: '37%' },
            features: data.basic.features || ['20 recipes per month', 'Recipe translation', 'Save recipes'],
          },
          pro: {
            name: 'Pro',
            monthly: data.pro.monthly || { price: 4.99 },
            yearly: data.pro.yearly || { price: 39.99, savings: '33%' },
            features: data.pro.features || ['Unlimited recipes', 'Recipe translation', 'Save recipes', 'Priority support'],
          },
        });
      }
    });

    // Load ratings summary (v2 format: { average, total, distribution })
    api.get('/api/feedback/ratings/summary').then(data => {
      if (data.average !== undefined && data.total !== undefined) {
        // Convert v2 format to display format
        setRatingsSummary({
          text: data.total > 0 ? `${data.average.toFixed(1)}★ (${data.total})` : null,
        });
      }
    });
  }, []);

  useEffect(() => {
    if (topRef.current && recipe) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [completedIngredients, completedSteps, phase]);

  useEffect(() => {
    if (!loading) { setLoadingIndex(0); return; }
    const loadingMessages = getLoadingMessages();
    const messages = inputMode === 'url' ? loadingMessages.url : inputMode === 'youtube' ? loadingMessages.youtube : loadingMessages.photo;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      setLoadingIndex(prev => { const next = prev + 1; if (next < messages.length) { setLoadingMessage(messages[next]); return next; } return prev; });
    }, 3000);
    return () => clearInterval(interval);
  }, [loading, inputMode, language]);

  const loadSavedRecipes = async () => {
    const data = await api.get('/api/recipes/saved');
    if (data.recipes) {
      // Transform snake_case from v2 backend to camelCase
      const transformed = data.recipes.map(r => ({
        id: r.id,
        title: r.title,
        servings: r.servings,
        prepTime: r.prep_time || r.prepTime,
        cookTime: r.cook_time || r.cookTime,
        imageUrl: r.image_url || r.imageUrl,
        ingredients: r.ingredients,
        steps: r.steps,
        tips: r.tips,
        source: r.source,
        sourceUrl: r.source_url || r.sourceUrl,
        author: r.author,
      }));
      setSavedRecipes(transformed);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setSavedRecipes([]);
    setShowSaved(false);
    setRecipesRemaining(10); // Back to anonymous limit
  };

  const submitContact = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Please fill in all fields');
      return;
    }
    setContactSending(true);
    setContactError('');
    try {
      const data = await api.post('/api/contact', {
        name: contactName,
        email: contactEmail,
        message: contactMessage,
      });
      if (data.error) {
        setContactError(data.error);
      } else {
        setContactSent(true);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
      }
    } catch (err) {
      setContactError('Failed to send. Please try again.');
    }
    setContactSending(false);
  };

  const handleUpgrade = async (plan) => {
    if (!user) { setShowAuth(true); setAuthMode('signin'); return; }
    setUpgradingPlan(plan);
    setError(''); // Clear any previous error
    try {
      // Build plan key with billing period (e.g., 'basic_monthly', 'pro_yearly')
      const planKey = `${plan}_${billingPeriod}`;
      const data = await api.post('/api/payments/create-checkout', { plan: planKey });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (err) {
      setError(txt.paymentError || 'Payment failed. Please try again.');
      setUpgradingPlan(null);
    }
  };

  const saveCurrentRecipe = async () => {
    if (!user || !recipe) return;
    setSavingRecipe(true);
    // v2 expects flat recipe object, not nested { recipe: {...} }
    await api.post('/api/recipes/save', {
      title: recipe.title,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tips: recipe.tips,
      source: recipe.source,
      sourceUrl: recipe.sourceUrl,
      author: recipe.author,
    });
    await loadSavedRecipes();
    setSavingRecipe(false);
  };

  const deleteRecipe = async (id) => { if (!user) return; await api.delete(`/api/recipes/${id}`); await loadSavedRecipes(); };

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
    const data = await api.post('/api/recipe/clean-url', { url, language });
    if (data.error) {
      if (data.requiresSignup) { setShowAuth(true); setAuthMode('signup'); }
      else if (data.upgrade) setShowPricing(true);
      setError(data.message || data.error);
    }
    else {
      setRecipe(data.recipe);
      setServings(parseServingsToInt(data.recipe.servings));
      // v2 doesn't return recipesRemaining, decrement locally
      setRecipesRemaining(prev => prev === Infinity ? Infinity : Math.max(0, prev - 1));
    }
    setLoading(false);
  };

  const processPhotos = async () => {
    if (!photos.length) { setError('Please add at least one photo'); return; }
    setLoading(true); setError(''); setRecipe(null); resetCookingState();
    const data = await api.post('/api/recipe/clean-photo', { photos, language });
    if (data.error) {
      if (data.requiresSignup) { setShowAuth(true); setAuthMode('signup'); }
      else if (data.upgrade) setShowPricing(true);
      setError(data.message || data.error);
    }
    else {
      setRecipe(data.recipe);
      setServings(parseServingsToInt(data.recipe.servings));
      // v2 doesn't return recipesRemaining, decrement locally
      setRecipesRemaining(prev => prev === Infinity ? Infinity : Math.max(0, prev - 1));
      setPhotos([]);
    }
    setLoading(false);
  };

  const processYoutube = async () => {
    if (!youtubeUrl.trim()) { setError('Please paste a YouTube URL'); return; }
    setLoading(true); setError(''); setRecipe(null); resetCookingState();
    const data = await api.post('/api/recipe/clean-youtube', { url: youtubeUrl, language });
    if (data.error) {
      if (data.requiresSignup) { setShowAuth(true); setAuthMode('signup'); }
      else if (data.upgrade) setShowPricing(true);
      setError(data.message || data.error);
    }
    else {
      setRecipe(data.recipe);
      setServings(parseServingsToInt(data.recipe.servings));
      // v2 doesn't return recipesRemaining, decrement locally
      setRecipesRemaining(prev => prev === Infinity ? Infinity : Math.max(0, prev - 1));
      setYoutubeUrl('');
    }
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

  // Match step ingredient name to full recipe ingredient (with amount)
  const findFullIngredient = (stepIng) => {
    if (!recipe?.ingredients) return stepIng;
    const stepIngLower = stepIng.toLowerCase().trim();
    // Try to find a matching full ingredient from recipe.ingredients
    const match = recipe.ingredients.find(fullIng => {
      const fullIngLower = fullIng.toLowerCase();
      return fullIngLower.includes(stepIngLower) || stepIngLower.includes(fullIngLower);
    });
    return match || stepIng;
  };

  // Feedback handlers
  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    await api.post('/api/feedback', { message: feedbackText, type: 'idea' });
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => { setShowFeedback(false); setFeedbackSent(false); }, 2000);
  };

  // Rating handler - instant, no submit button
  const submitRating = async (stars) => {
    setUserRating(stars);
    setHasRatedThisSession(true);
    // v2 uses /api/feedback/rating endpoint
    await api.post('/api/feedback/rating', { stars });
    // Refresh summary (v2 format: { average, total, distribution })
    const data = await api.get('/api/feedback/ratings/summary');
    if (data.average !== undefined && data.total !== undefined) {
      setRatingsSummary({
        text: data.total > 0 ? `${data.average.toFixed(1)}★ (${data.total})` : null,
      });
    }
  };

  // Admin dashboard functions
  const loadAdminData = async (page = 1) => {
    setAdminLoading(true);
    const [usersData, statsData] = await Promise.all([
      api.get(`/api/admin/users?page=${page}&limit=20`),
      api.get('/api/admin/stats'),
    ]);
    if (usersData.users) {
      setAdminUsers(usersData.users);
      setAdminPagination(usersData.pagination);
      setAdminPage(page);
    }
    if (statsData.totalUsers !== undefined) {
      setAdminStats(statsData);
    }
    setAdminLoading(false);
  };

  const openAdminDashboard = () => {
    setShowAdmin(true);
    loadAdminData(1);
  };

  const exportUsersCSV = async () => {
    const token = api.getToken();
    const res = await fetch(`${API_URL}/api/admin/users/export`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
    if (!recipe.source && !recipe.author && !recipe.sourceUrl) return null;

    const renderAttribution = () => {
      // Photo source - no link
      if (recipe.source === 'photo') {
        return <span style={{ color: c.muted }}>{txt.fromPhoto}</span>;
      }
      // YouTube source - link to video
      if (recipe.source === 'youtube') {
        return recipe.sourceUrl
          ? <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: c.accent, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{txt.fromYouTube}</a>
          : <span style={{ color: c.muted }}>{txt.fromYouTube}</span>;
      }
      // Has author - show author name with "view original" link
      if (recipe.author) {
        return (
          <>
            <span>{recipe.author}</span>
            {recipe.sourceUrl && (
              <span> · <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: c.accent, textDecoration: 'none', fontSize: '12px' }} onClick={e => e.stopPropagation()}>{txt.viewOriginal}</a></span>
            )}
          </>
        );
      }
      // No author but has URL - show "View original recipe" link
      if (recipe.sourceUrl) {
        return <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: c.accent, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{txt.viewOriginalRecipe}</a>;
      }
      return null;
    };

    return (
      <div style={{ padding: '12px 14px', background: c.card, borderRadius: '10px', border: `1px solid ${c.border}`, marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: c.muted, marginBottom: '6px' }}>{txt.originalRecipe}</p>
        <p style={{ fontSize: '14px', color: c.text, lineHeight: 1.4 }}>
          {renderAttribution()}
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

  // Legal pages (Privacy, Terms, Refund)
  if (legalPage) {
    const legalContent = {
      privacy: {
        title: 'Privacy Policy',
        lastUpdated: 'January 2025',
        content: [
          { heading: 'Information We Collect', text: 'We collect information you provide directly: email address when you create an account, recipe URLs you submit, and photos you upload for recipe extraction. We also collect usage data including browser fingerprints for anonymous users and basic analytics.' },
          { heading: 'How We Use Your Information', text: 'We use your information to: provide the recipe extraction service, manage your account and subscription, improve our AI models (anonymized data only), send transactional emails about your account, and respond to support requests.' },
          { heading: 'Data Storage', text: 'Your data is stored securely using industry-standard encryption. Recipes you save are stored until you delete them. We do not sell your personal information to third parties.' },
          { heading: 'Third-Party Services', text: 'We use trusted third-party services: Clerk for authentication, Stripe for payment processing, and Anthropic Claude for AI recipe extraction. Each service has their own privacy policy.' },
          { heading: 'Cookies', text: 'We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.' },
          { heading: 'Your Rights', text: 'You can: access your data through your account, delete your account and associated data at any time, export your saved recipes, and opt out of marketing communications.' },
          { heading: 'Contact', text: 'For privacy-related questions, contact us through the feedback form in the app.' },
        ],
      },
      terms: {
        title: 'Terms of Service',
        lastUpdated: 'January 2025',
        content: [
          { heading: 'Acceptance of Terms', text: 'By using Mise ("the Service"), you agree to these terms. If you do not agree, please do not use the Service.' },
          { heading: 'Service Description', text: 'Mise is a recipe extraction service that uses AI to clean and format recipes from websites, photos, and YouTube videos. The Service is provided "as is" without warranties.' },
          { heading: 'User Accounts', text: 'You are responsible for maintaining the security of your account. You must provide accurate information and are responsible for all activity under your account.' },
          { heading: 'Acceptable Use', text: 'You agree not to: abuse the Service or use it for illegal purposes, attempt to circumvent usage limits, scrape or automate access to the Service, or use extracted content in ways that violate copyright.' },
          { heading: 'Subscriptions', text: 'Paid subscriptions are billed monthly through Stripe. You can cancel at any time. Cancellations take effect at the end of the billing period.' },
          { heading: 'Content', text: 'Recipe content extracted from third-party sources remains the property of the original creators. Mise provides a formatting service only. You are responsible for respecting copyright when using extracted recipes.' },
          { heading: 'Limitation of Liability', text: 'Mise is not liable for: inaccuracies in extracted recipes, service interruptions, or damages arising from use of the Service. Use recipes at your own risk.' },
          { heading: 'Changes to Terms', text: 'We may update these terms. Continued use of the Service after changes constitutes acceptance of the new terms.' },
        ],
      },
      refund: {
        title: 'Refund Policy',
        lastUpdated: 'January 2025',
        content: [
          { heading: 'Subscription Refunds', text: 'We offer a 7-day money-back guarantee for new subscriptions. If you are not satisfied within the first 7 days, contact us for a full refund.' },
          { heading: 'How to Request a Refund', text: 'To request a refund, use the feedback form in the app or contact us within 7 days of your subscription start date. Include your account email.' },
          { heading: 'Processing Time', text: 'Refunds are processed within 5-10 business days. The refund will appear on the same payment method used for the original purchase.' },
          { heading: 'Partial Refunds', text: 'After the 7-day period, we do not offer partial refunds. You can cancel your subscription at any time, and it will remain active until the end of the billing period.' },
          { heading: 'Free Trial', text: 'If we offer a free trial, no payment is taken until the trial ends. You can cancel during the trial without any charge.' },
          { heading: 'Exceptions', text: 'We reserve the right to deny refunds in cases of abuse, fraud, or violation of our Terms of Service.' },
        ],
      },
    };

    const page = legalContent[legalPage];

    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, padding: '20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button onClick={() => setLegalPage(null)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>{txt.back}</button>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>{page.title}</h1>
          <p style={{ fontSize: '12px', color: c.muted, marginBottom: '32px' }}>Last updated: {page.lastUpdated}</p>
          {page.content.map((section, i) => (
            <div key={i} style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: c.text }}>{section.heading}</h2>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: c.muted }}>{section.text}</p>
            </div>
          ))}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: `1px solid ${c.border}`, textAlign: 'center' }}>
            <button onClick={() => setLegalPage(null)} style={{ background: c.accent, color: c.bg, border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>{txt.back}</button>
          </div>
        </div>
      </div>
    );
  }

  // Contact form modal
  if (showContact) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: c.card, borderRadius: '16px', padding: '24px', border: `1px solid ${c.border}` }}>
          <button onClick={() => { setShowContact(false); setContactSent(false); setContactError(''); }} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>{txt.back}</button>

          {contactSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '32px' }}>📬</span>
              <p style={{ fontSize: '16px', marginTop: '12px' }}>Message sent! We'll get back to you soon.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Contact Us</h2>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '16px', lineHeight: 1.5 }}>
                Have a question or need help? We typically respond within 24 hours.
              </p>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: '100%', padding: '12px', fontSize: '14px', marginBottom: '12px',
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px',
                  color: c.text, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="Your email"
                style={{
                  width: '100%', padding: '12px', fontSize: '14px', marginBottom: '12px',
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px',
                  color: c.text, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <textarea
                value={contactMessage}
                onChange={e => setContactMessage(e.target.value)}
                placeholder="How can we help?"
                style={{
                  width: '100%', height: '120px', padding: '12px', fontSize: '14px',
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px',
                  color: c.text, resize: 'none', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {contactError && <p style={{ color: c.error, fontSize: '13px', marginTop: '8px' }}>{contactError}</p>}
              <button
                onClick={submitContact}
                disabled={contactSending}
                style={{
                  width: '100%', marginTop: '12px', padding: '12px', fontSize: '14px', fontWeight: '500',
                  background: contactSending ? c.dim : c.accent, color: c.bg,
                  border: 'none', borderRadius: '8px', cursor: contactSending ? 'wait' : 'pointer',
                }}
              >
                {contactSending ? 'Sending...' : 'Send Message'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Feedback modal - minimal and friendly
  if (showFeedback) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: c.card, borderRadius: '16px', padding: '24px', border: `1px solid ${c.border}` }}>
          <button onClick={() => setShowFeedback(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>{txt.back}</button>

          {feedbackSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '32px' }}>💚</span>
              <p style={{ fontSize: '16px', marginTop: '12px' }}>{txt.thanksMessage}</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{txt.gotAnIdea}</h2>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '16px', lineHeight: 1.5 }}>
                {txt.feedbackDescription}
                {user?.email && <span style={{ display: 'block', marginTop: '4px', color: c.dim }}>{txt.feedbackNotify}</span>}
              </p>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder={txt.feedbackQuestion}
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
                {txt.sendFeedback}
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
        <button onClick={() => setShowPricing(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '20px' }}>{txt.back}</button>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <MiseLogo size={48} />
          <h2 style={{ fontSize: '22px', fontWeight: '600', margin: '16px 0 8px' }}>{txt.upgradePlan}</h2>
          <p style={{ color: c.muted, fontSize: '14px', marginBottom: '24px' }}>{txt.upgradeDescription}</p>

          {/* Billing period toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              style={{
                padding: '10px 20px',
                background: billingPeriod === 'monthly' ? c.accent : 'transparent',
                color: billingPeriod === 'monthly' ? c.bg : c.text,
                border: `1px solid ${billingPeriod === 'monthly' ? c.accent : c.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              style={{
                padding: '10px 20px',
                background: billingPeriod === 'yearly' ? c.accent : 'transparent',
                color: billingPeriod === 'yearly' ? c.bg : c.text,
                border: `1px solid ${billingPeriod === 'yearly' ? c.accent : c.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Yearly <span style={{ color: billingPeriod === 'yearly' ? c.bg : c.accent, fontSize: '12px', marginLeft: '4px' }}>Save 37%</span>
            </button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {['basic', 'pro'].map(plan => {
            const priceData = plans[plan]?.[billingPeriod] || {};
            return (
              <div key={plan} style={{ background: c.card, borderRadius: '12px', border: `1px solid ${plan === 'pro' ? c.accent : c.border}`, padding: '20px', marginBottom: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{plans[plan]?.name || plan}</h3>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '20px', fontWeight: '600' }}>
                      ${priceData.price || '?'}
                      <span style={{ fontSize: '14px', color: c.muted }}>/{billingPeriod === 'yearly' ? 'yr' : 'mo'}</span>
                    </span>
                    {billingPeriod === 'yearly' && priceData.savings && (
                      <div style={{ fontSize: '12px', color: c.accent, marginTop: '2px' }}>Save {priceData.savings}</div>
                    )}
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                  {(plans[plan]?.features || []).map((f, i) => <li key={i} style={{ fontSize: '13px', color: c.muted, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: c.accent }}>✓</span> {f}</li>)}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgradingPlan !== null}
                  style={{ width: '100%', padding: '12px', background: plan === 'pro' ? c.accent : c.cardHover, color: plan === 'pro' ? c.bg : c.text, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: upgradingPlan ? 'not-allowed' : 'pointer', opacity: upgradingPlan && upgradingPlan !== plan ? 0.6 : 1 }}
                >
                  {upgradingPlan === plan ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                      Loading...
                    </span>
                  ) : (plan === 'pro' ? txt.goPro : txt.getBasic)}
                </button>
              </div>
            );
          })}
          <p style={{ fontSize: '12px', color: c.dim, marginTop: '16px' }}>{txt.cancelAnytime}</p>
        </div>
      </div>
    );
  }

  // Auth modal (Clerk)
  if (showAuth) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAuth(false)}
            style={{
              position: 'absolute',
              top: '-40px',
              left: '0',
              background: 'none',
              border: 'none',
              color: c.muted,
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {txt.back}
          </button>
          {authMode === 'signup' ? (
            <SignUp
              signInUrl="#"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  card: { background: c.card, border: `1px solid ${c.border}` },
                }
              }}
            />
          ) : (
            <SignIn
              signUpUrl="#"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  card: { background: c.card, border: `1px solid ${c.border}` },
                }
              }}
            />
          )}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              style={{ background: 'none', border: 'none', color: c.accent, cursor: 'pointer', fontSize: '14px' }}
            >
              {authMode === 'signin' ? txt.needAccount + ' ' + txt.createAccount : txt.haveAccount + ' ' + txt.signIn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Saved recipes
  if (showSaved) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text }}>
        <header style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setShowSaved(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', padding: 0 }}>{txt.back}</button>
          <span style={{ fontSize: '13px', color: c.muted }}>{savedRecipes.length} {txt.recipes}</span>
        </header>
        <div style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>{txt.savedRecipes}</h2>
          {savedRecipes.length === 0 ? (
            <p style={{ color: c.muted, textAlign: 'center', padding: '40px 0' }}>{txt.noSavedRecipes}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {savedRecipes.map(r => (
                <div key={r.id} style={{ background: c.card, borderRadius: '10px', border: `1px solid ${c.border}`, overflow: 'hidden', display: 'flex' }}>
                  {r.imageUrl && <div style={{ width: '72px', height: '72px', flexShrink: 0, background: `url(${r.imageUrl}) center/cover` }} />}
                  <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px', lineHeight: 1.3 }}>{r.title}</h3>
                    <p style={{ fontSize: '11px', color: c.muted }}>{r.source || txt.cookbook}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${c.border}` }}>
                    <button onClick={() => loadRecipe(r)} style={{ flex: 1, padding: '0 14px', background: 'none', border: 'none', color: c.accent, fontSize: '12px', cursor: 'pointer', borderBottom: `1px solid ${c.border}` }}>{txt.cookRecipe}</button>
                    <button onClick={() => deleteRecipe(r.id)} style={{ flex: 1, padding: '0 14px', background: 'none', border: 'none', color: c.error, fontSize: '12px', cursor: 'pointer' }}>{txt.deleteRecipe}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (showAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text }}>
        <header style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setShowAdmin(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', padding: 0 }}>{txt.back}</button>
          <span style={{ fontSize: '13px', color: c.warm, fontWeight: '600' }}>Admin Dashboard</span>
        </header>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {/* Stats Cards */}
          {adminStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: c.card, borderRadius: '10px', padding: '16px', border: `1px solid ${c.border}` }}>
                <p style={{ fontSize: '11px', color: c.muted, marginBottom: '4px' }}>Total Users</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: c.text }}>{adminStats.totalUsers}</p>
              </div>
              <div style={{ background: c.card, borderRadius: '10px', padding: '16px', border: `1px solid ${c.border}` }}>
                <p style={{ fontSize: '11px', color: c.muted, marginBottom: '4px' }}>Free Tier</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: c.text }}>{adminStats.bySubscription.free}</p>
              </div>
              <div style={{ background: c.card, borderRadius: '10px', padding: '16px', border: `1px solid ${c.border}` }}>
                <p style={{ fontSize: '11px', color: c.muted, marginBottom: '4px' }}>Basic</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: c.accent }}>{adminStats.bySubscription.basic}</p>
              </div>
              <div style={{ background: c.card, borderRadius: '10px', padding: '16px', border: `1px solid ${c.border}` }}>
                <p style={{ fontSize: '11px', color: c.muted, marginBottom: '4px' }}>Pro</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: c.warm }}>{adminStats.bySubscription.pro}</p>
              </div>
              <div style={{ background: c.card, borderRadius: '10px', padding: '16px', border: `1px solid ${c.border}` }}>
                <p style={{ fontSize: '11px', color: c.muted, marginBottom: '4px' }}>Last 7 Days</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: c.text }}>{adminStats.recentSignups}</p>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Users</h2>
            <button
              onClick={exportUsersCSV}
              style={{
                background: c.accent,
                border: 'none',
                color: c.bg,
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
          </div>

          {/* Loading */}
          {adminLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: `2px solid ${c.border}`, borderTopColor: c.accent, borderRadius: '50%', margin: '0 auto', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}

          {/* Users Table */}
          {!adminLoading && adminUsers.length > 0 && (
            <>
              <div style={{ background: c.card, borderRadius: '10px', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', padding: '12px 16px', borderBottom: `1px solid ${c.border}`, background: c.cardHover }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: c.muted, textTransform: 'uppercase' }}>Email</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: c.muted, textTransform: 'uppercase' }}>Subscription</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: c.muted, textTransform: 'uppercase' }}>Joined</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: c.muted, textTransform: 'uppercase', textAlign: 'right' }}>Recipes</span>
                </div>
                {adminUsers.map((u) => (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', padding: '12px 16px', borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ fontSize: '13px', color: c.text, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: u.subscription === 'pro' ? c.warm : u.subscription === 'basic' ? c.accent : c.dim,
                      color: c.bg,
                      width: 'fit-content',
                      fontWeight: '500',
                    }}>{u.subscription || 'free'}</span>
                    <span style={{ fontSize: '12px', color: c.muted }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</span>
                    <span style={{ fontSize: '13px', color: c.text, textAlign: 'right' }}>{u.recipesUsed}</span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {adminPagination && adminPagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => loadAdminData(adminPage - 1)}
                    disabled={adminPage <= 1}
                    style={{
                      background: c.card,
                      border: `1px solid ${c.border}`,
                      color: adminPage <= 1 ? c.dim : c.text,
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: adminPage <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '8px 12px', fontSize: '12px', color: c.muted }}>
                    Page {adminPage} of {adminPagination.totalPages}
                  </span>
                  <button
                    onClick={() => loadAdminData(adminPage + 1)}
                    disabled={adminPage >= adminPagination.totalPages}
                    style={{
                      background: c.card,
                      border: `1px solid ${c.border}`,
                      color: adminPage >= adminPagination.totalPages ? c.dim : c.text,
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: adminPage >= adminPagination.totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!adminLoading && adminUsers.length === 0 && (
            <p style={{ color: c.muted, textAlign: 'center', padding: '40px 0' }}>No users found</p>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          {/* Language selector - discreet */}
          <select 
            value={language} 
            onChange={(e) => changeLanguage(e.target.value)}
            style={{ 
              background: c.card, 
              border: `1px solid ${c.border}`, 
              color: c.muted, 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '11px', 
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              minWidth: '42px',
              textAlign: 'center',
            }}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
          <span style={{ fontSize: '11px', color: c.muted, background: c.card, padding: '4px 8px', borderRadius: '4px' }}>
            {recipesRemaining === Infinity ? '∞' : recipesRemaining} {txt.recipesLeft}
          </span>
          {isSignedIn && user ? (
            <>
              {user.isAdmin && (
                <button onClick={openAdminDashboard} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.warm, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Admin</button>
              )}
              <button onClick={() => setShowSaved(true)} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>📚 {savedRecipes.length}</button>
              <UserButton />
            </>
          ) : (
            <button onClick={() => { setShowAuth(true); setAuthMode('signin'); }} style={{ background: c.accent, border: 'none', color: c.bg, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>{txt.signIn}</button>
          )}
        </div>
      </header>

      {/* Landing Page Content - Centered for mobile thumb accessibility */}
      {!recipe && !loading && (
        <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '60px' }}>
          {/* Input Section */}
          <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {/* Tab buttons - fixed height */}
            <div style={{ display: 'flex', marginBottom: '16px', background: c.card, borderRadius: '10px', padding: '4px', border: `1px solid ${c.border}` }}>
              <button onClick={() => setInputMode('url')} style={{ flex: 1, padding: '10px 8px', fontSize: '12px', fontWeight: '500', background: inputMode === 'url' ? c.accent : 'transparent', color: inputMode === 'url' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap' }}>🔗 {txt.pasteUrl}</button>
              <button onClick={() => setInputMode('photo')} style={{ flex: 1, padding: '10px 8px', fontSize: '12px', fontWeight: '500', background: inputMode === 'photo' ? c.accent : 'transparent', color: inputMode === 'photo' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap' }}>📷 {txt.snapPhoto}</button>
              <button onClick={() => setInputMode('youtube')} style={{ flex: 1, padding: '10px 8px', fontSize: '12px', fontWeight: '500', background: inputMode === 'youtube' ? c.accent : 'transparent', color: inputMode === 'youtube' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap' }}>▶️ {txt.youtube}</button>
            </div>

            {/* Hidden file input for photo mode */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />

            {/* Photo previews - shown above input row when photos selected */}
            {inputMode === 'photo' && photos.length > 0 && (
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {photos.map((photo, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={photo} alt={`Recipe ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${c.border}` }} />
                    <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: c.error, color: '#fff', border: 'none', borderRadius: '50%', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input row - consistent height across all modes */}
            <div style={{ display: 'flex', gap: '8px', height: '48px' }}>
              {inputMode === 'url' && (
                <>
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Recipe URL..." onKeyDown={e => e.key === 'Enter' && fetchFromUrl()} style={{ flex: 1, padding: '0 16px', fontSize: '15px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', color: c.text, outline: 'none', height: '100%', boxSizing: 'border-box' }} />
                  <button onClick={fetchFromUrl} style={{ padding: '0 20px', fontSize: '14px', fontWeight: '500', background: c.accent, color: c.bg, border: 'none', borderRadius: '10px', cursor: 'pointer', height: '100%' }}>{txt.clean}</button>
                </>
              )}
              {inputMode === 'photo' && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '0 16px', fontSize: '15px', background: c.card, color: c.text, border: `2px dashed ${c.border}`, borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '100%', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '16px' }}>📷</span> {photos.length === 0 ? txt.addPhotos : txt.addMore}
                  </button>
                  {photos.length > 0 && (
                    <button onClick={processPhotos} style={{ padding: '0 20px', fontSize: '14px', fontWeight: '500', background: c.accent, color: c.bg, border: 'none', borderRadius: '10px', cursor: 'pointer', height: '100%' }}>{txt.clean}</button>
                  )}
                </>
              )}
              {inputMode === 'youtube' && (
                <>
                  <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder={txt.pasteYoutube} onKeyDown={e => e.key === 'Enter' && processYoutube()} style={{ flex: 1, padding: '0 16px', fontSize: '15px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', color: c.text, outline: 'none', height: '100%', boxSizing: 'border-box' }} />
                  <button onClick={processYoutube} style={{ padding: '0 20px', fontSize: '14px', fontWeight: '500', background: c.accent, color: c.bg, border: 'none', borderRadius: '10px', cursor: 'pointer', height: '100%' }}>{txt.clean}</button>
                </>
              )}
            </div>

            {/* Helper text - consistent height, always present */}
            <p style={{ fontSize: '12px', color: c.dim, textAlign: 'center', marginTop: '12px', lineHeight: 1.5, minHeight: '18px', visibility: inputMode === 'url' ? 'hidden' : 'visible' }}>
              {inputMode === 'photo' ? txt.uploadOrSnap : txt.youtubeHelper}
            </p>

            {error && <p style={{ textAlign: 'center', color: c.error, marginTop: '12px', fontSize: '13px' }}>{error}</p>}
          </div>

          {/* Empty State Hero */}
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '300', marginBottom: '8px', letterSpacing: '-0.5px' }}>{txt.justTheRecipe}</h1>
            <p style={{ fontSize: '14px', color: c.muted, maxWidth: '280px', margin: '0 auto', lineHeight: 1.6 }}>{txt.worksWithAny}</p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!isSignedIn && <button onClick={() => { setShowAuth(true); setAuthMode('signin'); }} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '10px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>{txt.signIn}</button>}
              <button onClick={() => setShowPricing(true)} style={{ background: 'none', border: 'none', color: c.accent, fontSize: '13px', cursor: 'pointer' }}>{txt.upgrade} →</button>
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
              {txt.gotFeatureIdea}
            </button>

            {/* Footer with legal links */}
            <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <button onClick={() => setLegalPage('privacy')} style={{ background: 'none', border: 'none', color: c.dim, fontSize: '11px', cursor: 'pointer' }}>Privacy</button>
              <button onClick={() => setLegalPage('terms')} style={{ background: 'none', border: 'none', color: c.dim, fontSize: '11px', cursor: 'pointer' }}>Terms</button>
              <button onClick={() => setLegalPage('refund')} style={{ background: 'none', border: 'none', color: c.dim, fontSize: '11px', cursor: 'pointer' }}>Refunds</button>
              <button onClick={() => setShowContact(true)} style={{ background: 'none', border: 'none', color: c.dim, fontSize: '11px', cursor: 'pointer' }}>Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: `2px solid ${c.border}`, borderTopColor: c.accent, borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: c.text, fontSize: '15px', marginBottom: '8px', minHeight: '24px' }}>{loadingMessage}</p>
          <p style={{ color: c.muted, fontSize: '12px' }}>{inputMode === 'url' ? txt.usuallySeconds : txt.usuallySecondsPhoto} ☕</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Translation Toast for Free Users */}
      {translateToast?.show && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: c.card, 
          border: `1px solid ${c.border}`,
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '340px',
          width: '90%',
        }}>
          <span style={{ fontSize: '24px' }}>🌍</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', color: c.text, fontWeight: '500', marginBottom: '2px' }}>
              {txt.translateTo} {languages.find(l => l.code === translateToast.language)?.name || translateToast.language}?
            </p>
            <p style={{ fontSize: '12px', color: c.muted }}>
              {txt.upgradeTranslation}
            </p>
          </div>
          <button 
            onClick={() => { setTranslateToast(null); setShowPricing(true); }}
            style={{ 
              background: c.accent, 
              color: c.bg, 
              border: 'none', 
              padding: '8px 14px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            $1.99/mo
          </button>
          <button 
            onClick={() => setTranslateToast(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: c.muted, 
              fontSize: '18px', 
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Recipe Display */}
      {recipe && !loading && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '16px', position: 'relative' }}>
          {/* Translating overlay */}
          {translating && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `${c.bg}dd`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '12px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: `2px solid ${c.border}`, borderTopColor: c.accent, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.7s linear infinite' }} />
                <p style={{ color: c.text, fontSize: '14px' }}>{txt.translating}</p>
              </div>
            </div>
          )}
          <div ref={topRef} />
          <button onClick={() => { setRecipe(null); setUrl(''); setRecipeLanguage('en'); }} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '13px', cursor: 'pointer', marginBottom: '12px', padding: 0 }}>{txt.newRecipe}</button>

          {recipe.imageUrl && <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', background: `url(${recipe.imageUrl}) center/cover` }} />}

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, lineHeight: 1.3 }}>{recipe.title}</h2>
              {user && !isRecipeSaved() && (
                <button onClick={saveCurrentRecipe} disabled={savingRecipe} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{savingRecipe ? txt.saving : `💾 ${txt.save}`}</button>
              )}
              {user && isRecipeSaved() && <span style={{ background: c.accentDim, color: c.text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', flexShrink: 0 }}>✓ {txt.saved}</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: c.muted, marginTop: '8px' }}>
              {recipe.prepTime && <span>⏱ {recipe.prepTime}</span>}
              {recipe.cookTime && <span>🔥 {recipe.cookTime}</span>}
            </div>
            {!isSignedIn && <button onClick={() => { setShowAuth(true); setAuthMode('signup'); }} style={{ marginTop: '8px', background: 'none', border: 'none', color: c.accent, fontSize: '12px', cursor: 'pointer', padding: 0 }}>{txt.signInToSave}</button>}
          </div>

          <Attribution recipe={recipe} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '12px', background: c.card, borderRadius: '10px', marginBottom: '20px', border: `1px solid ${c.border}` }}>
            <span style={{ fontSize: '12px', color: c.muted }}>{txt.servings}</span>
            <button onClick={() => adjustServings(servings - 1)} style={{ width: '28px', height: '28px', background: c.cardHover, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.text, fontSize: '14px', cursor: 'pointer' }}>−</button>
            <span style={{ fontSize: '16px', fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{servings}</span>
            <button onClick={() => adjustServings(servings + 1)} style={{ width: '28px', height: '28px', background: c.cardHover, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.text, fontSize: '14px', cursor: 'pointer' }}>+</button>
            {servings !== recipe.servings && <span style={{ fontSize: '10px', color: c.accent }}>{txt.scaled}</span>}
          </div>

          <div style={{ display: 'flex', marginBottom: '16px', background: c.card, borderRadius: '10px', padding: '4px', border: `1px solid ${c.border}` }}>
            <button onClick={() => setPhase('prep')} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', background: phase === 'prep' ? c.accent : 'transparent', color: phase === 'prep' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{txt.prepNum} {ingredientsDone > 0 && `(${ingredientsDone}/${recipe.ingredients?.length})`}</button>
            <button onClick={() => setPhase('cook')} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', background: phase === 'cook' ? c.accent : 'transparent', color: phase === 'cook' ? c.bg : c.muted, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{txt.cookNum} {stepsDone > 0 && `(${stepsDone}/${recipe.steps?.length})`}</button>
          </div>

          {/* Prep Phase */}
          {phase === 'prep' && (
            <div>
              {ingredientsDone > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 14px', background: c.accentDim, borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px' }}>{ingredientsDone} {txt.of} {recipe.ingredients?.length} {txt.gathered}</span>
                  <button onClick={undoLastIngredient} style={{ background: 'none', border: 'none', color: c.text, fontSize: '12px', cursor: 'pointer', opacity: 0.8 }}>{txt.undo}</button>
                </div>
              )}
              {remainingIngredients.length > 0 && <p style={{ fontSize: '12px', color: c.muted, marginBottom: '12px', textAlign: 'center' }}>{txt.tapIngredient}</p>}
              {remainingIngredients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: c.card, borderRadius: '12px', border: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>✅</span>
                  <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>{txt.allGathered}</p>
                  <p style={{ fontSize: '13px', color: c.muted }}>{txt.startCooking}</p>
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
                  <span style={{ fontSize: '12px' }}>{stepsDone} {txt.of} {recipe.steps?.length}</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={undoLastStep} style={{ background: 'none', border: 'none', color: c.text, fontSize: '12px', cursor: 'pointer', opacity: 0.8 }}>{txt.undo}</button>
                    <button onClick={resetAll} style={{ background: 'none', border: 'none', color: c.text, fontSize: '12px', cursor: 'pointer', opacity: 0.8 }}>{txt.reset}</button>
                  </div>
                </div>
              )}
              {remainingSteps.length > 0 && <p style={{ fontSize: '12px', color: c.muted, marginBottom: '12px', textAlign: 'center' }}>{txt.tapStep}</p>}
              {remainingSteps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: c.card, borderRadius: '12px', border: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>🎉</span>
                  <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>{txt.allDone}</p>
                  <p style={{ fontSize: '13px', color: c.muted, marginBottom: '12px' }}></p>
                  
                  {/* Quick rating - only show if not rated this session */}
                  {!hasRatedThisSession && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '12px', color: c.dim, marginBottom: '4px' }}>{txt.rateExperience}</p>
                      <QuickRating />
                    </div>
                  )}
                  {hasRatedThisSession && (
                    <p style={{ fontSize: '12px', color: c.accent, marginBottom: '16px' }}>{txt.thanksRating} 💚</p>
                  )}
                  
                  <button onClick={resetAll} style={{ background: c.cardHover, border: `1px solid ${c.border}`, color: c.text, padding: '10px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>{txt.cookAgain}</button>
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
                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: c.accent, marginBottom: '6px', fontWeight: '600' }}>{txt.youllNeed}</p>
                            {stepIngredients.map((ing, j) => <p key={j} style={{ fontSize: '13px', color: c.text, marginBottom: j < stepIngredients.length - 1 ? '4px' : 0, lineHeight: 1.4 }}>• {scaleIngredient(findFullIngredient(ing))}</p>)}
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
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: c.warm, marginBottom: '8px', fontWeight: '600' }}>💡 {txt.tips}</h3>
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
              {txt.suggestFeature}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
