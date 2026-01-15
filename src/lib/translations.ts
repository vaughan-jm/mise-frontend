/**
 * Pare Translations
 *
 * Type-safe i18n strings for 7 languages.
 * All UI text should come from here - never hardcode strings in components.
 */

import type { LanguageCode } from './types'

// Available languages
export const languages: { code: LanguageCode; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'zh', label: 'ZH', name: '中文' },
  { code: 'hi', label: 'HI', name: 'हिन्दी' },
  { code: 'ar', label: 'AR', name: 'العربية' },
]

// Translation keys - defines the shape of all translations
export interface Translations {
  // Brand
  appName: string
  tagline: string
  taglineShort: string

  // Navigation
  home: string
  cookbook: string
  pricing: string
  account: string
  signIn: string
  signOut: string

  // Input modes
  inputUrl: string
  inputPhoto: string
  inputVideo: string
  urlPlaceholder: string
  youtubePlaceholder: string
  pasteUrl: string
  uploadPhotos: string
  extractButton: string

  // Recipe display
  ingredients: string
  steps: string
  tips: string
  servings: string
  prepTime: string
  cookTime: string
  source: string

  // Cooking mode
  prep: string
  cook: string
  gathered: string
  completed: string
  undo: string
  reset: string
  youllNeed: string
  ofGathered: string
  ofCompleted: string
  allDone: string
  rateRecipe: string

  // Recipe actions
  saveRecipe: string
  saved: string
  deleteRecipe: string
  translate: string

  // Quota
  recipesRemaining: string
  unlimited: string
  upgradeForMore: string

  // Pricing
  free: string
  basic: string
  pro: string
  perMonth: string
  perYear: string
  recipesPerMonth: string
  currentPlan: string
  upgrade: string
  subscribe: string
  monthly: string
  yearly: string
  savePercent: string
  mostPopular: string

  // Features
  translationFeature: string
  prioritySupport: string
  unlimitedRecipes: string

  // Legal
  privacy: string
  terms: string
  refund: string
  contact: string

  // Contact form
  yourName: string
  yourEmail: string
  yourMessage: string
  send: string
  messageSent: string

  // Errors
  errorGeneric: string
  errorNetwork: string
  errorTimeout: string
  errorQuotaExceeded: string
  errorInvalidUrl: string
  errorNoRecipeFound: string
  errorPhotoTooLarge: string
  errorSignInRequired: string

  // Loading states
  loading: string
  extracting: string
  saving: string
  translating: string

  // Misc
  worksWithAnySite: string
  dragDropPhotos: string
  or: string
  cancel: string
  close: string
  back: string
  continue: string
  yes: string
  no: string
}

