/**
 * Business Genesis Engine
 * 
 * Generates a complete business context BEFORE components are created.
 * Every component in the system consumes this single source of truth.
 * 
 * Flow: Prompt → Blueprint → Business Genesis → Components
 */

import { detectBlueprint, type DomainBlueprint } from "./domain-blueprints";
import { extractBrandName, extractProjectContext } from "./generation-helpers";

export interface BusinessGenesis {
  brand: {
    name: string;
    tagline: string;
    description: string;
    values: string[];
    foundingStory: string;
  };
  audience: {
    primary: string;
    personas: Array<{ name: string; age: number; need: string; pain: string }>;
    industries: string[];
  };
  products: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    period?: string;
    description: string;
    benefits: string[];
    rating: number;
    reviews: number;
    inStock: boolean;
    badge?: string;
  }>;
  offers: Array<{
    code: string;
    discount: number;
    type: "percentage" | "fixed";
    minOrder: number;
    description: string;
  }>;
  testimonials: Array<{
    name: string;
    location: string;
    rating: number;
    quote: string;
    product?: string;
  }>;
  pricing: Array<{
    name: string;
    price: string;
    period: string;
    tagline: string;
    features: string[];
    popular?: boolean;
  }>;
  locations: Array<{
    city: string;
    address: string;
    phone: string;
    hours: string;
  }>;
  stats: Array<{ label: string; value: string }>;
  kpis: Record<string, string>;
  currency: string;
  industry: string;
}

/**
 * Domain-specific product catalogs — the core of realistic mock data.
 * Each domain gets 8-12 products with real names, prices, descriptions.
 */
