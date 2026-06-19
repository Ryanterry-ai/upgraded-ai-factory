/**
 * Registry-Driven Mock Data Generator
 *
 * Uses DomainBlueprint entity definitions to auto-generate realistic data.
 * Adding a new domain = adding to DomainRegistry. No new generator functions needed.
 *
 * Every domain gets: products/services, customers, orders, workflows — all from registry.
 */

import {
  BusinessState, BusinessEntities, BusinessEvent, BusinessWorkflow,
  Customer, Product, Order, InventoryMovement,
  computeMetrics,
} from "./business-data-provider";
import { detectDomain, DomainBlueprint, Entity } from "./domain-registry";

// ═══════════════════════════════════════════════════════════
// DOMAIN PRODUCT TEMPLATES
// Maps domain IDs to realistic product/service data
// ═══════════════════════════════════════════════════════════

interface ProductTemplate {
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  category: string;
  rating: number;
  benefits: string[];
}

interface DomainProductConfig {
  currency: string;
  products: ProductTemplate[];
  customers: { name: string; city: string; email: string; phone: string }[];
  orderPrefix: string;
}

const DOMAIN_PRODUCT_CONFIGS: Record<string, DomainProductConfig> = {
  "supplement-store": {
    currency: "₹",
    products: [
      { name: "MuscleBlaze Biozyme Whey", brand: "MuscleBlaze", price: 2399, originalPrice: 3199, category: "protein", rating: 4.7, benefits: ["25g protein per serving", "Biozyme blend for absorption", "Lab-tested"] },
      { name: "Optimum Nutrition Gold Standard Whey", brand: "ON", price: 3299, originalPrice: 4199, category: "protein", rating: 4.8, benefits: ["24g protein", "5.5g BCAAs", "Global #1 whey"] },
      { name: "Avvatar Whey Protein", brand: "Avvatar", price: 1999, originalPrice: 2599, category: "protein", rating: 4.6, benefits: ["100% vegetarian", "Indian brand", "No artificial sweeteners"] },
      { name: "MuscleBlaze Creatine", brand: "MuscleBlaze", price: 899, originalPrice: 1299, category: "recovery", rating: 4.6, benefits: ["5g micronized creatine", "Lab-tested purity"] },
      { name: "Himalayan Ashwagandha KSM-66", brand: "Himalayan", price: 699, originalPrice: 999, category: "brain", rating: 4.7, benefits: ["600mg KSM-66", "Reduces cortisol", "Boosts focus"] },
      { name: "Carbamide Forte Glucosamine", brand: "Carbamide Forte", price: 599, originalPrice: 899, category: "recovery", rating: 4.4, benefits: ["Joint support", "MSM + turmeric"] },
    ],
    customers: [
      { name: "Rajesh Kumar", city: "Mumbai", email: "rajesh.k@gmail.com", phone: "+91 98765 43210" },
      { name: "Priya Sharma", city: "Bangalore", email: "priya.s@outlook.com", phone: "+91 87654 32109" },
      { name: "Vikram Singh", city: "Noida", email: "vikram.singh@yahoo.com", phone: "+91 76543 21098" },
      { name: "Ananya Reddy", city: "Hyderabad", email: "ananya.r@gmail.com", phone: "+91 65432 10987" },
      { name: "Karthik Menon", city: "Bangalore", email: "karthik.m@gmail.com", phone: "+91 54321 09876" },
    ],
    orderPrefix: "SUP",
  },
  "ecommerce-store": {
    currency: "₹",
    products: [
      { name: "boAt Airdopes 141", brand: "boAt", price: 1299, originalPrice: 4490, category: "electronics", rating: 4.2, benefits: ["42H battery", "ENx noise cancellation", "IPX4"] },
      { name: "Samsung Galaxy M34", brand: "Samsung", price: 15999, originalPrice: 18999, category: "phones", rating: 4.4, benefits: ["6000mAh battery", "50MP camera", "sAMOLED"] },
      { name: "Prestige Iris Mixer", brand: "Prestige", price: 3499, originalPrice: 4995, category: "kitchen", rating: 4.3, benefits: ["750W motor", "Stainless steel jars", "3-year warranty"] },
      { name: "Wildcraft Backpack 44L", brand: "Wildcraft", price: 2199, originalPrice: 3499, category: "fashion", rating: 4.5, benefits: ["Water resistant", "Ergonomic design", "Lifetime warranty"] },
      { name: "Milton Thermosteel Bottle", brand: "Milton", price: 699, originalPrice: 1199, category: "home", rating: 4.6, benefits: ["24hr hot/cold", "Stainless steel", "Leak-proof"] },
      { name: "Yardley London Body Spray", brand: "Yardley", price: 199, originalPrice: 299, category: "personal", rating: 4.1, benefits: ["48hr freshness", "English Lavender", "Value pack"] },
    ],
    customers: [
      { name: "Amit Patel", city: "Ahmedabad", email: "amit.p@gmail.com", phone: "+91 98765 11111" },
      { name: "Neha Gupta", city: "Delhi", email: "neha.g@gmail.com", phone: "+91 87654 22222" },
      { name: "Sanjay Kumar", city: "Chennai", email: "sanjay.k@gmail.com", phone: "+91 76543 33333" },
      { name: "Pooja Reddy", city: "Hyderabad", email: "pooja.r@gmail.com", phone: "+91 65432 44444" },
      { name: "Rahul Joshi", city: "Pune", email: "rahul.j@gmail.com", phone: "+91 54321 55555" },
    ],
    orderPrefix: "ECM",
  },
  "gym-crm": {
    currency: "₹",
    products: [
      { name: "Basic Membership", brand: "FitZone", price: 1499, originalPrice: 1499, category: "membership", rating: 4.5, benefits: ["Gym floor access", "Locker room", "Basic equipment"] },
      { name: "Standard Membership", brand: "FitZone", price: 2499, originalPrice: 2499, category: "membership", rating: 4.7, benefits: ["Gym + group classes", "Sauna access", "Nutrition guide"] },
      { name: "Premium Membership", brand: "FitZone", price: 4499, originalPrice: 4499, category: "membership", rating: 4.8, benefits: ["All access", "4 PT sessions/month", "Spa + recovery"] },
      { name: "VIP Membership", brand: "FitZone", price: 7999, originalPrice: 7999, category: "membership", rating: 4.9, benefits: ["Unlimited everything", "Dedicated trainer", "Meal plans"] },
    ],
    customers: [
      { name: "Rahul Sharma", city: "Mumbai", email: "rahul@gmail.com", phone: "+91 98765 11111" },
      { name: "Priya Patel", city: "Mumbai", email: "priya.p@gmail.com", phone: "+91 87654 22222" },
      { name: "Amit Singh", city: "Delhi", email: "amit.s@gmail.com", phone: "+91 76543 33333" },
      { name: "Neha Gupta", city: "Gurgaon", email: "neha.g@gmail.com", phone: "+91 65432 44444" },
      { name: "Vikram Rao", city: "Pune", email: "vikram.r@gmail.com", phone: "+91 54321 55555" },
    ],
    orderPrefix: "GYM",
  },
  "saas-platform": {
    currency: "₹",
    products: [
      { name: "Starter Plan", brand: "SaaSify", price: 999, originalPrice: 999, category: "subscription", rating: 4.3, benefits: ["5 users", "10GB storage", "Email support"] },
      { name: "Professional Plan", brand: "SaaSify", price: 2999, originalPrice: 2999, category: "subscription", rating: 4.6, benefits: ["25 users", "100GB storage", "Priority support", "API access"] },
      { name: "Enterprise Plan", brand: "SaaSify", price: 9999, originalPrice: 9999, category: "subscription", rating: 4.8, benefits: ["Unlimited users", "1TB storage", "Dedicated support", "Custom integrations", "SLA"] },
    ],
    customers: [
      { name: "TechStart India", city: "Bangalore", email: "hello@techstart.in", phone: "+91 98765 60601" },
      { name: "GrowFast Solutions", city: "Pune", email: "team@growfast.io", phone: "+91 87654 70702" },
      { name: "DataPulse Analytics", city: "Delhi", email: "ops@datapulse.co", phone: "+91 76543 80803" },
      { name: "FreshCart", city: "Chennai", email: "dev@freshcart.com", phone: "+91 65432 90904" },
      { name: "MediConnect", city: "Hyderabad", email: "admin@mediconnect.in", phone: "+91 54321 10105" },
    ],
    orderPrefix: "SAA",
  },
  "agency-crm": {
    currency: "₹",
    products: [
      { name: "Website Redesign", brand: "PixelCraft Agency", price: 150000, originalPrice: 150000, category: "service", rating: 4.8, benefits: ["Custom design", "Responsive", "CMS integration"] },
      { name: "SEO Package", brand: "PixelCraft Agency", price: 25000, originalPrice: 25000, category: "service", rating: 4.6, benefits: ["Technical SEO", "Content strategy", "Link building"] },
      { name: "Social Media Management", brand: "PixelCraft Agency", price: 35000, originalPrice: 35000, category: "service", rating: 4.5, benefits: ["Content creation", "Scheduling", "Analytics"] },
      { name: "PPC Campaign", brand: "PixelCraft Agency", price: 50000, originalPrice: 50000, category: "service", rating: 4.7, benefits: ["Google Ads", "Facebook Ads", "Landing pages"] },
    ],
    customers: [
      { name: "TechNova Solutions", city: "Bangalore", email: "ceo@technova.in", phone: "+91 98765 50501" },
      { name: "GreenLeaf Organics", city: "Mumbai", email: "marketing@greenleaf.in", phone: "+91 87654 60602" },
      { name: "UrbanFit Studios", city: "Delhi", email: "founder@urbanfit.in", phone: "+91 76543 70703" },
      { name: "CloudServe IT", city: "Pune", email: "ops@cloudserve.in", phone: "+91 65432 80804" },
    ],
    orderPrefix: "AGY",
  },
  "restaurant": {
    currency: "₹",
    products: [
      { name: "Butter Chicken", brand: "Spice Garden", price: 380, originalPrice: 380, category: "mains", rating: 4.8, benefits: ["Creamy tomato gravy", "Tender chicken"] },
      { name: "Paneer Tikka Masala", brand: "Spice Garden", price: 320, originalPrice: 320, category: "mains", rating: 4.7, benefits: ["Cottage cheese in rich gravy"] },
      { name: "Garlic Naan", brand: "Spice Garden", price: 60, originalPrice: 60, category: "breads", rating: 4.6, benefits: ["Tandoor-baked"] },
      { name: "Jeera Rice", brand: "Spice Garden", price: 150, originalPrice: 150, category: "rice", rating: 4.5, benefits: ["Basmati with cumin"] },
      { name: "Gulab Jamun", brand: "Spice Garden", price: 120, originalPrice: 120, category: "desserts", rating: 4.7, benefits: ["Hot, syrup-soaked"] },
      { name: "Masala Chai", brand: "Spice Garden", price: 40, originalPrice: 40, category: "beverages", rating: 4.8, benefits: ["Freshly brewed"] },
    ],
    customers: [
      { name: "Arjun Mehta", city: "Mumbai", email: "arjun.m@gmail.com", phone: "+91 98765 10101" },
      { name: "Sneha Kapoor", city: "Mumbai", email: "sneha.k@gmail.com", phone: "+91 87654 20202" },
      { name: "Rohan Joshi", city: "Delhi", email: "rohan.j@gmail.com", phone: "+91 76543 30303" },
    ],
    orderPrefix: "RST",
  },
  "healthcare-clinic": {
    currency: "₹",
    products: [
      { name: "General Consultation", brand: "MediCare Clinic", price: 500, originalPrice: 500, category: "consultation", rating: 4.6, benefits: ["15-min consultation", "General diagnosis", "Prescription"] },
      { name: "Full Body Checkup", brand: "MediCare Clinic", price: 2999, originalPrice: 4500, category: "package", rating: 4.8, benefits: ["40+ tests", "Blood work", "ECG", "Doctor consultation"] },
      { name: "Dental Cleaning", brand: "MediCare Clinic", price: 1500, originalPrice: 2000, category: "dental", rating: 4.5, benefits: ["Professional cleaning", "X-ray included", "Fluoride treatment"] },
      { name: "Physiotherapy Session", brand: "MediCare Clinic", price: 800, originalPrice: 1000, category: "therapy", rating: 4.7, benefits: ["45-min session", "Personalized plan", "Exercise guidance"] },
      { name: "Eye Examination", brand: "MediCare Clinic", price: 600, originalPrice: 800, category: "optometry", rating: 4.4, benefits: ["Vision test", "Retina check", " prescription"] },
      { name: "Vaccination - Flu", brand: "MediCare Clinic", price: 750, originalPrice: 900, category: "vaccination", rating: 4.9, benefits: ["Annual flu vaccine", "Certificate", "Follow-up"] },
    ],
    customers: [
      { name: "Dr. Anand Verma", city: "Mumbai", email: "dr.verma@medicare.in", phone: "+91 98765 12121" },
      { name: "Sunita Iyer", city: "Delhi", email: "sunita.i@gmail.com", phone: "+91 87654 23232" },
      { name: "Mohammed Ali", city: "Bangalore", email: "mohammed.a@gmail.com", phone: "+91 76543 34343" },
      { name: "Kavitha Nair", city: "Chennai", email: "kavitha.n@gmail.com", phone: "+91 65432 45454" },
      { name: "Prakash Deshmukh", city: "Pune", email: "prakash.d@gmail.com", phone: "+91 54321 56565" },
    ],
    orderPrefix: "MED",
  },
  "education-platform": {
    currency: "₹",
    products: [
      { name: "JEE Main + Advanced Course", brand: "EduPulse", price: 49999, originalPrice: 69999, category: "course", rating: 4.7, benefits: ["Live classes", "Mock tests", "Doubt sessions"] },
      { name: "NEET Preparation", brand: "EduPulse", price: 39999, originalPrice: 59999, category: "course", rating: 4.6, benefits: ["Biology focus", "Lab sessions", "Previous year papers"] },
      { name: "CBSE Class 12 Math", brand: "EduPulse", price: 14999, originalPrice: 19999, category: "course", rating: 4.8, benefits: ["Video lectures", "Practice problems", "Board exam prep"] },
      { name: "Spoken English - Advanced", brand: "EduPulse", price: 4999, originalPrice: 7999, category: "course", rating: 4.5, benefits: ["Live practice", "Grammar mastery", "Business English"] },
      { name: "Python Programming", brand: "EduPulse", price: 7999, originalPrice: 12999, category: "course", rating: 4.4, benefits: ["100+ hours", "Projects", "Placement support"] },
      { name: "Data Science Bootcamp", brand: "EduPulse", price: 24999, originalPrice: 39999, category: "bootcamp", rating: 4.7, benefits: ["6-month intensive", "Real datasets", "Portfolio projects"] },
    ],
    customers: [
      { name: "Aarav Mehta", city: "Mumbai", email: "aarav.m@gmail.com", phone: "+91 98765 78787" },
      { name: "Ishita Sharma", city: "Delhi", email: "ishita.s@gmail.com", phone: "+91 87654 89898" },
      { name: "Ravi Krishnan", city: "Bangalore", email: "ravi.k@gmail.com", phone: "+91 76543 90909" },
      { name: "Deepa Menon", city: "Kochi", email: "deepa.m@gmail.com", phone: "+91 65432 01010" },
    ],
    orderPrefix: "EDU",
  },
  "real-estate-crm": {
    currency: "₹",
    products: [
      { name: "2BHK Apartment - Andheri", brand: "Prestige Group", price: 8500000, originalPrice: 9200000, category: "apartment", rating: 4.5, benefits: ["1200 sq ft", "2 bathrooms", "Covered parking"] },
      { name: "3BHK Villa - Whitefield", brand: "Brigade Group", price: 15000000, originalPrice: 17500000, category: "villa", rating: 4.8, benefits: ["2400 sq ft", "Private garden", "Club house access"] },
      { name: "Studio Apartment - Koramangala", brand: "Sobha Ltd", price: 4500000, originalPrice: 5200000, category: "studio", rating: 4.3, benefits: ["650 sq ft", "Fully furnished", "Gym access"] },
      { name: "Commercial Office Space - BKC", brand: "Lodha Group", price: 25000000, originalPrice: 28000000, category: "commercial", rating: 4.7, benefits: ["3000 sq ft", "Grade A", "24/7 security"] },
      { name: "1BHK Flat - Vashi", brand: "Tata Housing", price: 5800000, originalPrice: 6500000, category: "apartment", rating: 4.4, benefits: ["750 sq ft", "1 bathroom", "Swimming pool"] },
      { name: "Plot - Devanahalli", brand: "Embassy Group", price: 3500000, originalPrice: 4000000, category: "plot", rating: 4.2, benefits: ["1200 sq ft", "RTC approved", "Developed layout"] },
    ],
    customers: [
      { name: "Sanjay Kulkarni", city: "Mumbai", email: "sanjay.k@gmail.com", phone: "+91 98765 11112" },
      { name: "Meera Iyer", city: "Bangalore", email: "meera.i@gmail.com", phone: "+91 87654 22223" },
      { name: "Rajiv Malhotra", city: "Delhi", email: "rajiv.m@gmail.com", phone: "+91 76543 33334" },
      { name: "Anjali Bhatt", city: "Pune", email: "anjali.b@gmail.com", phone: "+91 65432 44445" },
      { name: "Karthik Subramanian", city: "Chennai", email: "karthik.s@gmail.com", phone: "+91 54321 55556" },
    ],
    orderPrefix: "RE",
  },
  "hotel-booking": {
    currency: "₹",
    products: [
      { name: "Deluxe Room - 1 Night", brand: "Taj Hotels", price: 8999, originalPrice: 12000, category: "room", rating: 4.7, benefits: ["King bed", "City view", "Breakfast included"] },
      { name: "Suite - 1 Night", brand: "Taj Hotels", price: 18999, originalPrice: 25000, category: "suite", rating: 4.9, benefits: ["Living area", "Premium amenities", "Butler service"] },
      { name: "Standard Room - 1 Night", brand: "OYO", price: 2999, originalPrice: 3999, category: "room", rating: 4.2, benefits: ["Queen bed", "Free Wi-Fi", "AC"] },
      { name: "Family Package - 2 Nights", brand: "Club Mahindra", price: 14999, originalPrice: 22000, category: "package", rating: 4.6, benefits: ["2 rooms", "Meals included", "Kids activities"] },
      { name: "Business Room - 1 Night", brand: "Lemon Tree", price: 4999, originalPrice: 6500, category: "room", rating: 4.3, benefits: ["Work desk", "Express check-in", "Airport shuttle"] },
    ],
    customers: [
      { name: "Vikram Bhatia", city: "Delhi", email: "vikram.b@gmail.com", phone: "+91 98765 11113" },
      { name: "Lakshmi Krishnamurthy", city: "Bangalore", email: "lakshmi.k@gmail.com", phone: "+91 87654 22224" },
      { name: "Arjun Reddy", city: "Hyderabad", email: "arjun.r@gmail.com", phone: "+91 76543 33335" },
    ],
    orderPrefix: "HTL",
  },
  "beauty-salon": {
    currency: "₹",
    products: [
      { name: "Haircut + Styling", brand: "Glam Studio", price: 800, originalPrice: 1200, category: "hair", rating: 4.6, benefits: ["Wash", "Cut", "Blow dry"] },
      { name: "Full Body Massage", brand: "Glam Studio", price: 2500, originalPrice: 3500, category: "spa", rating: 4.8, benefits: ["90 minutes", "Aromatherapy", "Hot stone"] },
      { name: "Bridal Makeup Package", brand: "Glam Studio", price: 15000, originalPrice: 22000, category: "makeup", rating: 4.9, benefits: ["HD makeup", "Hair styling", "Trial session"] },
      { name: "Facial + Cleanup", brand: "Glam Studio", price: 1500, originalPrice: 2200, category: "skin", rating: 4.5, benefits: ["Deep cleansing", "Face pack", "Moisturizer"] },
      { name: "Manicure + Pedicure", brand: "Glam Studio", price: 1200, originalPrice: 1800, category: "nail", rating: 4.4, benefits: ["Nail polish", "Cuticle care", "Hand massage"] },
      { name: "Hair Color - Global", brand: "Glam Studio", price: 3500, originalPrice: 5000, category: "hair", rating: 4.7, benefits: ["Ammonia-free", "Shine treatment", "Aftercare kit"] },
    ],
    customers: [
      { name: "Nisha Kapoor", city: "Mumbai", email: "nisha.k@gmail.com", phone: "+91 98765 11114" },
      { name: "Shruti Agarwal", city: "Delhi", email: "shruti.a@gmail.com", phone: "+91 87654 22225" },
      { name: "Divya Menon", city: "Bangalore", email: "divya.m@gmail.com", phone: "+91 76543 33336" },
    ],
    orderPrefix: "BEA",
  },
  "dental-clinic": {
    currency: "₹",
    products: [
      { name: "Dental Checkup", brand: "SmileCare", price: 500, originalPrice: 800, category: "checkup", rating: 4.6, benefits: ["Examination", "X-ray", "Consultation"] },
      { name: "Teeth Cleaning", brand: "SmileCare", price: 1500, originalPrice: 2000, category: "cleaning", rating: 4.7, benefits: ["Deep cleaning", "Polishing", "Fluoride"] },
      { name: "Root Canal", brand: "SmileCare", price: 8000, originalPrice: 12000, category: "treatment", rating: 4.5, benefits: ["Single sitting", "Crown included", "Painless"] },
      { name: "Teeth Whitening", brand: "SmileCare", price: 5000, originalPrice: 8000, category: "cosmetic", rating: 4.8, benefits: ["Laser whitening", "6 shades whiter", "12-month warranty"] },
      { name: "Dental Implant", brand: "SmileCare", price: 25000, originalPrice: 35000, category: "implant", rating: 4.9, benefits: ["Titanium", "Lifetime warranty", "Natural look"] },
      { name: "Braces - Metal", brand: "SmileCare", price: 35000, originalPrice: 50000, category: "orthodontic", rating: 4.4, benefits: ["18-24 months", "Monthly adjustment", "Retainer included"] },
    ],
    customers: [
      { name: "Dr. Priya Nair", city: "Mumbai", email: "dr.nair@smilecare.in", phone: "+91 98765 11115" },
      { name: "Arun Sharma", city: "Delhi", email: "arun.s@gmail.com", phone: "+91 87654 22226" },
      { name: "Kavita Joshi", city: "Bangalore", email: "kavita.j@gmail.com", phone: "+91 76543 33337" },
    ],
    orderPrefix: "DEN",
  },
  "law-firm": {
    currency: "₹",
    products: [
      { name: "Legal Consultation - 1 Hour", brand: "LegalEase", price: 3000, originalPrice: 5000, category: "consultation", rating: 4.7, benefits: ["Case analysis", "Legal opinion", "Documentation advice"] },
      { name: "Property Agreement Drafting", brand: "LegalEase", price: 8000, originalPrice: 12000, category: "document", rating: 4.6, benefits: ["Sale deed", "Registration guidance", "Stamp duty advice"] },
      { name: "Company Registration", brand: "LegalEase", price: 15000, originalPrice: 22000, category: "corporate", rating: 4.8, benefits: ["Pvt Ltd registration", "GST", "PAN/TAN", "MOA/AOA"] },
      { name: "Divorce Case Handling", brand: "LegalEase", price: 50000, originalPrice: 75000, category: "family", rating: 4.5, benefits: ["Full representation", "Mediation", "Documentation"] },
      { name: "Criminal Defense", brand: "LegalEase", price: 75000, originalPrice: 100000, category: "criminal", rating: 4.4, benefits: ["Bail application", "Trial representation", "Appeal"] },
    ],
    customers: [
      { name: "Advocate Mehta", city: "Mumbai", email: "mehta@legalease.in", phone: "+91 98765 11116" },
      { name: "Rohit Malhotra", city: "Delhi", email: "rohit.m@gmail.com", phone: "+91 87654 22227" },
      { name: "Pooja Bhatt", city: "Bangalore", email: "pooja.b@gmail.com", phone: "+91 76543 33338" },
    ],
    orderPrefix: "LAW",
  },
  "coaching-center": {
    currency: "₹",
    products: [
      { name: "IIT-JEE 2-Year Program", brand: "BrightMinds", price: 99999, originalPrice: 149999, category: "course", rating: 4.8, benefits: ["Daily classes", "Weekly tests", "Personal mentor"] },
      { name: "NEET Crash Course - 6 Months", brand: "BrightMinds", price: 49999, originalPrice: 69999, category: "course", rating: 4.6, benefits: ["Intensive prep", "Mock tests", "Doubt clearing"] },
      { name: "Foundation Course - Class 9-10", brand: "BrightMinds", price: 29999, originalPrice: 39999, category: "course", rating: 4.7, benefits: ["Olympiad prep", "Board foundation", "NTSE coaching"] },
      { name: "UPSC Prelims + Mains", brand: "BrightMinds", price: 75000, originalPrice: 99999, category: "course", rating: 4.5, benefits: ["GS + CSAT", "Essay writing", "Interview prep"] },
    ],
    customers: [
      { name: "Rajesh Kumar", city: "Kota", email: "rajesh.k@gmail.com", phone: "+91 98765 11117" },
      { name: "Sunita Devi", city: "Jaipur", email: "sunita.d@gmail.com", phone: "+91 87654 22228" },
      { name: "Manish Tiwari", city: "Delhi", email: "manish.t@gmail.com", phone: "+91 76543 33339" },
    ],
    orderPrefix: "COA",
  },
  "travel-agency": {
    currency: "₹",
    products: [
      { name: "Goa Package - 3N/4D", brand: "WanderLust", price: 18999, originalPrice: 25000, category: "domestic", rating: 4.7, benefits: ["Flights + Hotel", "Transfers", "Sightseeing"] },
      { name: "Kerala Backwaters - 2N/3D", brand: "WanderLust", price: 14999, originalPrice: 20000, category: "domestic", rating: 4.8, benefits: ["Houseboat stay", "Ayurveda", "Spices tour"] },
      { name: "Bali Honeymoon - 5N/6D", brand: "WanderLust", price: 65000, originalPrice: 85000, category: "international", rating: 4.6, benefits: ["Flights", "Villa stay", "Couple spa", "Sunset dinner"] },
      { name: "Europe Tour - 10N/11D", brand: "WanderLust", price: 199999, originalPrice: 250000, category: "international", rating: 4.9, benefits: ["6 countries", "Flights", "Hotels", "Guided tours"] },
      { name: "Manali Trip - 3N/4D", brand: "WanderLust", price: 12999, originalPrice: 18000, category: "domestic", rating: 4.5, benefits: ["Adventure sports", "Snow activities", "Valley view hotel"] },
    ],
    customers: [
      { name: "Vikram Singh", city: "Delhi", email: "vikram.s@gmail.com", phone: "+91 98765 11118" },
      { name: "Anjali Mehta", city: "Mumbai", email: "anjali.m@gmail.com", phone: "+91 87654 22229" },
      { name: "Karthik Raj", city: "Bangalore", email: "karthik.r@gmail.com", phone: "+91 76543 33340" },
    ],
    orderPrefix: "TRV",
  },
  "spa-wellness": {
    currency: "₹",
    products: [
      { name: "Thai Massage - 60 min", brand: "ZenSpa", price: 2000, originalPrice: 3000, category: "massage", rating: 4.7, benefits: ["Traditional technique", "Full body", "Herbal oils"] },
      { name: "Ayurvedic Panchakarma", brand: "ZenSpa", price: 8000, originalPrice: 12000, category: "ayurveda", rating: 4.9, benefits: ["5-day program", "Detox", "Doctor consultation"] },
      { name: "Deep Tissue Massage", brand: "ZenSpa", price: 2500, originalPrice: 3500, category: "massage", rating: 4.6, benefits: ["90 minutes", "Muscle relief", "Hot stones"] },
      { name: "Couples Spa Package", brand: "ZenSpa", price: 5000, originalPrice: 7500, category: "package", rating: 4.8, benefits: ["Side-by-side massage", "Jacuzzi", "Champagne"] },
      { name: "Detox Juice Cleanse - 3 Day", brand: "ZenSpa", price: 3000, originalPrice: 4500, category: "wellness", rating: 4.4, benefits: ["18 juices/day", "Raw food", "Consultation"] },
    ],
    customers: [
      { name: "Neha Sharma", city: "Mumbai", email: "neha.s@gmail.com", phone: "+91 98765 11119" },
      { name: "Priya Reddy", city: "Hyderabad", email: "priya.r@gmail.com", phone: "+91 87654 22230" },
    ],
    orderPrefix: "SPA",
  },
  "accounting-firm": {
    currency: "₹",
    products: [
      { name: "ITR Filing - Individual", brand: "TaxWise", price: 2000, originalPrice: 3500, category: "tax", rating: 4.6, benefits: ["Form 16 review", "Deductions", "e-filing"] },
      { name: "GST Registration", brand: "TaxWise", price: 5000, originalPrice: 8000, category: "registration", rating: 4.7, benefits: ["Application", "Documentation", "Portal setup"] },
      { name: "Annual Compliance - Pvt Ltd", brand: "TaxWise", price: 25000, originalPrice: 40000, category: "compliance", rating: 4.8, benefits: ["Board meetings", "Annual return", "ROC filings"] },
      { name: "Audit Services", brand: "TaxWise", price: 35000, originalPrice: 50000, category: "audit", rating: 4.5, benefits: ["Statutory audit", "Tax audit", "Management letter"] },
      { name: "Business Plan Preparation", brand: "TaxWise", price: 15000, originalPrice: 25000, category: "advisory", rating: 4.4, benefits: ["Market analysis", "Financial projections", "Pitch deck"] },
    ],
    customers: [
      { name: "Rajesh Industries", city: "Mumbai", email: "accounts@rajesh.in", phone: "+91 98765 11120" },
      { name: "Sunrise Traders", city: "Delhi", email: "info@sunrise.in", phone: "+91 87654 22231" },
      { name: "GreenTech Solutions", city: "Bangalore", email: "finance@greentech.in", phone: "+91 76543 33341" },
    ],
    orderPrefix: "TAX",
  },
  "consulting-business": {
    currency: "₹",
    products: [
      { name: "Strategy Workshop - 1 Day", brand: "ConsultPro", price: 50000, originalPrice: 75000, category: "workshop", rating: 4.8, benefits: ["Facilitator-led", "SWOT analysis", "Action plan"] },
      { name: "Digital Transformation Assessment", brand: "ConsultPro", price: 150000, originalPrice: 200000, category: "assessment", rating: 4.7, benefits: ["Gap analysis", "Roadmap", "ROI projection"] },
      { name: "Leadership Coaching - 6 Sessions", brand: "ConsultPro", price: 30000, originalPrice: 45000, category: "coaching", rating: 4.6, benefits: ["1:1 coaching", "360 feedback", "Action plan"] },
      { name: "Market Entry Strategy", brand: "ConsultPro", price: 200000, originalPrice: 300000, category: "advisory", rating: 4.9, benefits: ["Market research", "Competitor analysis", "Go-to-market plan"] },
    ],
    customers: [
      { name: "TechVista Inc", city: "Bangalore", email: "ceo@techvista.in", phone: "+91 98765 11121" },
      { name: "GlobalExports Ltd", city: "Mumbai", email: "director@globalexports.in", phone: "+91 87654 22232" },
    ],
    orderPrefix: "CON",
  },
  "recruitment-agency": {
    currency: "₹",
    products: [
      { name: "Executive Search", brand: "TalentBridge", price: 150000, originalPrice: 200000, category: "search", rating: 4.8, benefits: ["Senior roles", "3 candidates", "Replacement guarantee"] },
      { name: "Bulk Hiring - 10 Positions", brand: "TalentBridge", price: 200000, originalPrice: 300000, category: "bulk", rating: 4.6, benefits: ["Volume recruitment", "Campus drives", "Screening"] },
      { name: "Contract Staffing - 3 Months", brand: "TalentBridge", price: 75000, originalPrice: 100000, category: "contract", rating: 4.5, benefits: ["Temporary staff", "Payroll managed", "Replacement"] },
      { name: "Resume Writing - Professional", brand: "TalentBridge", price: 3000, originalPrice: 5000, category: "individual", rating: 4.4, benefits: ["ATS optimized", "LinkedIn profile", "Cover letter"] },
    ],
    customers: [
      { name: "Infotech Solutions", city: "Bangalore", email: "hr@infotech.in", phone: "+91 98765 11122" },
      { name: "FinServ Capital", city: "Mumbai", email: "recruitment@finserv.in", phone: "+91 87654 22233" },
    ],
    orderPrefix: "REC",
  },
  "event-management": {
    currency: "₹",
    products: [
      { name: "Wedding Planning - Premium", brand: "EventCraft", price: 500000, originalPrice: 750000, category: "wedding", rating: 4.9, benefits: ["Full planning", "Venue decor", "Catering", "Entertainment"] },
      { name: "Corporate Event - 200 Pax", brand: "EventCraft", price: 300000, originalPrice: 400000, category: "corporate", rating: 4.7, benefits: ["Conference setup", "AV equipment", "Catering", "Photography"] },
      { name: "Birthday Party - Kids", brand: "EventCraft", price: 25000, originalPrice: 40000, category: "party", rating: 4.5, benefits: ["Theme decor", "Cake", "Games", "Return gifts"] },
      { name: "Product Launch Event", brand: "EventCraft", price: 200000, originalPrice: 300000, category: "launch", rating: 4.8, benefits: ["Media invites", "Stage design", "Press kits", "Live streaming"] },
    ],
    customers: [
      { name: "Kavita & Arjun", city: "Mumbai", email: "kavita.arjun@gmail.com", phone: "+91 98765 11123" },
      { name: "TechCorp India", city: "Delhi", email: "events@techcorp.in", phone: "+91 87654 22234" },
    ],
    orderPrefix: "EVT",
  },
  "cleaning-service": {
    currency: "₹",
    products: [
      { name: "Home Deep Cleaning - 2BHK", brand: "SparkleClean", price: 3000, originalPrice: 5000, category: "residential", rating: 4.6, benefits: ["Full kitchen", "Bathrooms", "Floor polishing"] },
      { name: "Office Cleaning - Monthly", brand: "SparkleClean", price: 15000, originalPrice: 22000, category: "commercial", rating: 4.7, benefits: ["Daily maintenance", "Restroom upkeep", "Waste management"] },
      { name: "Carpet Cleaning", brand: "SparkleClean", price: 1500, originalPrice: 2500, category: "specialty", rating: 4.5, benefits: ["Steam cleaning", "Stain removal", "Deodorizing"] },
      { name: "Post-Construction Cleanup", brand: "SparkleClean", price: 8000, originalPrice: 12000, category: "construction", rating: 4.4, benefits: ["Debris removal", "Window cleaning", "Floor restoration"] },
    ],
    customers: [
      { name: "Amit Patel", city: "Mumbai", email: "amit.p@gmail.com", phone: "+91 98765 11124" },
      { name: "Neha Singh", city: "Delhi", email: "neha.s@gmail.com", phone: "+91 87654 22235" },
    ],
    orderPrefix: "CLN",
  },
  "repair-service": {
    currency: "₹",
    products: [
      { name: "AC Repair & Service", brand: "FixIt Pro", price: 1500, originalPrice: 2500, category: "appliance", rating: 4.6, benefits: ["Gas refill", "Filter cleaning", "Performance check"] },
      { name: "Plumbing Repair", brand: "FixIt Pro", price: 800, originalPrice: 1500, category: "home", rating: 4.5, benefits: ["Leak fixing", "Pipe replacement", "Tap repair"] },
      { name: "Electrical Wiring", brand: "FixIt Pro", price: 3000, originalPrice: 5000, category: "electrical", rating: 4.7, benefits: ["Safety inspection", "New wiring", "MCB replacement"] },
      { name: "Washing Machine Repair", brand: "FixIt Pro", price: 1200, originalPrice: 2000, category: "appliance", rating: 4.4, benefits: ["Motor repair", "Drum cleaning", "Spare parts"] },
    ],
    customers: [
      { name: "Rajesh Sharma", city: "Mumbai", email: "rajesh.s@gmail.com", phone: "+91 98765 11125" },
      { name: "Kavita Joshi", city: "Delhi", email: "kavita.j@gmail.com", phone: "+91 87654 22236" },
    ],
    orderPrefix: "FIX",
  },
  "photography-studio": {
    currency: "₹",
    products: [
      { name: "Wedding Photography - Full Day", brand: "CaptureMax", price: 75000, originalPrice: 100000, category: "wedding", rating: 4.9, benefits: ["2 photographers", "500+ edited photos", "Album"] },
      { name: "Portrait Session - 1 Hour", brand: "CaptureMax", price: 5000, originalPrice: 8000, category: "portrait", rating: 4.7, benefits: ["Studio setup", "10 edited photos", "Digital delivery"] },
      { name: "Product Photography - 50 Items", brand: "CaptureMax", price: 15000, originalPrice: 25000, category: "commercial", rating: 4.6, benefits: ["White background", "Lifestyle shots", "E-commerce ready"] },
      { name: "Event Coverage - 4 Hours", brand: "CaptureMax", price: 20000, originalPrice: 30000, category: "event", rating: 4.5, benefits: ["1 photographer", "200+ photos", "Same-day edits"] },
    ],
    customers: [
      { name: "Priya & Rohan", city: "Mumbai", email: "priya.rohan@gmail.com", phone: "+91 98765 11126" },
      { name: "StyleHub Fashion", city: "Delhi", email: "creative@stylehub.in", phone: "+91 87654 22237" },
    ],
    orderPrefix: "PHO",
  },
  "fitness-studio": {
    currency: "₹",
    products: [
      { name: "Yoga Class - Monthly", brand: "ZenFit", price: 3000, originalPrice: 4500, category: "yoga", rating: 4.8, benefits: ["Daily classes", "All levels", "Mat provided"] },
      { name: "Zumba - 10 Classes", brand: "ZenFit", price: 2500, originalPrice: 3500, category: "dance", rating: 4.7, benefits: ["High energy", "Cardio + fun", "Beginner friendly"] },
      { name: "CrossFit - Monthly", brand: "ZenFit", price: 5000, originalPrice: 7000, category: "crossfit", rating: 4.6, benefits: ["WOD sessions", "Coach led", "Community"] },
      { name: "Personal Training - 12 Sessions", brand: "ZenFit", price: 12000, originalPrice: 18000, category: "pt", rating: 4.9, benefits: ["1:1 coaching", "Custom plan", "Nutrition guidance"] },
    ],
    customers: [
      { name: "Amit Verma", city: "Mumbai", email: "amit.v@gmail.com", phone: "+91 98765 11127" },
      { name: "Nisha Patel", city: "Bangalore", email: "nisha.p@gmail.com", phone: "+91 87654 22238" },
    ],
    orderPrefix: "FIT",
  },
  "manufacturing-erp": {
    currency: "₹",
    products: [
      { name: "Basic ERP License", brand: "MfgPro", price: 250000, originalPrice: 350000, category: "license", rating: 4.5, benefits: ["5 users", "Inventory", "Production tracking"] },
      { name: "Professional ERP License", brand: "MfgPro", price: 500000, originalPrice: 750000, category: "license", rating: 4.7, benefits: ["25 users", "MRP", "Quality control", "Supply chain"] },
      { name: "Enterprise ERP License", brand: "MfgPro", price: 1200000, originalPrice: 1800000, category: "license", rating: 4.9, benefits: ["Unlimited users", "Multi-plant", "AI forecasting", "IoT integration"] },
      { name: "Implementation Service", brand: "MfgPro", price: 300000, originalPrice: 450000, category: "service", rating: 4.6, benefits: ["Data migration", "Training", "Go-live support"] },
    ],
    customers: [
      { name: "SteelWorks India", city: "Ahmedabad", email: "ops@steelworks.in", phone: "+91 98765 11128" },
      { name: "TextileMasters", city: "Surat", email: "admin@textilemasters.in", phone: "+91 87654 22239" },
      { name: "Precision Parts Ltd", city: "Pune", email: "erp@precision.in", phone: "+91 76543 33342" },
    ],
    orderPrefix: "MFG",
  },
  "wholesale-distribution": {
    currency: "₹",
    products: [
      { name: "FMCG Bulk - 100 Units", brand: "DistroHub", price: 50000, originalPrice: 65000, category: "fmcg", rating: 4.5, benefits: ["Fast-moving goods", "Discount pricing", "Free delivery"] },
      { name: "Electronics Wholesale", brand: "DistroHub", price: 200000, originalPrice: 280000, category: "electronics", rating: 4.6, benefits: ["Branded products", "Warranty", "Return policy"] },
      { name: "Garment Wholesale Lot", brand: "DistroHub", price: 75000, originalPrice: 100000, category: "fashion", rating: 4.4, benefits: ["Mixed sizes", "Season collection", "Quality assured"] },
      { name: "Chemical Bulk Supply", brand: "DistroHub", price: 150000, originalPrice: 200000, category: "chemical", rating: 4.7, benefits: ["Industrial grade", "MSDS provided", "Bulk discount"] },
    ],
    customers: [
      { name: "RetailMax Stores", city: "Mumbai", email: "purchase@retailmax.in", phone: "+91 98765 11129" },
      { name: "MartPlus", city: "Delhi", email: "buying@martplus.in", phone: "+91 87654 22240" },
    ],
    orderPrefix: "WHL",
  },
  "pharma-distribution": {
    currency: "₹",
    products: [
      { name: "Generic Medicine Pack", brand: "PharmaDist", price: 25000, originalPrice: 35000, category: "generic", rating: 4.6, benefits: ["100+ medicines", "WHO certified", "Cold chain"] },
      { name: "Surgical Instruments Set", brand: "PharmaDist", price: 50000, originalPrice: 70000, category: "surgical", rating: 4.7, benefits: ["Stainless steel", "Sterilized", "10-year warranty"] },
      { name: "Vaccine Supply - 1000 Doses", brand: "PharmaDist", price: 300000, originalPrice: 400000, category: "vaccine", rating: 4.9, benefits: ["Cold chain maintained", "Covid/Flu", "Documentation"] },
      { name: "OTC Medicine Bundle", brand: "PharmaDist", price: 15000, originalPrice: 20000, category: "otc", rating: 4.4, benefits: ["Pain relief", "Digestive", "Antiseptic"] },
    ],
    customers: [
      { name: "City Hospital", city: "Mumbai", email: "pharmacy@cityhospital.in", phone: "+91 98765 11130" },
      { name: "Apollo Pharmacy", city: "Delhi", email: "bulk@apollopharmacy.in", phone: "+91 87654 22241" },
    ],
    orderPrefix: "PHR",
  },
  "automobile-dealership": {
    currency: "₹",
    products: [
      { name: "Maruti Swift LXI", brand: "Maruti Suzuki", price: 600000, originalPrice: 650000, category: "hatchback", rating: 4.5, benefits: ["Petrol", "Manual", "5-year warranty"] },
      { name: "Hyundai Creta SX", brand: "Hyundai", price: 1400000, originalPrice: 1550000, category: "suv", rating: 4.7, benefits: ["Diesel", "Automatic", "Panoramic sunroof"] },
      { name: "Honda City ZX CVT", brand: "Honda", price: 1200000, originalPrice: 1350000, category: "sedan", rating: 4.6, benefits: ["Petrol", "CVT", "Honda Sensing"] },
      { name: "Tata Nexon EV", brand: "Tata", price: 1600000, originalPrice: 1750000, category: "ev", rating: 4.8, benefits: ["312km range", "Fast charge", "5-star safety"] },
      { name: "Toyota Fortuner 4x4", brand: "Toyota", price: 3500000, originalPrice: 3800000, category: "suv", rating: 4.9, benefits: ["Diesel", "4x4", "Toyota quality"] },
    ],
    customers: [
      { name: "Rajesh Mehta", city: "Mumbai", email: "rajesh.m@gmail.com", phone: "+91 98765 11131" },
      { name: "Vikram Singh", city: "Delhi", email: "vikram.s@gmail.com", phone: "+91 87654 22242" },
    ],
    orderPrefix: "AUTO",
  },
  "construction-company": {
    currency: "₹",
    products: [
      { name: "Residential Construction - 2BHK", brand: "BuildRight", price: 3500000, originalPrice: 4200000, category: "residential", rating: 4.7, benefits: ["1200 sq ft", "6-month delivery", "10-year structural warranty"] },
      { name: "Commercial Office Build", brand: "BuildRight", price: 15000000, originalPrice: 20000000, category: "commercial", rating: 4.8, benefits: ["10,000 sq ft", "Grade A construction", "Green building certified"] },
      { name: "Renovation - Kitchen & Bath", brand: "BuildRight", price: 500000, originalPrice: 700000, category: "renovation", rating: 4.6, benefits: ["3D design", "Modular kitchen", "Premium fittings"] },
      { name: "Interior Design Package", brand: "BuildRight", price: 800000, originalPrice: 1200000, category: "interior", rating: 4.5, benefits: ["Full home", "Furniture included", "Lighting design"] },
    ],
    customers: [
      { name: "HomeBuild Corp", city: "Bangalore", email: "projects@homebuild.in", phone: "+91 98765 11132" },
      { name: "InfraTech Ltd", city: "Hyderabad", email: "construction@infraftech.in", phone: "+91 87654 22243" },
    ],
    orderPrefix: "CON",
  },
  "logistics-company": {
    currency: "₹",
    products: [
      { name: "Intra-city Delivery - 5kg", brand: "SwiftLogistics", price: 150, originalPrice: 250, category: "delivery", rating: 4.5, benefits: ["Same day", "Live tracking", "Insurance"] },
      { name: "Intercity Freight - 500kg", brand: "SwiftLogistics", price: 8000, originalPrice: 12000, category: "freight", rating: 4.6, benefits: ["2-3 days", "GPS tracking", "Temperature controlled"] },
      { name: "Warehouse Storage - Monthly", brand: "SwiftLogistics", price: 25000, originalPrice: 35000, category: "warehouse", rating: 4.7, benefits: ["500 sq ft", "Climate controlled", "24/7 security"] },
      { name: "E-commerce Fulfillment", brand: "SwiftLogistics", price: 50000, originalPrice: 75000, category: "fulfillment", rating: 4.8, benefits: ["Pick & pack", "COD management", "Returns handling"] },
    ],
    customers: [
      { name: "QuickMart Online", city: "Mumbai", email: "logistics@quickmart.in", phone: "+91 98765 11133" },
      { name: "FreshBasket", city: "Delhi", email: "shipping@freshbasket.in", phone: "+91 87654 22244" },
    ],
    orderPrefix: "LOG",
  },
  "courier-service": {
    currency: "₹",
    products: [
      { name: "Document Courier - Same City", brand: "SpeedPost", price: 100, originalPrice: 150, category: "document", rating: 4.4, benefits: ["Same day delivery", "Tracking", "Proof of delivery"] },
      { name: "Parcel - 5kg Domestic", brand: "SpeedPost", price: 350, originalPrice: 500, category: "parcel", rating: 4.5, benefits: ["2-3 days", "Full tracking", "Insurance"] },
      { name: "Express International", brand: "SpeedPost", price: 2500, originalPrice: 4000, category: "international", rating: 4.7, benefits: ["3-5 days", "Customs clearance", "Door-to-door"] },
      { name: "Bulk Courier - 100 Shipments", brand: "SpeedPost", price: 15000, originalPrice: 22000, category: "bulk", rating: 4.6, benefits: ["Volume discount", "API integration", "Priority handling"] },
    ],
    customers: [
      { name: "EcomShippers", city: "Mumbai", email: "courier@ecomshippers.in", phone: "+91 98765 11134" },
      { name: "TradeConnect", city: "Chennai", email: "logistics@tradeconnect.in", phone: "+91 87654 22245" },
    ],
    orderPrefix: "CUR",
  },
  "interior-design-studio": {
    currency: "₹",
    products: [
      { name: "Living Room Design", brand: "DesignCraft", price: 150000, originalPrice: 220000, category: "room", rating: 4.7, benefits: ["3D visualization", "Furniture selection", "Color palette"] },
      { name: "Full Home Interior - 2BHK", brand: "DesignCraft", price: 500000, originalPrice: 750000, category: "home", rating: 4.8, benefits: ["All rooms", "Modular furniture", "Lighting design"] },
      { name: "Office Interior Design", brand: "DesignCraft", price: 800000, originalPrice: 1200000, category: "office", rating: 4.6, benefits: ["Workspace planning", "Ergonomic furniture", "Brand integration"] },
      { name: "Kitchen Remodel", brand: "DesignCraft", price: 300000, originalPrice: 450000, category: "kitchen", rating: 4.9, benefits: ["Modular kitchen", "Appliance selection", "Storage optimization"] },
    ],
    customers: [
      { name: "Amit & Priya Sharma", city: "Mumbai", email: "sharma.home@gmail.com", phone: "+91 98765 11135" },
      { name: "TechVista Office", city: "Bangalore", email: "interiors@techvista.in", phone: "+91 87654 22246" },
    ],
    orderPrefix: "INT",
  },
  "architecture-firm": {
    currency: "₹",
    products: [
      { name: "Residential Architecture - 2BHK", brand: "ArchStudio", price: 200000, originalPrice: 300000, category: "residential", rating: 4.7, benefits: ["Floor plans", "Elevation", "3D walkthrough"] },
      { name: "Commercial Building Design", brand: "ArchStudio", price: 1000000, originalPrice: 1500000, category: "commercial", rating: 4.8, benefits: ["Structural design", "MEP", "Green building"] },
      { name: "Landscape Architecture", brand: "ArchStudio", price: 150000, originalPrice: 250000, category: "landscape", rating: 4.6, benefits: ["Garden design", "Hardscape", "Planting plan"] },
      { name: "Interior Architecture", brand: "ArchStudio", price: 300000, originalPrice: 450000, category: "interior", rating: 4.5, benefits: ["Space planning", "Material selection", "Detail drawings"] },
    ],
    customers: [
      { name: "Prestige Developers", city: "Bangalore", email: "design@prestige.in", phone: "+91 98765 11136" },
      { name: "Urban Living Corp", city: "Mumbai", email: "architecture@urbanliving.in", phone: "+91 87654 22247" },
    ],
    orderPrefix: "ARC",
  },
  "insurance-crm": {
    currency: "₹",
    products: [
      { name: "Term Life Insurance - 1Cr", brand: "SecureLife", price: 12000, originalPrice: 15000, category: "life", rating: 4.7, benefits: ["40-year coverage", "Tax benefits", "Critical illness rider"] },
      { name: "Health Insurance - Family Floater", brand: "SecureLife", price: 18000, originalPrice: 25000, category: "health", rating: 4.8, benefits: ["10L sum insured", "Cashless hospitals", "No claim bonus"] },
      { name: "Motor Insurance - Comprehensive", brand: "SecureLife", price: 8000, originalPrice: 12000, category: "motor", rating: 4.5, benefits: ["Zero depreciation", "Roadside assistance", "NCB protection"] },
      { name: "Travel Insurance - International", brand: "SecureLife", price: 2500, originalPrice: 4000, category: "travel", rating: 4.6, benefits: ["Trip cancellation", "Medical cover", "Baggage loss"] },
      { name: "Home Insurance", brand: "SecureLife", price: 5000, originalPrice: 8000, category: "property", rating: 4.4, benefits: ["Building + contents", "Natural calamity", "Theft cover"] },
    ],
    customers: [
      { name: "Rajesh Kumar", city: "Mumbai", email: "rajesh.k@gmail.com", phone: "+91 98765 11137" },
      { name: "Sunita Patel", city: "Delhi", email: "sunita.p@gmail.com", phone: "+91 87654 22248" },
    ],
    orderPrefix: "INS",
  },
  "fintech-platform": {
    currency: "₹",
    products: [
      { name: "Basic Trading Account", brand: "FinTrade", price: 0, originalPrice: 0, category: "account", rating: 4.5, benefits: ["Free account", "Zero brokerage delivery", "Mobile app"] },
      { name: "Pro Trading Plan", brand: "FinTrade", price: 999, originalPrice: 1499, category: "subscription", rating: 4.7, benefits: ["Intraday tips", "Research reports", "Priority support"] },
      { name: "Mutual Fund SIP - ₹5000/month", brand: "FinTrade", price: 60000, originalPrice: 60000, category: "investment", rating: 4.6, benefits: ["Equity fund", "15% historical returns", "SIP discipline"] },
      { name: "Personal Loan - ₹5L", brand: "FinTrade", price: 500000, originalPrice: 500000, category: "loan", rating: 4.4, benefits: ["10.5% interest", "2-year tenure", "Quick approval"] },
    ],
    customers: [
      { name: "Amit Sharma", city: "Mumbai", email: "amit.s@gmail.com", phone: "+91 98765 11138" },
      { name: "Priya Reddy", city: "Bangalore", email: "priya.r@gmail.com", phone: "+91 87654 22249" },
    ],
    orderPrefix: "FIN",
  },
  "lending-platform": {
    currency: "₹",
    products: [
      { name: "Business Loan - ₹10L", brand: "LendEasy", price: 1000000, originalPrice: 1000000, category: "business", rating: 4.6, benefits: ["12% interest", "3-year tenure", "Minimal documentation"] },
      { name: "Education Loan - ₹15L", brand: "LendEasy", price: 1500000, originalPrice: 1500000, category: "education", rating: 4.7, benefits: ["Moratorium period", "Tax benefits", "Flexible repayment"] },
      { name: "Home Loan - ₹50L", brand: "LendEasy", price: 5000000, originalPrice: 5000000, category: "home", rating: 4.8, benefits: ["8.5% interest", "20-year tenure", "Prepayment allowed"] },
      { name: "Gold Loan - ₹2L", brand: "LendEasy", price: 200000, originalPrice: 200000, category: "gold", rating: 4.5, benefits: ["7% interest", "1-year tenure", "Same-day disbursement"] },
    ],
    customers: [
      { name: "Rajesh Industries", city: "Mumbai", email: "finance@rajesh.in", phone: "+91 98765 11139" },
      { name: "FreshGrad Academy", city: "Delhi", email: "loans@freshgrad.in", phone: "+91 87654 22250" },
    ],
    orderPrefix: "LEN",
  },
  "hrms": {
    currency: "₹",
    products: [
      { name: "HRMS Starter - 50 Employees", brand: "PeoplePro", price: 50000, originalPrice: 75000, category: "license", rating: 4.5, benefits: ["Payroll", "Leave management", "Attendance"] },
      { name: "HRMS Professional - 200 Employees", brand: "PeoplePro", price: 150000, originalPrice: 225000, category: "license", rating: 4.7, benefits: ["Recruitment", "Performance", "Training", "Analytics"] },
      { name: "HRMS Enterprise - Unlimited", brand: "PeoplePro", price: 400000, originalPrice: 600000, category: "license", rating: 4.9, benefits: ["All modules", "Custom workflows", "API access", "Dedicated support"] },
      { name: "Implementation & Training", brand: "PeoplePro", price: 100000, originalPrice: 150000, category: "service", rating: 4.6, benefits: ["Data migration", "Staff training", "Go-live support"] },
    ],
    customers: [
      { name: "TechVista Inc", city: "Bangalore", email: "hr@techvista.in", phone: "+91 98765 11140" },
      { name: "Manufacturing Corp", city: "Pune", email: "people@manufcorp.in", phone: "+91 87654 22251" },
    ],
    orderPrefix: "HRM",
  },
  "erp-system": {
    currency: "₹",
    products: [
      { name: "Finance Module", brand: "ERPPlus", price: 200000, originalPrice: 300000, category: "module", rating: 4.6, benefits: ["GL", "AP/AR", "Fixed assets", "Reporting"] },
      { name: "Supply Chain Module", brand: "ERPPlus", price: 250000, originalPrice: 375000, category: "module", rating: 4.7, benefits: ["Procurement", "Inventory", "Logistics", "Vendor management"] },
      { name: "Manufacturing Module", brand: "ERPPlus", price: 300000, originalPrice: 450000, category: "module", rating: 4.8, benefits: ["BOM", "MRP", "Shop floor", "Quality"] },
      { name: "Full ERP Suite", brand: "ERPPlus", price: 800000, originalPrice: 1200000, category: "suite", rating: 4.9, benefits: ["All modules", "Multi-entity", "AI insights", "Cloud + on-premise"] },
    ],
    customers: [
      { name: "MegaManufacturing", city: "Ahmedabad", email: "erp@megamfg.in", phone: "+91 98765 11141" },
      { name: "RetailChain India", city: "Mumbai", email: "systems@retailchain.in", phone: "+91 87654 22252" },
    ],
    orderPrefix: "ERP",
  },
  "franchise-management": {
    currency: "₹",
    products: [
      { name: "Franchise Fee - Standard", brand: "FranchiseHub", price: 500000, originalPrice: 750000, category: "fee", rating: 4.6, benefits: ["Brand license", "Training", "Site selection"] },
      { name: "Franchise Fee - Premium", brand: "FranchiseHub", price: 1500000, originalPrice: 2000000, category: "fee", rating: 4.8, benefits: ["Exclusive territory", "Full support", "Marketing fund"] },
      { name: "Royalty Management System", brand: "FranchiseHub", price: 100000, originalPrice: 150000, category: "software", rating: 4.5, benefits: ["Auto royalty calc", "Reporting", "Compliance"] },
      { name: "Franchise Marketing Support", brand: "FranchiseHub", price: 200000, originalPrice: 300000, category: "service", rating: 4.7, benefits: ["Local marketing", "Digital campaigns", "Brand guidelines"] },
    ],
    customers: [
      { name: "QuickBite Foods", city: "Mumbai", email: "franchise@quickbite.in", phone: "+91 98765 11142" },
      { name: "FitZone Gym", city: "Delhi", email: "expansion@fitzone.in", phone: "+91 87654 22253" },
    ],
    orderPrefix: "FRC",
  },
  "membership-organization": {
    currency: "₹",
    products: [
      { name: "Individual Membership - Annual", brand: "ClubElite", price: 12000, originalPrice: 18000, category: "membership", rating: 4.6, benefits: ["Facility access", "Events", "Newsletter"] },
      { name: "Family Membership - Annual", brand: "ClubElite", price: 25000, originalPrice: 38000, category: "membership", rating: 4.8, benefits: ["4 members", "Kids activities", "Holiday camps"] },
      { name: "Corporate Membership", brand: "ClubElite", price: 100000, originalPrice: 150000, category: "membership", rating: 4.7, benefits: ["20 employees", "Meeting rooms", "Networking events"] },
      { name: "Lifetime Membership", brand: "ClubElite", price: 200000, originalPrice: 300000, category: "membership", rating: 4.9, benefits: ["Lifetime access", "Priority booking", "VIP events"] },
    ],
    customers: [
      { name: "Rajesh Kumar", city: "Mumbai", email: "rajesh.k@gmail.com", phone: "+91 98765 11143" },
      { name: "Priya Sharma", city: "Delhi", email: "priya.s@gmail.com", phone: "+91 87654 22254" },
    ],
    orderPrefix: "MEM",
  },
  "nonprofit-management": {
    currency: "₹",
    products: [
      { name: "Donor Management System", brand: "ImpactTrack", price: 50000, originalPrice: 75000, category: "software", rating: 4.6, benefits: ["Donor database", "Receipts", "Reporting"] },
      { name: "Fundraising Campaign Support", brand: "ImpactTrack", price: 100000, originalPrice: 150000, category: "service", rating: 4.7, benefits: ["Strategy", "Digital campaigns", "Donor engagement"] },
      { name: "Impact Assessment Report", brand: "ImpactTrack", price: 75000, originalPrice: 100000, category: "report", rating: 4.8, benefits: ["Impact metrics", "Beneficiary data", "Grant reporting"] },
      { name: "Volunteer Management Platform", brand: "ImpactTrack", price: 30000, originalPrice: 50000, category: "software", rating: 4.5, benefits: ["Registration", "Scheduling", "Tracking"] },
    ],
    customers: [
      { name: "Education First NGO", city: "Mumbai", email: "info@educationfirst.org", phone: "+91 98765 11144" },
      { name: "GreenEarth Foundation", city: "Delhi", email: "admin@greenearth.org", phone: "+91 87654 22255" },
    ],
    orderPrefix: "NPO",
  },
  "multi-vendor-marketplace": {
    currency: "₹",
    products: [
      { name: "Vendor Onboarding Package", brand: "MarketHub", price: 25000, originalPrice: 40000, category: "service", rating: 4.6, benefits: ["Store setup", "Catalog listing", "Training"] },
      { name: "Commission Plan - Basic", brand: "MarketHub", price: 0, originalPrice: 0, category: "plan", rating: 4.4, benefits: ["5% commission", "Standard listing", "Basic analytics"] },
      { name: "Commission Plan - Premium", brand: "MarketHub", price: 5000, originalPrice: 8000, category: "plan", rating: 4.7, benefits: ["3% commission", "Featured listing", "Priority support", "Marketing boost"] },
      { name: "Marketplace Ads - Monthly", brand: "MarketHub", price: 10000, originalPrice: 15000, category: "advertising", rating: 4.5, benefits: ["Banner ads", "Search boost", "Social promotion"] },
    ],
    customers: [
      { name: "FashionBazaar", city: "Mumbai", email: "seller@fashionbazaar.in", phone: "+91 98765 11145" },
      { name: "ElectroWorld", city: "Bangalore", email: "vendor@electroworld.in", phone: "+91 87654 22256" },
    ],
    orderPrefix: "MKT",
  },
};