// English translations (default)
const en: Translations = {
  // Brand
  appName: 'pare',
  tagline: 'just the recipe',
  taglineShort: 'just the recipe',

  // Navigation
  home: 'home',
  cookbook: 'cookbook',
  pricing: 'pricing',
  account: 'account',
  signIn: 'sign in',
  signOut: 'sign out',

  // Input modes
  inputUrl: 'url',
  inputPhoto: 'photo',
  inputVideo: 'video',
  urlPlaceholder: 'paste any recipe url...',
  youtubePlaceholder: 'paste youtube url...',
  pasteUrl: 'paste url',
  uploadPhotos: 'upload photos',
  extractButton: 'pare',

  // Recipe display
  ingredients: 'ingredients',
  steps: 'steps',
  tips: 'tips',
  servings: 'servings',
  prepTime: 'prep',
  cookTime: 'cook',
  source: 'source',

  // Cooking mode
  prep: 'prep',
  cook: 'cook',
  gathered: 'gathered',
  completed: 'completed',
  undo: 'undo',
  reset: 'reset',
  youllNeed: "you'll need",
  ofGathered: 'of {total} gathered',
  ofCompleted: 'of {total} completed',
  allDone: 'all done!',
  rateRecipe: 'how was this recipe?',

  // Recipe actions
  saveRecipe: 'save',
  saved: 'saved',
  deleteRecipe: 'delete',
  translate: 'translate',

  // Quota
  recipesRemaining: '{count} recipes remaining',
  unlimited: 'unlimited',
  upgradeForMore: 'upgrade for more',

  // Pricing
  free: 'free',
  basic: 'basic',
  pro: 'pro',
  perMonth: '/month',
  perYear: '/year',
  recipesPerMonth: '{count} recipes/month',
  currentPlan: 'current plan',
  upgrade: 'upgrade',
  subscribe: 'subscribe',
  monthly: 'monthly',
  yearly: 'yearly',
  savePercent: 'save {percent}%',
  mostPopular: 'most popular',

  // Features
  translationFeature: 'recipe translation',
  prioritySupport: 'priority support',
  unlimitedRecipes: 'unlimited recipes',

  // Legal
  privacy: 'privacy',
  terms: 'terms',
  refund: 'refunds',
  contact: 'contact',

  // Contact form
  yourName: 'your name',
  yourEmail: 'your email',
  yourMessage: 'your message',
  send: 'send',
  messageSent: 'message sent!',

  // Errors
  errorGeneric: 'something went wrong',
  errorNetwork: 'network error - please try again',
  errorTimeout: 'request timed out',
  errorQuotaExceeded: "you've reached your monthly limit",
  errorInvalidUrl: 'please enter a valid url',
  errorNoRecipeFound: 'no recipe found on this page',
  errorPhotoTooLarge: 'photo is too large',
  errorSignInRequired: 'please sign in to continue',

  // Loading states
  loading: 'loading...',
  extracting: 'extracting recipe...',
  saving: 'saving...',
  translating: 'translating...',

  // Misc
  worksWithAnySite: 'works with any recipe website',
  dragDropPhotos: 'drag & drop photos or click to upload',
  or: 'or',
  cancel: 'cancel',
  close: 'close',
  back: 'back',
  continue: 'continue',
  yes: 'yes',
  no: 'no',
}

// Spanish translations
const es: Translations = {
  appName: 'pare',
  tagline: 'solo la receta',
  taglineShort: 'solo la receta',
  home: 'inicio',
  cookbook: 'recetario',
  pricing: 'precios',
  account: 'cuenta',
  signIn: 'iniciar sesión',
  signOut: 'cerrar sesión',
  inputUrl: 'url',
  inputPhoto: 'foto',
  inputVideo: 'video',
  urlPlaceholder: 'pega cualquier url de receta...',
  youtubePlaceholder: 'pega url de youtube...',
  pasteUrl: 'pegar url',
  uploadPhotos: 'subir fotos',
  extractButton: 'pare',
  ingredients: 'ingredientes',
  steps: 'pasos',
  tips: 'consejos',
  servings: 'porciones',
  prepTime: 'prep',
  cookTime: 'cocción',
  source: 'fuente',
  prep: 'prep',
  cook: 'cocinar',
  gathered: 'reunido',
  completed: 'completado',
  undo: 'deshacer',
  reset: 'reiniciar',
  youllNeed: 'necesitarás',
  ofGathered: 'de {total} reunidos',
  ofCompleted: 'de {total} completados',
  allDone: '¡listo!',
  rateRecipe: '¿qué tal esta receta?',
  saveRecipe: 'guardar',
  saved: 'guardado',
  deleteRecipe: 'eliminar',
  translate: 'traducir',
  recipesRemaining: '{count} recetas restantes',
  unlimited: 'ilimitado',
  upgradeForMore: 'mejora para más',
  free: 'gratis',
  basic: 'básico',
  pro: 'pro',
  perMonth: '/mes',
  perYear: '/año',
  recipesPerMonth: '{count} recetas/mes',
  currentPlan: 'plan actual',
  upgrade: 'mejorar',
  subscribe: 'suscribirse',
  monthly: 'mensual',
  yearly: 'anual',
  savePercent: 'ahorra {percent}%',
  mostPopular: 'más popular',
  translationFeature: 'traducción de recetas',
  prioritySupport: 'soporte prioritario',
  unlimitedRecipes: 'recetas ilimitadas',
  privacy: 'privacidad',
  terms: 'términos',
  refund: 'reembolsos',
  contact: 'contacto',
  yourName: 'tu nombre',
  yourEmail: 'tu email',
  yourMessage: 'tu mensaje',
  send: 'enviar',
  messageSent: '¡mensaje enviado!',
  errorGeneric: 'algo salió mal',
  errorNetwork: 'error de red - intenta de nuevo',
  errorTimeout: 'tiempo de espera agotado',
  errorQuotaExceeded: 'has alcanzado tu límite mensual',
  errorInvalidUrl: 'ingresa una url válida',
  errorNoRecipeFound: 'no se encontró receta en esta página',
  errorPhotoTooLarge: 'la foto es muy grande',
  errorSignInRequired: 'inicia sesión para continuar',
  loading: 'cargando...',
  extracting: 'extrayendo receta...',
  saving: 'guardando...',
  translating: 'traduciendo...',
  worksWithAnySite: 'funciona con cualquier sitio de recetas',
  dragDropPhotos: 'arrastra fotos o haz clic para subir',
  or: 'o',
  cancel: 'cancelar',
  close: 'cerrar',
  back: 'atrás',
  continue: 'continuar',
  yes: 'sí',
  no: 'no',
}

