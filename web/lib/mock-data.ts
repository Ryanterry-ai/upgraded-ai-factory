/**
 * Mock Data Library — Domain-specific realistic content for generated projects.
 * Each blueprint has its own data set with real names, prices, descriptions, and images.
 */

// ═══════════════════════════════════════════════════════════
// SHARED UTILITIES
// ═══════════════════════════════════════════════════════════

export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function getProductImageUrl(query: string, width = 400, height = 400): string {
  return `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=${width}&h=${height}&fit=crop&auto=format`;
}

export function getPlaceholderImage(category: string, width = 400, height = 300): string {
  const images: Record<string, string[]> = {
    fitness: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
    ],
    food: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    ],
    tech: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop",
    ],
    movie: [
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop",
    ],
    office: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop",
    ],
  };
  const categoryImages = images[category] || images.tech;
  const index = Math.abs(hashCode(category)) % categoryImages.length;
  return categoryImages[index];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// ═══════════════════════════════════════════════════════════
// ECOMMERCE MOCK DATA
// ═══════════════════════════════════════════════════════════

export const ECOMMERCE_MOCK = {
  companyName: "FitLife Supplements",
  tagline: "Premium Nutrition for Peak Performance",
  heroTitle: "Fuel Your Fitness Journey",
  heroSubtitle: "Science-backed supplements trusted by 50,000+ athletes worldwide",
  products: [
    {
      id: "1",
      name: "Whey Protein Isolate",
      price: 49.99,
      originalPrice: 59.99,
      description: "Premium grass-fed whey protein with 25g protein per serving. Zero artificial sweeteners.",
      category: "Protein",
      rating: 4.8,
      reviews: 2847,
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop",
      badge: "Best Seller",
      inStock: true,
    },
    {
      id: "2",
      name: "Creatine Monohydrate",
      price: 29.99,
      originalPrice: 34.99,
      description: "5g micronized creatine per serving. Lab-tested for purity. Unflavored for easy mixing.",
      category: "Performance",
      rating: 4.9,
      reviews: 3421,
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop",
      badge: "Top Rated",
      inStock: true,
    },
    {
      id: "3",
      name: "BCAA Recovery Powder",
      price: 34.99,
      originalPrice: null,
      description: "2:1:1 BCAA ratio with electrolytes. Tropical flavor.加速 recovery between sessions.",
      category: "Recovery",
      rating: 4.7,
      reviews: 1892,
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop",
      badge: null,
      inStock: true,
    },
    {
      id: "4",
      name: "Pre-Workout Ignite",
      price: 39.99,
      originalPrice: 44.99,
      description: "Explosive energy with 200mg caffeine, beta-alanine, and citrulline malate. Fruit Punch flavor.",
      category: "Energy",
      rating: 4.6,
      reviews: 2156,
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop",
      badge: "New",
      inStock: true,
    },
    {
      id: "5",
      name: "Omega-3 Fish Oil",
      price: 24.99,
      originalPrice: null,
      description: "Triple strength EPA/DHA. Molecular distillation for purity. No fishy aftertaste.",
      category: "Health",
      rating: 4.8,
      reviews: 1567,
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop",
      badge: null,
      inStock: true,
    },
    {
      id: "6",
      name: "Mass Gainer Complex",
      price: 54.99,
      originalPrice: 64.99,
      description: "1250 calories per serving. 50g protein, 250g carbs. Vanilla Cream flavor.",
      category: "Protein",
      rating: 4.5,
      reviews: 987,
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d6?w=400&h=400&fit=crop",
      badge: null,
      inStock: true,
    },
  ],
  categories: ["All", "Protein", "Performance", "Recovery", "Energy", "Health"],
  testimonials: [
    {
      name: "Sarah Mitchell",
      role: "CrossFit Athlete",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      text: "The Whey Protein Isolate changed my recovery game. I'm hitting PRs every week now.",
      rating: 5,
    },
    {
      name: "James Rodriguez",
      role: "Personal Trainer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
      text: "I recommend FitLife to all my clients. The quality is unmatched and the results speak for themselves.",
      rating: 5,
    },
    {
      name: "Emily Chen",
      role: "Marathon Runner",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      text: "BCAA Recovery Powder helped me cut my recovery time in half. Game changer for endurance athletes.",
      rating: 5,
    },
  ],
  stats: [
    { label: "Happy Customers", value: "50,000+" },
    { label: "Products Sold", value: "1M+" },
    { label: "5-Star Reviews", value: "25,000+" },
    { label: "Countries Shipped", value: "35+" },
  ],
  featuredCategories: [
    { name: "Protein", icon: "💪", count: 12 },
    { name: "Pre-Workout", icon: "⚡", count: 8 },
    { name: "Recovery", icon: "🔄", count: 6 },
    { name: "Health", icon: "❤️", count: 10 },
  ],
};

