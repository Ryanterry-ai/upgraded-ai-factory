import { CanonicalRequirements, RequirementsInput, RequirementsEngineResult, InputType, InputLanguage, FactoryType, ExtractedFeature, ExtractedEntity, UIRequirement, DataRequirement, BusinessGoal } from './canonical-schema.js';

// Language detection patterns
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  en: [/\b(the|is|are|was|were|have|has|will|can|should|must|with|from|for|this|that|and|but|not|you|your|our|their)\b/gi],
  es: [/\b(el|la|los|las|es|son|está|están|con|para|por|pero|como|todo|más|también|hacer|tiene|ser|hay|puede)\b/gi],
  fr: [/\b(le|la|les|des|est|sont|avec|pour|mais|comme|tout|faire|avoir|être|peut|aussi|cette|cela|nous|vous)\b/gi],
  de: [/\b(der|die|das|ist|sind|mit|für|aber|wie|alle|auch|noch|nicht|kann|haben|sein|werden|diese|diese)\b/gi],
  ja: [/\b(は|が|を|に|で|も|の|と|や|か|から|まで|より|について|として|において|对于|关于)\b/g],
  zh: [/\b(的|是|在|有|和|与|或|但|而|从|到|为|对|被|让|把|将|会|能|可以|应该|需要)\b/g],
  ko: [/\b(은|는|이|가|을|를|에|에서|의|와|과|도|로|으로|만|까지|부터|에 대해서|에게)\b/g],
  pt: [/\b(o|a|os|as|é|são|com|para|mas|como|tudo|fazer|ter|ser|pode|também|este|isto|nós|vocês)\b/gi],
  ar: [/\b(من|في|على|إلى|عن|مع|أو|لكن|هذا|هذه|كل|يمكن|يجب|أن|التي|الذي|هم|نحن)\b/g],
  hi: [/\b(है|हैं|के|का|की|में|से|को|पर|और|लेकिन|यह|वह|सभी|कर|रहा|हो|जा|सकता|चाहिए)\b/g],
};

// Factory detection keywords
const FACTORY_KEYWORDS: Record<FactoryType, string[]> = {
  website: ['landing page', 'website', 'site', 'web page', 'homepage', 'portfolio', 'blog', 'agency', 'corporate', 'personal site', 'brochure'],
  ecommerce: ['store', 'shop', 'ecommerce', 'e-commerce', 'product', 'cart', 'checkout', 'order', 'inventory', 'merchandise', 'marketplace'],
  saas: ['saas', 'software as a service', 'platform', 'subscription', 'dashboard', 'analytics', 'tool', 'app', 'application', 'web app', 'productivity'],
  admin: ['admin', 'admin panel', 'backoffice', 'crud', 'management', 'cms', 'content management', 'control panel', 'backend'],
  dashboard: ['dashboard', 'analytics', 'metrics', 'kpi', 'reporting', 'visualization', 'charts', 'data visualization', 'monitoring'],
  agent: ['chatbot', 'bot', 'ai assistant', 'conversational', 'chat bot', 'virtual assistant', 'ai agent', 'nlp', 'dialogue'],
  tools: ['internal tool', 'utility', 'tool', 'builder', 'generator', 'converter', 'editor', 'formatter', 'tester', 'debugger'],
};

// Industry keywords
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'healthcare': ['health', 'medical', 'patient', 'clinic', 'hospital', 'doctor', 'healthcare', 'telemedicine'],
  'fashion': ['fashion', 'clothing', 'apparel', 'wear', 'style', 'boutique', 'garment'],
  'food': ['food', 'restaurant', 'cafe', 'coffee', 'recipe', 'cooking', 'dining', 'bakery'],
  'technology': ['tech', 'software', 'developer', 'programming', 'api', 'saas', 'cloud', 'ai', 'ml'],
  'finance': ['finance', 'banking', 'investment', 'trading', 'payment', 'fintech', 'insurance'],
  'education': ['education', 'learning', 'course', 'student', 'teacher', 'school', 'university', 'tutorial'],
  'real-estate': ['real estate', 'property', 'housing', 'rental', 'apartment', 'mortgage'],
  'entertainment': ['entertainment', 'media', 'music', 'video', 'gaming', 'streaming', 'podcast'],
  'ecommerce': ['ecommerce', 'e-commerce', 'online store', 'shopping', 'retail', 'marketplace'],
  'nonprofit': ['nonprofit', 'charity', 'donation', 'volunteer', 'ngo', 'foundation'],
  'travel': ['travel', 'hotel', 'booking', 'flight', 'tourism', 'vacation', 'airbnb'],
  'fitness': ['fitness', 'gym', 'workout', 'exercise', 'yoga', 'wellness', 'health'],
};