// French translations
const fr: Translations = {
  appName: 'pare',
  tagline: 'juste la recette',
  taglineShort: 'juste la recette',
  home: 'accueil',
  cookbook: 'livre de recettes',
  pricing: 'tarifs',
  account: 'compte',
  signIn: 'connexion',
  signOut: 'déconnexion',
  inputUrl: 'url',
  inputPhoto: 'photo',
  inputVideo: 'vidéo',
  urlPlaceholder: 'collez une url de recette...',
  youtubePlaceholder: 'collez une url youtube...',
  pasteUrl: 'coller url',
  uploadPhotos: 'télécharger photos',
  extractButton: 'pare',
  ingredients: 'ingrédients',
  steps: 'étapes',
  tips: 'astuces',
  servings: 'portions',
  prepTime: 'prép',
  cookTime: 'cuisson',
  source: 'source',
  prep: 'prép',
  cook: 'cuisson',
  gathered: 'rassemblé',
  completed: 'terminé',
  undo: 'annuler',
  reset: 'réinitialiser',
  youllNeed: 'vous aurez besoin',
  ofGathered: 'de {total} rassemblés',
  ofCompleted: 'de {total} terminés',
  allDone: 'terminé!',
  rateRecipe: 'comment était cette recette?',
  saveRecipe: 'sauvegarder',
  saved: 'sauvegardé',
  deleteRecipe: 'supprimer',
  translate: 'traduire',
  recipesRemaining: '{count} recettes restantes',
  unlimited: 'illimité',
  upgradeForMore: 'passez au niveau supérieur',
  free: 'gratuit',
  basic: 'basique',
  pro: 'pro',
  perMonth: '/mois',
  perYear: '/an',
  recipesPerMonth: '{count} recettes/mois',
  currentPlan: 'plan actuel',
  upgrade: 'améliorer',
  subscribe: 'abonnez-vous',
  monthly: 'mensuel',
  yearly: 'annuel',
  savePercent: 'économisez {percent}%',
  mostPopular: 'plus populaire',
  translationFeature: 'traduction de recettes',
  prioritySupport: 'support prioritaire',
  unlimitedRecipes: 'recettes illimitées',
  privacy: 'confidentialité',
  terms: 'conditions',
  refund: 'remboursements',
  contact: 'contact',
  yourName: 'votre nom',
  yourEmail: 'votre email',
  yourMessage: 'votre message',
  send: 'envoyer',
  messageSent: 'message envoyé!',
  errorGeneric: 'une erreur est survenue',
  errorNetwork: 'erreur réseau - réessayez',
  errorTimeout: 'délai dépassé',
  errorQuotaExceeded: 'vous avez atteint votre limite mensuelle',
  errorInvalidUrl: 'entrez une url valide',
  errorNoRecipeFound: 'aucune recette trouvée sur cette page',
  errorPhotoTooLarge: 'la photo est trop grande',
  errorSignInRequired: 'connectez-vous pour continuer',
  loading: 'chargement...',
  extracting: 'extraction de la recette...',
  saving: 'sauvegarde...',
  translating: 'traduction...',
  worksWithAnySite: 'fonctionne avec tous les sites de recettes',
  dragDropPhotos: 'glissez des photos ou cliquez pour télécharger',
  or: 'ou',
  cancel: 'annuler',
  close: 'fermer',
  back: 'retour',
  continue: 'continuer',
  yes: 'oui',
  no: 'non',
}