// ═══════════════════════════════════════════════════════════
// GYM CRM MOCK DATA
// ═══════════════════════════════════════════════════════════

export const GYM_CRM_MOCK = {
  companyName: "Iron Peak Fitness",
  dashboardStats: [
    { label: "Total Members", value: "1,247", change: "+12%", trend: "up" },
    { label: "Monthly Revenue", value: "$89,450", change: "+8%", trend: "up" },
    { label: "Attendance Today", value: "89", change: "-3%", trend: "down" },
    { label: "Active Classes", value: "12", change: "+2", trend: "up" },
  ],
  members: [
    { id: "M001", name: "Alex Thompson", email: "alex@email.com", phone: "+1 555-0101", membership: "Premium", status: "Active", joinDate: "2024-01-15", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
    { id: "M002", name: "Maria Garcia", email: "maria@email.com", phone: "+1 555-0102", membership: "Standard", status: "Active", joinDate: "2024-02-20", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" },
    { id: "M003", name: "David Kim", email: "david@email.com", phone: "+1 555-0103", membership: "Premium", status: "Active", joinDate: "2024-03-10", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David" },
    { id: "M004", name: "Sarah Wilson", email: "sarah@email.com", phone: "+1 555-0104", membership: "Basic", status: "Expired", joinDate: "2023-11-05", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { id: "M005", name: "James Brown", email: "james@email.com", phone: "+1 555-0105", membership: "Premium", status: "Active", joinDate: "2024-04-01", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James" },
    { id: "M006", name: "Lisa Anderson", email: "lisa@email.com", phone: "+1 555-0106", membership: "Standard", status: "Active", joinDate: "2024-05-12", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa" },
  ],
  classes: [
    { id: "C001", name: "HIIT Blast", instructor: "Mike Johnson", time: "6:00 AM", capacity: 20, enrolled: 18, duration: "45 min", intensity: "High" },
    { id: "C002", name: "Yoga Flow", instructor: "Emma Davis", time: "8:00 AM", capacity: 15, enrolled: 12, duration: "60 min", intensity: "Low" },
    { id: "C003", name: "Spin Cycle", instructor: "Chris Lee", time: "10:00 AM", capacity: 25, enrolled: 22, duration: "45 min", intensity: "High" },
    { id: "C004", name: "Strength Training", instructor: "Mike Johnson", time: "12:00 PM", capacity: 12, enrolled: 10, duration: "50 min", intensity: "Medium" },
    { id: "C005", name: "Pilates", instructor: "Emma Davis", time: "4:00 PM", capacity: 18, enrolled: 15, duration: "55 min", intensity: "Low" },
  ],
  attendance: [
    { date: "2024-06-01", total: 87, peak: "6:00 AM - 8:00 AM" },
    { date: "2024-06-02", total: 92, peak: "5:00 PM - 7:00 PM" },
    { date: "2024-06-03", total: 78, peak: "6:00 AM - 8:00 AM" },
    { date: "2024-06-04", total: 95, peak: "5:00 PM - 7:00 PM" },
    { date: "2024-06-05", total: 88, peak: "6:00 AM - 8:00 AM" },
  ],
  leads: [
    { id: "L001", name: "Jennifer Taylor", source: "Website", status: "Contacted", value: 1200, phone: "+1 555-0201" },
    { id: "L002", name: "Robert Martinez", source: "Referral", status: "Qualified", value: 2400, phone: "+1 555-0202" },
    { id: "L003", name: "Amanda White", source: "Social Media", status: "New", value: 1800, phone: "+1 555-0203" },
    { id: "L004", name: "Christopher Lee", source: "Walk-in", status: "Negotiation", value: 3600, phone: "+1 555-0204" },
  ],
  billing: [
    { id: "INV-001", member: "Alex Thompson", amount: 79.99, status: "Paid", date: "2024-06-01", plan: "Premium" },
    { id: "INV-002", member: "Maria Garcia", amount: 49.99, status: "Paid", date: "2024-06-01", plan: "Standard" },
    { id: "INV-003", member: "David Kim", amount: 79.99, status: "Pending", date: "2024-06-01", plan: "Premium" },
    { id: "INV-004", member: "Sarah Wilson", amount: 29.99, status: "Overdue", date: "2024-05-01", plan: "Basic" },
  ],
};

// ═══════════════════════════════════════════════════════════
// STREAMING MEDIA MOCK DATA
// ═══════════════════════════════════════════════════════════

export const STREAMING_MOCK = {
  companyName: "StreamVault",
  tagline: "Unlimited Movies & Shows",
  heroTitle: "Watch What You Love",
  heroSubtitle: "Stream thousands of movies, shows, and originals. Cancel anytime.",
  profiles: [
    { id: "1", name: "You", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You", isKids: false },
    { id: "2", name: "Partner", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Partner", isKids: false },
    { id: "3", name: "Kids", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kids", isKids: true },
  ],
  content: [
    {
      id: "1",
      title: "The Last Frontier",
      type: "movie",
      year: 2024,
      rating: "PG-13",
      duration: "2h 14m",
      genre: ["Action", "Sci-Fi"],
      description: "In a future where Earth is dying, a team of astronauts embarks on a mission to find a new home for humanity.",
      thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=170&fit=crop",
      backdrop: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&h=720&fit=cop",
      match: 98,
    },
    {
      id: "2",
      title: "Cyber Wars",
      type: "series",
      year: 2024,
      rating: "TV-MA",
      duration: "3 Seasons",
      genre: ["Thriller", "Technology"],
      description: "A hacker discovers a global conspiracy and must choose between exposing the truth or protecting her family.",
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&h=170&fit=crop",
      backdrop: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1280&h=720&fit=crop",
      match: 95,
    },
    {
      id: "3",
      title: "Ocean's Memory",
      type: "movie",
      year: 2023,
      rating: "PG",
      duration: "1h 48m",
      genre: ["Drama", "Mystery"],
      description: "A marine biologist uncovers secrets from her past while researching a mysterious deep-sea creature.",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=170&fit=crop",
      backdrop: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&h=720&fit=crop",
      match: 92,
    },
    {
      id: "4",
      title: "Code Breakers",
      type: "series",
      year: 2024,
      rating: "TV-14",
      duration: "2 Seasons",
      genre: ["Documentary", "Technology"],
      description: "The untold story of the brilliant minds who cracked the world's most dangerous cyber codes.",
      thumbnail: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=170&fit=crop",
      backdrop: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1280&h=720&fit=crop",
      match: 89,
    },
    {
      id: "5",
      title: "Mountain Peak",
      type: "movie",
      year: 2024,
      rating: "R",
      duration: "2h 2m",
      genre: ["Adventure", "Drama"],
      description: "Two estranged siblings reunite to climb the world's most dangerous mountain, confronting their past along the way.",
      thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=170&fit=crop",
      backdrop: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&h=720&fit=crop",
      match: 87,
    },
    {
      id: "6",
      title: "The Heist",
      type: "movie",
      year: 2023,
      rating: "TV-MA",
      duration: "1h 56m",
      genre: ["Crime", "Thriller"],
      description: "A master thief assembles a crew for one last job — stealing from the world's most secure vault.",
      thumbnail: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=170&fit=crop",
      backdrop: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1280&h=720&fit=crop",
      match: 94,
    },
  ],
  categories: [
    { name: "Trending Now", items: [] },
    { name: "Continue Watching", items: [] },
    { name: "Top Picks for You", items: [] },
    { name: "New Releases", items: [] },
    { name: "Action & Adventure", items: [] },
    { name: "Documentaries", items: [] },
  ],
  subscription: {
    plans: [
      { name: "Basic", price: 8.99, features: ["1 screen", "HD quality", "Watch on 1 device"], popular: false },
      { name: "Standard", price: 13.99, features: ["2 screens", "Full HD quality", "Watch on 2 devices", "Download for offline"], popular: true },
      { name: "Premium", price: 17.99, features: ["4 screens", "4K + HDR quality", "Watch on 4 devices", "Download for offline", "Spatial Audio"], popular: false },
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// RESTAURANT MOCK DATA
// ═══════════════════════════════════════════════════════════

export const RESTAURANT_MOCK = {
  companyName: "Sakura Japanese Bistro",
  tagline: "Authentic Japanese Cuisine",
  heroTitle: "Taste of Japan in Every Bite",
  heroSubtitle: "Fresh ingredients, traditional recipes, modern presentation",
  menu: [
    { id: "1", name: "Salmon Sashimi", description: "Fresh Atlantic salmon, thinly sliced. Served with wasabi and soy sauce.", price: 16.99, category: "Sashimi", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", spicy: false, popular: true },
    { id: "2", name: "Dragon Roll", description: "Shrimp tempura, avocado, eel sauce, and tobiko. 8 pieces.", price: 18.99, category: "Rolls", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop", spicy: false, popular: true },
    { id: "3", name: "Spicy Tuna Roll", description: "Fresh tuna, spicy mayo, cucumber, and sesame seeds. 8 pieces.", price: 14.99, category: "Rolls", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop", spicy: true, popular: false },
    { id: "4", name: "Chicken Teriyaki", description: "Grilled chicken thigh glazed with house teriyaki. Served with steamed rice.", price: 15.99, category: "Entrees", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", spicy: false, popular: false },
    { id: "5", name: "Miso Ramen", description: "Rich miso broth, chashu pork, soft egg, nori, and green onions.", price: 16.99, category: "Ramen", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop", spicy: false, popular: true },
    { id: "6", name: "Tempura Udon", description: "Udon noodles in dashi broth, topped with shrimp tempura and scallions.", price: 14.99, category: "Ramen", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop", spicy: false, popular: false },
    { id: "7", name: "Edamame", description: "Steamed soybeans with sea salt. A classic appetizer.", price: 6.99, category: "Appetizers", image: "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=400&h=300&fit=crop", spicy: false, popular: false },
    { id: "8", name: "Gyoza", description: "Pan-fried pork dumplings with dipping sauce. 6 pieces.", price: 8.99, category: "Appetizers", image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop", spicy: false, popular: true },
  ],
  categories: ["All", "Appetizers", "Sashimi", "Rolls", "Entrees", "Ramen"],
  testimonials: [
    { name: "Michael Chang", text: "Best sushi I've had outside of Tokyo. The Dragon Roll is incredible!", rating: 5 },
    { name: "Emily Watson", text: "The ramen is authentic and the service is always outstanding.", rating: 5 },
    { name: "David Kim", text: "Our family's favorite spot. The kids love the teriyaki chicken.", rating: 5 },
  ],
  hours: {
    monday: "11:30 AM - 10:00 PM",
    tuesday: "11:30 AM - 10:00 PM",
    wednesday: "11:30 AM - 10:00 PM",
    thursday: "11:30 AM - 10:00 PM",
    friday: "11:30 AM - 11:00 PM",
    saturday: "12:00 PM - 11:00 PM",
    sunday: "12:00 PM - 9:30 PM",
  },
  reservationSlots: ["11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"],
};

// ═══════════════════════════════════════════════════════════
// ADMIN DASHBOARD MOCK DATA
// ═══════════════════════════════════════════════════════════

export const ADMIN_DASHBOARD_MOCK = {
  companyName: "ShopHub Admin",
  stats: [
    { label: "Total Revenue", value: "$124,563", change: "+14.2%", trend: "up", icon: "DollarSign" },
    { label: "Total Orders", value: "3,456", change: "+8.1%", trend: "up", icon: "ShoppingCart" },
    { label: "Active Users", value: "12,345", change: "+5.7%", trend: "up", icon: "Users" },
    { label: "Conversion Rate", value: "3.24%", change: "-0.4%", trend: "down", icon: "TrendingUp" },
  ],
  recentOrders: [
    { id: "ORD-7891", customer: "John Smith", email: "john@email.com", amount: 299.99, status: "Completed", date: "2024-06-15", items: 3 },
    { id: "ORD-7892", customer: "Sarah Johnson", email: "sarah@email.com", amount: 149.50, status: "Processing", date: "2024-06-15", items: 2 },
    { id: "ORD-7893", customer: "Mike Davis", email: "mike@email.com", amount: 89.99, status: "Shipped", date: "2024-06-14", items: 1 },
    { id: "ORD-7894", customer: "Emily Brown", email: "emily@email.com", amount: 459.00, status: "Completed", date: "2024-06-14", items: 5 },
    { id: "ORD-7895", customer: "Chris Wilson", email: "chris@email.com", amount: 199.99, status: "Pending", date: "2024-06-14", items: 2 },
  ],
  users: [
    { id: "U001", name: "Admin User", email: "admin@shophub.com", role: "Admin", status: "Active", lastActive: "2 min ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" },
    { id: "U002", name: "Sarah Manager", email: "sarah@shophub.com", role: "Manager", status: "Active", lastActive: "15 min ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { id: "U003", name: "Tom Support", email: "tom@shophub.com", role: "Support", status: "Active", lastActive: "1 hour ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom" },
    { id: "U004", name: "Lisa Sales", email: "lisa@shophub.com", role: "Sales", status: "Away", lastActive: "3 hours ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa" },
  ],
  products: [
    { id: "P001", name: "Wireless Headphones", price: 79.99, stock: 145, category: "Electronics", status: "Active" },
    { id: "P002", name: "Running Shoes", price: 129.99, stock: 89, category: "Sports", status: "Active" },
    { id: "P003", name: "Coffee Maker", price: 49.99, stock: 23, category: "Home", status: "Low Stock" },
    { id: "P004", name: "Yoga Mat", price: 34.99, stock: 0, category: "Sports", status: "Out of Stock" },
  ],
};

// ═══════════════════════════════════════════════════════════
// GENERIC FALLBACK MOCK DATA
// ═══════════════════════════════════════════════════════════

export const GENERIC_MOCK = {
  companyName: "Acme Corp",
  tagline: "Innovation for Everyone",
  heroTitle: "Build Something Amazing",
  heroSubtitle: "The platform that helps you create, collaborate, and ship faster.",
  features: [
    { name: "Lightning Fast", description: "Built for speed with modern architecture", icon: "⚡" },
    { name: "Secure by Default", description: "Enterprise-grade security out of the box", icon: "🔒" },
    { name: "Easy to Use", description: "Intuitive interface your team will love", icon: "✨" },
    { name: "Scalable", description: "Grows with your business from day one", icon: "📈" },
  ],
  testimonials: [
    { name: "Alex Johnson", role: "CEO, TechStart", text: "This platform transformed how we build products. Highly recommended!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
    { name: "Sarah Chen", role: "CTO, GrowthCo", text: "The best investment we made this year. Our team is 3x more productive.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { name: "Mike Rodriguez", role: "Founder, LaunchPad", text: "From idea to production in days, not months. This is the future.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
  ],
  stats: [
    { label: "Customers", value: "10,000+" },
    { label: "Uptime", value: "99.9%" },
    { label: "Support", value: "24/7" },
    { label: "Integrations", value: "100+" },
  ],
  pricing: [
    { name: "Starter", price: 0, period: "forever", features: ["1 project", "Basic features", "Community support"], popular: false },
    { name: "Pro", price: 29, period: "month", features: ["Unlimited projects", "All features", "Priority support", "API access"], popular: true },
    { name: "Enterprise", price: 99, period: "month", features: ["Unlimited everything", "Custom features", "Dedicated support", "SLA", "SSO"], popular: false },
  ],
};

// ═══════════════════════════════════════════════════════════
// MOCK DATA ROUTER
// ═══════════════════════════════════════════════════════════

export function getMockDataForBlueprint(blueprintId: string): Record<string, unknown> {
  switch (blueprintId) {
    case "ecommerce":
      return ECOMMERCE_MOCK;
    case "gym-crm":
      return GYM_CRM_MOCK;
    case "streaming":
      return STREAMING_MOCK;
    case "restaurant":
      return RESTAURANT_MOCK;
    case "admin-dashboard":
      return ADMIN_DASHBOARD_MOCK;
    default:
      return GENERIC_MOCK;
  }
}

export function getTestimonialsForBlueprint(blueprintId: string): Array<{ name: string; text: string; rating: number; avatar?: string }> {
  switch (blueprintId) {
    case "ecommerce":
      return ECOMMERCE_MOCK.testimonials.map(t => ({ name: t.name, text: t.text, rating: t.rating, avatar: t.avatar }));
    case "gym-crm":
      return []; // Gym CRM doesn't have testimonials
    case "streaming":
      return []; // Streaming doesn't have testimonials
    case "restaurant":
      return RESTAURANT_MOCK.testimonials.map(t => ({ name: t.name, text: t.text, rating: t.rating }));
    default:
      return GENERIC_MOCK.testimonials.map(t => ({ name: t.name, text: t.text, rating: 5, avatar: t.avatar }));
  }
}

export function getStatsForBlueprint(blueprintId: string): Array<{ label: string; value: string }> {
  switch (blueprintId) {
    case "ecommerce":
      return ECOMMERCE_MOCK.stats;
    case "gym-crm":
      return GYM_CRM_MOCK.dashboardStats.map(s => ({ label: s.label, value: s.value }));
    case "streaming":
      return [];
    case "restaurant":
      return [];
    default:
      return GENERIC_MOCK.stats;
  }
}