const DOMAIN_PRODUCTS: Record<string, BusinessGenesis["products"]> = {
  ecommerce: [
    { id: "p1", name: "Whey Protein Isolate", category: "Protein", price: 2499, originalPrice: 3299, description: "100% grass-fed whey isolate. 27g protein per serving, zero sugar, lab-tested for purity.", benefits: ["Muscle Recovery", "Fast Absorption", "Lab Tested"], rating: 4.8, reviews: 2341, inStock: true, badge: "Bestseller" },
    { id: "p2", name: "Creatine Monohydrate", category: "Performance", price: 899, originalPrice: 1299, description: "Micronized creatine monohydrate. 5g per serving. Increase strength and power output.", benefits: ["Strength Gain", "Power Output", "Muscle Volume"], rating: 4.7, reviews: 1856, inStock: true, badge: "FSSAI Certified" },
    { id: "p3", name: "BCAA Recovery Complex", category: "Recovery", price: 1499, description: "2:1:1 ratio BCAAs with electrolytes.加速 recovery between sessions.", benefits: ["Faster Recovery", "Reduced Soreness", "Electrolytes"], rating: 4.6, reviews: 987, inStock: true },
    { id: "p4", name: "Pre-Workout Surge", category: "Performance", price: 1799, originalPrice: 2199, description: "Explosive energy blend with caffeine, beta-alanine, and citrulline. 20 servings.", benefits: ["Energy Boost", "Focus", "Endurance"], rating: 4.5, reviews: 1234, inStock: true, badge: "New" },
    { id: "p5", name: "Omega-3 Fish Oil", category: "Health", price: 699, description: "Triple-strength fish oil. 1000mg EPA+DHA per capsule. Molecularly distilled.", benefits: ["Heart Health", "Joint Support", "Brain Function"], rating: 4.7, reviews: 876, inStock: true },
    { id: "p6", name: "Mass Gainer Pro", category: "Weight Gain", price: 2199, originalPrice: 2799, description: "High-calorie mass builder. 50g protein, 250g carbs per serving. For hardgainers.", benefits: ["Weight Gain", "Calorie Dense", "Muscle Building"], rating: 4.4, reviews: 654, inStock: true },
    { id: "p7", name: "Ashwagandha KSM-66", category: "Adaptogens", price: 599, description: "Clinically studied ashwagandha root extract. 600mg per serving. Reduce stress and cortisol.", benefits: ["Stress Relief", "Cortisol Control", "Sleep Quality"], rating: 4.8, reviews: 1567, inStock: true, badge: "Top Rated" },
    { id: "p8", name: "Green Tea Fat Burner", category: "Weight Management", price: 499, description: "Green tea extract with EGCG and garcinia cambogia. 90 capsules.", benefits: ["Fat Metabolism", "Antioxidants", "Energy"], rating: 4.3, reviews: 543, inStock: true },
  ],
  "gym-crm": [
    { id: "p1", name: "Basic Plan", category: "Subscription", price: 999, period: "/month", description: "For small gyms up to 100 members. Core features included.", benefits: ["Member Management", "Attendance Tracking", "Basic Billing", "Email Support"], rating: 4.5, reviews: 234, inStock: true, badge: "Starter" },
    { id: "p2", name: "Professional Plan", category: "Subscription", price: 2499, period: "/month", description: "For growing gyms up to 500 members. Advanced analytics.", benefits: ["All Basic Features", "Lead Pipeline", "Revenue Analytics", "WhatsApp Integration", "Priority Support"], rating: 4.7, reviews: 189, inStock: true, badge: "Most Popular" },
    { id: "p3", name: "Enterprise Plan", category: "Subscription", price: 4999, period: "/month", description: "For gym chains. Unlimited members, custom branding.", benefits: ["All Pro Features", "Multi-Location", "Custom Branding", "API Access", "Dedicated Manager"], rating: 4.8, reviews: 67, inStock: true },
    { id: "p4", name: "Annual Basic", category: "Subscription", price: 9999, period: "/year", description: "Save 2 months on Basic plan. Billed annually.", benefits: ["Member Management", "Attendance Tracking", "Basic Billing", "Email Support"], rating: 4.4, reviews: 156, inStock: true, badge: "Save 17%" },
  ],
  restaurant: [
    { id: "p1", name: "Salmon Sashimi", category: "Sashimi", price: 699, description: "Fresh Atlantic salmon, thinly sliced. 8 pieces.", benefits: ["Fresh Daily", "Omega-3 Rich", "Chef's Special"], rating: 4.8, reviews: 345, inStock: true, badge: "Popular" },
    { id: "p2", name: "Dragon Roll", category: "Rolls", price: 799, description: "Shrimp tempura, avocado, eel sauce. 8 pieces.", benefits: ["Crispy Tempura", "Creamy Avocado", "Signature Sauce"], rating: 4.7, reviews: 278, inStock: true, badge: "Chef's Pick" },
    { id: "p3", name: "Miso Ramen", category: "Ramen", price: 599, description: "Rich miso broth, chashu pork, soft egg, nori, green onions.", benefits: ["Rich Broth", "Tender Pork", "Comfort Food"], rating: 4.6, reviews: 432, inStock: true },
    { id: "p4", name: "Chicken Teriyaki", category: "Entrees", price: 549, description: "Grilled chicken with house teriyaki glaze. Served with steamed rice.", benefits: ["Grilled Fresh", "House Sauce", "Balanced Meal"], rating: 4.5, reviews: 198, inStock: true },
    { id: "p5", name: "Spicy Tuna Roll", category: "Rolls", price: 649, description: "Fresh tuna, spicy mayo, cucumber. 8 pieces.", benefits: ["Spicy Kick", "Fresh Tuna", "Cooling Cucumber"], rating: 4.6, reviews: 321, inStock: true },
    { id: "p6", name: "Tempura Udon", category: "Noodles", price: 579, description: "Thick udon noodles in dashi broth with shrimp tempura.", benefits: ["Crispy Tempura", "Savory Broth", "Filling"], rating: 4.5, reviews: 167, inStock: true },
  ],
  "saas": [
    { id: "p1", name: "Starter", category: "Plan", price: 0, period: "/month", description: "For individuals and small teams getting started.", benefits: ["3 Projects", "1GB Storage", "Basic Analytics", "Community Support"], rating: 4.3, reviews: 567, inStock: true, badge: "Free" },
    { id: "p2", name: "Professional", category: "Plan", price: 29, period: "/month", description: "For growing teams that need more power.", benefits: ["Unlimited Projects", "10GB Storage", "Advanced Analytics", "Priority Support", "API Access"], rating: 4.7, reviews: 345, inStock: true, badge: "Popular" },
    { id: "p3", name: "Business", category: "Plan", price: 79, period: "/month", description: "For businesses that need enterprise features.", benefits: ["All Pro Features", "100GB Storage", "Custom Branding", "SSO", "Dedicated Manager"], rating: 4.8, reviews: 189, inStock: true },
    { id: "p4", name: "Enterprise", category: "Plan", price: 0, description: "Custom pricing for large organizations.", benefits: ["All Business Features", "Unlimited Storage", "On-Premise Option", "SLA", "24/7 Phone Support"], rating: 4.9, reviews: 45, inStock: true, badge: "Custom" },
  ],
  "healthcare-clinic": [
    { id: "p1", name: "General Consultation", category: "Consultation", price: 500, description: "In-person consultation with general physician. 30 minutes.", benefits: ["Diagnosis", "Prescription", "Follow-up Advice"], rating: 4.6, reviews: 890, inStock: true },
    { id: "p2", name: "Health Checkup Package", category: "Package", price: 2999, originalPrice: 4500, description: "Complete blood work, ECG, chest X-ray, doctor consultation.", benefits: ["50+ Tests", "ECG", "X-Ray", "Doctor Consult"], rating: 4.8, reviews: 567, inStock: true, badge: "Best Value" },
    { id: "p3", name: "Dental Cleaning", category: "Dental", price: 800, description: "Professional dental cleaning and oral health checkup.", benefits: ["Deep Cleaning", "Polish", "Oral Checkup"], rating: 4.5, reviews: 234, inStock: true },
    { id: "p4", name: "Physiotherapy Session", category: "Therapy", price: 1200, description: "One-on-one physiotherapy session. 45 minutes.", benefits: ["Personalized Plan", "Pain Relief", "Mobility Improvement"], rating: 4.7, reviews: 178, inStock: true },
  ],
  "agency-crm": [
    { id: "p1", name: "Starter Plan", category: "Plan", price: 2999, period: "/month", description: "For small agencies with up to 5 team members.", benefits: ["10 Client Accounts", "Basic Pipeline", "Email Integration", "Reporting"], rating: 4.5, reviews: 234, inStock: true, badge: "Starter" },
    { id: "p2", name: "Growth Plan", category: "Plan", price: 7999, period: "/month", description: "For growing agencies with up to 20 team members.", benefits: ["50 Client Accounts", "Advanced Pipeline", "WhatsApp Integration", "Custom Reports", "Priority Support"], rating: 4.7, reviews: 189, inStock: true, badge: "Most Popular" },
    { id: "p3", name: "Enterprise Plan", category: "Plan", price: 19999, period: "/month", description: "For large agencies with unlimited team members.", benefits: ["Unlimited Clients", "White Label", "API Access", "Custom Integrations", "Dedicated Manager"], rating: 4.8, reviews: 67, inStock: true },
  ],
  "education-platform": [
    { id: "p1", name: "Basic Course", category: "Course", price: 999, description: "Foundation course with 20 video lessons and quizzes.", benefits: ["20 Video Lessons", "Quizzes", "Certificate", "6-month Access"], rating: 4.6, reviews: 890, inStock: true },
    { id: "p2", name: "Pro Bootcamp", category: "Bootcamp", price: 9999, originalPrice: 14999, description: "8-week intensive bootcamp with live sessions and projects.", benefits: ["Live Sessions", "4 Projects", "1-on-1 Mentoring", "Job Assistance"], rating: 4.8, reviews: 567, inStock: true, badge: "Best Seller" },
    { id: "p3", name: "Enterprise Training", category: "Corporate", price: 49999, description: "Custom training program for teams of 10+ employees.", benefits: ["Custom Curriculum", "Dedicated Trainer", "Progress Tracking", "Completion Reports"], rating: 4.7, reviews: 89, inStock: true },
  ],
  "real-estate-crm": [
    { id: "p1", name: "Basic Listing", category: "Listing", price: 1999, period: "/month", description: "List up to 20 properties with photos and details.", benefits: ["20 Listings", "Photo Upload", "Lead Capture", "Basic Analytics"], rating: 4.5, reviews: 345, inStock: true },
    { id: "p2", name: "Premium Listing", category: "Listing", price: 4999, period: "/month", description: "Unlimited listings with virtual tours and priority placement.", benefits: ["Unlimited Listings", "Virtual Tours", "Priority Placement", "CRM Integration"], rating: 4.7, reviews: 234, inStock: true, badge: "Most Popular" },
    { id: "p3", name: "Brokerage Suite", category: "Suite", price: 14999, period: "/month", description: "Complete brokerage management with agent tracking and commissions.", benefits: ["Agent Management", "Commission Tracking", "Lead Distribution", "Performance Reports"], rating: 4.8, reviews: 123, inStock: true },
  ],
  "hotel-booking": [
    { id: "p1", name: "Standard Room", category: "Room", price: 3999, period: "/night", description: "Comfortable room with queen bed, AC, and free Wi-Fi.", benefits: ["Queen Bed", "AC", "Free Wi-Fi", "Room Service"], rating: 4.5, reviews: 890, inStock: true },
    { id: "p2", name: "Deluxe Suite", category: "Suite", price: 7999, period: "/night", description: "Spacious suite with living area, balcony, and premium amenities.", benefits: ["King Bed", "Living Area", "Balcony", "Premium Toiletries", "Mini Bar"], rating: 4.7, reviews: 567, inStock: true, badge: "Popular" },
    { id: "p3", name: "Family Package", category: "Package", price: 12999, period: "/2 nights", description: "2-night stay with breakfast, dinner, and kids activities.", benefits: ["2 Nights", "Breakfast & Dinner", "Kids Activities", "Late Checkout"], rating: 4.8, reviews: 345, inStock: true, badge: "Best Value" },
  ],
  "beauty-salon": [
    { id: "p1", name: "Haircut & Styling", category: "Hair", price: 899, description: "Professional haircut with wash, conditioning, and styling.", benefits: ["Consultation", "Wash", "Cut", "Styling"], rating: 4.6, reviews: 1234, inStock: true },
    { id: "p2", name: "Bridal Makeup Package", category: "Makeup", price: 14999, originalPrice: 19999, description: "Complete bridal makeup with trial session, HD makeup, and hair styling.", benefits: ["Trial Session", "HD Makeup", "Hair Styling", "Touch-ups"], rating: 4.8, reviews: 456, inStock: true, badge: "Premium" },
    { id: "p3", name: "Facial & Cleanup", category: "Skincare", price: 1499, description: "Deep cleansing facial with skin analysis and personalized treatment.", benefits: ["Skin Analysis", "Deep Cleanse", "Massage", "Mask", "Moisturize"], rating: 4.7, reviews: 789, inStock: true },
    { id: "p4", name: "Full Body Massage", category: "Spa", price: 2499, description: "90-minute relaxation massage with aromatherapy oils.", benefits: ["90 Minutes", "Aromatherapy", "Pressure Points", "Hot Towels"], rating: 4.9, reviews: 567, inStock: true, badge: "Top Rated" },
  ],
  "dental-clinic": [
    { id: "p1", name: "Teeth Cleaning", category: "Preventive", price: 800, description: "Professional dental cleaning with ultrasonic scaling.", benefits: ["Deep Cleaning", "Plaque Removal", "Polish"], rating: 4.6, reviews: 1234, inStock: true },
    { id: "p2", name: "Root Canal Treatment", category: "Endodontics", price: 8000, originalPrice: 12000, description: "Single sitting root canal with crown placement.", benefits: ["Pain-Free", "Single Visit", "Crown Included"], rating: 4.7, reviews: 890, inStock: true, badge: "Popular" },
    { id: "p3", name: "Teeth Whitening", category: "Cosmetic", price: 5000, description: "Professional laser teeth whitening. 6-8 shades brighter.", benefits: ["Instant Results", "Safe Procedure", "Long Lasting"], rating: 4.8, reviews: 567, inStock: true },
    { id: "p4", name: "Dental Implant", category: "Prosthodontics", price: 35000, description: "Titanium dental implant with abutment and crown.", benefits: ["Permanent Solution", "Natural Look", "Lifetime Warranty"], rating: 4.9, reviews: 234, inStock: true, badge: "Premium" },
  ],
  "law-firm": [
    { id: "p1", name: "Legal Consultation", category: "Consultation", price: 2000, description: "One-on-one consultation with senior advocate. 45 minutes.", benefits: ["Case Analysis", "Legal Advice", "Documentation Review"], rating: 4.6, reviews: 890, inStock: true },
    { id: "p2", name: "Corporate Legal Package", category: "Corporate", price: 25000, period: "/month", description: "Monthly retainer for startups and SMEs. Includes contract review and compliance.", benefits: ["Contract Drafting", "Compliance Review", "Legal Notices", "Board Resolutions"], rating: 4.7, reviews: 456, inStock: true, badge: "Best Value" },
    { id: "p3", name: "Property Verification", category: "Real Estate", price: 5000, description: "Complete property title verification and legal opinion.", benefits: ["Title Search", "Encumbrance Check", "Legal Opinion Report"], rating: 4.8, reviews: 678, inStock: true },
    { id: "p4", name: "Family Law Case", category: "Family", price: 50000, description: "Complete handling of divorce/custody case through court.", benefits: ["Court Representation", "Documentation", "Mediation", "Settlement"], rating: 4.5, reviews: 345, inStock: true },
  ],
  "coaching-center": [
    { id: "p1", name: "JEE Main Crash Course", category: "Engineering", price: 35000, originalPrice: 50000, description: "6-month intensive preparation for JEE Main & Advanced.", benefits: ["400+ Hours", "Mock Tests", "Doubt Sessions", "Study Material"], rating: 4.7, reviews: 2341, inStock: true, badge: "Best Seller" },
    { id: "p2", name: "NEET Preparation", category: "Medical", price: 40000, period: "/year", description: "Complete NEET coaching with biology, physics, chemistry.", benefits: ["500+ Hours", "NCERT Focus", "Previous Papers", "Test Series"], rating: 4.8, reviews: 1890, inStock: true, badge: "Top Rated" },
    { id: "p3", name: "Foundation Course (9-10)", category: "Foundation", price: 25000, period: "/year", description: "Build strong fundamentals for competitive exams.", benefits: ["Board + Competitive", "Weekly Tests", "Parent Reports"], rating: 4.6, reviews: 890, inStock: true },
    { id: "p4", name: "Online Test Series", category: "Tests", price: 5000, description: "Full-length mock tests with detailed analysis.", benefits: ["50+ Mocks", "All India Rank", "Performance Analytics"], rating: 4.5, reviews: 3456, inStock: true, badge: "Affordable" },
  ],
  "travel-agency": [
    { id: "p1", name: "Goa Beach Package", category: "Domestic", price: 18999, originalPrice: 25000, description: "4 nights/5 days in Goa. Flights, hotel, sightseeing included.", benefits: ["Flights", "3-Star Hotel", "North & South Goa Tour", "Water Sports"], rating: 4.6, reviews: 3456, inStock: true, badge: "Trending" },
    { id: "p2", name: "Kashmir Paradise Tour", category: "Domestic", price: 32999, description: "6 nights/7 days. Srinagar, Gulmarg, Pahalgam, Sonmarg.", benefits: ["Flights", "Houseboat Stay", "Gondola Ride", "All Transfers"], rating: 4.8, reviews: 2341, inStock: true, badge: "Most Popular" },
    { id: "p3", name: "Thailand Budget Trip", category: "International", price: 45999, description: "5 nights/6 days in Bangkok & Pattaya. Flights, hotel, visa.", benefits: ["Flights", "4-Star Hotel", "Island Tour", "Visa Assistance"], rating: 4.5, reviews: 1234, inStock: true },
    { id: "p4", name: "Honeymoon Special — Maldives", category: "International", price: 125000, originalPrice: 150000, description: "5 nights in overwater villa. Flights, transfers, all meals.", benefits: ["Overwater Villa", "All Meals", "Snorkeling", "Sunset Cruise"], rating: 4.9, reviews: 890, inStock: true, badge: "Premium" },
  ],
  "spa-wellness": [
    { id: "p1", name: "Swedish Massage", category: "Massage", price: 2500, description: "60-minute full body relaxation massage with essential oils.", benefits: ["60 Minutes", "Full Body", "Aromatherapy", "Stress Relief"], rating: 4.7, reviews: 1234, inStock: true },
    { id: "p2", name: "Deep Tissue Massage", category: "Massage", price: 3500, description: "90-minute targeted massage for chronic pain and tension.", benefits: ["90 Minutes", "Targeted Relief", "Muscle Recovery", "Posture Correction"], rating: 4.8, reviews: 890, inStock: true, badge: "Therapist's Pick" },
    { id: "p3", name: "Ayurvedic Panchakarma", category: "Ayurveda", price: 15000, period: "/session", description: "Traditional detox and rejuvenation therapy.", benefits: ["Detox", "Rejuvenation", "Herbal Oils", "Personalized Treatment"], rating: 4.9, reviews: 456, inStock: true, badge: "Premium" },
    { id: "p4", name: "Couples Retreat Package", category: "Package", price: 12000, originalPrice: 16000, description: "Side-by-side massage, jacuzzi, champagne, and dinner.", benefits: ["Couples Massage", "Jacuzzi", "Champagne", "Candlelight Dinner"], rating: 4.9, reviews: 678, inStock: true, badge: "Best Seller" },
  ],
  "accounting-firm": [
    { id: "p1", name: "ITR Filing — Individual", category: "Tax", price: 1999, description: "Income tax return filing for salaried individuals.", benefits: ["Form 16 Analysis", "Deduction Optimization", "E-Filing", "Acknowledgment"], rating: 4.5, reviews: 5678, inStock: true, badge: "Popular" },
    { id: "p2", name: "GST Registration & Filing", category: "GST", price: 9999, period: "/year", description: "Complete GST compliance for businesses.", benefits: ["Registration", "Monthly Filing", "Reconciliation", "Annual Return"], rating: 4.7, reviews: 3456, inStock: true },
    { id: "p3", name: "Business Audit Package", category: "Audit", price: 75000, description: "Statutory audit for companies with turnover up to ₹10 Cr.", benefits: ["Financial Statements", "Compliance Check", "Tax Planning", "Board Report"], rating: 4.8, reviews: 890, inStock: true, badge: "Comprehensive" },
    { id: "p4", name: "Startup CFO Services", category: "Advisory", price: 25000, period: "/month", description: "Fractional CFO for startups — financial planning, investor readiness.", benefits: ["Financial Modeling", "Investor Pitch Deck", "Cash Flow Management", "Board Reporting"], rating: 4.6, reviews: 234, inStock: true },
  ],
  "consulting-business": [
    { id: "p1", name: "Strategy Workshop", category: "Workshop", price: 50000, description: "Full-day strategy workshop for leadership team. 8 hours.", benefits: ["SWOT Analysis", "Market Assessment", "Action Plan", "Follow-up Report"], rating: 4.7, reviews: 456, inStock: true },
    { id: "p2", name: "Digital Transformation", category: "Project", price: 500000, description: "End-to-end digital transformation for mid-size enterprises.", benefits: ["Process Audit", "Tech Selection", "Implementation", "Training"], rating: 4.8, reviews: 123, inStock: true, badge: "Enterprise" },
    { id: "p3", name: "Business Process Reengineering", category: "Project", price: 200000, description: "Redesign core business processes for efficiency.", benefits: ["Current State Mapping", "Gap Analysis", "Future State Design", "Change Management"], rating: 4.6, reviews: 234, inStock: true },
    { id: "p4", name: "Market Entry Strategy", category: "Advisory", price: 150000, description: "Research-backed market entry plan for new geographies or segments.", benefits: ["Market Research", "Competitive Analysis", "Pricing Strategy", "Go-to-Market Plan"], rating: 4.7, reviews: 345, inStock: true },
  ],
  "recruitment-agency": [
    { id: "p1", name: "Bulk Hiring Package", category: "Hiring", price: 5000, period: "/hire", description: "For hiring 10+ candidates. End-to-end recruitment.", benefits: ["Sourcing", "Screening", "Interviews", "Onboarding"], rating: 4.5, reviews: 3456, inStock: true },
    { id: "p2", name: "Executive Search", category: "Leadership", price: 150000, description: "Headhunting for C-suite and VP-level positions.", benefits: ["Confidential Search", "Assessment", "Background Check", "Negotiation"], rating: 4.8, reviews: 234, inStock: true, badge: "Premium" },
    { id: "p3", name: "Contract Staffing", category: "Staffing", price: 15000, period: "/month/per head", description: "Flexible workforce for project-based needs.", benefits: ["Payroll Management", "Compliance", "Replacement Guarantee", "Performance Reviews"], rating: 4.6, reviews: 567, inStock: true },
    { id: "p4", name: "Recruitment Process Outsourcing", category: "RPO", price: 200000, period: "/month", description: "Dedicated recruitment team for your organization.", benefits: ["Dedicated Team", "ATS Integration", "Analytics Dashboard", "SLA Guarantee"], rating: 4.7, reviews: 123, inStock: true },
  ],
  "event-management": [
    { id: "p1", name: "Wedding Planning", category: "Wedding", price: 500000, originalPrice: 750000, description: "Complete wedding planning from engagement to reception.", benefits: ["Venue Selection", "Décor", "Catering", "Entertainment", "Coordination"], rating: 4.8, reviews: 890, inStock: true, badge: "Most Popular" },
    { id: "p2", name: "Corporate Event Package", category: "Corporate", price: 200000, description: "Conference, seminar, or product launch management.", benefits: ["Venue Setup", "AV Equipment", "Catering", "Photography"], rating: 4.7, reviews: 567, inStock: true },
    { id: "p3", name: "Birthday Celebration", category: "Social", price: 50000, description: "Themed birthday party planning with decoration and cake.", benefits: ["Theme Décor", "Custom Cake", "Entertainment", "Photography"], rating: 4.6, reviews: 2345, inStock: true, badge: "Affordable" },
    { id: "p4", name: "Exhibition & Trade Show", category: "B2B", price: 300000, period: "/stall", description: "End-to-end stall design and execution for trade shows.", benefits: ["Stall Design", "Fabrication", "Staffing", "Lead Capture"], rating: 4.7, reviews: 345, inStock: true },
  ],
  "cleaning-service": [
    { id: "p1", name: "Deep Home Cleaning", category: "Residential", price: 3999, description: "Full home deep cleaning — kitchen, bathrooms, bedrooms.", benefits: ["All Rooms", "Kitchen Degreasing", "Bathroom Sanitization", "Floor Polishing"], rating: 4.7, reviews: 5678, inStock: true, badge: "Best Seller" },
    { id: "p2", name: "Sofa & Carpet Cleaning", category: "Specialized", price: 1999, description: "Steam cleaning for sofas, carpets, and curtains.", benefits: ["Steam Cleaning", "Stain Removal", "Deodorizing", "Fabric Protection"], rating: 4.6, reviews: 2345, inStock: true },
    { id: "p3", name: "Office Cleaning Contract", category: "Commercial", price: 15000, period: "/month", description: "Daily cleaning for offices up to 5000 sq ft.", benefits: ["Daily Cleaning", "Restroom Maintenance", "Waste Management", "Sanitization"], rating: 4.8, reviews: 890, inStock: true },
    { id: "p4", name: "Post-Construction Cleanup", category: "Specialized", price: 12000, description: "Remove debris, dust, and construction residue.", benefits: ["Debris Removal", "Dust Cleaning", "Window Washing", "Floor Restoration"], rating: 4.7, reviews: 456, inStock: true },
  ],
  "repair-service": [
    { id: "p1", name: "AC Repair & Service", category: "Appliance", price: 999, description: "Complete AC servicing — gas refill, filter cleaning, compressor check.", benefits: ["Gas Refill", "Filter Cleaning", "Compressor Check", "Performance Test"], rating: 4.6, reviews: 8901, inStock: true, badge: "Most Booked" },
    { id: "p2", name: "Plumbing Service", category: "Home", price: 799, description: "Fix leaks, install fixtures, clear drains. 1-hour service.", benefits: ["Leak Repair", "Pipe Fitting", "Drain Clearing", "Fixture Installation"], rating: 4.5, reviews: 6789, inStock: true },
    { id: "p3", name: "Electrical Repair", category: "Home", price: 899, description: "Wiring, switchboard, fan, light installation and repair.", benefits: ["Wiring", "Switchboard", "Fan Installation", "Lighting"], rating: 4.7, reviews: 5432, inStock: true },
    { id: "p4", name: "Appliance AMC", category: "AMC", price: 4999, period: "/year", description: "Annual maintenance for all home appliances.", benefits: ["3 Visits/Year", "All Appliances", "Parts Included", "Priority Service"], rating: 4.8, reviews: 2345, inStock: true, badge: "Best Value" },
  ],
  "photography": [
    { id: "p1", name: "Wedding Photography", category: "Wedding", price: 75000, description: "Full-day wedding coverage with 2 photographers and videographer.", benefits: ["2 Photographers", "Videographer", "500+ Edited Photos", "Highlight Reel"], rating: 4.8, reviews: 890, inStock: true, badge: "Popular" },
    { id: "p2", name: "Pre-Wedding Shoot", category: "Couple", price: 25000, description: "Half-day shoot at scenic location with outfit changes.", benefits: ["3 Outfits", "2 Locations", "50+ Edited Photos", "Same-Day Preview"], rating: 4.7, reviews: 1234, inStock: true, badge: "Best Seller" },
    { id: "p3", name: "Product Photography", category: "Commercial", price: 5000, period: "/product", description: "Professional studio shoot for e-commerce and catalogs.", benefits: ["White Background", "Multiple Angles", "Lifestyle Shots", "Retouching"], rating: 4.6, reviews: 3456, inStock: true },
    { id: "p4", name: "Portrait Session", category: "Personal", price: 8000, description: "Individual or family portrait with styling and retouching.", benefits: ["Styling Advice", "Indoor/Outdoor", "20+ Edited Photos", "Print-Ready Files"], rating: 4.7, reviews: 2345, inStock: true },
  ],
  "fitness-studio": [
    { id: "p1", name: "Monthly Membership", category: "Membership", price: 3999, period: "/month", description: "Unlimited access to all studio classes and equipment.", benefits: ["All Classes", "Equipment Access", "Locker", "WiFi"], rating: 4.7, reviews: 2345, inStock: true, badge: "Most Popular" },
    { id: "p2", name: "Personal Training (12 Sessions)", category: "Training", price: 18000, originalPrice: 24000, description: "12 one-on-one sessions with certified personal trainer.", benefits: ["Certified Trainer", "Custom Plan", "Nutrition Guide", "Progress Tracking"], rating: 4.8, reviews: 890, inStock: true, badge: "Results Guaranteed" },
    { id: "p3", name: "Yoga & Meditation", category: "Wellness", price: 2500, period: "/month", description: "Daily yoga and meditation classes for all levels.", benefits: ["Beginner Friendly", "Certified Instructor", "Flexible Timings", "Stress Relief"], rating: 4.9, reviews: 1234, inStock: true },
    { id: "p4", name: "Group Fitness Pack (10 Classes)", category: "Group", price: 5000, description: "10 class pass for Zumba, HIIT, spinning, or aerobics.", benefits: ["Any Group Class", "60-Day Validity", "No Lock-In", "Bring a Friend Free"], rating: 4.6, reviews: 3456, inStock: true },
  ],
  "manufacturing-erp": [
    { id: "p1", name: "Shop Floor Module", category: "Module", price: 49999, period: "/year", description: "Production planning, scheduling, and shop floor control.", benefits: ["MRP", "Production Scheduling", "Real-Time Tracking", "Reports"], rating: 4.6, reviews: 456, inStock: true },
    { id: "p2", name: "Inventory Management", category: "Module", price: 29999, period: "/year", description: "Raw material and finished goods inventory tracking.", benefits: ["Stock Tracking", "Reorder Alerts", "Batch Tracking", "Valuation"], rating: 4.7, reviews: 678, inStock: true, badge: "Essential" },
    { id: "p3", name: "Quality Control Module", category: "Module", price: 39999, period: "/year", description: "QC inspections, defect tracking, and compliance reporting.", benefits: ["Inspection Checklists", "Defect Tracking", "SPC Charts", "ISO Compliance"], rating: 4.8, reviews: 345, inStock: true },
    { id: "p4", name: "Complete ERP Suite", category: "Suite", price: 199999, period: "/year", description: "Full ERP covering production, inventory, quality, and finance.", benefits: ["All Modules", "Multi-User", "Cloud Hosted", "Custom Integrations", "Dedicated Support"], rating: 4.9, reviews: 123, inStock: true, badge: "Enterprise" },
  ],
  "wholesale-distribution": [
    { id: "p1", name: "Distribution Management", category: "Module", price: 35000, period: "/year", description: "Dealer network management, order processing, and dispatch.", benefits: ["Dealer Portal", "Order Management", "Dispatch Tracking", "Commissions"], rating: 4.6, reviews: 567, inStock: true },
    { id: "p2", name: "Warehouse Module", category: "Module", price: 25000, period: "/year", description: "Warehouse operations — putaway, picking, packing, shipping.", benefits: ["Bin Management", "Pick Lists", "Label Printing", "Stock Audit"], rating: 4.7, reviews: 456, inStock: true },
    { id: "p3", name: "Sales Force Automation", category: "Module", price: 30000, period: "/year", description: "Field sales team management with route planning.", benefits: ["Beat Planning", "Order Capture", "GPS Tracking", "Expense Management"], rating: 4.5, reviews: 789, inStock: true },
    { id: "p4", name: "Distribution Suite", category: "Suite", price: 120000, period: "/year", description: "Complete distribution management with all modules.", benefits: ["All Modules", "Multi-Warehouse", "Dealer App", "Analytics Dashboard"], rating: 4.8, reviews: 234, inStock: true, badge: "Complete" },
  ],
  "pharma-distribution": [
    { id: "p1", name: "Drug Distribution Module", category: "Module", price: 45000, period: "/year", description: "Schedule H/H1 compliance, batch tracking, expiry management.", benefits: ["Drug License Compliance", "Batch Tracking", "Expiry Alerts", "GST on Drugs"], rating: 4.7, reviews: 345, inStock: true },
    { id: "p2", name: "Cold Chain Management", category: "Module", price: 35000, period: "/year", description: "Temperature-controlled logistics for biologics and vaccines.", benefits: ["Temperature Monitoring", "GPS Tracking", "Compliance Reports", "Alerts"], rating: 4.8, reviews: 234, inStock: true, badge: "Critical" },
    { id: "p3", name: "Medical Rep Management", category: "Module", price: 20000, period: "/year", description: "Field force management for pharma sales teams.", benefits: ["Doctor Visit Tracking", "Sample Management", "Expense Claims", "Reporting"], rating: 4.6, reviews: 567, inStock: true },
    { id: "p4", name: "Pharma ERP Suite", category: "Suite", price: 175000, period: "/year", description: "Complete pharma distribution ERP with regulatory compliance.", benefits: ["All Modules", "CDSCO Compliance", "Distributor Portal", "Analytics"], rating: 4.9, reviews: 123, inStock: true, badge: "Enterprise" },
  ],
  "auto-dealership": [
    { id: "p1", name: "DMS Basic", category: "Software", price: 15000, period: "/month", description: "Dealer management for single showroom.", benefits: ["Inventory Management", "Lead Tracking", "Sales Pipeline", "Basic Reports"], rating: 4.5, reviews: 890, inStock: true, badge: "Starter" },
    { id: "p2", name: "DMS Professional", category: "Software", price: 35000, period: "/month", description: "Multi-showroom dealer management with service module.", benefits: ["Multi-Showroom", "Service Bay", "Spares Management", "Customer Portal"], rating: 4.7, reviews: 567, inStock: true, badge: "Most Popular" },
    { id: "p3", name: "Used Car Platform", category: "Platform", price: 50000, period: "/year", description: "Online platform for buying and selling certified pre-owned cars.", benefits: ["Inspection Reports", "Valuation Engine", "Online Listings", "Lead Management"], rating: 4.6, reviews: 345, inStock: true },
    { id: "p4", name: "Complete Dealer Suite", category: "Suite", price: 500000, period: "/year", description: "End-to-end dealership management with OEM integration.", benefits: ["All Modules", "OEM Integration", "Multi-Location", "Analytics", "Support"], rating: 4.8, reviews: 234, inStock: true, badge: "Enterprise" },
  ],
  "construction": [
    { id: "p1", name: "Residential Construction", category: "Project", price: 1800, period: "/sq ft", description: "Complete home construction from foundation to handover.", benefits: ["3D Design", "Premium Materials", "10-Year Warranty", "Project Tracking"], rating: 4.7, reviews: 890, inStock: true, badge: "Trusted" },
    { id: "p2", name: "Commercial Construction", category: "Project", price: 2500, period: "/sq ft", description: "Office buildings, retail spaces, and warehouses.", benefits: ["Architect Design", "Structural Engineering", "MEP Work", "Occupancy Certificate"], rating: 4.8, reviews: 456, inStock: true },
    { id: "p3", name: "Renovation & Remodeling", category: "Renovation", price: 150000, description: "Home renovation with interior design consultation.", benefits: ["Design Consultation", "Demolition", "Civil Work", "Finishing"], rating: 4.6, reviews: 1234, inStock: true },
    { id: "p4", name: "Interior Design Package", category: "Interior", price: 500000, originalPrice: 700000, description: "Complete home interior — modular kitchen, wardrobes, flooring.", benefits: ["3D Visualization", "Modular Kitchen", "Wardrobes", "Flooring", "Lighting"], rating: 4.9, reviews: 678, inStock: true, badge: "Premium" },
  ],
  "logistics": [
    { id: "p1", name: "FTL Transport", category: "Transport", price: 25000, description: "Full truck load transport — Delhi to Mumbai.", benefits: ["GPS Tracking", "Insurance", "14 FT - 32 FT Trucks", "Real-Time Updates"], rating: 4.6, reviews: 5678, inStock: true },
    { id: "p2", name: "LTL / Part Load", category: "Transport", price: 8000, description: "Part load transport for shipments under 1 ton.", benefits: ["Shared Truck", "Door Delivery", "Insurance", "Tracking"], rating: 4.5, reviews: 3456, inStock: true },
    { id: "p3", name: "Warehouse Rental", category: "Warehouse", price: 50, period: "/sq ft/month", description: "Warehousing space in major logistics hubs.", benefits: ["24/7 Security", "Loading Docks", "Climate Control", "Inventory Management"], rating: 4.7, reviews: 890, inStock: true, badge: "Strategic" },
    { id: "p4", name: "E-Commerce Fulfillment", category: "Fulfillment", price: 30, period: "/order", description: "Pick, pack, and ship for D2C brands.", benefits: ["Same-Day Dispatch", "Returns Management", "COD Handling", "API Integration"], rating: 4.8, reviews: 2345, inStock: true, badge: "Fast Growing" },
  ],
  "courier": [
    { id: "p1", name: "Same-Day Delivery", category: "Express", price: 150, description: "Within-city delivery within 4 hours.", benefits: ["4-Hour Delivery", "Live Tracking", "SMS Updates", "Insurance"], rating: 4.7, reviews: 8901, inStock: true, badge: "Fastest" },
    { id: "p2", name: "Next-Day Delivery", category: "Express", price: 80, description: "Inter-city delivery by next business day.", benefits: ["Next Business Day", "Door-to-Door", "Tracking", "Proof of Delivery"], rating: 4.6, reviews: 12345, inStock: true },
    { id: "p3", name: "Bulk Shipping", category: "Business", price: 40, period: "/parcel", description: "Discounted rates for businesses shipping 100+ parcels/month.", benefits: ["Bulk Discounts", "API Integration", "COD Available", "Dashboard"], rating: 4.5, reviews: 3456, inStock: true, badge: "Business Favorite" },
    { id: "p4", name: "International Courier", category: "International", price: 999, description: "Ship to 220+ countries with customs clearance.", benefits: ["220+ Countries", "Customs Handling", "Insurance", "Door Delivery"], rating: 4.7, reviews: 2345, inStock: true },
  ],
  "interior-design": [
    { id: "p1", name: "Living Room Package", category: "Room", price: 350000, description: "Complete living room interior — sofa, TV unit, wall panel, lighting.", benefits: ["3D Design", "Custom Furniture", "Wall Décor", "Lighting"], rating: 4.7, reviews: 890, inStock: true, badge: "Popular" },
    { id: "p2", name: "Modular Kitchen", category: "Kitchen", price: 250000, originalPrice: 350000, description: "L-shaped or U-shaped modular kitchen with chimney.", benefits: ["Soft-Close Hinges", "Granite Top", "Chimney", "Pipeline"], rating: 4.8, reviews: 1234, inStock: true, badge: "Best Seller" },
    { id: "p3", name: "Bedroom Makeover", category: "Room", price: 200000, description: "Bed, wardrobe, study table, and accent wall.", benefits: ["Custom Bed", "Sliding Wardrobe", "Study Unit", "Accent Wall"], rating: 4.6, reviews: 678, inStock: true },
    { id: "p4", name: "Full Home Interior", category: "Home", price: 1200000, originalPrice: 1800000, description: "Complete home interior design and execution.", benefits: ["All Rooms", "3D Walkthrough", "PMC", "10-Year Warranty"], rating: 4.9, reviews: 456, inStock: true, badge: "Premium" },
  ],
  "architecture-firm": [
    { id: "p1", name: "Residential Design", category: "Design", price: 150, period: "/sq ft", description: "Architectural design for homes — 2D plans, 3D views, elevation.", benefits: ["Floor Plans", "3D Renderings", "Elevation", "BOQ"], rating: 4.7, reviews: 890, inStock: true },
    { id: "p2", name: "Commercial Design", category: "Design", price: 200, period: "/sq ft", description: "Office, retail, and hospitality architectural design.", benefits: ["Concept Design", "3D Walkthrough", "MEP Coordination", "Approvals"], rating: 4.8, reviews: 456, inStock: true, badge: "Premium" },
    { id: "p3", name: "Landscape Architecture", category: "Landscape", price: 75, period: "/sq ft", description: "Outdoor spaces — gardens, terraces, courtyards.", benefits: ["Garden Design", "Hardscaping", "Irrigation", "Lighting Plan"], rating: 4.6, reviews: 345, inStock: true },
    { id: "p4", name: "Interior + Architecture Bundle", category: "Bundle", price: 250, period: "/sq ft", description: "Combined architectural and interior design for new builds.", benefits: ["All Design Services", "Single Point of Contact", "3D Walkthrough", "Construction Support"], rating: 4.9, reviews: 234, inStock: true, badge: "Best Value" },
  ],
  "insurance-crm": [
    { id: "p1", name: "Agent CRM Basic", category: "CRM", price: 999, period: "/month", description: "Lead management and policy tracking for individual agents.", benefits: ["Lead Management", "Policy Database", "Renewal Reminders", "Basic Reports"], rating: 4.5, reviews: 2345, inStock: true, badge: "Starter" },
    { id: "p2", name: "Agency CRM Pro", category: "CRM", price: 4999, period: "/month", description: "Multi-agent CRM with commissions and team performance.", benefits: ["Team Dashboard", "Commission Tracking", "WhatsApp Integration", "Claim Processing"], rating: 4.7, reviews: 890, inStock: true, badge: "Most Popular" },
    { id: "p3", name: "Insurer Platform", category: "Platform", price: 99999, period: "/year", description: "Enterprise platform for insurance companies.", benefits: ["Underwriting", "Claims Management", "Regulatory Reporting", "Agent Portal"], rating: 4.8, reviews: 234, inStock: true },
    { id: "p4", name: "Comparison Engine", category: "Platform", price: 49999, period: "/year", description: "Multi-insurer comparison platform for aggregators.", benefits: ["Multi-Insurer API", "Premium Calculator", "Lead Capture", "Instant Quotes"], rating: 4.6, reviews: 345, inStock: true },
  ],
  "fintech": [
    { id: "p1", name: "Payment Gateway", category: "Payments", price: 2, period: "% per txn", description: "Accept UPI, cards, netbanking, and wallets.", benefits: ["UPI", "Cards", "NetBanking", "Wallets", "Instant Settlement"], rating: 4.7, reviews: 5678, inStock: true, badge: "Most Used" },
    { id: "p2", name: "BNPL Platform", category: "Lending", price: 50000, period: "/month", description: "Buy Now Pay Later for e-commerce merchants.", benefits: ["Instant Approval", "Merchant Dashboard", "Risk Engine", "Collections"], rating: 4.6, reviews: 890, inStock: true },
    { id: "p3", name: "Digital Lending Suite", category: "Lending", price: 200000, period: "/year", description: "End-to-end digital lending — origination to collection.", benefits: ["KYC/AML", "Credit Scoring", "Loan Management", "Collections"], rating: 4.8, reviews: 345, inStock: true, badge: "Enterprise" },
    { id: "p4", name: "WealthTech Platform", category: "Wealth", price: 100000, period: "/year", description: "Mutual fund distribution and portfolio management.", benefits: ["MF Distribution", "Portfolio Tracking", "Goal Planning", "KYC"], rating: 4.7, reviews: 567, inStock: true },
  ],
  "lending": [
    { id: "p1", name: "MSME Loan Origination", category: "Lending", price: 75000, period: "/year", description: "End-to-end loan processing for micro and small businesses.", benefits: ["Application Portal", "Document Upload", "Credit Check", "Disbursement"], rating: 4.6, reviews: 567, inStock: true },
    { id: "p2", name: "Gold Loan Module", category: "Lending", price: 50000, period: "/year", description: "Gold loan management with auto-valuation.", benefits: ["Auto Valuation", "Purity Check", "Interest Calculation", "Auction Management"], rating: 4.7, reviews: 345, inStock: true },
    { id: "p3", name: "NPA Management", category: "Recovery", price: 100000, period: "/year", description: "NPA tracking, legal notices, and recovery management.", benefits: ["NPA Tracking", "Legal Notices", "Recovery Agents", "SARFAESI Compliance"], rating: 4.8, reviews: 234, inStock: true, badge: "Essential" },
    { id: "p4", name: "Complete Lending Suite", category: "Suite", price: 300000, period: "/year", description: "Full lending platform — origination to recovery.", benefits: ["All Modules", "Multi-Product", "Analytics", "Regulatory Compliance"], rating: 4.9, reviews: 123, inStock: true, badge: "Enterprise" },
  ],
  "hrms": [
    { id: "p1", name: "Core HR Module", category: "Module", price: 50, period: "/employee/month", description: "Employee records, leave, attendance, and payroll.", benefits: ["Employee Database", "Leave Management", "Attendance", "Payroll"], rating: 4.6, reviews: 3456, inStock: true, badge: "Essential" },
    { id: "p2", name: "Recruitment Module", category: "Module", price: 30, period: "/employee/month", description: "Job posting, applicant tracking, and onboarding.", benefits: ["Job Board Integration", "ATS", "Offer Management", "Onboarding"], rating: 4.5, reviews: 2345, inStock: true },
    { id: "p3", name: "Performance Management", category: "Module", price: 25, period: "/employee/month", description: "OKRs, reviews, 360 feedback, and succession planning.", benefits: ["OKR Tracking", "360° Feedback", "Appraisals", "Succession Planning"], rating: 4.7, reviews: 1234, inStock: true },
    { id: "p4", name: "Complete HRMS Suite", category: "Suite", price: 150, period: "/employee/month", description: "Full HR platform with all modules and analytics.", benefits: ["All Modules", "Analytics Dashboard", "Mobile App", "API Access", "Dedicated Support"], rating: 4.8, reviews: 890, inStock: true, badge: "Most Popular" },
  ],
  "erp": [
    { id: "p1", name: "Finance & Accounting", category: "Module", price: 40000, period: "/year", description: "General ledger, AP, AR, reconciliation, and compliance.", benefits: ["GL", "AP/AR", "Bank Reconciliation", "TDS/GST"], rating: 4.7, reviews: 2345, inStock: true },
    { id: "p2", name: "Supply Chain Module", category: "Module", price: 35000, period: "/year", description: "Procurement, inventory, and vendor management.", benefits: ["Purchase Orders", "Inventory", "Vendor Portal", "GRN"], rating: 4.6, reviews: 1890, inStock: true, badge: "Essential" },
    { id: "p3", name: "HR & Payroll Module", category: "Module", price: 25000, period: "/year", description: "Employee management, payroll, and statutory compliance.", benefits: ["Employee DB", "Payroll", "PF/ESI", "PT"], rating: 4.5, reviews: 1234, inStock: true },
    { id: "p4", name: "Complete ERP System", category: "Suite", price: 250000, period: "/year", description: "Full ERP covering finance, supply chain, HR, and manufacturing.", benefits: ["All Modules", "Multi-Company", "Consolidation", "Business Intelligence", "Support"], rating: 4.8, reviews: 567, inStock: true, badge: "Enterprise" },
  ],
  "franchise": [
    { id: "p1", name: "Franchise Management", category: "Platform", price: 25000, period: "/month", description: "Franchisee onboarding, operations tracking, and compliance.", benefits: ["Franchisee Portal", "Operations Dashboard", "Compliance Tracking", "Reports"], rating: 4.6, reviews: 567, inStock: true },
    { id: "p2", name: "Royalty Management", category: "Module", price: 15000, period: "/month", description: "Automated royalty calculation and collection.", benefits: ["Auto Calculation", "Invoice Generation", "Collection Tracking", "Reports"], rating: 4.7, reviews: 345, inStock: true, badge: "Popular" },
    { id: "p3", name: "Brand Portal", category: "Portal", price: 10000, period: "/month", description: "Centralized brand guidelines and asset management.", benefits: ["Brand Guidelines", "Marketing Assets", "Training Videos", "Approval Workflows"], rating: 4.5, reviews: 234, inStock: true },
    { id: "p4", name: "Complete Franchise Suite", category: "Suite", price: 80000, period: "/month", description: "End-to-end franchise management with analytics.", benefits: ["All Modules", "Territory Mapping", "Performance Analytics", "Mobile App"], rating: 4.8, reviews: 123, inStock: true, badge: "Enterprise" },
  ],
  "membership-org": [
    { id: "p1", name: "Membership Portal", category: "Portal", price: 15000, period: "/year", description: "Online membership registration and renewal.", benefits: ["Online Registration", "Payment Gateway", "Member Directory", "Event Calendar"], rating: 4.6, reviews: 890, inStock: true },
    { id: "p2", name: "Association Management", category: "Platform", price: 50000, period: "/year", description: "Complete association management — chapters, events, publications.", benefits: ["Chapter Management", "Event Management", "Publication Portal", "Voting System"], rating: 4.7, reviews: 567, inStock: true, badge: "Complete" },
    { id: "p3", name: "Subscription Billing", category: "Module", price: 20000, period: "/year", description: "Automated recurring billing for membership dues.", benefits: ["Auto Billing", "Payment Reminders", "Receipts", "Financial Reports"], rating: 4.5, reviews: 345, inStock: true },
    { id: "p4", name: "Complete Membership Suite", category: "Suite", price: 100000, period: "/year", description: "Full platform for associations and clubs.", benefits: ["All Modules", "Mobile App", "Analytics", "Custom Integrations"], rating: 4.8, reviews: 234, inStock: true, badge: "Enterprise" },
  ],
  "nonprofit": [
    { id: "p1", name: "Donor Management", category: "CRM", price: 10000, period: "/year", description: "Donor database, gift tracking, and acknowledgment.", benefits: ["Donor Database", "Gift Tracking", "Auto Acknowledgments", "Reports"], rating: 4.6, reviews: 1234, inStock: true },
    { id: "p2", name: "Fundraising Platform", category: "Platform", price: 25000, period: "/year", description: "Online fundraising campaigns with donor portal.", benefits: ["Campaign Pages", "Online Donations", "Donor Portal", "Impact Reports"], rating: 4.7, reviews: 890, inStock: true, badge: "Most Popular" },
    { id: "p3", name: "Grant Management", category: "Module", price: 15000, period: "/year", description: "Grant application, tracking, and reporting.", benefits: ["Grant Pipeline", "Budget Tracking", "Milestone Reports", "Compliance"], rating: 4.5, reviews: 567, inStock: true },
    { id: "p4", name: "Complete Nonprofit Suite", category: "Suite", price: 60000, period: "/year", description: "Full platform for NGOs — donors, grants, events, volunteers.", benefits: ["All Modules", "Volunteer Portal", "Impact Dashboard", "Compliance Reports"], rating: 4.8, reviews: 345, inStock: true, badge: "Complete" },
  ],
  "marketplace": [
    { id: "p1", name: "Vendor Onboarding", category: "Module", price: 20000, period: "/year", description: "Vendor registration, KYC, and product listing.", benefits: ["Registration Flow", "KYC/Verification", "Product Listings", "Commission Setup"], rating: 4.6, reviews: 890, inStock: true },
    { id: "p2", name: "Order Management", category: "Module", price: 30000, period: "/year", description: "Multi-vendor order processing and fulfillment.", benefits: ["Order Routing", "Vendor Dashboard", "Shipping Integration", "Returns"], rating: 4.7, reviews: 567, inStock: true, badge: "Essential" },
    { id: "p3", name: "Payment & Settlement", category: "Module", price: 25000, period: "/year", description: "Multi-vendor payment splits and settlement.", benefits: ["Payment Splits", "TDS Deduction", "Settlement Engine", "Commission Tracking"], rating: 4.8, reviews: 345, inStock: true },
    { id: "p4", name: "Complete Marketplace Suite", category: "Suite", price: 150000, period: "/year", description: "Full multi-vendor marketplace with analytics.", benefits: ["All Modules", "Mobile App", "Analytics", "Multi-Language", "Support"], rating: 4.9, reviews: 234, inStock: true, badge: "Enterprise" },
  ],
};