// Complexity indicators
const COMPLEXITY_INDICATORS = {
  simple: ['simple', 'basic', 'minimal', 'clean', 'straightforward', 'easy', 'single page', 'one page'],
  moderate: ['moderate', 'standard', 'typical', 'regular', 'normal', 'medium'],
  complex: ['complex', 'advanced', 'enterprise', 'multi-tenant', 'scalable', 'robust', 'full-featured', 'comprehensive'],
};

// Effort estimation keywords
const EFFORT_KEYWORDS = {
  hours: ['quick', 'simple', 'basic', 'minimal', 'small', 'tiny'],
  days: ['standard', 'normal', 'regular', 'typical', 'medium'],
  weeks: ['complex', 'advanced', 'enterprise', 'full', 'comprehensive', 'large', 'big'],
};

export class RequirementUnderstandingEngine {

  async process(input: RequirementsInput): Promise<RequirementsEngineResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Step 1: Detect language
    const language = input.language || this.detectLanguage(input.content.toString());

    // Step 2: Extract text content
    const textContent = this.extractText(input);

    // Step 3: Extract features
    const features = this.extractFeatures(textContent);

    // Step 4: Extract entities
    const entities = this.extractEntities(textContent);

    // Step 5: Determine project type
    const projectType = this.determineProjectType(textContent);

    // Step 6: Estimate complexity
    const complexity = this.estimateComplexity(textContent, features);

    // Step 7: Extract business goals
    const businessGoals = this.extractBusinessGoals(textContent);

    // Step 8: Determine UI requirements
    const uiRequirements = this.determineUIRequirements(textContent, projectType);

    // Step 9: Determine data requirements
    const dataRequirements = this.determineDataRequirements(textContent, projectType);

    // Step 10: Determine tech stack
    const techStack = this.determineTechStack(textContent, projectType);

    // Step 11: Determine integrations
    const integrations = this.determineIntegrations(textContent);

    // Step 12: Determine industry
    const industry = this.determineIndustry(textContent);

    // Step 13: Determine target audience
    const targetAudience = this.determineTargetAudience(textContent);

    // Step 14: Generate project name
    const projectName = this.generateProjectName(textContent, projectType);

    // Step 15: Generate project description
    const projectDescription = this.generateDescription(textContent, features);

    // Step 16: Calculate confidence
    const confidence = this.calculateConfidence(features, entities, textContent);

    // Step 17: Identify ambiguities
    const ambiguities = this.identifyAmbiguities(textContent, features, entities);

    // Step 18: Generate suggestions
    const suggestions = this.generateSuggestions(textContent, features, projectType);

    // Step 19: Set performance requirements
    const performanceRequirements = this.determinePerformanceRequirements(projectType, complexity);

    // Step 20: Set quality gates
    const qualityGates = this.determineQualityGates(projectType, complexity);

    const requirements: CanonicalRequirements = {
      inputType: input.type,
      inputLanguage: language,
      originalInput: input.content.toString(),
      extractedAt: new Date().toISOString(),
      projectName,
      projectType,
      projectDescription,
      industry,
      targetAudience,
      businessGoals,
      features,
      complexity,
      entities,
      dataRequirements,
      uiRequirements,
      techStack,
      integrations,
      performanceRequirements,
      qualityGates,
      confidence,
      ambiguities,
      suggestions,
    };