// Portuguese translations
const pt: Translations = {
  appName: 'pare',
  tagline: 'só a receita',
  taglineShort: 'só a receita',
  home: 'início',
  cookbook: 'livro de receitas',
  pricing: 'preços',
  account: 'conta',
  signIn: 'entrar',
  signOut: 'sair',
  inputUrl: 'url',
  inputPhoto: 'foto',
  inputVideo: 'vídeo',
  urlPlaceholder: 'cole qualquer url de receita...',
  youtubePlaceholder: 'cole url do youtube...',
  pasteUrl: 'colar url',
  uploadPhotos: 'enviar fotos',
  extractButton: 'pare',
  ingredients: 'ingredientes',
  steps: 'passos',
  tips: 'dicas',
  servings: 'porções',
  prepTime: 'prep',
  cookTime: 'cozimento',
  source: 'fonte',
  prep: 'prep',
  cook: 'cozinhar',
  gathered: 'reunido',
  completed: 'concluído',
  undo: 'desfazer',
  reset: 'reiniciar',
  youllNeed: 'você vai precisar',
  ofGathered: 'de {total} reunidos',
  ofCompleted: 'de {total} concluídos',
  allDone: 'pronto!',
  rateRecipe: 'como foi esta receita?',
  saveRecipe: 'salvar',
  saved: 'salvo',
  deleteRecipe: 'excluir',
  translate: 'traduzir',
  recipesRemaining: '{count} receitas restantes',
  unlimited: 'ilimitado',
  upgradeForMore: 'faça upgrade para mais',
  free: 'grátis',
  basic: 'básico',
  pro: 'pro',
  perMonth: '/mês',
  perYear: '/ano',
  recipesPerMonth: '{count} receitas/mês',
  currentPlan: 'plano atual',
  upgrade: 'upgrade',
  subscribe: 'assinar',
  monthly: 'mensal',
  yearly: 'anual',
  savePercent: 'economize {percent}%',
  mostPopular: 'mais popular',
  translationFeature: 'tradução de receitas',
  prioritySupport: 'suporte prioritário',
  unlimitedRecipes: 'receitas ilimitadas',
  privacy: 'privacidade',
  terms: 'termos',
  refund: 'reembolsos',
  contact: 'contato',
  yourName: 'seu nome',
  yourEmail: 'seu email',
  yourMessage: 'sua mensagem',
  send: 'enviar',
  messageSent: 'mensagem enviada!',
  errorGeneric: 'algo deu errado',
  errorNetwork: 'erro de rede - tente novamente',
  errorTimeout: 'tempo esgotado',
  errorQuotaExceeded: 'você atingiu seu limite mensal',
  errorInvalidUrl: 'insira uma url válida',
  errorNoRecipeFound: 'nenhuma receita encontrada nesta página',
  errorPhotoTooLarge: 'a foto é muito grande',
  errorSignInRequired: 'faça login para continuar',
  loading: 'carregando...',
  extracting: 'extraindo receita...',
  saving: 'salvando...',
  translating: 'traduzindo...',
  worksWithAnySite: 'funciona com qualquer site de receitas',
  dragDropPhotos: 'arraste fotos ou clique para enviar',
  or: 'ou',
  cancel: 'cancelar',
  close: 'fechar',
  back: 'voltar',
  continue: 'continuar',
  yes: 'sim',
  no: 'não',
}