const DOMAIN_TESTIMONIALS: Record<string, BusinessGenesis["testimonials"]> = {
  ecommerce: [
    { name: "Rajesh Kumar", location: "Mumbai", rating: 5, quote: "Best whey protein I've used in India. The quality is outstanding and delivery was super fast.", product: "Whey Protein Isolate" },
    { name: "Priya Sharma", location: "Bangalore", rating: 5, quote: "Finally a supplement brand I trust. FSSAI certified and the results speak for themselves.", product: "Creatine Monohydrate" },
    { name: "Vikram Singh", location: "Delhi", rating: 4, quote: "Great range of products at competitive prices. The Ashwagandha has really helped my sleep.", product: "Ashwagandha KSM-66" },
    { name: "Ananya Patel", location: "Ahmedabad", rating: 5, quote: "Been ordering from FuelCore for 6 months now. Consistent quality and genuine products.", product: "BCAA Recovery Complex" },
    { name: "Arjun Nair", location: "Kochi", rating: 4, quote: "Good pre-workout, decent energy without the crash. Will order again.", product: "Pre-Workout Surge" },
  ],
  restaurant: [
    { name: "Michael Chang", location: "Mumbai", rating: 5, quote: "The Dragon Roll here is incredible. Best Japanese food I've had outside Tokyo.", product: "Dragon Roll" },
    { name: "Sarah Williams", location: "Delhi", rating: 5, quote: "Authentic flavors and beautiful presentation. The Miso Ramen is my go-to comfort food.", product: "Miso Ramen" },
    { name: "Raj Patel", location: "Bangalore", rating: 4, quote: "Fresh fish, expert preparation. The Salmon Sashimi melts in your mouth.", product: "Salmon Sashimi" },
    { name: "Meera Reddy", location: "Hyderabad", rating: 5, quote: "Perfect ambiance and even better food. We come here every weekend.", product: "Chicken Teriyaki" },
  ],
  "gym-crm": [
    { name: "Karan Malhotra", location: "Mumbai", rating: 5, quote: "Iron Peak transformed our gym operations. Member retention improved by 40% in 3 months.", product: "Professional Plan" },
    { name: "Deepa Krishnan", location: "Chennai", rating: 5, quote: "The attendance tracking and billing automation saves us 15 hours every week.", product: "Enterprise Plan" },
    { name: "Suresh Menon", location: "Pune", rating: 4, quote: "Clean interface, powerful features. Our staff picked it up in just 2 days.", product: "Basic Plan" },
  ],
  saas: [
    { name: "Rohan Gupta", location: "Bangalore", rating: 5, quote: "Our team productivity increased by 35% after switching to this platform.", product: "Professional" },
    { name: "Nisha Agarwal", location: "Mumbai", rating: 5, quote: "The best project management tool we've used. Clean, fast, and reliable.", product: "Business" },
    { name: "Amit Deshmukh", location: "Pune", rating: 4, quote: "Great value for money. The free tier is more generous than competitors' paid plans.", product: "Starter" },
  ],
  "healthcare-clinic": [
    { name: "Priya Reddy", location: "Hyderabad", rating: 5, quote: "The health checkup package was comprehensive. Caught my vitamin D deficiency early.", product: "Health Checkup Package" },
    { name: "Arun Mehta", location: "Pune", rating: 4, quote: "Quick appointments and the doctors are very thorough. The physiotherapy sessions helped my back pain.", product: "Physiotherapy Session" },
    { name: "Sneha Iyer", location: "Chennai", rating: 5, quote: "Best dental clinic in the area. Painless cleaning and very hygienic setup.", product: "Dental Cleaning" },
  ],
  "agency-crm": [
    { name: "Rohit Verma", location: "Mumbai", rating: 5, quote: "Switched from HubSpot to this. The India-specific features and WhatsApp integration are game changers.", product: "Growth Plan" },
    { name: "Ananya Bose", location: "Kolkata", rating: 4, quote: "Pipeline management is intuitive. Our lead conversion rate improved by 35% in 2 months.", product: "Growth Plan" },
    { name: "Karthik Nair", location: "Bangalore", rating: 5, quote: "The client reporting feature saves us 10 hours per week. Clients love the automated updates.", product: "Enterprise Plan" },
  ],
  "education-platform": [
    { name: "Aditya Sharma", location: "Delhi", rating: 5, quote: "The bootcamp was intense but worth every rupee. Got placed within 2 weeks of completion.", product: "Pro Bootcamp" },
    { name: "Meera Krishnan", location: "Chennai", rating: 4, quote: "Good course content and the mentor was very supportive. Would recommend for beginners.", product: "Basic Course" },
    { name: "Vikram Patel", location: "Ahmedabad", rating: 5, quote: "We trained 50 employees through the enterprise program. The custom curriculum was exactly what we needed.", product: "Enterprise Training" },
  ],
  "real-estate-crm": [
    { name: "Sanjay Gupta", location: "Gurgaon", rating: 5, quote: "The virtual tour feature helped us close 3 deals without in-person visits. Game changer for NRI clients.", product: "Premium Listing" },
    { name: "Pooja Agarwal", location: "Mumbai", rating: 4, quote: "Lead capture from property portals flows directly into the CRM. No more manual data entry.", product: "Premium Listing" },
  ],
  "hotel-booking": [
    { name: "Rahul Malhotra", location: "Delhi", rating: 5, quote: "Booked the family package for Diwali. Kids loved the activities and the food was excellent.", product: "Family Package" },
    { name: "Shruti Desai", location: "Pune", rating: 4, quote: "The deluxe suite had a beautiful view. Check-in was seamless and the staff was very courteous.", product: "Deluxe Suite" },
  ],
  "beauty-salon": [
    { name: "Neha Kapoor", location: "Mumbai", rating: 5, quote: "The bridal makeup was flawless. My wedding photos look stunning. Thank you, Glow Studio!", product: "Bridal Makeup Package" },
    { name: "Deepika Rao", location: "Bangalore", rating: 5, quote: "Best facial I've ever had. My skin is glowing. The skin analysis was very detailed.", product: "Facial & Cleanup" },
    { name: "Ishita Banerjee", location: "Kolkata", rating: 4, quote: "Very professional hair styling. They understood exactly what I wanted.", product: "Haircut & Styling" },
  ],
  "dental-clinic": [
    { name: "Rajesh Tiwari", location: "Lucknow", rating: 5, quote: "Painless root canal. Dr. Sharma is the best dentist I've visited.", product: "Root Canal Treatment" },
    { name: "Kavitha Menon", location: "Bangalore", rating: 5, quote: "Teeth whitening results were amazing — 6 shades brighter in one session!", product: "Teeth Whitening" },
    { name: "Amit Joshi", location: "Jaipur", rating: 4, quote: "Affordable and quality dental care. The cleaning was thorough.", product: "Teeth Cleaning" },
  ],
  "law-firm": [
    { name: "Sanjay Mehta", location: "Mumbai", rating: 5, quote: "Their corporate legal team helped us close a ₹50 Cr acquisition smoothly.", product: "Corporate Legal Package" },
    { name: "Priyanka Desai", location: "Delhi", rating: 4, quote: "The property verification saved us from a fraudulent deal. Excellent due diligence.", product: "Property Verification" },
    { name: "Vikram Choudhary", location: "Chandigarh", rating: 5, quote: "Professional, responsive, and result-oriented. Best law firm in the region.", product: "Legal Consultation" },
  ],
  "coaching-center": [
    { name: "Arjun Mehta", location: "Kota", rating: 5, quote: "Got AIR 234 in JEE Advanced. The faculty and study material here are unmatched.", product: "JEE Main Crash Course" },
    { name: "Sneha Patil", location: "Pune", rating: 5, quote: "Cracked NEET with 680 marks. The biology faculty is phenomenal.", product: "NEET Preparation" },
    { name: "Rohit Sharma", location: "Delhi", rating: 4, quote: "The test series really helped me identify my weak areas. Highly recommend.", product: "Online Test Series" },
  ],
  "travel-agency": [
    { name: "Ananya Singh", location: "Mumbai", rating: 5, quote: "The Kashmir trip was perfectly organized. The houseboat experience was magical.", product: "Kashmir Paradise Tour" },
    { name: "Rahul Gupta", location: "Delhi", rating: 4, quote: "Maldives honeymoon was beyond our expectations. Everything was seamless.", product: "Honeymoon Special — Maldives" },
    { name: "Meera Nair", location: "Chennai", rating: 5, quote: "Goa package was great value. The water sports were the highlight!", product: "Goa Beach Package" },
  ],
  "spa-wellness": [
    { name: "Nisha Agarwal", location: "Bangalore", rating: 5, quote: "The Panchakarma treatment was transformative. I feel 10 years younger.", product: "Ayurvedic Panchakarma" },
    { name: "Karan Malhotra", location: "Mumbai", rating: 5, quote: "Best couples retreat we've ever had. The ambiance and service were perfect.", product: "Couples Retreat Package" },
    { name: "Deepa Krishnan", location: "Chennai", rating: 4, quote: "The deep tissue massage completely relieved my chronic back pain.", product: "Deep Tissue Massage" },
  ],
  "accounting-firm": [
    { name: "Prateek Sharma", location: "Delhi", rating: 5, quote: "Filed my ITR in 24 hours. Saved ₹45,000 in tax through smart planning.", product: "ITR Filing — Individual" },
    { name: "Arun Patel", location: "Ahmedabad", rating: 4, quote: "GST compliance was a nightmare until we found them. Now everything is smooth.", product: "GST Registration & Filing" },
    { name: "Meera Reddy", location: "Hyderabad", rating: 5, quote: "Their CFO services helped us raise our Series A. Strategic and hands-on.", product: "Startup CFO Services" },
  ],
  "consulting-business": [
    { name: "Ravi Kumar", location: "Bangalore", rating: 5, quote: "The digital transformation project increased our efficiency by 40%.", product: "Digital Transformation" },
    { name: "Shruti Agarwal", location: "Mumbai", rating: 4, quote: "The strategy workshop gave us clarity on our 3-year roadmap.", product: "Strategy Workshop" },
    { name: "Amit Deshmukh", location: "Pune", rating: 5, quote: "Market entry strategy for South India was spot-on. Revenue grew 3x in 18 months.", product: "Market Entry Strategy" },
  ],
  "recruitment-agency": [
    { name: "Suman Rao", location: "Hyderabad", rating: 5, quote: "Hired 50 engineers in 30 days. The bulk hiring capability is impressive.", product: "Bulk Hiring Package" },
    { name: "Vikram Bose", location: "Kolkata", rating: 4, quote: "Found the perfect CFO candidate through their executive search.", product: "Executive Search" },
    { name: "Neha Kapoor", location: "Gurgaon", rating: 5, quote: "RPO solution transformed our hiring. Time-to-hire dropped from 45 to 18 days.", product: "Recruitment Process Outsourcing" },
  ],
  "event-management": [
    { name: "Pooja Bhatt", location: "Mumbai", rating: 5, quote: "Our wedding was straight out of a fairy tale. Every detail was perfect.", product: "Wedding Planning" },
    { name: "Arjun Khanna", location: "Delhi", rating: 5, quote: "Product launch event generated 500+ leads. Excellent execution.", product: "Corporate Event Package" },
    { name: "Meera Joshi", location: "Bangalore", rating: 4, quote: "Son's birthday party was a hit. The theme setup was beyond our expectations.", product: "Birthday Celebration" },
  ],
  "cleaning-service": [
    { name: "Rajiv Malhotra", location: "Delhi", rating: 5, quote: "Deep cleaning transformed our 3BHK. Kitchen looks brand new.", product: "Deep Home Cleaning" },
    { name: "Anita Deshpande", location: "Pune", rating: 4, quote: "Office cleaning contract — consistent quality every day. No complaints.", product: "Office Cleaning Contract" },
    { name: "Sanjay Nair", location: "Kochi", rating: 5, quote: "Post-construction cleanup was thorough. Removed every trace of dust.", product: "Post-Construction Cleanup" },
  ],
  "repair-service": [
    { name: "Ramesh Patel", location: "Ahmedabad", rating: 5, quote: "AC repair done in 30 minutes. Technician was skilled and polite.", product: "AC Repair & Service" },
    { name: "Sunita Verma", location: "Lucknow", rating: 4, quote: "Plumbing service fixed a 3-day leak in 1 hour. Fair pricing.", product: "Plumbing Service" },
    { name: "Manoj Tiwari", location: "Varanasi", rating: 5, quote: "AMC plan is the best investment. 3 visits a year and all appliances covered.", product: "Appliance AMC" },
  ],
  "photography": [
    { name: "Riya Malhotra", location: "Mumbai", rating: 5, quote: "Our wedding photos are absolutely stunning. The team captured every emotion.", product: "Wedding Photography" },
    { name: "Akash Singh", location: "Delhi", rating: 5, quote: "Pre-wedding shoot at Jaipur was magical. 50+ photos, all gorgeous.", product: "Pre-Wedding Shoot" },
    { name: "Priya Menon", location: "Bangalore", rating: 4, quote: "Product photography increased our Amazon sales by 35%. Professional quality.", product: "Product Photography" },
  ],
  "fitness-studio": [
    { name: "Vikram Reddy", location: "Hyderabad", rating: 5, quote: "Lost 12 kg in 3 months with personal training. The trainers are incredible.", product: "Personal Training (12 Sessions)" },
    { name: "Neha Agarwal", location: "Delhi", rating: 5, quote: "Yoga classes changed my life. Better sleep, less stress, more energy.", product: "Yoga & Meditation" },
    { name: "Rahul Deshmukh", location: "Pune", rating: 4, quote: "Zumba and HIIT classes are addictive. Best fitness investment.", product: "Group Fitness Pack (10 Classes)" },
  ],
  "manufacturing-erp": [
    { name: "Suresh Bansal", location: "Ludhiana", rating: 5, quote: "Shop floor visibility improved 100%. We can track every production order in real-time.", product: "Shop Floor Module" },
    { name: "Rajesh Agarwal", location: "Rajkot", rating: 4, quote: "Inventory accuracy went from 72% to 99% after implementing the warehouse module.", product: "Inventory Management" },
    { name: "Anil Mehta", location: "Pune", rating: 5, quote: "Quality control module helped us achieve ISO 9001 certification.", product: "Quality Control Module" },
  ],
  "wholesale-distribution": [
    { name: "Mahesh Kumar", location: "Delhi", rating: 5, quote: "Managing 500+ dealers became easy. The dealer portal reduced calls by 80%.", product: "Distribution Management" },
    { name: "Pankaj Shah", location: "Mumbai", rating: 4, quote: "Sales team productivity increased 40% with beat planning and GPS tracking.", product: "Sales Force Automation" },
    { name: "Ravi Gupta", location: "Kanpur", rating: 5, quote: "Warehouse operations are now paperless. Accuracy and speed both improved.", product: "Warehouse Module" },
  ],
  "pharma-distribution": [
    { name: "Dr. Vikram Singh", location: "Delhi", rating: 5, quote: "Drug compliance tracking is now effortless. Every batch is traceable.", product: "Drug Distribution Module" },
    { name: "Priya Sharma", location: "Hyderabad", rating: 5, quote: "Cold chain monitoring saved us from vaccine spoilage. Real-time alerts are lifesavers.", product: "Cold Chain Management" },
    { name: "Arun Mehta", location: "Ahmedabad", rating: 4, quote: "Medical rep management improved field coverage by 35%.", product: "Medical Rep Management" },
  ],
  "auto-dealership": [
    { name: "Rajesh Verma", location: "Jaipur", rating: 5, quote: "DMS Pro transformed our 3-showroom operation. Everything is centralized.", product: "DMS Professional" },
    { name: "Sanjay Malhotra", location: "Gurgaon", rating: 4, quote: "Used car platform generates 200+ leads per month. Great ROI.", product: "Used Car Platform" },
    { name: "Anil Kapoor", location: "Lucknow", rating: 5, quote: "OEM integration was seamless. Reports auto-generate for the manufacturer.", product: "Complete Dealer Suite" },
  ],
  "construction": [
    { name: "Vikram Patel", location: "Ahmedabad", rating: 5, quote: "Built our 3000 sq ft home in 8 months. Quality materials and transparent billing.", product: "Residential Construction" },
    { name: "Sunita Sharma", location: "Delhi", rating: 5, quote: "Interior design was spectacular. The 3D walkthrough before starting was very helpful.", product: "Interior Design Package" },
    { name: "Mahesh Reddy", location: "Hyderabad", rating: 4, quote: "Office renovation completed on time and within budget. Professional team.", product: "Renovation & Remodeling" },
  ],
  "logistics": [
    { name: "Amit Sharma", location: "Mumbai", rating: 5, quote: "FTL transport from Delhi to Mumbai delivered in 18 hours. GPS tracking was accurate.", product: "FTL Transport" },
    { name: "Rajesh Gupta", location: "Pune", rating: 4, quote: "E-commerce fulfillment handles 500+ orders daily. Same-day dispatch is reliable.", product: "E-Commerce Fulfillment" },
    { name: "Sanjay Patel", location: "Ahmedabad", rating: 5, quote: "Warehouse in Bhiwandi is strategically located. 24/7 security and good connectivity.", product: "Warehouse Rental" },
  ],
  "courier": [
    { name: "Neha Agarwal", location: "Delhi", rating: 5, quote: "Same-day delivery within 3 hours. Perfect for urgent documents.", product: "Same-Day Delivery" },
    { name: "Rajiv Kumar", location: "Bangalore", rating: 4, quote: "Bulk shipping rates are the best in the market. API integration was easy.", product: "Bulk Shipping" },
    { name: "Priya Menon", location: "Mumbai", rating: 5, quote: "International courier to USA delivered in 5 days with tracking. Impressive.", product: "International Courier" },
  ],
  "interior-design": [
    { name: "Arun Mehta", location: "Mumbai", rating: 5, quote: "Living room transformation was beyond our expectations. The 3D design matched reality.", product: "Living Room Package" },
    { name: "Shruti Agarwal", location: "Delhi", rating: 5, quote: "Modular kitchen is a dream. Soft-close hinges, ample storage, perfect layout.", product: "Modular Kitchen" },
    { name: "Vikram Rao", location: "Hyderabad", rating: 4, quote: "Full home interior for our 3BHK. Great value for the quality delivered.", product: "Full Home Interior" },
  ],
  "architecture-firm": [
    { name: "Rajesh Khanna", location: "Delhi", rating: 5, quote: "The 3D walkthrough of our home design was photorealistic. We could visualize everything.", product: "Residential Design" },
    { name: "Meera Sharma", location: "Jaipur", rating: 4, quote: "Office building design was innovative yet practical. Completed approvals in 2 weeks.", product: "Commercial Design" },
    { name: "Anil Agarwal", location: "Pune", rating: 5, quote: "Landscape design transformed our terrace into a beautiful garden space.", product: "Landscape Architecture" },
  ],
  "insurance-crm": [
    { name: "Rajesh Verma", location: "Delhi", rating: 5, quote: "Renewal reminders increased retention by 25%. Missed renewals are now zero.", product: "Agency CRM Pro" },
    { name: "Priya Nair", location: "Kochi", rating: 4, quote: "Commission tracking was a mess before. Now everything is automated and accurate.", product: "Agency CRM Pro" },
    { name: "Sanjay Patel", location: "Ahmedabad", rating: 5, quote: "Lead management improved our conversion rate from 12% to 28%.", product: "Agent CRM Basic" },
  ],
  "fintech": [
    { name: "Arun Kumar", location: "Bangalore", rating: 5, quote: "Payment gateway integration took 2 hours. UPI success rate is 99.2%.", product: "Payment Gateway" },
    { name: "Neha Gupta", location: "Mumbai", rating: 4, quote: "BNPL increased our average order value by 35%. Great merchant dashboard.", product: "BNPL Platform" },
    { name: "Vikram Singh", location: "Delhi", rating: 5, quote: "Digital lending suite reduced loan processing time from 7 days to 4 hours.", product: "Digital Lending Suite" },
  ],
  "lending": [
    { name: "Rajesh Agarwal", location: "Ahmedabad", rating: 5, quote: "MSME loan disbursement increased 3x after implementing the origination platform.", product: "MSME Loan Origination" },
    { name: "Suresh Bansal", location: "Ludhiana", rating: 4, quote: "Gold loan auto-valuation reduced processing time by 60%.", product: "Gold Loan Module" },
    { name: "Priya Mehta", location: "Mumbai", rating: 5, quote: "NPA management helped recover ₹15 Cr in bad loans. Excellent legal coordination.", product: "NPA Management" },
  ],
  "hrms": [
    { name: "Anil Sharma", location: "Delhi", rating: 5, quote: "Payroll processing that took 3 days now takes 30 minutes. Game changer.", product: "Core HR Module" },
    { name: "Meera Patel", location: "Bangalore", rating: 4, quote: "Recruitment module reduced our time-to-hire from 45 to 20 days.", product: "Recruitment Module" },
    { name: "Vikram Reddy", location: "Hyderabad", rating: 5, quote: "Performance management with OKRs aligned our entire team to company goals.", product: "Performance Management" },
  ],
  "erp": [
    { name: "Rajesh Khanna", location: "Mumbai", rating: 5, quote: "Finance module automated our entire accounting. Month-end close in 2 days.", product: "Finance & Accounting" },
    { name: "Sanjay Gupta", location: "Pune", rating: 4, quote: "Supply chain visibility improved. We can track every purchase order in real-time.", product: "Supply Chain Module" },
    { name: "Anita Deshmukh", location: "Nagpur", rating: 5, quote: "Complete ERP system consolidated 5 companies into one platform.", product: "Complete ERP System" },
  ],
  "franchise": [
    { name: "Vikram Malhotra", location: "Delhi", rating: 5, quote: "Managing 50 franchisees became effortless. The portal gives complete visibility.", product: "Franchise Management" },
    { name: "Rajesh Agarwal", location: "Mumbai", rating: 4, quote: "Royalty auto-calculation saved us 20 hours per month. Accurate and transparent.", product: "Royalty Management" },
    { name: "Priya Sharma", location: "Bangalore", rating: 5, quote: "Brand portal ensured consistency across all 100 outlets.", product: "Brand Portal" },
  ],
  "membership-org": [
    { name: "Anil Mehta", location: "Delhi", rating: 5, quote: "Online registration increased new memberships by 60%. Digital is the way.", product: "Membership Portal" },
    { name: "Shruti Nair", location: "Kochi", rating: 4, quote: "Event management for 500-member association was seamless.", product: "Association Management" },
    { name: "Rajesh Patel", location: "Ahmedabad", rating: 5, quote: "Auto billing reduced dues collection time from 30 days to 3 days.", product: "Subscription Billing" },
  ],
  "nonprofit": [
    { name: "Dr. Sunita Rao", location: "Hyderabad", rating: 5, quote: "Donor management helped us increase repeat donations by 45%.", product: "Donor Management" },
    { name: "Arun Kumar", location: "Delhi", rating: 4, quote: "Fundraising platform raised ₹50 lakh for our education initiative.", product: "Fundraising Platform" },
    { name: "Meera Sharma", location: "Jaipur", rating: 5, quote: "Grant tracking ensures we never miss a reporting deadline. Life saver.", product: "Grant Management" },
  ],
  "marketplace": [
    { name: "Rajesh Verma", location: "Mumbai", rating: 5, quote: "Vendor onboarding flow is smooth. 200 sellers joined in the first month.", product: "Vendor Onboarding" },
    { name: "Priya Agarwal", location: "Delhi", rating: 5, quote: "Payment settlement engine handles 1000+ daily transactions accurately.", product: "Payment & Settlement" },
    { name: "Sanjay Nair", location: "Bangalore", rating: 4, quote: "Order management for multi-vendor is complex but the platform handles it well.", product: "Order Management" },
  ],
};

