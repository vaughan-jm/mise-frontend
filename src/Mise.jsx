import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Generate browser fingerprint for anonymous tracking
const getFingerprint = () => {
  const stored = localStorage.getItem('mise_fingerprint');
  if (stored) return stored;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasData.slice(-50)
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const fingerprint = 'fp_' + Math.abs(hash).toString(36);
  localStorage.setItem('mise_fingerprint', fingerprint);
  return fingerprint;
};

// Quota limits (must match backend config)
const QUOTAS = {
  anonymous: 10,
  free: 3,
  basic: 20,
  pro: Infinity,
};

// Helper to normalize v2 API errors to v1 format
const normalizeError = (data) => {
  if (data.error && typeof data.error === 'object') {
    // V2 format: { error: { code, message, details } }
    const { code, message } = data.error;
    return {
      error: message,
      code,
      // Map error codes to v1-style flags
      requiresSignup: code === 'QUOTA_EXCEEDED' && message.includes('sign up'),
      upgrade: code === 'QUOTA_EXCEEDED' || code === 'FORBIDDEN',
      message,
    };
  }
  // Already v1 format or no error
  return data;
};

// Helper to calculate recipesRemaining from user data
const calculateRecipesRemaining = (user) => {
  if (!user) return QUOTAS.anonymous;
  const sub = (user.subscription || 'free').toLowerCase();
  const limit = QUOTAS[sub] || QUOTAS.free;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - (user.recipesUsedThisMonth || 0));
};

// Helper to parse servings to integer
const parseServingsToInt = (servings) => {
  if (servings === undefined || servings === null) return 4;
  const parsed = parseInt(String(servings).replace(',', '.'), 10);
  return isNaN(parsed) || parsed < 1 ? 4 : parsed;
};