// Chinese translations
const zh: Translations = {
  appName: 'pare',
  tagline: '只要食谱',
  taglineShort: '只要食谱',
  home: '首页',
  cookbook: '食谱本',
  pricing: '价格',
  account: '账户',
  signIn: '登录',
  signOut: '退出',
  inputUrl: '网址',
  inputPhoto: '照片',
  inputVideo: '视频',
  urlPlaceholder: '粘贴任何食谱网址...',
  youtubePlaceholder: '粘贴YouTube网址...',
  pasteUrl: '粘贴网址',
  uploadPhotos: '上传照片',
  extractButton: 'pare',
  ingredients: '食材',
  steps: '步骤',
  tips: '小贴士',
  servings: '份量',
  prepTime: '准备',
  cookTime: '烹饪',
  source: '来源',
  prep: '准备',
  cook: '烹饪',
  gathered: '已收集',
  completed: '已完成',
  undo: '撤销',
  reset: '重置',
  youllNeed: '你需要',
  ofGathered: '已收集 {total} 个',
  ofCompleted: '已完成 {total} 个',
  allDone: '完成！',
  rateRecipe: '这个食谱怎么样？',
  saveRecipe: '保存',
  saved: '已保存',
  deleteRecipe: '删除',
  translate: '翻译',
  recipesRemaining: '剩余 {count} 个食谱',
  unlimited: '无限',
  upgradeForMore: '升级获取更多',
  free: '免费',
  basic: '基础',
  pro: '专业',
  perMonth: '/月',
  perYear: '/年',
  recipesPerMonth: '{count} 食谱/月',
  currentPlan: '当前计划',
  upgrade: '升级',
  subscribe: '订阅',
  monthly: '月付',
  yearly: '年付',
  savePercent: '节省 {percent}%',
  mostPopular: '最受欢迎',
  translationFeature: '食谱翻译',
  prioritySupport: '优先支持',
  unlimitedRecipes: '无限食谱',
  privacy: '隐私',
  terms: '条款',
  refund: '退款',
  contact: '联系',
  yourName: '您的姓名',
  yourEmail: '您的邮箱',
  yourMessage: '您的留言',
  send: '发送',
  messageSent: '消息已发送！',
  errorGeneric: '出了点问题',
  errorNetwork: '网络错误 - 请重试',
  errorTimeout: '请求超时',
  errorQuotaExceeded: '您已达到本月限额',
  errorInvalidUrl: '请输入有效的网址',
  errorNoRecipeFound: '此页面未找到食谱',
  errorPhotoTooLarge: '照片太大',
  errorSignInRequired: '请登录以继续',
  loading: '加载中...',
  extracting: '提取食谱中...',
  saving: '保存中...',
  translating: '翻译中...',
  worksWithAnySite: '适用于任何食谱网站',
  dragDropPhotos: '拖放照片或点击上传',
  or: '或',
  cancel: '取消',
  close: '关闭',
  back: '返回',
  continue: '继续',
  yes: '是',
  no: '否',
}