const DOMAIN_STATS: Record<string, BusinessGenesis["stats"]> = {
  ecommerce: [
    { label: "Happy Customers", value: "50,000+" },
    { label: "Orders Delivered", value: "2,00,000+" },
    { label: "FSSAI Certified", value: "100%" },
    { label: "Cities Covered", value: "500+" },
  ],
  restaurant: [
    { label: "Happy Guests", value: "15,000+" },
    { label: "Dishes Served", value: "1,00,000+" },
    { label: "Years of Excellence", value: "12" },
    { label: "Customer Rating", value: "4.8/5" },
  ],
  "gym-crm": [
    { label: "Gyms Managed", value: "2,500+" },
    { label: "Members Tracked", value: "5,00,000+" },
    { label: "Retention Improved", value: "40%" },
    { label: "Hours Saved/Week", value: "15+" },
  ],
  saas: [
    { label: "Active Users", value: "25,000+" },
    { label: "Projects Created", value: "1,50,000+" },
    { label: "Uptime", value: "99.9%" },
    { label: "Countries", value: "120+" },
  ],
  "healthcare-clinic": [
    { label: "Patients Treated", value: "30,000+" },
    { label: "Doctors", value: "25+" },
    { label: "Success Rate", value: "98%" },
    { label: "Years Experience", value: "15" },
  ],
  "agency-crm": [
    { label: "Clients Managed", value: "2,300+" },
    { label: "Leads Processed", value: "45,000+" },
    { label: "Revenue Tracked", value: "₹85 Cr+" },
    { label: "Team Productivity", value: "+40%" },
  ],
  "education-platform": [
    { label: "Students Enrolled", value: "8,500+" },
    { label: "Courses Available", value: "120+" },
    { label: "Completion Rate", value: "92%" },
    { label: "Placement Rate", value: "85%" },
  ],
  "real-estate-crm": [
    { label: "Properties Listed", value: "3,200+" },
    { label: "Deals Closed", value: "1,100+" },
    { label: "Agents Active", value: "250+" },
    { label: "Client Satisfaction", value: "96%" },
  ],
  "hotel-booking": [
    { label: "Happy Guests", value: "25,000+" },
    { label: "Room Nights Sold", value: "48,000+" },
    { label: "Average Rating", value: "4.7/5" },
    { label: "Repeat Guests", value: "65%" },
  ],
  "beauty-salon": [
    { label: "Happy Clients", value: "15,000+" },
    { label: "Services Completed", value: "32,000+" },
    { label: "Expert Stylists", value: "12+" },
    { label: "Client Rating", value: "4.8/5" },
  ],
  "dental-clinic": [
    { label: "Patients Treated", value: "18,000+" },
    { label: "Procedures Done", value: "25,000+" },
    { label: "Success Rate", value: "99%" },
    { label: "Years Experience", value: "12" },
  ],
  "law-firm": [
    { label: "Cases Won", value: "2,800+" },
    { label: "Clients Served", value: "5,000+" },
    { label: "Years Practice", value: "20+" },
    { label: "Win Rate", value: "94%" },
  ],
  "coaching-center": [
    { label: "Students Placed", value: "12,000+" },
    { label: "Selection Rate", value: "78%" },
    { label: "Faculty", value: "50+" },
    { label: "Study Hours", value: "10L+" },
  ],
  "travel-agency": [
    { label: "Trips Planned", value: "25,000+" },
    { label: "Happy Travelers", value: "80,000+" },
    { label: "Destinations", value: "150+" },
    { label: "Customer Rating", value: "4.7/5" },
  ],
  "spa-wellness": [
    { label: "Clients Relaxed", value: "10,000+" },
    { label: "Treatments Done", value: "25,000+" },
    { label: "Therapists", value: "15+" },
    { label: "Client Rating", value: "4.8/5" },
  ],
  "accounting-firm": [
    { label: "Clients Served", value: "3,500+" },
    { label: "ITRs Filed", value: "15,000+" },
    { label: "Tax Saved", value: "₹50 Cr+" },
    { label: "CA Team", value: "25+" },
  ],
  "consulting-business": [
    { label: "Projects Delivered", value: "500+" },
    { label: "Clients Served", value: "200+" },
    { label: "Industries", value: "20+" },
    { label: "Revenue Impact", value: "₹500 Cr+" },
  ],
  "recruitment-agency": [
    { label: "Placements Made", value: "15,000+" },
    { label: "Client Companies", value: "500+" },
    { label: "Success Rate", value: "92%" },
    { label: "Avg Time-to-Hire", value: "18 days" },
  ],
  "event-management": [
    { label: "Events Managed", value: "2,000+" },
    { label: "Happy Clients", value: "3,000+" },
    { label: "Venues", value: "100+" },
    { label: "Guests Served", value: "5L+" },
  ],
  "cleaning-service": [
    { label: "Homes Cleaned", value: "50,000+" },
    { label: "Happy Customers", value: "25,000+" },
    { label: "Service Pros", value: "200+" },
    { label: "Rating", value: "4.7/5" },
  ],
  "repair-service": [
    { label: "Repairs Done", value: "1,00,000+" },
    { label: "Cities", value: "10+" },
    { label: "Technicians", value: "500+" },
    { label: "Avg Rating", value: "4.6/5" },
  ],
  "photography": [
    { label: "Shoots Done", value: "8,000+" },
    { label: "Happy Clients", value: "5,000+" },
    { label: "Awards", value: "12+" },
    { label: "Avg Rating", value: "4.8/5" },
  ],
  "fitness-studio": [
    { label: "Active Members", value: "2,500+" },
    { label: "Classes Monthly", value: "200+" },
    { label: "Trainers", value: "15+" },
    { label: "Member Rating", value: "4.7/5" },
  ],
  "manufacturing-erp": [
    { label: "Factories Automated", value: "500+" },
    { label: "Production Lines", value: "2,000+" },
    { label: "Efficiency Gain", value: "35%" },
    { label: "Uptime", value: "99.5%" },
  ],
  "wholesale-distribution": [
    { label: "Dealers Managed", value: "10,000+" },
    { label: "Orders Processed", value: "5L+" },
    { label: "Warehouses", value: "200+" },
    { label: "Revenue Managed", value: "₹1000 Cr+" },
  ],
  "pharma-distribution": [
    { label: "Distributors", value: "1,500+" },
    { label: "Batches Tracked", value: "50,000+" },
    { label: "Compliance Rate", value: "100%" },
    { label: "Products Managed", value: "10,000+" },
  ],
  "auto-dealership": [
    { label: "Showrooms", value: "200+" },
    { label: "Cars Sold", value: "50,000+" },
    { label: "Satisfaction", value: "95%" },
    { label: "Service Bays", value: "1,000+" },
  ],
  "construction": [
    { label: "Projects Completed", value: "800+" },
    { label: "Homes Built", value: "2,000+" },
    { label: "Sq Ft Delivered", value: "50L+" },
    { label: "Client Rating", value: "4.7/5" },
  ],
  "logistics": [
    { label: "Shipments Monthly", value: "50,000+" },
    { label: "Pin Codes", value: "19,000+" },
    { label: "Fleet Size", value: "5,000+" },
    { label: "On-Time Delivery", value: "96%" },
  ],
  "courier": [
    { label: "Parcels Daily", value: "2,00,000+" },
    { label: "Pin Codes", value: "19,000+" },
    { label: "Cities", value: "1,000+" },
    { label: "Delivery Rate", value: "98%" },
  ],
  "interior-design": [
    { label: "Homes Designed", value: "1,500+" },
    { label: "Happy Families", value: "2,000+" },
    { label: "Designers", value: "30+" },
    { label: "Client Rating", value: "4.8/5" },
  ],
  "architecture-firm": [
    { label: "Projects Designed", value: "600+" },
    { label: "Sq Ft Designed", value: "80L+" },
    { label: "Awards", value: "15+" },
    { label: "Client Rating", value: "4.7/5" },
  ],
  "insurance-crm": [
    { label: "Agents Using", value: "10,000+" },
    { label: "Policies Managed", value: "5L+" },
    { label: "Claims Processed", value: "50,000+" },
    { label: "Renewal Rate", value: "88%" },
  ],
  "fintech": [
    { label: "Transactions", value: "1 Cr+" },
    { label: "Merchants", value: "50,000+" },
    { label: "Success Rate", value: "99.5%" },
    { label: "Settlement", value: "Same Day" },
  ],
  "lending": [
    { label: "Loans Disbursed", value: "₹500 Cr+" },
    { label: "Borrowers", value: "25,000+" },
    { label: "NPA Rate", value: "<2%" },
    { label: "Avg Processing", value: "4 hours" },
  ],
  "hrms": [
    { label: "Employees Managed", value: "2L+" },
    { label: "Companies", value: "1,500+" },
    { label: "Payroll Accuracy", value: "99.9%" },
    { label: "Support", value: "24/7" },
  ],
  "erp": [
    { label: "Companies", value: "3,000+" },
    { label: "Users", value: "50,000+" },
    { label: "Modules", value: "20+" },
    { label: "Uptime", value: "99.9%" },
  ],
  "franchise": [
    { label: "Franchises", value: "5,000+" },
    { label: "Brands", value: "100+" },
    { label: "Cities", value: "200+" },
    { label: "Revenue Tracked", value: "₹2000 Cr+" },
  ],
  "membership-org": [
    { label: "Members", value: "1,00,000+" },
    { label: "Organizations", value: "500+" },
    { label: "Events Managed", value: "10,000+" },
    { label: "Retention Rate", value: "92%" },
  ],
  "nonprofit": [
    { label: "Donors", value: "50,000+" },
    { label: "Funds Raised", value: "₹100 Cr+" },
    { label: "NGOs", value: "200+" },
    { label: "Impact Stories", value: "5,000+" },
  ],
  "marketplace": [
    { label: "Sellers", value: "10,000+" },
    { label: "Products", value: "5,00,000+" },
    { label: "Orders Daily", value: "25,000+" },
    { label: "Cities", value: "500+" },
  ],
};

