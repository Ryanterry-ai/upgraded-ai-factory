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

  // Get domain-specific data, fall back to ecommerce
  const products = DOMAIN_PRODUCTS[domain] || DOMAIN_PRODUCTS.ecommerce;
  const testimonials = DOMAIN_TESTIMONIALS[domain] || DOMAIN_TESTIMONIALS.ecommerce;
  const stats = DOMAIN_STATS[domain] || DOMAIN_STATS.ecommerce;
  const offers = DOMAIN_OFFERS[domain] || DOMAIN_OFFERS.ecommerce;

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