// Hindi translations
const hi: Translations = {
  appName: 'pare',
  tagline: 'बस रेसिपी',
  taglineShort: 'बस रेसिपी',
  home: 'होम',
  cookbook: 'कुकबुक',
  pricing: 'मूल्य',
  account: 'खाता',
  signIn: 'साइन इन',
  signOut: 'साइन आउट',
  inputUrl: 'यूआरएल',
  inputPhoto: 'फोटो',
  inputVideo: 'वीडियो',
  urlPlaceholder: 'कोई भी रेसिपी यूआरएल पेस्ट करें...',
  youtubePlaceholder: 'यूट्यूब यूआरएल पेस्ट करें...',
  pasteUrl: 'यूआरएल पेस्ट करें',
  uploadPhotos: 'फोटो अपलोड करें',
  extractButton: 'pare',
  ingredients: 'सामग्री',
  steps: 'चरण',
  tips: 'सुझाव',
  servings: 'सर्विंग',
  prepTime: 'तैयारी',
  cookTime: 'पकाना',
  source: 'स्रोत',
  prep: 'तैयारी',
  cook: 'पकाना',
  gathered: 'एकत्रित',
  completed: 'पूर्ण',
  undo: 'पूर्ववत',
  reset: 'रीसेट',
  youllNeed: 'आपको चाहिए',
  ofGathered: '{total} में से एकत्रित',
  ofCompleted: '{total} में से पूर्ण',
  allDone: 'हो गया!',
  rateRecipe: 'यह रेसिपी कैसी थी?',
  saveRecipe: 'सेव करें',
  saved: 'सेव किया',
  deleteRecipe: 'हटाएं',
  translate: 'अनुवाद',
  recipesRemaining: '{count} रेसिपी शेष',
  unlimited: 'असीमित',
  upgradeForMore: 'अधिक के लिए अपग्रेड करें',
  free: 'मुफ्त',
  basic: 'बेसिक',
  pro: 'प्रो',
  perMonth: '/महीना',
  perYear: '/साल',
  recipesPerMonth: '{count} रेसिपी/महीना',
  currentPlan: 'वर्तमान प्लान',
  upgrade: 'अपग्रेड',
  subscribe: 'सब्सक्राइब',
  monthly: 'मासिक',
  yearly: 'वार्षिक',
  savePercent: '{percent}% बचाएं',
  mostPopular: 'सबसे लोकप्रिय',
  translationFeature: 'रेसिपी अनुवाद',
  prioritySupport: 'प्राथमिकता सहायता',
  unlimitedRecipes: 'असीमित रेसिपी',
  privacy: 'गोपनीयता',
  terms: 'शर्तें',
  refund: 'रिफंड',
  contact: 'संपर्क',
  yourName: 'आपका नाम',
  yourEmail: 'आपका ईमेल',
  yourMessage: 'आपका संदेश',
  send: 'भेजें',
  messageSent: 'संदेश भेजा गया!',
  errorGeneric: 'कुछ गलत हो गया',
  errorNetwork: 'नेटवर्क त्रुटि - पुनः प्रयास करें',
  errorTimeout: 'अनुरोध समय समाप्त',
  errorQuotaExceeded: 'आपने अपनी मासिक सीमा पूरी कर ली है',
  errorInvalidUrl: 'कृपया वैध यूआरएल दर्ज करें',
  errorNoRecipeFound: 'इस पेज पर कोई रेसिपी नहीं मिली',
  errorPhotoTooLarge: 'फोटो बहुत बड़ी है',
  errorSignInRequired: 'जारी रखने के लिए साइन इन करें',
  loading: 'लोड हो रहा है...',
  extracting: 'रेसिपी निकाल रहे हैं...',
  saving: 'सेव हो रहा है...',
  translating: 'अनुवाद हो रहा है...',
  worksWithAnySite: 'किसी भी रेसिपी वेबसाइट के साथ काम करता है',
  dragDropPhotos: 'फोटो खींचें या अपलोड करने के लिए क्लिक करें',
  or: 'या',
  cancel: 'रद्द करें',
  close: 'बंद करें',
  back: 'वापस',
  continue: 'जारी रखें',
  yes: 'हां',
  no: 'नहीं',
}