const DOMAIN_OFFERS: Record<string, BusinessGenesis["offers"]> = {
  ecommerce: [
    { code: "FITINDIA", discount: 10, type: "percentage", minOrder: 1999, description: "10% off on orders above ₹1,999" },
    { code: "FREESHIP", discount: 99, type: "fixed", minOrder: 999, description: "Free shipping on orders above ₹999" },
    { code: "FIRST15", discount: 15, type: "percentage", minOrder: 0, description: "15% off on your first order" },
  ],
  restaurant: [
    { code: "WELCOME20", discount: 20, type: "percentage", minOrder: 0, description: "20% off on your first order" },
    { code: "LUNCH50", discount: 50, type: "fixed", minOrder: 499, description: "₹50 off on lunch orders above ₹499" },
  ],
  "gym-crm": [
    { code: "ANNUAL20", discount: 20, type: "percentage", minOrder: 0, description: "20% off on annual plans" },
  ],
  saas: [
    { code: "STARTUP50", discount: 50, type: "percentage", minOrder: 0, description: "50% off for startups (first year)" },
  ],
  "healthcare-clinic": [
    { code: "HEALTH10", discount: 10, type: "percentage", minOrder: 0, description: "10% off on health packages" },
  ],
  "agency-crm": [
    { code: "AGENCY30", discount: 30, type: "percentage", minOrder: 0, description: "30% off on first 3 months" },
    { code: "FREEAUDIT", discount: 0, type: "fixed", minOrder: 0, description: "Free brand audit with any plan" },
  ],
  "education-platform": [
    { code: "STUDENT25", discount: 25, type: "percentage", minOrder: 0, description: "25% off for students" },
    { code: "BUNDLE50", discount: 50, type: "fixed", minOrder: 4999, description: "₹500 off on course bundles" },
  ],
  "real-estate-crm": [
    { code: "HOME10", discount: 10, type: "percentage", minOrder: 0, description: "10% off on listing packages" },
  ],
  "hotel-booking": [
    { code: "EARLY20", discount: 20, type: "percentage", minOrder: 0, description: "20% off on early bird bookings" },
    { code: "STAY3", discount: 0, type: "fixed", minOrder: 0, description: "Stay 3 nights, pay for 2" },
  ],
  "beauty-salon": [
    { code: "GLAM20", discount: 20, type: "percentage", minOrder: 0, description: "20% off on first visit" },
    { code: "MEMBER15", discount: 15, type: "percentage", minOrder: 0, description: "15% off for members" },
  ],
  "dental-clinic": [
    { code: "SMILE15", discount: 15, type: "percentage", minOrder: 0, description: "15% off on cosmetic procedures" },
    { code: "FAMILY10", discount: 10, type: "percentage", minOrder: 0, description: "10% off for family of 3+" },
  ],
  "law-firm": [
    { code: "FREECONSULT", discount: 100, type: "percentage", minOrder: 0, description: "Free first consultation" },
    { code: "CORP20", discount: 20, type: "percentage", minOrder: 0, description: "20% off corporate packages" },
  ],
  "coaching-center": [
    { code: "EARLY25", discount: 25, type: "percentage", minOrder: 0, description: "25% off early bird registration" },
    { code: "SIBLING10", discount: 10, type: "percentage", minOrder: 0, description: "10% off for siblings" },
  ],
  "travel-agency": [
    { code: "EARLYBIRD", discount: 15, type: "percentage", minOrder: 0, description: "15% off on bookings 60+ days in advance" },
    { code: "GROUP20", discount: 20, type: "percentage", minOrder: 0, description: "20% off for groups of 6+" },
  ],
  "spa-wellness": [
    { code: "RELAX20", discount: 20, type: "percentage", minOrder: 0, description: "20% off first visit" },
    { code: "WEEKDAY30", discount: 30, type: "percentage", minOrder: 0, description: "30% off on weekday visits" },
  ],
  "accounting-firm": [
    { code: "FIRSTFREE", discount: 100, type: "percentage", minOrder: 0, description: "Free first consultation" },
    { code: "ANNUAL10", discount: 10, type: "percentage", minOrder: 0, description: "10% off annual packages" },
  ],
  "consulting-business": [
    { code: "PILOT30", discount: 30, type: "percentage", minOrder: 0, description: "30% off pilot projects" },
    { code: "REFER20", discount: 20, type: "percentage", minOrder: 0, description: "20% off via referral" },
  ],
  "recruitment-agency": [
    { code: "BULK50", discount: 50, type: "fixed", minOrder: 0, description: "₹50 off per hire for 20+ hires" },
    { code: "RETAINER15", discount: 15, type: "percentage", minOrder: 0, description: "15% off RPO retainer" },
  ],
  "event-management": [
    { code: "BOOKNOW", discount: 10, type: "percentage", minOrder: 0, description: "10% off for booking 3+ months in advance" },
    { code: "WEEKDAY20", discount: 20, type: "percentage", minOrder: 0, description: "20% off for weekday events" },
  ],
  "cleaning-service": [
    { code: "FIRST50", discount: 50, type: "percentage", minOrder: 0, description: "50% off first cleaning" },
    { code: "SUBSCRIBE15", discount: 15, type: "percentage", minOrder: 0, description: "15% off monthly subscription" },
  ],
  "repair-service": [
    { code: "FIRST99", discount: 0, type: "fixed", minOrder: 0, description: "First repair at ₹99" },
    { code: "AMC20", discount: 20, type: "percentage", minOrder: 0, description: "20% off annual AMC" },
  ],
  "photography": [
    { code: "FLASH20", discount: 20, type: "percentage", minOrder: 0, description: "20% off pre-wedding shoot" },
    { code: "WEDDING10", discount: 10, type: "percentage", minOrder: 0, description: "10% off wedding package" },
  ],
  "fitness-studio": [
    { code: "FITFREE", discount: 100, type: "percentage", minOrder: 0, description: "Free trial week" },
    { code: "ANNUAL25", discount: 25, type: "percentage", minOrder: 0, description: "25% off annual membership" },
  ],
  "manufacturing-erp": [
    { code: "DEMO30", discount: 30, type: "percentage", minOrder: 0, description: "30% off first 3 months" },
    { code: "BUNDLE20", discount: 20, type: "percentage", minOrder: 0, description: "20% off module bundles" },
  ],
  "wholesale-distribution": [
    { code: "PILOT25", discount: 25, type: "percentage", minOrder: 0, description: "25% off pilot program" },
    { code: "ANNUAL15", discount: 15, type: "percentage", minOrder: 0, description: "15% off annual subscription" },
  ],
  "pharma-distribution": [
    { code: "COMPLIANCE", discount: 20, type: "percentage", minOrder: 0, description: "20% off compliance modules" },
    { code: "BUNDLE30", discount: 30, type: "percentage", minOrder: 0, description: "30% off full suite" },
  ],
  "auto-dealership": [
    { code: "DMS20", discount: 20, type: "percentage", minOrder: 0, description: "20% off first year" },
    { code: "MULTI15", discount: 15, type: "percentage", minOrder: 0, description: "15% off multi-showroom" },
  ],
  "construction": [
    { code: "BUILD10", discount: 10, type: "percentage", minOrder: 0, description: "10% off construction cost" },
    { code: "INTERIOR15", discount: 15, type: "percentage", minOrder: 0, description: "15% off interior package" },
  ],
  "logistics": [
    { code: "SHIP20", discount: 20, type: "percentage", minOrder: 0, description: "20% off first shipment" },
    { code: "CONTRACT10", discount: 10, type: "percentage", minOrder: 0, description: "10% off annual contract" },
  ],
  "courier": [
    { code: "FIRST50", discount: 50, type: "percentage", minOrder: 0, description: "50% off first 10 shipments" },
    { code: "BULK25", discount: 25, type: "percentage", minOrder: 0, description: "25% off bulk orders" },
  ],
  "interior-design": [
    { code: "DESIGN20", discount: 20, type: "percentage", minOrder: 0, description: "20% off design consultation" },
    { code: "FULLHOME10", discount: 10, type: "percentage", minOrder: 0, description: "10% off full home interior" },
  ],
  "architecture-firm": [
    { code: "BLUEPRINT15", discount: 15, type: "percentage", minOrder: 0, description: "15% off design fees" },
    { code: "BUNDLE25", discount: 25, type: "percentage", minOrder: 0, description: "25% off architecture + interior bundle" },
  ],
  "insurance-crm": [
    { code: "FREE30", discount: 100, type: "percentage", minOrder: 0, description: "Free 30-day trial" },
    { code: "ANNUAL20", discount: 20, type: "percentage", minOrder: 0, description: "20% off annual plan" },
  ],
  "fintech": [
    { code: "LOWRATE", discount: 30, type: "percentage", minOrder: 0, description: "30% off transaction fees for 3 months" },
    { code: "ENTERPRISE15", discount: 15, type: "percentage", minOrder: 0, description: "15% off enterprise plans" },
  ],
  "lending": [
    { code: "LAUNCH25", discount: 25, type: "percentage", minOrder: 0, description: "25% off setup fees" },
    { code: "BUNDLE20", discount: 20, type: "percentage", minOrder: 0, description: "20% off module bundles" },
  ],
  "hrms": [
    { code: "FREE75", discount: 100, type: "percentage", minOrder: 0, description: "Free for up to 75 employees" },
    { code: "ANNUAL20", discount: 20, type: "percentage", minOrder: 0, description: "20% off annual billing" },
  ],
  "erp": [
    { code: "PILOT30", discount: 30, type: "percentage", minOrder: 0, description: "30% off pilot program" },
    { code: "BUNDLE15", discount: 15, type: "percentage", minOrder: 0, description: "15% off module bundles" },
  ],
  "franchise": [
    { code: "LAUNCH20", discount: 20, type: "percentage", minOrder: 0, description: "20% off first year" },
    { code: "MULTI10", discount: 10, type: "percentage", minOrder: 0, description: "10% off multi-brand" },
  ],
  "membership-org": [
    { code: "ANNUAL15", discount: 15, type: "percentage", minOrder: 0, description: "15% off annual plan" },
    { code: "BULK25", discount: 25, type: "percentage", minOrder: 0, description: "25% off for 500+ members" },
  ],
  "nonprofit": [
    { code: "NGO50", discount: 50, type: "percentage", minOrder: 0, description: "50% off for verified NGOs" },
    { code: "FREEFOR100", discount: 100, type: "percentage", minOrder: 0, description: "Free for nonprofits with <100 donors" },
  ],
  "marketplace": [
    { code: "LAUNCH30", discount: 30, type: "percentage", minOrder: 0, description: "30% off commission for 3 months" },
    { code: "BULK15", discount: 15, type: "percentage", minOrder: 0, description: "15% off for 1000+ sellers" },
  ],
};