// API with token-based auth
const api = {
  getToken: () => localStorage.getItem('mise_token'),
  setToken: (token) => token ? localStorage.setItem('mise_token', token) : localStorage.removeItem('mise_token'),

  async post(path, body = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Add fingerprint for anonymous tracking
    if (!token) body.fingerprint = getFingerprint();

    const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json();
    return normalizeError(data);
  },
  async get(path) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { headers });
    const data = await res.json();
    return normalizeError(data);
  },
  async delete(path) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers });
    const data = await res.json();
    return normalizeError(data);
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
  const [recipesRemaining, setRecipesRemaining] = useState(10); // 10 free for anonymous users

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
  
  // Language state
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mise_language') || 'en';
    }
    return 'en';
  });
  
  const languages = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'pt', label: 'PT', name: 'Português' },
    { code: 'zh', label: '中文', name: 'Chinese' },
    { code: 'hi', label: 'हिं', name: 'Hindi' },
    { code: 'ar', label: 'عر', name: 'Arabic' },
  ];
  
  // UI Translations
  const t = {
    en: {
      justTheRecipe: 'just the recipe',
      pasteUrl: 'Paste URL',
      snapPhoto: 'Photo',
      youtube: 'Video',
      recipesLeft: 'left',
      signIn: 'Sign In',
      logout: 'Logout',
      clean: 'Clean',
      addPhotos: 'Add photos',
      addMore: 'Add more',
      worksWithAny: 'Works with any recipe website',
      uploadOrSnap: 'Snap or upload recipe photos',
      pasteYoutube: 'YouTube video URL...',
      youtubeHelper: 'Works with cooking videos',
      prep: 'Prep',
      cook: 'Cook',
      servings: 'Servings',
      viewSource: 'View source',
      save: 'Save',
      saved: 'Saved',
      saving: 'Saving...',
      upgrade: 'Upgrade',
      cookAgain: 'Cook Again',
      youllNeed: "You'll need:",
      tips: 'Tips',
      suggestFeature: 'Suggest a feature',
      savedRecipes: 'Saved Recipes',
      close: 'Close',
      noSavedRecipes: 'No saved recipes yet',
      createAccount: 'Create Account',
      welcomeBack: 'Welcome back',
      email: 'Email',
      password: 'Password',
      needAccount: "Need an account?",
      haveAccount: 'Have an account?',
      free: 'Free',
      recipes: 'recipes',
      month: 'month',
      unlimited: 'Unlimited',
      current: 'Current',
      choosePlan: 'Choose Plan',
      rateExperience: 'How was your cooking experience?',
      feedbackPlaceholder: "What feature would make mise better for you?",
      sendFeedback: 'Send',
      thanksFeedback: 'Thanks for your feedback!',
      newRecipe: '← New recipe',
      signInToSave: 'Sign in to save →',
      scaled: 'scaled',
      gathered: 'gathered',
      of: 'of',
      undo: 'Undo',
      tapIngredient: '👆 Tap each ingredient as you set it out',
      allGathered: '✓ All ingredients gathered!',
      startCooking: 'Start Cooking →',
      tapStep: '👆 Tap each step as you complete it',
      allDone: '🎉 Done! Enjoy your meal!',
      gotFeatureIdea: '💡 Got a feature idea?',
      usuallySeconds: 'Usually 15-25 seconds',
      usuallySecondsPhoto: 'Usually 20-30 seconds',
      back: '← Back',
      deleteRecipe: 'Delete',
      cookRecipe: 'Cook',
      originalRecipe: 'Original recipe',
      viewOriginal: 'view original',
      viewOriginalRecipe: 'View original recipe',
      fromPhoto: 'From photo',
      fromYouTube: 'From YouTube video',
      thanksMessage: 'Thanks! We read every message.',
      gotAnIdea: 'Got an idea?',
      feedbackDescription: 'We ship updates weekly. Your suggestions become features.',
      feedbackNotify: "We'll notify you when we build it.",
      feedbackQuestion: 'What would make mise better?',
      upgradePlan: 'Upgrade your plan',
      upgradeDescription: 'Clean more recipes, save them forever',
      goPro: 'Go Pro',
      getBasic: 'Get Basic',
      cancelAnytime: 'Cancel anytime. Secure payment via Stripe.',
      signInAccess: 'Sign in to access saved recipes',
      getFreeRecipes: 'Get 3 free recipes every month',
      or: 'or',
      trustMessage: 'We never share your email or data. Secure payments via Stripe. Cancel anytime.',
      cookbook: 'Cookbook',
      pasteRecipeUrl: 'Paste recipe URL...',
      translateTo: 'Translate to',
      upgradeTranslation: 'Upgrade for instant recipe translation',
      translating: 'Translating...',
      reset: 'Reset',
      thanksRating: 'Thanks for rating!',
      stepNum: 'Step',
      prepNum: '1. Prep',
      cookNum: '2. Cook',
    },
    es: {
      justTheRecipe: 'solo la receta',
      pasteUrl: 'Pegar URL',
      snapPhoto: 'Foto',
      youtube: 'Video',
      recipesLeft: 'restantes',
      signIn: 'Iniciar',
      logout: 'Salir',
      clean: 'Limpiar',
      addPhotos: 'Añadir fotos',
      addMore: 'Añadir más',
      worksWithAny: 'Funciona con cualquier sitio de recetas',
      uploadOrSnap: 'Sube o fotografía recetas',
      pasteYoutube: 'URL de video YouTube...',
      youtubeHelper: 'Funciona con videos de cocina',
      prep: 'Prep',
      cook: 'Cocinar',
      servings: 'Porciones',
      viewSource: 'Ver fuente',
      save: 'Guardar',
      saved: 'Guardado',
      saving: 'Guardando...',
      upgrade: 'Mejorar',
      cookAgain: 'Cocinar de nuevo',
      youllNeed: 'Necesitarás:',
      tips: 'Consejos',
      suggestFeature: 'Sugerir función',
      savedRecipes: 'Recetas guardadas',
      close: 'Cerrar',
      noSavedRecipes: 'Aún no hay recetas guardadas',
      createAccount: 'Crear cuenta',
      welcomeBack: 'Bienvenido de nuevo',
      email: 'Correo',
      password: 'Contraseña',
      needAccount: '¿Necesitas una cuenta?',
      haveAccount: '¿Tienes cuenta?',
      free: 'Gratis',
      recipes: 'recetas',
      month: 'mes',
      unlimited: 'Ilimitado',
      current: 'Actual',
      choosePlan: 'Elegir plan',
      rateExperience: '¿Cómo fue tu experiencia cocinando?',
      feedbackPlaceholder: '¿Qué función mejoraría mise para ti?',
      sendFeedback: 'Enviar',
      thanksFeedback: '¡Gracias por tu opinión!',
      newRecipe: '← Nueva receta',
      signInToSave: 'Inicia sesión para guardar →',
      scaled: 'escalado',
      gathered: 'reunidos',
      of: 'de',
      undo: 'Deshacer',
      tapIngredient: '👆 Toca cada ingrediente al prepararlo',
      allGathered: '✓ ¡Todos los ingredientes listos!',
      startCooking: 'Empezar a cocinar →',
      tapStep: '👆 Toca cada paso al completarlo',
      allDone: '🎉 ¡Listo! ¡Buen provecho!',
      gotFeatureIdea: '💡 ¿Tienes una idea?',
      usuallySeconds: 'Generalmente 15-25 segundos',
      usuallySecondsPhoto: 'Generalmente 20-30 segundos',
      back: '← Volver',
      deleteRecipe: 'Eliminar',
      cookRecipe: 'Cocinar',
      originalRecipe: 'Receta original',
      viewOriginal: 'ver original',
      viewOriginalRecipe: 'Ver receta original',
      fromPhoto: 'De foto',
      fromYouTube: 'De video de YouTube',
      thanksMessage: '¡Gracias! Leemos cada mensaje.',
      gotAnIdea: '¿Tienes una idea?',
      feedbackDescription: 'Lanzamos actualizaciones semanalmente. Tus sugerencias se convierten en funciones.',
      feedbackNotify: 'Te notificaremos cuando lo construyamos.',
      feedbackQuestion: '¿Qué mejoraría mise para ti?',
      upgradePlan: 'Mejora tu plan',
      upgradeDescription: 'Limpia más recetas, guárdalas para siempre',
      goPro: 'Hazte Pro',
      getBasic: 'Obtener Básico',
      cancelAnytime: 'Cancela cuando quieras. Pago seguro vía Stripe.',
      signInAccess: 'Inicia sesión para acceder a recetas guardadas',
      getFreeRecipes: 'Obtén 3 recetas gratis cada mes',
      or: 'o',
      trustMessage: 'Nunca compartimos tu correo ni datos. Pagos seguros vía Stripe. Cancela cuando quieras.',
      cookbook: 'Libro de cocina',
      pasteRecipeUrl: 'Pega la URL de la receta...',
      translateTo: 'Traducir a',
      upgradeTranslation: 'Mejora para traducción instantánea de recetas',
      translating: 'Traduciendo...',
      reset: 'Reiniciar',
      thanksRating: '¡Gracias por calificar!',
      stepNum: 'Paso',
      prepNum: '1. Prep',
      cookNum: '2. Cocinar',
    },
    fr: {
      justTheRecipe: 'juste la recette',
      pasteUrl: 'Coller URL',
      snapPhoto: 'Photo',
      youtube: 'Vidéo',
      recipesLeft: 'restantes',
      signIn: 'Connexion',
      logout: 'Déconnexion',
      clean: 'Nettoyer',
      addPhotos: 'Ajouter photos',
      addMore: 'Ajouter plus',
      worksWithAny: 'Fonctionne avec tous les sites de recettes',
      uploadOrSnap: 'Photo ou téléchargez recettes',
      pasteYoutube: 'URL vidéo YouTube...',
      youtubeHelper: 'Fonctionne avec vidéos de cuisine',
      prep: 'Prép',
      cook: 'Cuisson',
      servings: 'portions',
      viewSource: 'Voir source',
      save: 'Sauver',
      saved: 'Sauvé',
      saving: 'Sauvegarde...',
      upgrade: 'Améliorer',
      cookAgain: 'Recuisiner',
      youllNeed: 'Vous aurez besoin:',
      tips: 'Conseils',
      suggestFeature: 'Suggérer une fonction',
      savedRecipes: 'Recettes sauvées',
      close: 'Fermer',
      noSavedRecipes: 'Pas encore de recettes sauvées',
      createAccount: 'Créer un compte',
      welcomeBack: 'Bienvenue',
      email: 'Email',
      password: 'Mot de passe',
      needAccount: 'Besoin d\'un compte?',
      haveAccount: 'Déjà un compte?',
      free: 'Gratuit',
      recipes: 'recettes',
      month: 'mois',
      unlimited: 'Illimité',
      current: 'Actuel',
      choosePlan: 'Choisir',
      rateExperience: 'Comment était votre expérience?',
      feedbackPlaceholder: 'Quelle fonction améliorerait mise?',
      sendFeedback: 'Envoyer',
      thanksFeedback: 'Merci pour votre avis!',
      newRecipe: '← Nouvelle recette',
      signInToSave: 'Connectez-vous pour sauver →',
      scaled: 'ajusté',
      gathered: 'rassemblés',
      of: 'de',
      undo: 'Annuler',
      tapIngredient: '👆 Appuyez sur chaque ingrédient au fur et à mesure',
      allGathered: '✓ Tous les ingrédients rassemblés!',
      startCooking: 'Commencer à cuisiner →',
      tapStep: '👆 Appuyez sur chaque étape une fois terminée',
      allDone: '🎉 Terminé! Bon appétit!',
      gotFeatureIdea: '💡 Une idée de fonctionnalité?',
      usuallySeconds: 'Généralement 15-25 secondes',
      usuallySecondsPhoto: 'Généralement 20-30 secondes',
      back: '← Retour',
      deleteRecipe: 'Supprimer',
      cookRecipe: 'Cuisiner',
      originalRecipe: 'Recette originale',
      viewOriginal: 'voir l\'original',
      viewOriginalRecipe: 'Voir la recette originale',
      fromPhoto: 'Depuis une photo',
      fromYouTube: 'Depuis une vidéo YouTube',
      thanksMessage: 'Merci! Nous lisons chaque message.',
      gotAnIdea: 'Une idée?',
      feedbackDescription: 'Nous publions des mises à jour chaque semaine. Vos suggestions deviennent des fonctionnalités.',
      feedbackNotify: 'Nous vous informerons quand ce sera prêt.',
      feedbackQuestion: "Qu'est-ce qui améliorerait mise?",
      upgradePlan: 'Améliorez votre plan',
      upgradeDescription: 'Nettoyez plus de recettes, sauvegardez-les pour toujours',
      goPro: 'Passer Pro',
      getBasic: 'Obtenir Basic',
      cancelAnytime: 'Annulez quand vous voulez. Paiement sécurisé via Stripe.',
      signInAccess: 'Connectez-vous pour accéder aux recettes sauvées',
      getFreeRecipes: 'Obtenez 3 recettes gratuites par mois',
      or: 'ou',
      trustMessage: 'Nous ne partageons jamais votre email ou vos données. Paiements sécurisés via Stripe. Annulez quand vous voulez.',
      cookbook: 'Livre de cuisine',
      pasteRecipeUrl: 'Collez l\'URL de la recette...',
      translateTo: 'Traduire en',
      upgradeTranslation: 'Améliorez pour la traduction instantanée',
      translating: 'Traduction...',
      reset: 'Réinitialiser',
      thanksRating: 'Merci pour votre note!',
      stepNum: 'Étape',
      prepNum: '1. Prép',
      cookNum: '2. Cuisson',
    },
    pt: {
      justTheRecipe: 'só a receita',
      pasteUrl: 'Colar URL',
      snapPhoto: 'Foto',
      youtube: 'Vídeo',
      recipesLeft: 'restantes',
      signIn: 'Entrar',
      logout: 'Sair',
      clean: 'Limpar',
      addPhotos: 'Adicionar fotos',
      addMore: 'Adicionar mais',
      worksWithAny: 'Funciona com qualquer site de receitas',
      uploadOrSnap: 'Envie ou fotografe receitas',
      pasteYoutube: 'URL do vídeo YouTube...',
      youtubeHelper: 'Funciona com vídeos de culinária',
      prep: 'Prep',
      cook: 'Cozinhar',
      servings: 'porções',
      viewSource: 'Ver fonte',
      save: 'Salvar',
      saved: 'Salvo',
      saving: 'Salvando...',
      upgrade: 'Melhorar',
      cookAgain: 'Cozinhar novamente',
      youllNeed: 'Você vai precisar:',
      tips: 'Dicas',
      suggestFeature: 'Sugerir função',
      savedRecipes: 'Receitas salvas',
      close: 'Fechar',
      noSavedRecipes: 'Nenhuma receita salva ainda',
      createAccount: 'Criar conta',
      welcomeBack: 'Bem-vindo de volta',
      email: 'Email',
      password: 'Senha',
      needAccount: 'Precisa de uma conta?',
      haveAccount: 'Tem uma conta?',
      free: 'Grátis',
      recipes: 'receitas',
      month: 'mês',
      unlimited: 'Ilimitado',
      current: 'Atual',
      choosePlan: 'Escolher',
      rateExperience: 'Como foi sua experiência?',
      feedbackPlaceholder: 'Que função melhoraria o mise?',
      sendFeedback: 'Enviar',
      thanksFeedback: 'Obrigado pelo feedback!',
      newRecipe: '← Nova receita',
      signInToSave: 'Entre para salvar →',
      scaled: 'ajustado',
      gathered: 'reunidos',
      of: 'de',
      undo: 'Desfazer',
      tapIngredient: '👆 Toque em cada ingrediente ao prepará-lo',
      allGathered: '✓ Todos os ingredientes reunidos!',
      startCooking: 'Começar a cozinhar →',
      tapStep: '👆 Toque em cada passo ao completá-lo',
      allDone: '🎉 Pronto! Bom apetite!',
      gotFeatureIdea: '💡 Tem uma ideia?',
      usuallySeconds: 'Geralmente 15-25 segundos',
      usuallySecondsPhoto: 'Geralmente 20-30 segundos',
      back: '← Voltar',
      deleteRecipe: 'Excluir',
      cookRecipe: 'Cozinhar',
      originalRecipe: 'Receita original',
      viewOriginal: 'ver original',
      viewOriginalRecipe: 'Ver receita original',
      fromPhoto: 'Da foto',
      fromYouTube: 'Do vídeo do YouTube',
      thanksMessage: 'Obrigado! Lemos cada mensagem.',
      gotAnIdea: 'Tem uma ideia?',
      feedbackDescription: 'Lançamos atualizações semanalmente. Suas sugestões viram funcionalidades.',
      feedbackNotify: 'Vamos notificá-lo quando construirmos.',
      feedbackQuestion: 'O que melhoraria o mise?',
      upgradePlan: 'Melhore seu plano',
      upgradeDescription: 'Limpe mais receitas, salve-as para sempre',
      goPro: 'Seja Pro',
      getBasic: 'Obter Básico',
      cancelAnytime: 'Cancele quando quiser. Pagamento seguro via Stripe.',
      signInAccess: 'Entre para acessar receitas salvas',
      getFreeRecipes: 'Ganhe 3 receitas grátis por mês',
      or: 'ou',
      trustMessage: 'Nunca compartilhamos seu email ou dados. Pagamentos seguros via Stripe. Cancele quando quiser.',
      cookbook: 'Livro de receitas',
      pasteRecipeUrl: 'Cole a URL da receita...',
      translateTo: 'Traduzir para',
      upgradeTranslation: 'Melhore para tradução instantânea',
      translating: 'Traduzindo...',
      reset: 'Reiniciar',
      thanksRating: 'Obrigado por avaliar!',
      stepNum: 'Passo',
      prepNum: '1. Prep',
      cookNum: '2. Cozinhar',
    },
    zh: {
      justTheRecipe: '只要食谱',
      pasteUrl: '粘贴链接',
      snapPhoto: '照片',
      youtube: '视频',
      recipesLeft: '剩余',
      signIn: '登录',
      logout: '退出',
      clean: '整理',
      addPhotos: '添加照片',
      addMore: '添加更多',
      worksWithAny: '适用于任何食谱网站',
      uploadOrSnap: '上传或拍摄食谱照片',
      pasteYoutube: 'YouTube视频链接...',
      youtubeHelper: '支持烹饪视频',
      prep: '准备',
      cook: '烹饪',
      servings: '份',
      viewSource: '查看来源',
      save: '保存',
      saved: '已保存',
      saving: '保存中...',
      upgrade: '升级',
      cookAgain: '再做一次',
      youllNeed: '你需要:',
      tips: '提示',
      suggestFeature: '建议功能',
      savedRecipes: '已保存的食谱',
      close: '关闭',
      noSavedRecipes: '还没有保存的食谱',
      createAccount: '创建账户',
      welcomeBack: '欢迎回来',
      email: '邮箱',
      password: '密码',
      needAccount: '需要账户?',
      haveAccount: '已有账户?',
      free: '免费',
      recipes: '食谱',
      month: '月',
      unlimited: '无限',
      current: '当前',
      choosePlan: '选择',
      rateExperience: '烹饪体验如何?',
      feedbackPlaceholder: '什么功能能让mise更好?',
      sendFeedback: '发送',
      thanksFeedback: '感谢您的反馈!',
      newRecipe: '← 新食谱',
      signInToSave: '登录以保存 →',
      scaled: '已调整',
      gathered: '已准备',
      of: '/',
      undo: '撤销',
      tapIngredient: '👆 点击每个食材以标记已准备',
      allGathered: '✓ 所有食材已准备好!',
      startCooking: '开始烹饪 →',
      tapStep: '👆 点击每个步骤以标记完成',
      allDone: '🎉 完成！请享用!',
      gotFeatureIdea: '💡 有功能建议?',
      usuallySeconds: '通常需要15-25秒',
      usuallySecondsPhoto: '通常需要20-30秒',
      back: '← 返回',
      deleteRecipe: '删除',
      cookRecipe: '烹饪',
      originalRecipe: '原始食谱',
      viewOriginal: '查看原文',
      viewOriginalRecipe: '查看原始食谱',
      fromPhoto: '来自照片',
      fromYouTube: '来自YouTube视频',
      thanksMessage: '谢谢！我们会阅读每条消息。',
      gotAnIdea: '有想法吗？',
      feedbackDescription: '我们每周发布更新。您的建议会成为功能。',
      feedbackNotify: '我们会在完成时通知您。',
      feedbackQuestion: '什么能让mise更好？',
      upgradePlan: '升级您的计划',
      upgradeDescription: '清理更多食谱，永久保存',
      goPro: '升级Pro',
      getBasic: '获取基础版',
      cancelAnytime: '随时取消。通过Stripe安全支付。',
      signInAccess: '登录以访问保存的食谱',
      getFreeRecipes: '每月获得3个免费食谱',
      or: '或',
      trustMessage: '我们绝不分享您的邮箱或数据。通过Stripe安全支付。随时取消。',
      cookbook: '食谱书',
      pasteRecipeUrl: '粘贴食谱链接...',
      translateTo: '翻译成',
      upgradeTranslation: '升级以获得即时翻译',
      translating: '翻译中...',
      reset: '重置',
      thanksRating: '感谢评价！',
      stepNum: '步骤',
      prepNum: '1. 准备',
      cookNum: '2. 烹饪',
    },
    hi: {
      justTheRecipe: 'सिर्फ रेसिपी',
      pasteUrl: 'URL पेस्ट करें',
      snapPhoto: 'फोटो',
      youtube: 'वीडियो',
      recipesLeft: 'बाकी',
      signIn: 'साइन इन',
      logout: 'लॉगआउट',
      clean: 'साफ करें',
      addPhotos: 'फोटो जोड़ें',
      addMore: 'और जोड़ें',
      worksWithAny: 'किसी भी रेसिपी वेबसाइट के साथ काम करता है',
      uploadOrSnap: 'रेसिपी फोटो अपलोड करें',
      pasteYoutube: 'YouTube वीडियो URL...',
      youtubeHelper: 'कुकिंग वीडियो के साथ काम करता है',
      prep: 'तैयारी',
      cook: 'पकाना',
      servings: 'सर्विंग्स',
      viewSource: 'स्रोत देखें',
      save: 'सेव करें',
      saved: 'सेव हो गया',
      saving: 'सेव हो रहा है...',
      upgrade: 'अपग्रेड',
      cookAgain: 'फिर से बनाएं',
      youllNeed: 'आपको चाहिए:',
      tips: 'सुझाव',
      suggestFeature: 'सुझाव दें',
      savedRecipes: 'सेव की गई रेसिपी',
      close: 'बंद करें',
      noSavedRecipes: 'अभी तक कोई रेसिपी सेव नहीं',
      createAccount: 'खाता बनाएं',
      welcomeBack: 'वापसी पर स्वागत है',
      email: 'ईमेल',
      password: 'पासवर्ड',
      needAccount: 'खाता चाहिए?',
      haveAccount: 'खाता है?',
      free: 'मुफ्त',
      recipes: 'रेसिपी',
      month: 'महीना',
      unlimited: 'अनलिमिटेड',
      current: 'वर्तमान',
      choosePlan: 'चुनें',
      rateExperience: 'खाना बनाने का अनुभव कैसा था?',
      feedbackPlaceholder: 'कौन सी सुविधा mise को बेहतर बनाएगी?',
      sendFeedback: 'भेजें',
      thanksFeedback: 'आपकी प्रतिक्रिया के लिए धन्यवाद!',
      newRecipe: '← नई रेसिपी',
      signInToSave: 'सेव करने के लिए साइन इन करें →',
      scaled: 'स्केल किया गया',
      gathered: 'इकट्ठा किया',
      of: 'का',
      undo: 'वापस लें',
      tapIngredient: '👆 प्रत्येक सामग्री को तैयार करते समय टैप करें',
      allGathered: '✓ सभी सामग्री तैयार!',
      startCooking: 'पकाना शुरू करें →',
      tapStep: '👆 प्रत्येक चरण पूरा करने पर टैप करें',
      allDone: '🎉 हो गया! खाना खाइए!',
      gotFeatureIdea: '💡 कोई विचार है?',
      usuallySeconds: 'आमतौर पर 15-25 सेकंड',
      usuallySecondsPhoto: 'आमतौर पर 20-30 सेकंड',
      back: '← वापस',
      deleteRecipe: 'हटाएं',
      cookRecipe: 'पकाएं',
      originalRecipe: 'मूल रेसिपी',
      viewOriginal: 'मूल देखें',
      viewOriginalRecipe: 'मूल रेसिपी देखें',
      fromPhoto: 'फ़ोटो से',
      fromYouTube: 'YouTube वीडियो से',
      thanksMessage: 'धन्यवाद! हम हर संदेश पढ़ते हैं।',
      gotAnIdea: 'कोई विचार है?',
      feedbackDescription: 'हम साप्ताहिक अपडेट जारी करते हैं। आपके सुझाव फीचर बनते हैं।',
      feedbackNotify: 'जब हम इसे बनाएंगे तो आपको सूचित करेंगे।',
      feedbackQuestion: 'क्या mise को बेहतर बनाएगा?',
      upgradePlan: 'अपना प्लान अपग्रेड करें',
      upgradeDescription: 'अधिक रेसिपी साफ करें, हमेशा के लिए सेव करें',
      goPro: 'प्रो बनें',
      getBasic: 'बेसिक लें',
      cancelAnytime: 'कभी भी रद्द करें। Stripe के माध्यम से सुरक्षित भुगतान।',
      signInAccess: 'सेव की गई रेसिपी देखने के लिए साइन इन करें',
      getFreeRecipes: 'हर महीने 3 मुफ्त रेसिपी पाएं',
      or: 'या',
      trustMessage: 'हम आपका ईमेल या डेटा कभी साझा नहीं करते। Stripe के माध्यम से सुरक्षित भुगतान। कभी भी रद्द करें।',
      cookbook: 'रसोई की किताब',
      pasteRecipeUrl: 'रेसिपी URL पेस्ट करें...',
      translateTo: 'में अनुवाद करें',
      upgradeTranslation: 'तुरंत अनुवाद के लिए अपग्रेड करें',
      translating: 'अनुवाद हो रहा है...',
      reset: 'रीसेट',
      thanksRating: 'रेटिंग के लिए धन्यवाद!',
      stepNum: 'चरण',
      prepNum: '1. तैयारी',
      cookNum: '2. पकाना',
    },
    ar: {
      justTheRecipe: 'فقط الوصفة',
      pasteUrl: 'لصق الرابط',
      snapPhoto: 'صورة',
      youtube: 'فيديو',
      recipesLeft: 'متبقي',
      signIn: 'تسجيل الدخول',
      logout: 'خروج',
      clean: 'تنظيف',
      addPhotos: 'إضافة صور',
      addMore: 'إضافة المزيد',
      worksWithAny: 'يعمل مع أي موقع وصفات',
      uploadOrSnap: 'ارفع أو صوّر الوصفات',
      pasteYoutube: 'رابط فيديو يوتيوب...',
      youtubeHelper: 'يعمل مع فيديوهات الطبخ',
      prep: 'تحضير',
      cook: 'طبخ',
      servings: 'حصص',
      viewSource: 'عرض المصدر',
      save: 'حفظ',
      saved: 'محفوظ',
      saving: 'جاري الحفظ...',
      upgrade: 'ترقية',
      cookAgain: 'اطبخ مرة أخرى',
      youllNeed: 'ستحتاج:',
      tips: 'نصائح',
      suggestFeature: 'اقتراح ميزة',
      savedRecipes: 'الوصفات المحفوظة',
      close: 'إغلاق',
      noSavedRecipes: 'لا توجد وصفات محفوظة بعد',
      createAccount: 'إنشاء حساب',
      welcomeBack: 'مرحباً بعودتك',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      needAccount: 'تحتاج حساب؟',
      haveAccount: 'لديك حساب؟',
      free: 'مجاني',
      recipes: 'وصفات',
      month: 'شهر',
      unlimited: 'غير محدود',
      current: 'الحالي',
      choosePlan: 'اختر',
      rateExperience: 'كيف كانت تجربتك في الطبخ؟',
      feedbackPlaceholder: 'ما الميزة التي ستحسن mise؟',
      sendFeedback: 'إرسال',
      thanksFeedback: 'شكراً على رأيك!',
      newRecipe: '← وصفة جديدة',
      signInToSave: 'سجل الدخول للحفظ →',
      scaled: 'معدّل',
      gathered: 'تم جمعها',
      of: 'من',
      undo: 'تراجع',
      tapIngredient: '👆 انقر على كل مكون عند تجهيزه',
      allGathered: '✓ تم جمع جميع المكونات!',
      startCooking: 'ابدأ الطبخ →',
      tapStep: '👆 انقر على كل خطوة عند إكمالها',
      allDone: '🎉 انتهى! بالعافية!',
      gotFeatureIdea: '💡 لديك فكرة؟',
      usuallySeconds: 'عادة 15-25 ثانية',
      usuallySecondsPhoto: 'عادة 20-30 ثانية',
      back: '← رجوع',
      deleteRecipe: 'حذف',
      cookRecipe: 'اطبخ',
      originalRecipe: 'الوصفة الأصلية',
      viewOriginal: 'عرض الأصل',
      viewOriginalRecipe: 'عرض الوصفة الأصلية',
      fromPhoto: 'من صورة',
      fromYouTube: 'من فيديو يوتيوب',
      thanksMessage: 'شكراً! نقرأ كل رسالة.',
      gotAnIdea: 'لديك فكرة؟',
      feedbackDescription: 'نصدر تحديثات أسبوعياً. اقتراحاتك تصبح ميزات.',
      feedbackNotify: 'سنخبرك عندما ننفذها.',
      feedbackQuestion: 'ما الذي سيحسن mise؟',
      upgradePlan: 'قم بترقية خطتك',
      upgradeDescription: 'نظّف المزيد من الوصفات، احفظها للأبد',
      goPro: 'انتقل إلى Pro',
      getBasic: 'احصل على Basic',
      cancelAnytime: 'ألغِ في أي وقت. دفع آمن عبر Stripe.',
      signInAccess: 'سجل الدخول للوصول إلى الوصفات المحفوظة',
      getFreeRecipes: 'احصل على 3 وصفات مجانية كل شهر',
      or: 'أو',
      trustMessage: 'لا نشارك بريدك أو بياناتك أبداً. دفع آمن عبر Stripe. ألغِ في أي وقت.',
      cookbook: 'كتاب الطبخ',
      pasteRecipeUrl: 'الصق رابط الوصفة...',
      translateTo: 'ترجم إلى',
      upgradeTranslation: 'قم بالترقية للترجمة الفورية',
      translating: 'جاري الترجمة...',
      reset: 'إعادة تعيين',
      thanksRating: 'شكراً على التقييم!',
      stepNum: 'خطوة',
      prepNum: '1. تحضير',
      cookNum: '2. طبخ',
    },
  };
  
  const txt = { ...t.en, ...(t[language] || {}) }; // Merge with English fallbacks
  
  // YouTube state
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

  useEffect(() => {
    // Check for existing session
    const token = api.getToken();
    if (token) {
      api.get('/api/auth/me').then(data => {
        if (data.user) {
          setUser(data.user);
          setRecipesRemaining(calculateRecipesRemaining(data.user));
          loadSavedRecipes();
        } else {
          // Invalid token, clear it
          api.setToken(null);
        }
      }).catch(() => api.setToken(null));
    }

    // Load plans (v2 format)
    api.get('/api/payments/plans').then(data => {
      // v2 returns { basic: {...}, pro: {...} } with nested monthly/yearly
      if (data.basic && data.pro) {
        setPlans({
          basic: {
            name: 'Basic',
            price: data.basic.monthly?.price || 1.99,
            features: data.basic.features || ['20 recipes per month', 'Recipe translation', 'Save recipes'],
          },
          pro: {
            name: 'Pro',
            price: data.pro.monthly?.price || 4.99,
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

    // Load Google Sign-In script
    if (GOOGLE_CLIENT_ID) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
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

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) { setAuthError('Email and password required'); return; }
    setAuthLoading(true); setAuthError('');
    const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const data = await api.post(endpoint, { email, password });
    if (data.error) { setAuthError(data.error); }
    else {
      api.setToken(data.token);
      setUser(data.user);
      setRecipesRemaining(calculateRecipesRemaining(data.user));
      setShowAuth(false);
      setEmail('');
      setPassword('');
      loadSavedRecipes();
    }
    setAuthLoading(false);
  };

  const handleGoogleAuth = async (response) => {
    setAuthLoading(true); setAuthError('');
    const data = await api.post('/api/auth/google', { credential: response.credential });
    if (data.error) { setAuthError(data.error); }
    else {
      api.setToken(data.token);
      setUser(data.user);
      setRecipesRemaining(calculateRecipesRemaining(data.user));
      setShowAuth(false);
      loadSavedRecipes();
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => { 
    await api.post('/api/auth/logout');
    api.setToken(null);
    setUser(null); 
    setSavedRecipes([]); 
    setShowSaved(false); 
    setRecipesRemaining(10); // Back to initial free
  };

  const handleUpgrade = async (plan) => {
    if (!user) { setShowAuth(true); return; }
    // Map plan names to v2 format (basic/pro -> basic_monthly/pro_monthly)
    const planMap = { basic: 'basic_monthly', pro: 'pro_monthly' };
    const data = await api.post('/api/payments/create-checkout', { plan: planMap[plan] || plan });
    // v2 uses checkoutUrl instead of url
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
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
          {['basic', 'pro'].map(plan => (
            <div key={plan} style={{ background: c.card, borderRadius: '12px', border: `1px solid ${plan === 'pro' ? c.accent : c.border}`, padding: '20px', marginBottom: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{plans[plan]?.name || plan}</h3>
                <span style={{ fontSize: '20px', fontWeight: '600' }}>${plans[plan]?.price || '?'}<span style={{ fontSize: '14px', color: c.muted }}>/mo</span></span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                {(plans[plan]?.features || []).map((f, i) => <li key={i} style={{ fontSize: '13px', color: c.muted, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: c.accent }}>✓</span> {f}</li>)}
              </ul>
              <button onClick={() => handleUpgrade(plan)} style={{ width: '100%', padding: '12px', background: plan === 'pro' ? c.accent : c.cardHover, color: plan === 'pro' ? c.bg : c.text, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                {plan === 'pro' ? txt.goPro : txt.getBasic}
              </button>
            </div>
          ))}
          <p style={{ fontSize: '12px', color: c.dim, marginTop: '16px' }}>{txt.cancelAnytime}</p>
        </div>
      </div>
    );
  }

  // Auth modal
  if (showAuth) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '340px', background: c.card, borderRadius: '16px', padding: '28px 24px', border: `1px solid ${c.border}` }}>
          <button onClick={() => setShowAuth(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>{txt.back}</button>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px' }}>{authMode === 'login' ? txt.welcomeBack : txt.createAccount}</h2>
          <p style={{ fontSize: '14px', color: c.muted, marginBottom: '24px' }}>{authMode === 'login' ? txt.signInAccess : txt.getFreeRecipes}</p>
          
          {/* Google Sign-In Button */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div 
                id="google-signin-button"
                ref={(el) => {
                  if (el && window.google) {
                    window.google.accounts.id.initialize({
                      client_id: GOOGLE_CLIENT_ID,
                      callback: handleGoogleAuth
                    });
                    window.google.accounts.id.renderButton(el, {
                      theme: 'outline',
                      size: 'large',
                      width: '100%',
                      text: 'continue_with'
                    });
                  }
                }}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, height: '1px', background: c.border }} />
                <span style={{ fontSize: '12px', color: c.muted }}>{txt.or}</span>
                <div style={{ flex: 1, height: '1px', background: c.border }} />
              </div>
            </>
          )}
          
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={txt.email} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.text, marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={txt.password} onKeyDown={e => e.key === 'Enter' && handleAuth()} style={{ width: '100%', padding: '12px 14px', fontSize: '15px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.text, marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
          {authError && <p style={{ color: c.error, fontSize: '13px', marginBottom: '16px' }}>{authError}</p>}
          <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: '600', background: c.accent, color: c.bg, border: 'none', borderRadius: '8px', cursor: authLoading ? 'wait' : 'pointer', marginBottom: '16px' }}>{authLoading ? '...' : (authMode === 'login' ? txt.signIn : txt.createAccount)}</button>
          <p style={{ textAlign: 'center', fontSize: '14px', color: c.muted }}>{authMode === 'login' ? txt.needAccount : txt.haveAccount}<button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: c.accent, cursor: 'pointer', fontSize: '14px', padding: 0, marginLeft: '4px' }}>{authMode === 'login' ? txt.createAccount : txt.signIn}</button></p>
          
          {/* Trust messaging */}
          <div style={{ marginTop: '20px', padding: '12px', background: c.bg, borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: c.dim, lineHeight: 1.5 }}>
              🔒 {txt.trustMessage}
            </p>
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
          {user ? (
            <>
              <button onClick={() => setShowSaved(true)} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>📚 {savedRecipes.length}</button>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: c.muted, fontSize: '12px', cursor: 'pointer' }}>{txt.logout}</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: c.accent, border: 'none', color: c.bg, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>{txt.signIn}</button>
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
              {!user && <button onClick={() => setShowAuth(true)} style={{ background: c.card, border: `1px solid ${c.border}`, color: c.text, padding: '10px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>{txt.signIn}</button>}
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
            {!user && <button onClick={() => setShowAuth(true)} style={{ marginTop: '8px', background: 'none', border: 'none', color: c.accent, fontSize: '12px', cursor: 'pointer', padding: 0 }}>{txt.signInToSave}</button>}
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