// Arabic translations
const ar: Translations = {
  appName: 'pare',
  tagline: 'فقط الوصفة',
  taglineShort: 'فقط الوصفة',
  home: 'الرئيسية',
  cookbook: 'كتاب الطبخ',
  pricing: 'الأسعار',
  account: 'الحساب',
  signIn: 'تسجيل الدخول',
  signOut: 'تسجيل الخروج',
  inputUrl: 'رابط',
  inputPhoto: 'صورة',
  inputVideo: 'فيديو',
  urlPlaceholder: 'الصق أي رابط وصفة...',
  youtubePlaceholder: 'الصق رابط يوتيوب...',
  pasteUrl: 'لصق الرابط',
  uploadPhotos: 'رفع الصور',
  extractButton: 'pare',
  ingredients: 'المكونات',
  steps: 'الخطوات',
  tips: 'نصائح',
  servings: 'الحصص',
  prepTime: 'التحضير',
  cookTime: 'الطهي',
  source: 'المصدر',
  prep: 'التحضير',
  cook: 'الطهي',
  gathered: 'تم جمعها',
  completed: 'مكتمل',
  undo: 'تراجع',
  reset: 'إعادة تعيين',
  youllNeed: 'ستحتاج',
  ofGathered: 'من {total} تم جمعها',
  ofCompleted: 'من {total} مكتملة',
  allDone: 'تم!',
  rateRecipe: 'كيف كانت هذه الوصفة؟',
  saveRecipe: 'حفظ',
  saved: 'محفوظ',
  deleteRecipe: 'حذف',
  translate: 'ترجمة',
  recipesRemaining: '{count} وصفات متبقية',
  unlimited: 'غير محدود',
  upgradeForMore: 'ترقية للمزيد',
  free: 'مجاني',
  basic: 'أساسي',
  pro: 'احترافي',
  perMonth: '/شهر',
  perYear: '/سنة',
  recipesPerMonth: '{count} وصفة/شهر',
  currentPlan: 'الخطة الحالية',
  upgrade: 'ترقية',
  subscribe: 'اشتراك',
  monthly: 'شهري',
  yearly: 'سنوي',
  savePercent: 'وفر {percent}%',
  mostPopular: 'الأكثر شعبية',
  translationFeature: 'ترجمة الوصفات',
  prioritySupport: 'دعم ذو أولوية',
  unlimitedRecipes: 'وصفات غير محدودة',
  privacy: 'الخصوصية',
  terms: 'الشروط',
  refund: 'الاسترداد',
  contact: 'اتصل',
  yourName: 'اسمك',
  yourEmail: 'بريدك الإلكتروني',
  yourMessage: 'رسالتك',
  send: 'إرسال',
  messageSent: 'تم إرسال الرسالة!',
  errorGeneric: 'حدث خطأ ما',
  errorNetwork: 'خطأ في الشبكة - حاول مرة أخرى',
  errorTimeout: 'انتهت مهلة الطلب',
  errorQuotaExceeded: 'لقد وصلت إلى حدك الشهري',
  errorInvalidUrl: 'الرجاء إدخال رابط صالح',
  errorNoRecipeFound: 'لم يتم العثور على وصفة في هذه الصفحة',
  errorPhotoTooLarge: 'الصورة كبيرة جداً',
  errorSignInRequired: 'الرجاء تسجيل الدخول للمتابعة',
  loading: 'جاري التحميل...',
  extracting: 'جاري استخراج الوصفة...',
  saving: 'جاري الحفظ...',
  translating: 'جاري الترجمة...',
  worksWithAnySite: 'يعمل مع أي موقع وصفات',
  dragDropPhotos: 'اسحب الصور أو انقر للرفع',
  or: 'أو',
  cancel: 'إلغاء',
  close: 'إغلاق',
  back: 'رجوع',
  continue: 'متابعة',
  yes: 'نعم',
  no: 'لا',
}

// All translations
const translations: Record<LanguageCode, Translations> = {
  en,
  es,
  fr,
  pt,
  zh,
  hi,
  ar,
}

/**
 * Get translations for a language
 */
export function getTranslations(lang: LanguageCode): Translations {
  return translations[lang] || translations.en
}

/**
 * Get a specific translation with variable substitution
 * Usage: t('recipesRemaining', { count: 5 }) => "5 recipes remaining"
 */
export function translate(
  lang: LanguageCode,
  key: keyof Translations,
  vars?: Record<string, string | number>
): string {
  const t = getTranslations(lang)
  let text = t[key] || key

  if (vars) {
    Object.entries(vars).forEach(([varKey, value]) => {
      text = text.replace(`{${varKey}}`, String(value))
    })
  }

  return text
}

/**
 * Detect browser language and return closest supported language
 */
export function detectLanguage(): LanguageCode {
  const browserLang = navigator.language.split('-')[0]?.toLowerCase() ?? 'en'
  const supported = languages.map((l) => l.code)

  if (supported.includes(browserLang as LanguageCode)) {
    return browserLang as LanguageCode
  }

  return 'en'
}

export default translations