/**
 * Generate a complete Business Genesis from a prompt and blueprint.
 */
export function generateBusinessGenesis(
  prompt: string,
  blueprint?: DomainBlueprint | null
): BusinessGenesis {
  const bp = blueprint || detectBlueprint(prompt);
  const domain = bp?.id || "ecommerce";
  const brandName = extractBrandName(prompt);
  const ctx = extractProjectContext(prompt);
  const industry = ctx.industry || "business";

  // Map registry domain IDs to genesis data keys
  const DOMAIN_KEY_MAP: Record<string, string> = {
    "supplement-store": "ecommerce",
    "ecommerce-store": "ecommerce",
    "saas-platform": "saas",
  };
  const genesisKey = DOMAIN_KEY_MAP[domain] || domain;

  // Get domain-specific data, fall back to ecommerce
  const products = DOMAIN_PRODUCTS[genesisKey] || DOMAIN_PRODUCTS.ecommerce;
  const testimonials = DOMAIN_TESTIMONIALS[genesisKey] || DOMAIN_TESTIMONIALS.ecommerce;
  const stats = DOMAIN_STATS[genesisKey] || DOMAIN_STATS.ecommerce;
  const offers = DOMAIN_OFFERS[genesisKey] || DOMAIN_OFFERS.ecommerce;

  return {
    brand: {
      name: brandName,
      tagline: generateTagline(brandName, domain),
      description: generateDescription(brandName, domain),
      values: generateValues(domain),
      foundingStory: generateFoundingStory(brandName, domain),
    },
    audience: {
      primary: generateAudiencePrimary(domain),
      personas: generatePersonas(domain),
      industries: [industry],
    },
    products,
    offers,
    testimonials,
    pricing: generatePricing(domain),
    locations: generateLocations(prompt),
    stats,
    kpis: generateKPIs(domain),
    currency: "₹",
    industry,
  };
}