    return {
      requirements,
      inputType: input.type,
      factory: projectType,
      confidence,
      processingTimeMs: Date.now() - startTime,
      warnings,
    };
  }

  private detectLanguage(text: string): InputLanguage {
    const scores: Record<string, number> = {};

    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      scores[lang] = 0;
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) scores[lang] += matches.length;
      }
    }

    const maxLang = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);
    return maxLang[1] > 0 ? maxLang[0] as InputLanguage : 'unknown';
  }

  private extractText(input: RequirementsInput): string {
    if (Buffer.isBuffer(input.content)) {
      return input.content.toString('utf-8');
    }
    return input.content;
  }

  private extractFeatures(text: string): ExtractedFeature[] {
    const features: ExtractedFeature[] = [];
    const lowerText = text.toLowerCase();

    // Feature extraction patterns
    const featurePatterns = [
      { pattern: /\b(user|member|account)\s+(registration|signup|sign\s*up|creation)\b/i, name: 'User Registration', category: 'auth' as const },
      { pattern: /\b(login|log\s*in|sign\s*in|authentication)\b/i, name: 'User Login', category: 'auth' as const },
      { pattern: /\b(user|member)\s+(profile|account|dashboard)\b/i, name: 'User Profile', category: 'ui' as const },
      { pattern: /\b(search|find|lookup|filter|filtering)\b/i, name: 'Search & Filter', category: 'ui' as const },
      { pattern: /\b(notification|alert|email|push)\b/i, name: 'Notifications', category: 'integration' as const },
      { pattern: /\b(payment|checkout|billing|invoice|subscription)\b/i, name: 'Payment Processing', category: 'backend' as const },
      { pattern: /\b(admin|backoffice|manage|management|cms)\b/i, name: 'Admin Panel', category: 'ui' as const },
      { pattern: /\b(analytics|report|reporting|metrics|dashboard|chart|graph|visualization)\b/i, name: 'Analytics Dashboard', category: 'analytics' as const },
      { pattern: /\b(api|rest|graphql|webhook|endpoint)\b/i, name: 'API Integration', category: 'integration' as const },
      { pattern: /\b(upload|file|image|media|gallery|photo|video)\b/i, name: 'File Upload & Media', category: 'ui' as const },
      { pattern: /\b(responsive|mobile|tablet|adaptive)\b/i, name: 'Responsive Design', category: 'ui' as const },
      { pattern: /\b(dark\s*mode|theme|light\s*mode|color\s*scheme)\b/i, name: 'Dark Mode', category: 'ui' as const },
      { pattern: /\b(cart|basket|shopping|add\s*to\s*cart)\b/i, name: 'Shopping Cart', category: 'core' as const },
      { pattern: /\b(product|item|catalog|inventory)\b/i, name: 'Product Management', category: 'data' as const },
      { pattern: /\b(order|purchase|transaction|history)\b/i, name: 'Order Management', category: 'data' as const },
      { pattern: /\b(real[\s-]*time|live|websocket|streaming)\b/i, name: 'Real-time Features', category: 'backend' as const },
      { pattern: /\b(seo|meta|sitemap|structured\s*data|open\s*graph)\b/i, name: 'SEO Optimization', category: 'seo' as const },
      { pattern: /\b(cache|caching|performance|optimization|lazy\s*load)\b/i, name: 'Performance Optimization', category: 'performance' as const },
      { pattern: /\b(i18n|localization|translation|multi[\s-]*language)\b/i, name: 'Internationalization', category: 'core' as const },
      { pattern: /\b(accessibility|aria|wcag|screen\s*reader|alt\s*text)\b/i, name: 'Accessibility', category: 'ui' as const },
      { pattern: /\b(chat|messaging|conversation|message)\b/i, name: 'Chat/Messaging', category: 'core' as const },
      { pattern: /\b(scheduling|calendar|booking|appointment|reservation)\b/i, name: 'Scheduling/Booking', category: 'core' as const },
      { pattern: /\b(tags|categories|labels|taxonomy)\b/i, name: 'Tagging & Categories', category: 'data' as const },
      { pattern: /\b(sharing|social|share)\b/i, name: 'Social Sharing', category: 'integration' as const },
      { pattern: /\b(feedback|review|rating|comment)\b/i, name: 'Feedback/Reviews', category: 'core' as const },
      { pattern: /\b(export|download|csv|pdf|report)\b/i, name: 'Data Export', category: 'backend' as const },
      { pattern: /\b(import|upload|csv|bulk)\b/i, name: 'Data Import', category: 'backend' as const },
      { pattern: /\b(auth|oauth|google|github|social\s*login)\b/i, name: 'Social Authentication', category: 'auth' as const },
      { pattern: /\b(role|permission|rbac|access\s*control)\b/i, name: 'Role-Based Access', category: 'auth' as const },
      { pattern: /\b(logging|audit|trail|activity)\b/i, name: 'Audit Logging', category: 'backend' as const },
    ];

    for (const { pattern, name, category } of featurePatterns) {
      if (pattern.test(text)) {
        const priority = this.determineFeaturePriority(text, name);
        const effort = this.estimateFeatureEffort(text, name);
        features.push({
          name,
          description: `Extracted from input text`,
          priority,
          category,
          estimatedEffort: effort,
        });
      }
    }

    return features;
  }

  private extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerText = text.toLowerCase();

    const entityPatterns = [
      { pattern: /\b(user|member|customer|client|account|person|people|staff|employee|admin)\b/i, type: 'user' as const, fields: ['name', 'email', 'role', 'createdAt'] },
      { pattern: /\b(product|item|good|merchandise|article|listing|service)\b/i, type: 'product' as const, fields: ['name', 'description', 'price', 'image', 'category'] },
      { pattern: /\b(order|purchase|transaction|payment|checkout|cart)\b/i, type: 'order' as const, fields: ['userId', 'items', 'total', 'status', 'createdAt'] },
      { pattern: /\b(post|article|blog|page|content|entry|news|story)\b/i, type: 'content' as const, fields: ['title', 'body', 'author', 'publishedAt', 'category'] },
      { pattern: /\b(comment|review|feedback|rating|message|chat)\b/i, type: 'custom' as const, fields: ['userId', 'content', 'createdAt', 'parentId'] },
      { pattern: /\b(category|tag|label|genre|type|section)\b/i, type: 'config' as const, fields: ['name', 'slug', 'parentId'] },
      { pattern: /\b(event|appointment|booking|reservation|schedule|session)\b/i, type: 'session' as const, fields: ['title', 'startTime', 'endTime', 'userId'] },
      { pattern: /\b(setting|config|preference|option|parameter)\b/i, type: 'config' as const, fields: ['key', 'value', 'userId'] },
      { pattern: /\b(notification|alert|message|email|push)\b/i, type: 'notification' as const, fields: ['userId', 'type', 'content', 'read', 'createdAt'] },
    ];

    const seenTypes = new Set<string>();

    for (const { pattern, type, fields } of entityPatterns) {
      if (pattern.test(text) && !seenTypes.has(type)) {
        seenTypes.add(type);
        entities.push({ name: type, type, fields, relationships: [] });
      }
    }

    // Infer relationships
    if (entities.some(e => e.type === 'user') && entities.some(e => e.type === 'order')) {
      const user = entities.find(e => e.type === 'user');
      const order = entities.find(e => e.type === 'order');
      if (user && order) {
        user.relationships.push('has many orders');
        order.relationships.push('belongs to user');
      }
    }

    if (entities.some(e => e.type === 'product') && entities.some(e => e.type === 'order')) {
      const product = entities.find(e => e.type === 'product');
      const order = entities.find(e => e.type === 'order');
      if (product && order) {
        product.relationships.push('included in orders');
        order.relationships.push('contains products');
      }
    }

    return entities;
  }

  private determineProjectType(text: string): FactoryType {
    const lowerText = text.toLowerCase();
    const scores: Record<FactoryType, number> = {
      website: 0, ecommerce: 0, saas: 0, admin: 0, dashboard: 0, agent: 0, tools: 0,
    };

    for (const [factory, keywords] of Object.entries(FACTORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          scores[factory as FactoryType] += keyword.split(' ').length;
        }
      }
    }

    // Boost score based on features
    const features = this.extractFeatures(text);
    if (features.some(f => f.name === 'Shopping Cart' || f.name === 'Product Management')) scores.ecommerce += 3;
    if (features.some(f => f.name === 'Admin Panel')) scores.admin += 2;
    if (features.some(f => f.name === 'Analytics Dashboard')) scores.dashboard += 2;
    if (features.some(f => f.name === 'Chat/Messaging')) scores.agent += 2;
    if (features.some(f => f.name === 'Data Export' || f.name === 'Data Import')) scores.tools += 1;

    // Boost score based on entities
    const entities = this.extractEntities(text);
    if (entities.some(e => e.type === 'product')) scores.ecommerce += 2;
    if (entities.some(e => e.type === 'order')) scores.ecommerce += 1;
    if (entities.some(e => e.type === 'user')) scores.admin += 1;

    const maxFactory = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);
    return maxFactory[1] > 0 ? maxFactory[0] as FactoryType : 'website';
  }

  private estimateComplexity(text: string, features: ExtractedFeature[]): 'simple' | 'moderate' | 'complex' {
    const lowerText = text.toLowerCase();

    // Check explicit complexity indicators
    for (const [level, indicators] of Object.entries(COMPLEXITY_INDICATORS)) {
      for (const indicator of indicators) {
        if (lowerText.includes(indicator)) {
          return level as 'simple' | 'moderate' | 'complex';
        }
      }
    }

    // Estimate based on feature count
    if (features.length <= 3) return 'simple';
    if (features.length <= 7) return 'moderate';
    return 'complex';
  }

  private extractBusinessGoals(text: string): BusinessGoal[] {
    const goals: BusinessGoal[] = [];
    const lowerText = text.toLowerCase();

    const goalPatterns = [
      { pattern: /\b(increase|grow|boost|improve|raise)\s+(\w+)/gi, metric: 'conversion' },
      { pattern: /\b(reduce|decrease|lower|minimize|cut)\s+(\w+)/gi, metric: 'reduction' },
      { pattern: /\b(improve|enhance|better|optimize)\s+(\w+)/gi, metric: 'improvement' },
      { pattern: /\b(automate|streamline|simplify)\s+(\w+)/gi, metric: 'automation' },
      { pattern: /\b(attract|acquire|get|gain)\s+(more\s+)?(\w+)/gi, metric: 'acquisition' },
    ];

    for (const { pattern, metric } of goalPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        goals.push({
          goal: match[0],
          metric,
          target: 'TBD',
          timeframe: 'TBD',
        });
      }
    }

    return goals;
  }

  private determineUIRequirements(text: string, projectType: FactoryType): UIRequirement {
    const lowerText = text.toLowerCase();

    let layout: UIRequirement['layout'] = 'single-page';
    if (projectType === 'admin' || projectType === 'dashboard') layout = 'admin';
    else if (lowerText.includes('multi') || lowerText.includes('several page') || lowerText.includes('multiple page')) layout = 'multi-page';
    else if (lowerText.includes('dashboard') || lowerText.includes('analytics')) layout = 'dashboard';
    else if (lowerText.includes('hybrid') || lowerText.includes('both')) layout = 'hybrid';

    let navigation: UIRequirement['navigation'] = 'top-nav';
    if (projectType === 'admin' || projectType === 'dashboard') navigation = 'sidebar';
    else if (lowerText.includes('mobile') || lowerText.includes('app')) navigation = 'bottom-nav';
    else if (lowerText.includes('sidebar') || lowerText.includes('side nav')) navigation = 'sidebar';

    let theme: UIRequirement['theme'] = 'light';
    if (lowerText.includes('dark mode') || lowerText.includes('dark theme')) theme = 'dark';
    else if (lowerText.includes('both') || lowerText.includes('toggle') || lowerText.includes('switch')) theme = 'both';
    else if (lowerText.includes('auto') || lowerText.includes('system')) theme = 'auto';

    const responsive = !lowerText.includes('desktop only') && !lowerText.includes('non-responsive');

    let accessibility: UIRequirement['accessibility'] = 'basic';
    if (lowerText.includes('wcag') || lowerText.includes('accessible') || lowerText.includes('a11y')) accessibility = 'wcag-aa';
    if (lowerText.includes('wcag aaa') || lowerText.includes('full accessibility')) accessibility = 'wcag-aaa';

    const components: string[] = [];
    if (lowerText.includes('nav')) components.push('Navbar');
    if (lowerText.includes('footer')) components.push('Footer');
    if (lowerText.includes('sidebar')) components.push('Sidebar');
    if (lowerText.includes('modal') || lowerText.includes('dialog')) components.push('Modal');
    if (lowerText.includes('form') || lowerText.includes('input')) components.push('Form');
    if (lowerText.includes('table') || lowerText.includes('list')) components.push('Table');
    if (lowerText.includes('card')) components.push('Card');
    if (lowerText.includes('button') || lowerText.includes('cta')) components.push('Button');
    if (lowerText.includes('hero')) components.push('Hero');
    if (lowerText.includes('feature')) components.push('Features');
    if (lowerText.includes('testimonial')) components.push('Testimonials');
    if (lowerText.includes('pricing')) components.push('Pricing');
    if (lowerText.includes('faq')) components.push('FAQ');

    return { layout, navigation, theme, responsive, accessibility, components };
  }

  private determineDataRequirements(text: string, projectType: FactoryType): DataRequirement {
    const lowerText = text.toLowerCase();

    let storage: DataRequirement['storage'] = 'local';
    if (lowerText.includes('database') || lowerText.includes('persist') || lowerText.includes('save')) storage = 'database';
    else if (lowerText.includes('api') || lowerText.includes('fetch') || lowerText.includes('endpoint')) storage = 'api';
    else if (lowerText.includes('mixed') || lowerText.includes('both')) storage = 'mixed';

    let database: DataRequirement['database'] = 'none';
    if (storage === 'database' || storage === 'mixed') {
      if (lowerText.includes('postgres') || lowerText.includes('postgresql')) database = 'postgres';
      else if (lowerText.includes('mysql') || lowerText.includes('mariadb')) database = 'mysql';
      else if (lowerText.includes('mongo') || lowerText.includes('mongodb')) database = 'mongodb';
      else if (lowerText.includes('sqlite')) database = 'sqlite';
      else database = 'postgres'; // default
    }

    let auth: DataRequirement['auth'] = 'none';
    if (lowerText.includes('login') || lowerText.includes('auth') || lowerText.includes('user')) auth = 'email';
    if (lowerText.includes('oauth') || lowerText.includes('social login') || lowerText.includes('google') || lowerText.includes('github')) auth = 'oauth';
    if (lowerText.includes('api key') || lowerText.includes('apikey')) auth = 'api-key';

    const realtime = lowerText.includes('real-time') || lowerText.includes('realtime') || lowerText.includes('websocket') || lowerText.includes('live');
    const caching = lowerText.includes('cache') || lowerText.includes('caching') || lowerText.includes('performance');

    return { storage, database, auth, realtime, caching };
  }

  private determineTechStack(text: string, projectType: FactoryType): string[] {
    const lowerText = text.toLowerCase();
    const stack: string[] = ['Next.js', 'React', 'TypeScript'];

    if (lowerText.includes('tailwind')) stack.push('Tailwind CSS');
    if (lowerText.includes('shadcn')) stack.push('shadcn/ui');
    if (lowerText.includes('prisma')) stack.push('Prisma');
    if (lowerText.includes('graphql')) stack.push('GraphQL');
    if (lowerText.includes('redis')) stack.push('Redis');
    if (lowerText.includes('stripe')) stack.push('Stripe');
    if (lowerText.includes('firebase')) stack.push('Firebase');
    if (lowerText.includes('supabase')) stack.push('Supabase');
    if (lowerText.includes('postgres') || lowerText.includes('postgresql')) stack.push('PostgreSQL');

    return stack;
  }

  private determineIntegrations(text: string): string[] {
    const lowerText = text.toLowerCase();
    const integrations: string[] = [];

    if (lowerText.includes('stripe')) integrations.push('Stripe');
    if (lowerText.includes('paypal')) integrations.push('PayPal');
    if (lowerText.includes('google analytics') || lowerText.includes('ga4')) integrations.push('Google Analytics');
    if (lowerText.includes('sendgrid') || lowerText.includes('email')) integrations.push('SendGrid');
    if (lowerText.includes('twilio') || lowerText.includes('sms')) integrations.push('Twilio');
    if (lowerText.includes('aws') || lowerText.includes('amazon')) integrations.push('AWS');
    if (lowerText.includes('cloudinary') || lowerText.includes('image')) integrations.push('Cloudinary');
    if (lowerText.includes('auth0')) integrations.push('Auth0');
    if (lowerText.includes('vercel')) integrations.push('Vercel');
    if (lowerText.includes('netlify')) integrations.push('Netlify');

    return integrations;
  }

  private determineIndustry(text: string): string {
    const lowerText = text.toLowerCase();
    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) return industry;
      }
    }
    return 'technology';
  }

  private determineTargetAudience(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('b2b') || lowerText.includes('business') || lowerText.includes('enterprise')) return 'B2B';
    if (lowerText.includes('b2c') || lowerText.includes('consumer') || lowerText.includes('customer')) return 'B2C';
    if (lowerText.includes('internal') || lowerText.includes('team') || lowerText.includes('employee')) return 'Internal';
    if (lowerText.includes('developer') || lowerText.includes('dev')) return 'Developers';
    if (lowerText.includes('non-technical') || lowerText.includes('beginner')) return 'Non-Technical Users';
    return 'General';
  }

  private generateProjectName(text: string, projectType: FactoryType): string {
    const words = text.split(/\s+/).slice(0, 3);
    const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    return `${name}${projectType.charAt(0).toUpperCase() + projectType.slice(1)}`;
  }

  private generateDescription(text: string, features: ExtractedFeature[]): string {
    const featureNames = features.slice(0, 5).map(f => f.name.toLowerCase()).join(', ');
    const base = text.split('.')[0] || text.substring(0, 100);
    return featureNames
      ? `${base}. Key features: ${featureNames}.`
      : base;
  }

  private determineFeaturePriority(text: string, featureName: string): 'must-have' | 'should-have' | 'nice-to-have' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('must') || lowerText.includes('essential') || lowerText.includes('critical')) return 'must-have';
    if (lowerText.includes('should') || lowerText.includes('important')) return 'should-have';
    return 'nice-to-have';
  }

  private estimateFeatureEffort(text: string, featureName: string): 'hours' | 'days' | 'weeks' {
    const lowerText = text.toLowerCase();
    for (const [effort, keywords] of Object.entries(EFFORT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) return effort as 'hours' | 'days' | 'weeks';
      }
    }
    return 'days';
  }

  private calculateConfidence(features: ExtractedFeature[], entities: ExtractedEntity[], text: string): number {
    let confidence = 0.5; // base

    if (features.length > 0) confidence += 0.1;
    if (features.length > 3) confidence += 0.1;
    if (entities.length > 0) confidence += 0.1;
    if (entities.length > 2) confidence += 0.05;
    if (text.length > 100) confidence += 0.05;
    if (text.length > 500) confidence += 0.05;
    if (text.length > 1000) confidence += 0.05;

    return Math.min(confidence, 1);
  }

  private identifyAmbiguities(text: string, features: ExtractedFeature[], entities: ExtractedEntity[]): string[] {
    const ambiguities: string[] = [];

    if (features.length === 0) ambiguities.push('No specific features could be identified from the input.');
    if (entities.length === 0) ambiguities.push('No data entities could be identified.');
    if (text.length < 50) ambiguities.push('Input is very short. Consider providing more detail.');
    if (!text.includes('.') && text.length > 20) ambiguities.push('Input lacks sentence structure. Consider using complete sentences.');

    return ambiguities;
  }

  private generateSuggestions(text: string, features: ExtractedFeature[], projectType: FactoryType): string[] {
    const suggestions: string[] = [];

    if (!features.some(f => f.name === 'Responsive Design')) {
      suggestions.push('Consider adding responsive design for mobile users.');
    }
    if (!features.some(f => f.name === 'SEO Optimization')) {
      suggestions.push('Consider adding SEO metadata for better search visibility.');
    }
    if (!features.some(f => f.name === 'Accessibility')) {
      suggestions.push('Consider adding accessibility features (ARIA attributes, alt text).');
    }
    if (!features.some(f => f.name === 'Dark Mode')) {
      suggestions.push('Consider adding dark mode support for better UX.');
    }

    return suggestions;
  }

  private determinePerformanceRequirements(projectType: FactoryType, complexity: string) {
    const base = { loadTimeMs: 3000, lighthouseScore: 70, bundleSizeKb: 500 };
    if (complexity === 'simple') return { loadTimeMs: 2000, lighthouseScore: 80, bundleSizeKb: 300 };
    if (complexity === 'complex') return { loadTimeMs: 5000, lighthouseScore: 60, bundleSizeKb: 800 };
    return base;
  }

  private determineQualityGates(projectType: FactoryType, complexity: string) {
    return {
      buildMustPass: true,
      maxTsErrors: complexity === 'simple' ? 3 : complexity === 'complex' ? 15 : 8,
      minTestCoverage: 0,
      minLighthouseScore: 60,
      requiredAccessibility: ['alt-text', 'aria-labels', 'keyboard-navigation'],
    };
  }
}