// ═══════════════════════════════════════════════════════════
// AUTO-GENERATOR FROM REGISTRY
// ═══════════════════════════════════════════════════════════

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"];

function generateId(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrderDate(index: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (30 - index * 5));
  return d.toISOString().split("T")[0];
}

function computeOrderTotal(items: { price: number; qty: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function generateFromRegistry(domainId: string): BusinessState {
  // Try product config first
  const config = DOMAIN_PRODUCT_CONFIGS[domainId];
  if (config) {
    return generateFromConfig(domainId, config);
  }

  // Fallback: use registry blueprint to generate generic data
  const blueprint = detectDomain(domainId);
  if (blueprint) {
    return generateFromBlueprint(domainId, blueprint);
  }

  // Ultimate fallback: supplement store
  return generateFromConfig("supplement-store", DOMAIN_PRODUCT_CONFIGS["supplement-store"]);
}

function generateFromConfig(domainId: string, config: DomainProductConfig): BusinessState {
  const products: Product[] = config.products.map((p, i) => ({
    id: `P-${i + 1}`,
    name: p.name,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice,
    category: p.category,
    stock: Math.floor(Math.random() * 200) + 10,
    reorderPoint: 15,
    rating: p.rating,
    reviewCount: Math.floor(Math.random() * 5000) + 100,
    veg: p.category !== "protein" && !["mains", "breads"].includes(p.category),
    fssai: "10019062000",
    weight: "",
    benefits: p.benefits,
  }));

  const customers: Customer[] = config.customers.map((c, i) => ({
    id: generateId("C", i),
    name: c.name,
    email: c.email,
    phone: c.phone,
    city: c.city,
    totalSpent: 0,
    orderIds: [],
    lastOrderDate: "",
    membership: (["bronze", "silver", "gold", "platinum"] as const)[Math.floor(Math.random() * 4)],
    createdAt: generateOrderDate(Math.floor(Math.random() * 10)),
  }));

  // Generate orders with proper totals
  const orders: Order[] = [];
  const statuses: Array<"pending" | "processing" | "shipped" | "delivered" | "cancelled"> = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const paymentMethods: Array<"upi" | "cod" | "card" | "netbanking"> = ["upi", "cod", "card", "netbanking"];

  for (let i = 0; i < Math.min(config.customers.length, 6); i++) {
    const cust = customers[i % customers.length];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items: { productId: string; name: string; qty: number; price: number }[] = [];

    for (let j = 0; j < itemCount; j++) {
      const prod = pickRandom(products);
      const qty = Math.floor(Math.random() * 3) + 1;
      items.push({ productId: prod.id, name: prod.name, qty, price: prod.price });
    }

    const total = computeOrderTotal(items);
    const orderId = generateId(config.orderPrefix, i);
    const orderDate = generateOrderDate(i);

    orders.push({
      id: orderId,
      customerId: cust.id,
      items,
      total,
      status: statuses[i % statuses.length],
      paymentMethod: paymentMethods[i % paymentMethods.length],
      shippingAddress: pickRandom(CITIES),
      createdAt: orderDate,
      updatedAt: orderDate,
    });

    // Update customer totals
    cust.totalSpent += total;
    cust.orderIds.push(orderId);
    cust.lastOrderDate = orderDate;
  }

  const inventoryMovements: InventoryMovement[] = products.slice(0, 3).map((p, i) => ({
    id: `MOV-${i + 1}`,
    productId: p.id,
    quantity: Math.floor(Math.random() * 20) + 5,
    type: "sale" as const,
    orderId: orders[i % orders.length].id,
    note: `Sold ${p.name}`,
    timestamp: `${generateOrderDate(i)}T10:00:00Z`,
  }));

  const entities: BusinessEntities = { customers, products, orders, inventoryMovements };
  const metrics = computeMetrics(entities);

  const workflows: BusinessWorkflow[] = [
    { id: "wf-order", name: "Order Fulfillment", trigger: "ORDER_PLACED", steps: ["Received", "Payment verified", "Packing", "Shipped", "Delivered"], currentStep: 0, status: "idle" },
    { id: "wf-inventory", name: "Inventory Reorder", trigger: "INVENTORY_LOW", steps: ["Low stock detected", "PO created", "Supplier confirmed", "Received", "Stock updated"], currentStep: 0, status: "idle" },
  ];

  const events: BusinessEvent[] = orders.map(o => ({
    id: `EVT-${o.id}`,
    type: "ORDER_PLACED" as const,
    entityId: o.id,
    entity_type: "order",
    data: { orderId: o.id, customerId: o.customerId, total: o.total },
    timestamp: o.createdAt,
  }));

  return { entities, workflows, metrics, events };
}

function generateFromBlueprint(domainId: string, blueprint: DomainBlueprint): BusinessState {
  const products: Product[] = [];
  const customers: Customer[] = [];
  const orders: Order[] = [];

  // Generate products from blueprint entity definitions
  const productEntity = blueprint.entities.find(e => e.name.toLowerCase().includes("product") || e.name.toLowerCase().includes("service") || e.name.toLowerCase().includes("plan"));
  if (productEntity) {
    for (let i = 0; i < 6; i++) {
      const price = Math.floor(Math.random() * 50000) + 500;
      products.push({
        id: `P-${i + 1}`,
        name: `${blueprint.name} ${productEntity.name} ${i + 1}`,
        brand: blueprint.name,
        price,
        originalPrice: Math.round(price * 1.3),
        category: productEntity.name.toLowerCase(),
        stock: Math.floor(Math.random() * 100) + 10,
        reorderPoint: 15,
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 3000) + 50,
        veg: true,
        fssai: "",
        weight: "",
        benefits: [`${productEntity.name} feature 1`, `${productEntity.name} feature 2`],
      });
    }
  }

  // Generate customers
  for (let i = 0; i < 5; i++) {
    const city = CITIES[i % CITIES.length];
    customers.push({
      id: generateId("C", i),
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      phone: `+91 ${9876500000 + i}`,
      city,
      totalSpent: 0,
      orderIds: [],
      lastOrderDate: "",
      membership: "bronze" as const,
      createdAt: generateOrderDate(i),
    });
  }

  // Generate orders
  if (products.length > 0) {
    for (let i = 0; i < Math.min(customers.length, 5); i++) {
      const prod = pickRandom(products);
      const qty = Math.floor(Math.random() * 3) + 1;
      const total = prod.price * qty;
      const orderId = generateId(blueprint.name.substring(0, 3).toUpperCase(), i);
      const orderDate = generateOrderDate(i);

      orders.push({
        id: orderId,
        customerId: customers[i].id,
        items: [{ productId: prod.id, name: prod.name, qty, price: prod.price }],
        total,
        status: "delivered" as const,
        paymentMethod: "card" as const,
        shippingAddress: customers[i].city,
        createdAt: orderDate,
        updatedAt: orderDate,
      });

      customers[i].totalSpent = total;
      customers[i].orderIds = [orderId];
      customers[i].lastOrderDate = orderDate;
    }
  }

  const entities: BusinessEntities = { customers, products, orders, inventoryMovements: [] };
  const metrics = computeMetrics(entities);

  const workflows: BusinessWorkflow[] = blueprint.workflows.map(wf => ({
    id: wf.id,
    name: wf.name,
    trigger: wf.trigger,
    steps: wf.steps.map(s => s.name),
    currentStep: 0,
    status: "idle" as const,
  }));

  const events: BusinessEvent[] = [];
  return { entities, workflows, metrics, events };
}