function generateTagline(name: string, domain: string): string {
  const taglines: Record<string, string> = {
    ecommerce: "Premium Supplements, Trusted by Athletes",
    restaurant: "Authentic Japanese Cuisine, Crafted with Passion",
    "gym-crm": "Smart Gym Management, Happy Members",
    saas: "Build Faster, Ship Sooner",
    "healthcare-clinic": "Caring for Your Health, Every Day",
  };
  return taglines[domain] || `Quality You Can Trust, From ${name}`;
}

function generateDescription(name: string, domain: string): string {
  const descriptions: Record<string, string> = {
    ecommerce: `${name} brings you lab-tested, FSSAI certified sports nutrition. Trusted by 50,000+ Indian athletes for premium quality supplements.`,
    restaurant: `${name} serves authentic Japanese cuisine with the freshest ingredients. Our award-winning chef brings flavors from Tokyo to your table.`,
    "gym-crm": `${name} is the all-in-one gym management platform. Track members, automate billing, and grow your fitness business.`,
    saas: `${name} helps teams collaborate better. Project management, analytics, and automation in one clean interface.`,
    "healthcare-clinic": `${name} provides comprehensive healthcare services with experienced doctors and modern facilities.`,
  };
  return descriptions[domain] || `${name} delivers exceptional quality and service you can trust.`;
}

