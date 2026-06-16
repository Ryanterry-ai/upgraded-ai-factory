// Phase 8: Benchmark Prompts - 100 Real-World Prompts
export const BENCHMARK_PROMPTS = [
    // ============================================
    // WEBSITE (20 prompts)
    // ============================================
    // Stripe-style homepage (5)
    {
        id: 'website-stripe-1',
        category: 'website',
        subcategory: 'stripe-style',
        prompt: 'Build a Stripe-style homepage with a hero section, feature grid, pricing table, and CTA. Modern dark theme with gradient accents.',
        expectedFeatures: ['hero', 'features', 'pricing', 'cta', 'dark-theme', 'gradient'],
        difficulty: 'medium',
        competitorNotes: 'Lovable excels at this style'
    },
    {
        id: 'website-stripe-2',
        category: 'website',
        subcategory: 'stripe-style',
        prompt: 'Create a payment processing landing page similar to Stripe. Include animated counters, trust badges, and integration logos.',
        expectedFeatures: ['counters', 'trust-badges', 'logos', 'animation'],
        difficulty: 'medium'
    },
    {
        id: 'website-stripe-3',
        category: 'website',
        subcategory: 'stripe-style',
        prompt: 'Build a SaaS pricing page with tiered plans, feature comparison table, and toggle for monthly/annual pricing.',
        expectedFeatures: ['pricing-tiers', 'comparison-table', 'toggle', 'highlight-popular'],
        difficulty: 'easy'
    },
    {
        id: 'website-stripe-4',
        category: 'website',
        subcategory: 'stripe-style',
        prompt: 'Create a developer documentation landing page with code examples, API reference, and quickstart guide.',
        expectedFeatures: ['code-blocks', 'api-reference', 'quickstart', 'navigation'],
        difficulty: 'medium'
    },
    {
        id: 'website-stripe-5',
        category: 'website',
        subcategory: 'stripe-style',
        prompt: 'Build a product showcase page with interactive demo, feature tabs, and customer testimonials.',
        expectedFeatures: ['interactive-demo', 'tabs', 'testimonials', 'cta'],
        difficulty: 'medium'
    },
    // Apple-style product page (5)
    {
        id: 'website-apple-1',
        category: 'website',
        subcategory: 'apple-style',
        prompt: 'Build an Apple-style product page with large hero image, parallax scrolling, and feature highlights. Minimalist design.',
        expectedFeatures: ['hero-image', 'parallax', 'minimalist', 'feature-highlights'],
        difficulty: 'hard',
        competitorNotes: 'Bolt.new has strong visual polish'
    },
    {
        id: 'website-apple-2',
        category: 'website',
        subcategory: 'apple-style',
        prompt: 'Create a product launch page with countdown timer, email signup, and social sharing buttons.',
        expectedFeatures: ['countdown', 'email-signup', 'social-share', 'launch-animations'],
        difficulty: 'medium'
    },
    {
        id: 'website-apple-3',
        category: 'website',
        subcategory: 'apple-style',
        prompt: 'Build a tech product comparison page with side-by-side specs, interactive sliders, and buy buttons.',
        expectedFeatures: ['comparison', 'specs', 'interactive-slider', 'buy-buttons'],
        difficulty: 'medium'
    },
    {
        id: 'website-apple-4',
        category: 'website',
        subcategory: 'apple-style',
        prompt: 'Create a mobile app showcase page with phone mockups, feature callouts, and download buttons.',
        expectedFeatures: ['phone-mockup', 'feature-callouts', 'download-buttons', 'app-store'],
        difficulty: 'easy'
    },
    {
        id: 'website-apple-5',
        category: 'website',
        subcategory: 'apple-style',
        prompt: 'Build a hardware product page with 360° view, color picker, and configurator.',
        expectedFeatures: ['360-view', 'color-picker', 'configurator', 'price-display'],
        difficulty: 'hard'
    },
    // Agency website (5)
    {
        id: 'website-agency-1',
        category: 'website',
        subcategory: 'agency',
        prompt: 'Build a creative agency website with portfolio grid, team section, and case studies. Bold typography and animations.',
        expectedFeatures: ['portfolio', 'team', 'case-studies', 'bold-typography'],
        difficulty: 'medium'
    },
    {
        id: 'website-agency-2',
        category: 'website',
        subcategory: 'agency',
        prompt: 'Create a digital marketing agency site with service cards, client logos, and contact form.',
        expectedFeatures: ['service-cards', 'client-logos', 'contact-form', 'testimonials'],
        difficulty: 'easy'
    },
    {
        id: 'website-agency-3',
        category: 'website',
        subcategory: 'agency',
        prompt: 'Build a design studio portfolio with masonry grid, hover effects, and project detail pages.',
        expectedFeatures: ['masonry-grid', 'hover-effects', 'project-detail', 'navigation'],
        difficulty: 'medium'
    },
    {
        id: 'website-agency-4',
        category: 'website',
        subcategory: 'agency',
        prompt: 'Create a branding agency site with before/after showcases, process timeline, and pricing.',
        expectedFeatures: ['before-after', 'timeline', 'pricing', 'process'],
        difficulty: 'medium'
    },
    {
        id: 'website-agency-5',
        category: 'website',
        subcategory: 'agency',
        prompt: 'Build a web development agency with tech stack display, project calculator, and booking system.',
        expectedFeatures: ['tech-stack', 'calculator', 'booking', 'portfolio'],
        difficulty: 'hard'
    },
    // Personal portfolio (5)
    {
        id: 'website-portfolio-1',
        category: 'website',
        subcategory: 'portfolio',
        prompt: 'Build a developer portfolio with project cards, skills matrix, GitHub stats, and contact form.',
        expectedFeatures: ['project-cards', 'skills', 'github-stats', 'contact'],
        difficulty: 'easy'
    },
    {
        id: 'website-portfolio-2',
        category: 'website',
        subcategory: 'portfolio',
        prompt: 'Create a designer portfolio with case studies, process showcase, and testimonial carousel.',
        expectedFeatures: ['case-studies', 'process', 'testimonials', 'carousel'],
        difficulty: 'medium'
    },
    {
        id: 'website-portfolio-3',
        category: 'website',
        subcategory: 'portfolio',
        prompt: 'Build a photographer portfolio with masonry gallery, lightbox, and booking inquiry form.',
        expectedFeatures: ['masonry-gallery', 'lightbox', 'booking-form', 'fullscreen-view'],
        difficulty: 'medium'
    },
    {
        id: 'website-portfolio-4',
        category: 'website',
        subcategory: 'portfolio',
        prompt: 'Create a freelance writer portfolio with blog previews, writing samples, and hire button.',
        expectedFeatures: ['blog-previews', 'writing-samples', 'hire-button', 'about-section'],
        difficulty: 'easy'
    },
    {
        id: 'website-portfolio-5',
        category: 'website',
        subcategory: 'portfolio',
        prompt: 'Build an interactive portfolio with scroll animations, cursor effects, and dynamic content loading.',
        expectedFeatures: ['scroll-animations', 'cursor-effects', 'dynamic-loading', 'interactivity'],
        difficulty: 'hard'
    },
    // Restaurant website (5)
    {
        id: 'website-restaurant-1',
        category: 'website',
        subcategory: 'restaurant',
        prompt: 'Build a restaurant website with menu, reservation form, gallery, and location map.',
        expectedFeatures: ['menu', 'reservation', 'gallery', 'map'],
        difficulty: 'easy'
    },
    {
        id: 'website-restaurant-2',
        category: 'website',
        subcategory: 'restaurant',
        prompt: 'Create a fine dining site with elegant design, chef profile, tasting menu, and wine list.',
        expectedFeatures: ['elegant-design', 'chef-profile', 'tasting-menu', 'wine-list'],
        difficulty: 'medium'
    },
    {
        id: 'website-restaurant-3',
        category: 'website',
        subcategory: 'restaurant',
        prompt: 'Build a food truck website with daily locations, menu items, and social media feed.',
        expectedFeatures: ['locations', 'daily-menu', 'social-feed', 'contact'],
        difficulty: 'easy'
    },
    {
        id: 'website-restaurant-4',
        category: 'website',
        subcategory: 'restaurant',
        prompt: 'Create a pizza shop with online ordering, delivery tracker, and loyalty program.',
        expectedFeatures: ['ordering', 'delivery-tracker', 'loyalty', 'cart'],
        difficulty: 'hard'
    },
    {
        id: 'website-restaurant-5',
        category: 'website',
        subcategory: 'restaurant',
        prompt: 'Build a café website with menu, online ordering, ambient music player, and gift cards.',
        expectedFeatures: ['menu', 'ordering', 'music-player', 'gift-cards'],
        difficulty: 'medium'
    },
    // ============================================
    // ECOMMERCE (20 prompts)
    // ============================================
    // Supplement store (4)
    {
        id: 'ecommerce-supplement-1',
        category: 'ecommerce',
        subcategory: 'supplement',
        prompt: 'Build a supplement store with product categories, filtering, reviews, and subscription options.',
        expectedFeatures: ['categories', 'filtering', 'reviews', 'subscriptions'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-supplement-2',
        category: 'ecommerce',
        subcategory: 'supplement',
        prompt: 'Create a protein powder shop with flavor selector, nutrition facts, and bundle deals.',
        expectedFeatures: ['flavor-selector', 'nutrition-facts', 'bundles', 'product-detail'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-supplement-3',
        category: 'ecommerce',
        subcategory: 'supplement',
        prompt: 'Build a vitamins store with quiz recommender, autoship, and loyalty points.',
        expectedFeatures: ['quiz', 'autoship', 'loyalty', 'recommendations'],
        difficulty: 'hard'
    },
    {
        id: 'ecommerce-supplement-4',
        category: 'ecommerce',
        subcategory: 'supplement',
        prompt: 'Create a pre-workout store with ingredient comparison, stack builder, and before/after gallery.',
        expectedFeatures: ['comparison', 'stack-builder', 'gallery', 'ingredients'],
        difficulty: 'medium'
    },
    // Clothing brand (4)
    {
        id: 'ecommerce-clothing-1',
        category: 'ecommerce',
        subcategory: 'clothing',
        prompt: 'Build a clothing brand store with size guide, color variants, and wishlist.',
        expectedFeatures: ['size-guide', 'color-variants', 'wishlist', 'product-grid'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-clothing-2',
        category: 'ecommerce',
        subcategory: 'clothing',
        prompt: 'Create a streetwear shop with lookbook, drop countdown, and exclusive access.',
        expectedFeatures: ['lookbook', 'countdown', 'exclusive', 'drops'],
        difficulty: 'hard'
    },
    {
        id: 'ecommerce-clothing-3',
        category: 'ecommerce',
        subcategory: 'clothing',
        prompt: 'Build a sustainable fashion store with material info, carbon footprint, and impact stats.',
        expectedFeatures: ['sustainability', 'materials', 'impact-stats', 'certifications'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-clothing-4',
        category: 'ecommerce',
        subcategory: 'clothing',
        prompt: 'Create a kids clothing store with age filter, growth tracker, and bundle pricing.',
        expectedFeatures: ['age-filter', 'growth-tracker', 'bundles', 'family-accounts'],
        difficulty: 'medium'
    },
    // Electronics store (4)
    {
        id: 'ecommerce-electronics-1',
        category: 'ecommerce',
        subcategory: 'electronics',
        prompt: 'Build an electronics store with spec comparison, reviews, and compatibility checker.',
        expectedFeatures: ['spec-comparison', 'reviews', 'compatibility', 'filters'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-electronics-2',
        category: 'ecommerce',
        subcategory: 'electronics',
        prompt: 'Create a gaming peripherals shop with performance specs, pro endorsements, and RGB customizer.',
        expectedFeatures: ['specs', 'endorsements', 'rgb-customizer', 'bundles'],
        difficulty: 'hard'
    },
    {
        id: 'ecommerce-electronics-3',
        category: 'ecommerce',
        subcategory: 'electronics',
        prompt: 'Build a smart home store with device compatibility, setup guides, and automation builder.',
        expectedFeatures: ['compatibility', 'setup-guides', 'automation', 'bundles'],
        difficulty: 'hard'
    },
    {
        id: 'ecommerce-electronics-4',
        category: 'ecommerce',
        subcategory: 'electronics',
        prompt: 'Create a audio equipment store with sound comparison, reviews, and recommendation quiz.',
        expectedFeatures: ['sound-comparison', 'reviews', 'quiz', 'specs'],
        difficulty: 'medium'
    },
    // Pet supplies (4)
    {
        id: 'ecommerce-pet-1',
        category: 'ecommerce',
        subcategory: 'pet',
        prompt: 'Build a pet supplies store with pet profiles, auto-ship, and vet recommendations.',
        expectedFeatures: ['pet-profiles', 'auto-ship', 'vet-recommendations', 'categories'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-pet-2',
        category: 'ecommerce',
        subcategory: 'pet',
        prompt: 'Create a premium dog food shop with breed selector, nutrition plan, and subscription.',
        expectedFeatures: ['breed-selector', 'nutrition-plan', 'subscription', 'ingredients'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-pet-3',
        category: 'ecommerce',
        subcategory: 'pet',
        prompt: 'Build a cat specialty store with indoor/outdoor filter, age-based recommendations, and toy bundles.',
        expectedFeatures: ['indoor-outdoor', 'age-filter', 'bundles', 'recommendations'],
        difficulty: 'easy'
    },
    {
        id: 'ecommerce-pet-4',
        category: 'ecommerce',
        subcategory: 'pet',
        prompt: 'Create an aquarium store with tank size calculator, fish compatibility, and care guides.',
        expectedFeatures: ['calculator', 'compatibility', 'care-guides', 'products'],
        difficulty: 'hard'
    },
    // Beauty brand (4)
    {
        id: 'ecommerce-beauty-1',
        category: 'ecommerce',
        subcategory: 'beauty',
        prompt: 'Build a skincare store with skin type quiz, ingredient finder, and routine builder.',
        expectedFeatures: ['skin-quiz', 'ingredient-finder', 'routine-builder', 'reviews'],
        difficulty: 'hard'
    },
    {
        id: 'ecommerce-beauty-2',
        category: 'ecommerce',
        subcategory: 'beauty',
        prompt: 'Create a makeup brand with shade matcher, tutorials, and virtual try-on.',
        expectedFeatures: ['shade-matcher', 'tutorials', 'virtual-try-on', 'lookbook'],
        difficulty: 'hard'
    },
    {
        id: 'ecommerce-beauty-3',
        category: 'ecommerce',
        subcategory: 'beauty',
        prompt: 'Build a natural cosmetics shop with purity ratings, sustainability badges, and gift sets.',
        expectedFeatures: ['purity-ratings', 'sustainability', 'gift-sets', 'ingredients'],
        difficulty: 'medium'
    },
    {
        id: 'ecommerce-beauty-4',
        category: 'ecommerce',
        subcategory: 'beauty',
        prompt: 'Create a fragrance store with scent profiles, occasion filter, and sample kit ordering.',
        expectedFeatures: ['scent-profiles', 'occasion-filter', 'sample-kit', 'reviews'],
        difficulty: 'medium'
    },
    // ============================================
    // SAAS (20 prompts)
    // ============================================
    // CRM (4)
    {
        id: 'saas-crm-1',
        category: 'saas',
        subcategory: 'crm',
        prompt: 'Build a CRM dashboard with contact management, deal pipeline, and activity timeline.',
        expectedFeatures: ['contacts', 'pipeline', 'timeline', 'search'],
        difficulty: 'medium'
    },
    {
        id: 'saas-crm-2',
        category: 'saas',
        subcategory: 'crm',
        prompt: 'Create a sales CRM with lead scoring, email integration, and forecast charts.',
        expectedFeatures: ['lead-scoring', 'email', 'forecast', 'charts'],
        difficulty: 'hard'
    },
    {
        id: 'saas-crm-3',
        category: 'saas',
        subcategory: 'crm',
        prompt: 'Build a small business CRM with customer profiles, notes, and task management.',
        expectedFeatures: ['profiles', 'notes', 'tasks', 'search'],
        difficulty: 'easy'
    },
    {
        id: 'saas-crm-4',
        category: 'saas',
        subcategory: 'crm',
        prompt: 'Create an enterprise CRM with role-based access, audit logs, and custom fields.',
        expectedFeatures: ['rbac', 'audit-logs', 'custom-fields', 'reporting'],
        difficulty: 'hard'
    },
    // Project management (4)
    {
        id: 'saas-pm-1',
        category: 'saas',
        subcategory: 'project-management',
        prompt: 'Build a project management tool with Kanban board, Gantt chart, and team workload.',
        expectedFeatures: ['kanban', 'gantt', 'workload', 'tasks'],
        difficulty: 'hard'
    },
    {
        id: 'saas-pm-2',
        category: 'saas',
        subcategory: 'project-management',
        prompt: 'Create a simple task manager with lists, due dates, and team assignments.',
        expectedFeatures: ['lists', 'due-dates', 'assignments', 'filters'],
        difficulty: 'easy'
    },
    {
        id: 'saas-pm-3',
        category: 'saas',
        subcategory: 'project-management',
        prompt: 'Build a sprint planning tool with backlog, story points, and velocity tracking.',
        expectedFeatures: ['backlog', 'story-points', 'velocity', 'sprints'],
        difficulty: 'medium'
    },
    {
        id: 'saas-pm-4',
        category: 'saas',
        subcategory: 'project-management',
        prompt: 'Create a client portal with project timeline, deliverables, and approval workflow.',
        expectedFeatures: ['timeline', 'deliverables', 'approvals', 'messaging'],
        difficulty: 'medium'
    },
    // Inventory management (4)
    {
        id: 'saas-inventory-1',
        category: 'saas',
        subcategory: 'inventory',
        prompt: 'Build an inventory management system with stock levels, reorder alerts, and barcode scanning.',
        expectedFeatures: ['stock-levels', 'alerts', 'barcode', 'reports'],
        difficulty: 'medium'
    },
    {
        id: 'saas-inventory-2',
        category: 'saas',
        subcategory: 'inventory',
        prompt: 'Create a warehouse management tool with location tracking, pick lists, and audit trail.',
        expectedFeatures: ['locations', 'pick-lists', 'audit', 'search'],
        difficulty: 'hard'
    },
    {
        id: 'saas-inventory-3',
        category: 'saas',
        subcategory: 'inventory',
        prompt: 'Build a multi-location inventory sync with transfer requests and stock history.',
        expectedFeatures: ['multi-location', 'transfers', 'history', 'sync'],
        difficulty: 'hard'
    },
    {
        id: 'saas-inventory-4',
        category: 'saas',
        subcategory: 'inventory',
        prompt: 'Create a simple stock tracker with CSV import, alerts, and basic reporting.',
        expectedFeatures: ['csv-import', 'alerts', 'reporting', 'export'],
        difficulty: 'easy'
    },
    // HR software (4)
    {
        id: 'saas-hr-1',
        category: 'saas',
        subcategory: 'hr',
        prompt: 'Build an HR dashboard with employee directory, PTO tracking, and org chart.',
        expectedFeatures: ['directory', 'pto', 'org-chart', 'profiles'],
        difficulty: 'medium'
    },
    {
        id: 'saas-hr-2',
        category: 'saas',
        subcategory: 'hr',
        prompt: 'Create a payroll system with salary calculations, tax forms, and pay stubs.',
        expectedFeatures: ['payroll', 'tax-forms', 'pay-stubs', 'reports'],
        difficulty: 'hard'
    },
    {
        id: 'saas-hr-3',
        category: 'saas',
        subcategory: 'hr',
        prompt: 'Build an applicant tracking system with job postings, candidate pipeline, and interview scheduling.',
        expectedFeatures: ['job-postings', 'pipeline', 'scheduling', 'notes'],
        difficulty: 'hard'
    },
    {
        id: 'saas-hr-4',
        category: 'saas',
        subcategory: 'hr',
        prompt: 'Create an onboarding portal with checklists, document upload, and training modules.',
        expectedFeatures: ['checklists', 'document-upload', 'training', 'progress'],
        difficulty: 'medium'
    },
    // Analytics platform (4)
    {
        id: 'saas-analytics-1',
        category: 'saas',
        subcategory: 'analytics',
        prompt: 'Build an analytics dashboard with real-time charts, filters, and export options.',
        expectedFeatures: ['real-time-charts', 'filters', 'export', 'kpi-cards'],
        difficulty: 'medium'
    },
    {
        id: 'saas-analytics-2',
        category: 'saas',
        subcategory: 'analytics',
        prompt: 'Create a marketing analytics tool with campaign tracking, ROI calculations, and attribution.',
        expectedFeatures: ['campaigns', 'roi', 'attribution', 'funnels'],
        difficulty: 'hard'
    },
    {
        id: 'saas-analytics-3',
        category: 'saas',
        subcategory: 'analytics',
        prompt: 'Build a website analytics tool with traffic sources, user behavior, and conversion tracking.',
        expectedFeatures: ['traffic', 'behavior', 'conversions', 'heatmaps'],
        difficulty: 'hard'
    },
    {
        id: 'saas-analytics-4',
        category: 'saas',
        subcategory: 'analytics',
        prompt: 'Create a simple metrics dashboard with KPI cards, trend charts, and date range picker.',
        expectedFeatures: ['kpi-cards', 'trends', 'date-picker', 'export'],
        difficulty: 'easy'
    },
    // ============================================
    // DASHBOARD (20 prompts)
    // ============================================
    // Sales dashboard (4)
    {
        id: 'dashboard-sales-1',
        category: 'dashboard',
        subcategory: 'sales',
        prompt: 'Build a sales dashboard with revenue charts, pipeline value, and rep leaderboard.',
        expectedFeatures: ['revenue-charts', 'pipeline', 'leaderboard', 'filters'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-sales-2',
        category: 'dashboard',
        subcategory: 'sales',
        prompt: 'Create a sales analytics tool with deal velocity, win rates, and territory mapping.',
        expectedFeatures: ['velocity', 'win-rates', 'territory', 'forecast'],
        difficulty: 'hard'
    },
    {
        id: 'dashboard-sales-3',
        category: 'dashboard',
        subcategory: 'sales',
        prompt: 'Build a CRM dashboard with activity feed, quotas, and commission calculator.',
        expectedFeatures: ['activity-feed', 'quotas', 'commission', 'goals'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-sales-4',
        category: 'dashboard',
        subcategory: 'sales',
        prompt: 'Create a simple sales tracker with daily/weekly/monthly views and goal progress.',
        expectedFeatures: ['daily-weekly-monthly', 'goals', 'progress', 'simple-charts'],
        difficulty: 'easy'
    },
    // Marketing dashboard (4)
    {
        id: 'dashboard-marketing-1',
        category: 'dashboard',
        subcategory: 'marketing',
        prompt: 'Build a marketing dashboard with campaign performance, ROI, and channel breakdown.',
        expectedFeatures: ['campaigns', 'roi', 'channels', 'metrics'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-marketing-2',
        category: 'dashboard',
        subcategory: 'marketing',
        prompt: 'Create a social media analytics tool with engagement metrics, follower growth, and content calendar.',
        expectedFeatures: ['engagement', 'followers', 'content-calendar', 'posts'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-marketing-3',
        category: 'dashboard',
        subcategory: 'marketing',
        prompt: 'Build an email marketing dashboard with open rates, click tracking, and A/B test results.',
        expectedFeatures: ['open-rates', 'clicks', 'ab-tests', 'campaigns'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-marketing-4',
        category: 'dashboard',
        subcategory: 'marketing',
        prompt: 'Create a content marketing tracker with SEO scores, keyword rankings, and content performance.',
        expectedFeatures: ['seo-scores', 'keywords', 'content-performance', 'editorial-calendar'],
        difficulty: 'hard'
    },
    // Operations dashboard (4)
    {
        id: 'dashboard-operations-1',
        category: 'dashboard',
        subcategory: 'operations',
        prompt: 'Build an operations dashboard with system status, incident tracking, and SLA metrics.',
        expectedFeatures: ['system-status', 'incidents', 'sla', 'uptime'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-operations-2',
        category: 'dashboard',
        subcategory: 'operations',
        prompt: 'Create a supply chain dashboard with inventory levels, shipment tracking, and supplier metrics.',
        expectedFeatures: ['inventory', 'shipments', 'suppliers', 'lead-times'],
        difficulty: 'hard'
    },
    {
        id: 'dashboard-operations-3',
        category: 'dashboard',
        subcategory: 'operations',
        prompt: 'Build a support ticket dashboard with queue management, SLA tracking, and agent performance.',
        expectedFeatures: ['tickets', 'queue', 'sla', 'agent-performance'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-operations-4',
        category: 'dashboard',
        subcategory: 'operations',
        prompt: 'Create a facility management dashboard with booking, maintenance requests, and occupancy.',
        expectedFeatures: ['booking', 'maintenance', 'occupancy', 'calendar'],
        difficulty: 'medium'
    },
    // Finance dashboard (4)
    {
        id: 'dashboard-finance-1',
        category: 'dashboard',
        subcategory: 'finance',
        prompt: 'Build a finance dashboard with P&L, cash flow, and budget vs actual charts.',
        expectedFeatures: ['p-and-l', 'cash-flow', 'budget', 'charts'],
        difficulty: 'hard'
    },
    {
        id: 'dashboard-finance-2',
        category: 'dashboard',
        subcategory: 'finance',
        prompt: 'Create an expense tracking tool with categories, receipts, and approval workflow.',
        expectedFeatures: ['categories', 'receipts', 'approvals', 'reports'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-finance-3',
        category: 'dashboard',
        subcategory: 'finance',
        prompt: 'Build an invoice management system with templates, payment tracking, and reminders.',
        expectedFeatures: ['templates', 'payment-tracking', 'reminders', 'reports'],
        difficulty: 'medium'
    },
    {
        id: 'dashboard-finance-4',
        category: 'dashboard',
        subcategory: 'finance',
        prompt: 'Create a simple bookkeeping tool with transaction categories, reconciliation, and reports.',
        expectedFeatures: ['transactions', 'reconciliation', 'reports', 'export'],
        difficulty: 'easy'
    },
    // ============================================
    // ADMIN (10 prompts)
    // ============================================
    // User management (3)
    {
        id: 'admin-users-1',
        category: 'admin',
        subcategory: 'user-management',
        prompt: 'Build a user management panel with roles, permissions, and activity logs.',
        expectedFeatures: ['roles', 'permissions', 'activity-logs', 'search'],
        difficulty: 'medium'
    },
    {
        id: 'admin-users-2',
        category: 'admin',
        subcategory: 'user-management',
        prompt: 'Create an admin dashboard with user statistics, growth charts, and engagement metrics.',
        expectedFeatures: ['statistics', 'growth-charts', 'engagement', 'filters'],
        difficulty: 'medium'
    },
    {
        id: 'admin-users-3',
        category: 'admin',
        subcategory: 'user-management',
        prompt: 'Build a user onboarding admin with progress tracking, email templates, and analytics.',
        expectedFeatures: ['progress', 'email-templates', 'analytics', 'bulk-actions'],
        difficulty: 'hard'
    },
    // Product management (3)
    {
        id: 'admin-products-1',
        category: 'admin',
        subcategory: 'product-management',
        prompt: 'Build a product admin with inventory, pricing, and category management.',
        expectedFeatures: ['inventory', 'pricing', 'categories', 'bulk-edit'],
        difficulty: 'medium'
    },
    {
        id: 'admin-products-2',
        category: 'admin',
        subcategory: 'product-management',
        prompt: 'Create a product catalog admin with images, variants, and SEO fields.',
        expectedFeatures: ['images', 'variants', 'seo', 'preview'],
        difficulty: 'medium'
    },
    {
        id: 'admin-products-3',
        category: 'admin',
        subcategory: 'product-management',
        prompt: 'Build a digital product admin with file management, licenses, and download tracking.',
        expectedFeatures: ['file-management', 'licenses', 'downloads', 'analytics'],
        difficulty: 'hard'
    },
    // Order management (4)
    {
        id: 'admin-orders-1',
        category: 'admin',
        subcategory: 'order-management',
        prompt: 'Build an order management system with status tracking, refunds, and shipping labels.',
        expectedFeatures: ['status', 'refunds', 'shipping', 'search'],
        difficulty: 'medium'
    },
    {
        id: 'admin-orders-2',
        category: 'admin',
        subcategory: 'order-management',
        prompt: 'Create an order dashboard with fulfillment queue, bulk actions, and reporting.',
        expectedFeatures: ['fulfillment', 'bulk-actions', 'reporting', 'filters'],
        difficulty: 'medium'
    },
    {
        id: 'admin-orders-3',
        category: 'admin',
        subcategory: 'order-management',
        prompt: 'Build a multi-vendor order system with vendor management, splits, and payouts.',
        expectedFeatures: ['multi-vendor', 'splits', 'payouts', 'vendor-portal'],
        difficulty: 'hard'
    },
    {
        id: 'admin-orders-4',
        category: 'admin',
        subcategory: 'order-management',
        prompt: 'Create a subscription management admin with renewals, cancellations, and usage tracking.',
        expectedFeatures: ['renewals', 'cancellations', 'usage', 'billing'],
        difficulty: 'hard'
    },
    // ============================================
    // AI AGENT (10 prompts)
    // ============================================
    // Customer support (3)
    {
        id: 'agent-support-1',
        category: 'agent',
        subcategory: 'customer-support',
        prompt: 'Build a customer support AI agent with ticket routing, knowledge base, and escalation.',
        expectedFeatures: ['routing', 'knowledge-base', 'escalation', 'chat-history'],
        difficulty: 'hard'
    },
    {
        id: 'agent-support-2',
        category: 'agent',
        subcategory: 'customer-support',
        prompt: 'Create a chatbot builder with drag-drop flow editor, templates, and analytics.',
        expectedFeatures: ['flow-editor', 'templates', 'analytics', 'preview'],
        difficulty: 'hard'
    },
    {
        id: 'agent-support-3',
        category: 'agent',
        subcategory: 'customer-support',
        prompt: 'Build a help desk AI with suggested responses, sentiment analysis, and SLA tracking.',
        expectedFeatures: ['suggested-responses', 'sentiment', 'sla', 'prioritization'],
        difficulty: 'medium'
    },
    // Lead qualification (3)
    {
        id: 'agent-lead-1',
        category: 'agent',
        subcategory: 'lead-qualification',
        prompt: 'Build a lead qualification agent with scoring, routing, and CRM integration.',
        expectedFeatures: ['scoring', 'routing', 'crm-integration', 'qualification-flow'],
        difficulty: 'hard'
    },
    {
        id: 'agent-lead-2',
        category: 'agent',
        subcategory: 'lead-qualification',
        prompt: 'Create a sales assistant AI with meeting scheduling, follow-up reminders, and pipeline updates.',
        expectedFeatures: ['scheduling', 'reminders', 'pipeline', 'notes'],
        difficulty: 'medium'
    },
    {
        id: 'agent-lead-3',
        category: 'agent',
        subcategory: 'lead-qualification',
        prompt: 'Build a website visitor tracker with intent scoring and automated outreach.',
        expectedFeatures: ['visitor-tracking', 'intent-scoring', 'outreach', 'analytics'],
        difficulty: 'hard'
    },
    // Content generation (4)
    {
        id: 'agent-content-1',
        category: 'agent',
        subcategory: 'content-generation',
        prompt: 'Build a blog content AI with outline generation, SEO optimization, and scheduling.',
        expectedFeatures: ['outline', 'seo', 'scheduling', 'editor'],
        difficulty: 'medium'
    },
    {
        id: 'agent-content-2',
        category: 'agent',
        subcategory: 'content-generation',
        prompt: 'Create a social media AI with content calendar, hashtag suggestions, and analytics.',
        expectedFeatures: ['calendar', 'hashtags', 'analytics', 'scheduling'],
        difficulty: 'medium'
    },
    {
        id: 'agent-content-3',
        category: 'agent',
        subcategory: 'content-generation',
        prompt: 'Build an email marketing AI with subject line testing, copy optimization, and A/B testing.',
        expectedFeatures: ['subject-lines', 'copy-optimization', 'ab-testing', 'templates'],
        difficulty: 'hard'
    },
    {
        id: 'agent-content-4',
        category: 'agent',
        subcategory: 'content-generation',
        prompt: 'Create a product description AI with bulk generation, SEO, and multi-language support.',
        expectedFeatures: ['bulk-generation', 'seo', 'multi-language', 'templates'],
        difficulty: 'medium'
    }
];
export function getPromptsByCategory(category) {
    return BENCHMARK_PROMPTS.filter(p => p.category === category);
}
export function getPromptsByDifficulty(difficulty) {
    return BENCHMARK_PROMPTS.filter(p => p.difficulty === difficulty);
}
export function getPromptById(id) {
    return BENCHMARK_PROMPTS.find(p => p.id === id);
}
export function getPromptStats() {
    const byCategory = {};
    const byDifficulty = {};
    for (const prompt of BENCHMARK_PROMPTS) {
        byCategory[prompt.category] = (byCategory[prompt.category] || 0) + 1;
        byDifficulty[prompt.difficulty] = (byDifficulty[prompt.difficulty] || 0) + 1;
    }
    return {
        total: BENCHMARK_PROMPTS.length,
        byCategory,
        byDifficulty
    };
}
//# sourceMappingURL=benchmark-prompts.js.map