function generateValues(domain: string): string[] {
  const values: Record<string, string[]> = {
    ecommerce: ["Quality First", "Transparency", "Customer Trust", "Innovation"],
    restaurant: ["Fresh Ingredients", "Authentic Flavors", "Warm Hospitality", "Clean Kitchen"],
    "gym-crm": ["Member Success", "Reliable Platform", "Continuous Improvement", "Data-Driven"],
    saas: ["Simplicity", "Performance", "Security", "Customer Focus"],
    "healthcare-clinic": ["Patient Care", "Medical Excellence", "Ethics", "Accessibility"],
  };
  return values[domain] || ["Quality", "Integrity", "Innovation", "Customer First"];
}

function generateFoundingStory(name: string, domain: string): string {
  const stories: Record<string, string> = {
    ecommerce: `${name} was born from a simple belief: every athlete in India deserves access to world-class supplements. Our founders, former national-level athletes, saw too many people struggling with imported, overpriced products. So they created a brand that's 100% Indian, FSSAI certified, and affordably priced.`,
    restaurant: `${name} started with a chef's dream — to bring the authentic flavors of Japan to India. After training in Tokyo's finest restaurants, our chef returned with recipes passed down through generations, adapted for the Indian palate.`,
    "gym-crm": `${name} was created when our founders realized gym owners were spending more time on spreadsheets than on their members. We built the tool we wished existed — simple, powerful, and made for the Indian fitness industry.`,
    saas: `${name} was born from frustration. Our team tried every project management tool out there, and they were all either too complex or too limited. So we built the one we actually wanted to use.`,
    "healthcare-clinic": `${name} was established with a mission to make quality healthcare accessible to everyone. Our team of experienced doctors and modern facilities ensures every patient receives personalized care.`,
  };
  return stories[domain] || `${name} was founded with a clear mission: deliver exceptional quality and service that our customers can trust.`;
}

function generateAudiencePrimary(domain: string): string {
  const audiences: Record<string, string> = {
    ecommerce: "Fitness enthusiasts and athletes in India looking for premium, lab-tested supplements at affordable prices",
    restaurant: "Food lovers seeking authentic Japanese cuisine and a fine dining experience",
    "gym-crm": "Gym owners and fitness business operators who want to streamline operations and retain members",
    saas: "Teams and businesses that need clean, powerful project management and collaboration tools",
    "healthcare-clinic": "Individuals and families seeking quality healthcare services with experienced doctors",
  };
  return audiences[domain] || "Quality-conscious consumers looking for reliable products and services";
}

function generatePersonas(domain: string): BusinessGenesis["audience"]["personas"] {
  const personas: Record<string, BusinessGenesis["audience"]["personas"]> = {
    ecommerce: [
      { name: "Rahul", age: 25, need: "Build muscle and improve performance", pain: "Confused by too many supplement options, worried about fake products" },
      { name: "Priya", age: 22, need: "Stay fit and healthy", pain: "Hard to find supplements that work for Indian bodies and budgets" },
      { name: "Vikram", age: 30, need: "Recovery after intense workouts", pain: "Imported brands are too expensive, local brands lack quality" },
    ],
    restaurant: [
      { name: "Meera", age: 28, need: "Special dinner with friends", pain: "Finding authentic Japanese food that's not overpriced" },
      { name: "Arjun", age: 35, need: "Business dinner venue", pain: "Need a place that's impressive but not pretentious" },
    ],
    "gym-crm": [
      { name: "Karan", age: 32, need: "Manage 200+ members efficiently", pain: "Spending 3 hours daily on billing and attendance" },
      { name: "Deepa", age: 28, need: "Grow gym membership", pain: "Leads go cold, no system to track follow-ups" },
    ],
    saas: [
      { name: "Rohan", age: 29, need: "Manage remote team projects", pain: "Tools are either too complex or too simple" },
      { name: "Nisha", age: 31, need: "Track team productivity", pain: "No visibility into who's working on what" },
    ],
    "healthcare-clinic": [
      { name: "Sunita", age: 45, need: "Regular health checkup", pain: "Long wait times, rushed consultations" },
      { name: "Ramesh", age: 55, need: "Manage chronic condition", pain: "Need consistent follow-up and personalized care" },
    ],
  };
  return personas[domain] || personas.ecommerce;
}

function generatePricing(domain: string): BusinessGenesis["pricing"] {
  const pricing: Record<string, BusinessGenesis["pricing"]> = {
    "gym-crm": [
      { name: "Basic", price: "₹999", period: "/month", tagline: "For small gyms", features: ["Up to 100 Members", "Attendance Tracking", "Basic Billing", "Email Support"] },
      { name: "Professional", price: "₹2,499", period: "/month", tagline: "For growing gyms", features: ["Up to 500 Members", "Lead Pipeline", "Revenue Analytics", "WhatsApp Integration", "Priority Support"], popular: true },
      { name: "Enterprise", price: "₹4,999", period: "/month", tagline: "For gym chains", features: ["Unlimited Members", "Multi-Location", "Custom Branding", "API Access", "Dedicated Manager"] },
    ],
    saas: [
      { name: "Starter", price: "Free", period: "", tagline: "For individuals", features: ["3 Projects", "1GB Storage", "Basic Analytics", "Community Support"] },
      { name: "Professional", price: "$29", period: "/month", tagline: "For teams", features: ["Unlimited Projects", "10GB Storage", "Advanced Analytics", "Priority Support", "API Access"], popular: true },
      { name: "Business", price: "$79", period: "/month", tagline: "For businesses", features: ["All Pro Features", "100GB Storage", "Custom Branding", "SSO", "Dedicated Manager"] },
    ],
  };
  return pricing[domain] || [];
}

function generateLocations(prompt: string): BusinessGenesis["locations"] {
  const nameMatch = prompt.match(/india/i);
  if (nameMatch) {
    return [
      { city: "Mumbai", address: "123 Bandra West, Mumbai 400050", phone: "+91 22 2651 0000", hours: "Mon-Sat: 10AM-9PM" },
      { city: "Delhi", address: "45 Connaught Place, New Delhi 110001", phone: "+91 11 2334 0000", hours: "Mon-Sat: 10AM-9PM" },
      { city: "Bangalore", address: "78 Koramangala, Bangalore 560034", phone: "+91 80 2553 0000", hours: "Mon-Sat: 10AM-9PM" },
    ];
  }
  return [
    { city: "Mumbai", address: "123 Main Street, Mumbai 400001", phone: "+91 22 2345 6789", hours: "Mon-Sat: 9AM-6PM" },
  ];
}

function generateKPIs(domain: string): Record<string, string> {
  const kpis: Record<string, Record<string, string>> = {
    ecommerce: {
      totalRevenue: "₹12,45,000",
      totalOrders: "3,456",
      avgOrderValue: "₹3,602",
      conversionRate: "3.2%",
      repeatCustomers: "42%",
    },
    restaurant: {
      todayRevenue: "₹4,892",
      weeklyRevenue: "₹28,450",
      monthlyRevenue: "₹1,12,300",
      avgPartySize: "3.2",
      avgCheck: "₹850",
      reservationRate: "68%",
    },
    "gym-crm": {
      totalMembers: "1,247",
      monthlyRevenue: "₹8,94,500",
      attendanceToday: "89",
      activeClasses: "12",
      retentionRate: "78%",
    },
    saas: {
      mrr: "$45,000",
      activeUsers: "2,340",
      churnRate: "2.1%",
      nps: "72",
      avgSessionTime: "18min",
    },
    "healthcare-clinic": {
      patientsToday: "45",
      monthlyRevenue: "₹8,50,000",
      avgWaitTime: "12min",
      satisfactionRate: "96%",
      repeatPatients: "65%",
    },
  };
  return kpis[domain] || kpis.ecommerce;
}
