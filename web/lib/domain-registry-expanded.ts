/**
 * EXPANDED DOMAIN DEFINITIONS
 * Tier 2 (remaining 10), Tier 3 (10), Tier 4 (9)
 * All with full entity, workflow, page, dashboard, and business rule definitions.
 */

import type { DomainBlueprint } from "./domain-registry";

// ═══════════════════════════════════════════════════════════
// TIER 2 — REMAINING (10 domains)
// ═══════════════════════════════════════════════════════════

export const TIER2_EXPANDED: DomainBlueprint[] = [
  {
    id: "spa-wellness", name: "Spa & Wellness", tier: 2, category: "services",
    description: "Spa with therapists, bookings, packages, and wellness treatments",
    keywords: ["spa", "wellness", "massage", "therapy", "relaxation", "retreat"],
    entities: [
      { id: "therapist", name: "Therapist", plural: "Therapists", description: "Spa therapist", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "specialization", type: "string", required: true, description: "Specialty" },
        { name: "availability", type: "string", required: true, description: "Available hours" },
        { name: "rating", type: "number", required: true, description: "Average rating" },
      ]},
      { id: "treatment", name: "Treatment", plural: "Treatments", description: "Spa treatment/service", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Treatment name" },
        { name: "category", type: "enum", enumValues: ["massage", "facial", "body-wrap", "aromatherapy", "ayurvedic"], required: true, description: "Category" },
        { name: "duration", type: "number", required: true, description: "Duration in min" },
        { name: "price", type: "number", required: true, description: "Price in INR" },
        { name: "description", type: "string", required: true, description: "What's included" },
      ]},
      { id: "booking", name: "Booking", plural: "Bookings", description: "Spa booking", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "customerName", type: "string", required: true, description: "Customer" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "treatmentId", type: "ref", refEntity: "treatment", required: true, description: "Treatment" },
        { name: "therapistId", type: "ref", refEntity: "therapist", required: true, description: "Therapist" },
        { name: "date", type: "string", required: true, description: "Date" },
        { name: "time", type: "string", required: true, description: "Time" },
        { name: "status", type: "enum", enumValues: ["confirmed", "in-progress", "completed", "cancelled"], required: true, description: "Status" },
      ]},
      { id: "package", name: "Package", plural: "Packages", description: "Spa package deal", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Package name" },
        { name: "treatments", type: "string", required: true, description: "Included treatments" },
        { name: "price", type: "number", required: true, description: "Package price" },
        { name: "validDays", type: "number", required: true, description: "Validity in days" },
      ]},
    ],
    workflows: [
      { id: "wf-booking", name: "Spa Booking", description: "Book treatment → Service → Payment", trigger: "Customer inquiry",
        steps: [
          { id: "inquire", name: "Inquire", description: "Customer inquiry" },
          { id: "recommend", name: "Recommend", description: "Suggest treatments" },
          { id: "book", name: "Book", description: "Confirm booking" },
          { id: "serve", name: "Serve", description: "Provide treatment" },
          { id: "pay", name: "Pay", description: "Collect payment" },
        ], outputEntity: "booking" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "booking", description: "Spa overview" },
      { id: "treatments", name: "Treatments", route: "/treatments", type: "list", primaryEntity: "treatment", description: "Service menu" },
      { id: "bookings", name: "Bookings", route: "/bookings", type: "calendar", primaryEntity: "booking", description: "Booking calendar" },
      { id: "therapists", name: "Therapists", route: "/therapists", type: "list", primaryEntity: "therapist", description: "Therapist profiles" },
      { id: "packages", name: "Packages", route: "/packages", type: "list", primaryEntity: "package", description: "Spa packages" },
    ],
    dashboards: [
      { id: "owner", name: "Spa Dashboard", description: "Spa performance", persona: "owner",
        widgets: [
          { id: "today", name: "Today's Bookings", type: "metric", dataEntity: "booking", aggregation: "count", description: "Bookings today" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "booking", aggregation: "sum", description: "Today's revenue" },
          { id: "popular", name: "Popular Treatments", type: "chart", dataEntity: "booking", aggregation: "group-by", description: "Most booked treatments" },
        ] },
    ],
    businessRules: [
      { id: "br-reminder", name: "Booking Reminder", description: "Remind customer 2h before", entity: "booking", condition: "booking.time - now <= 2h", action: "Send reminder" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "accounting-firm", name: "Accounting Firm", tier: 2, category: "services",
    description: "Accounting firm with clients, tax filings, and invoices",
    keywords: ["accounting", "ca", "chartered", "tax", "gst", "audit", "bookkeeping"],
    entities: [
      { id: "client", name: "Client", plural: "Clients", description: "Accounting client", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Company/Person name" },
        { name: "pan", type: "string", required: true, description: "PAN number" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "email", type: "string", required: true, description: "Email" },
        { name: "type", type: "enum", enumValues: ["individual", "small-business", "corporate"], required: true, description: "Client type" },
      ]},
      { id: "filing", name: "TaxFiling", plural: "TaxFilings", description: "Tax filing record", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
        { name: "type", type: "enum", enumValues: ["gst-return", "income-tax", "tds", "audit", "roc"], required: true, description: "Filing type" },
        { name: "period", type: "string", required: true, description: "Filing period" },
        { name: "dueDate", type: "string", required: true, description: "Due date" },
        { name: "status", type: "enum", enumValues: ["pending", "in-progress", "filed", "overdue"], required: true, description: "Status" },
        { name: "fee", type: "number", required: true, description: "Service fee in INR" },
      ]},
      { id: "invoice", name: "Invoice", plural: "Invoices", description: "Client invoice", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
        { name: "amount", type: "number", required: true, description: "Amount in INR" },
        { name: "status", type: "enum", enumValues: ["draft", "sent", "paid", "overdue"], required: true, description: "Status" },
        { name: "dueDate", type: "string", required: true, description: "Due date" },
      ]},
    ],
    workflows: [
      { id: "wf-filing", name: "Tax Filing Process", description: "Document collection → Preparation → Filing", trigger: "Filing due date approaching",
        steps: [
          { id: "collect", name: "Collect Documents", description: "Gather client documents" },
          { id: "prepare", name: "Prepare Return", description: "Prepare filing" },
          { id: "review", name: "Review", description: "Partner review" },
          { id: "file", name: "File", description: "Submit to department" },
          { id: "confirm", name: "Confirm", description: "Confirm filing receipt" },
        ], outputEntity: "filing" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "filing", description: "Firm overview" },
      { id: "clients", name: "Clients", route: "/clients", type: "list", primaryEntity: "client", description: "Client list" },
      { id: "filings", name: "Tax Filings", route: "/filings", type: "list", primaryEntity: "filing", description: "Filing tracker" },
      { id: "invoices", name: "Invoices", route: "/invoices", type: "list", primaryEntity: "invoice", description: "Invoice management" },
    ],
    dashboards: [
      { id: "partner", name: "Partner Dashboard", description: "Firm performance", persona: "owner",
        widgets: [
          { id: "pending", name: "Pending Filings", type: "metric", dataEntity: "filing", aggregation: "count", description: "Filings pending" },
          { id: "overdue", name: "Overdue Filings", type: "metric", dataEntity: "filing", aggregation: "count", description: "Overdue count" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "invoice", aggregation: "sum", description: "Total revenue" },
        ] },
    ],
    businessRules: [
      { id: "br-due", name: "Filing Due Alert", description: "Alert 7 days before due", entity: "filing", condition: "filing.dueDate - today <= 7 days", action: "Send reminder to assigned CA" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "consulting-business", name: "Consulting Business", tier: 2, category: "services",
    description: "Consulting with projects, proposals, and invoices",
    keywords: ["consulting", "consultant", "advisory", "strategy", "management"],
    entities: [
      { id: "client", name: "Client", plural: "Clients", description: "Consulting client", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Company name" },
        { name: "industry", type: "string", required: true, description: "Industry" },
        { name: "contactPerson", type: "string", required: true, description: "Contact" },
        { name: "email", type: "string", required: true, description: "Email" },
      ]},
      { id: "project", name: "Project", plural: "Projects", description: "Consulting project", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
        { name: "name", type: "string", required: true, description: "Project name" },
        { name: "type", type: "enum", enumValues: ["strategy", "operations", "digital", "financial", "hr"], required: true, description: "Project type" },
        { name: "budget", type: "number", required: true, description: "Budget in INR" },
        { name: "status", type: "enum", enumValues: ["proposal", "active", "review", "completed", "invoiced"], required: true, description: "Status" },
      ]},
      { id: "proposal", name: "Proposal", plural: "Proposals", description: "Client proposal", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
        { name: "title", type: "string", required: true, description: "Proposal title" },
        { name: "amount", type: "number", required: true, description: "Proposed amount" },
        { name: "status", type: "enum", enumValues: ["draft", "sent", "accepted", "rejected"], required: true, description: "Status" },
      ]},
      { id: "invoice", name: "Invoice", plural: "Invoices", description: "Project invoice", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientId", type: "ref", refEntity: "client", required: true, description: "Client" },
        { name: "projectId", type: "ref", refEntity: "project", required: true, description: "Project" },
        { name: "amount", type: "number", required: true, description: "Amount in INR" },
        { name: "status", type: "enum", enumValues: ["draft", "sent", "paid", "overdue"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-project", name: "Consulting Engagement", description: "Proposal → Contract → Deliver → Invoice", trigger: "Client inquiry",
        steps: [
          { id: "discover", name: "Discovery", description: "Understand client needs" },
          { id: "propose", name: "Proposal", description: "Send proposal" },
          { id: "contract", name: "Contract", description: "Sign engagement" },
          { id: "deliver", name: "Deliver", description: "Execute project" },
          { id: "invoice", name: "Invoice", description: "Send invoice" },
        ], outputEntity: "project" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "project", description: "Firm overview" },
      { id: "clients", name: "Clients", route: "/clients", type: "list", primaryEntity: "client", description: "Client list" },
      { id: "projects", name: "Projects", route: "/projects", type: "kanban", primaryEntity: "project", description: "Project board" },
      { id: "proposals", name: "Proposals", route: "/proposals", type: "list", primaryEntity: "proposal", description: "Proposal tracker" },
      { id: "invoices", name: "Invoices", route: "/invoices", type: "list", primaryEntity: "invoice", description: "Invoice management" },
    ],
    dashboards: [
      { id: "partner", name: "Partner Dashboard", description: "Firm performance", persona: "owner",
        widgets: [
          { id: "active", name: "Active Projects", type: "metric", dataEntity: "project", aggregation: "count", description: "Running projects" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "invoice", aggregation: "sum", description: "Total revenue" },
          { id: "pipeline", name: "Pipeline", type: "chart", dataEntity: "proposal", aggregation: "group-by", description: "Proposal status" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "recruitment-agency", name: "Recruitment Agency", tier: 2, category: "services",
    description: "Recruitment with candidates, jobs, and placements",
    keywords: ["recruitment", "hiring", "staffing", "placement", "hr consultant"],
    entities: [
      { id: "candidate", name: "Candidate", plural: "Candidates", description: "Job candidate", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "email", type: "string", required: true, description: "Email" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "skills", type: "string", required: true, description: "Skills" },
        { name: "experience", type: "number", required: true, description: "Years of experience" },
        { name: "status", type: "enum", enumValues: ["sourced", "screened", "interviewed", "offered", "placed", "rejected"], required: true, description: "Status" },
      ]},
      { id: "job", name: "Job", plural: "Jobs", description: "Job opening", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "title", type: "string", required: true, description: "Job title" },
        { name: "company", type: "string", required: true, description: "Company" },
        { name: "salary", type: "number", required: true, description: "Salary range" },
        { name: "status", type: "enum", enumValues: ["open", "filled", "closed"], required: true, description: "Status" },
      ]},
      { id: "placement", name: "Placement", plural: "Placements", description: "Successful placement", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "candidateId", type: "ref", refEntity: "candidate", required: true, description: "Candidate" },
        { name: "jobId", type: "ref", refEntity: "job", required: true, description: "Job" },
        { name: "fee", type: "number", required: true, description: "Placement fee" },
        { name: "startDate", type: "string", required: true, description: "Start date" },
      ]},
    ],
    workflows: [
      { id: "wf-placement", name: "Placement Process", description: "Source → Screen → Interview → Place", trigger: "Client requirement",
        steps: [
          { id: "source", name: "Source", description: "Find candidates" },
          { id: "screen", name: "Screen", description: "Screen resumes" },
          { id: "interview", name: "Interview", description: "Client interviews" },
          { id: "offer", name: "Offer", description: "Extend offer" },
          { id: "place", name: "Place", description: "Candidate joins" },
        ], outputEntity: "placement" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "candidate", description: "Agency overview" },
      { id: "candidates", name: "Candidates", route: "/candidates", type: "list", primaryEntity: "candidate", description: "Candidate pool" },
      { id: "jobs", name: "Jobs", route: "/jobs", type: "list", primaryEntity: "job", description: "Open positions" },
      { id: "placements", name: "Placements", route: "/placements", type: "list", primaryEntity: "placement", description: "Placements" },
    ],
    dashboards: [
      { id: "owner", name: "Agency Dashboard", description: "Agency performance", persona: "owner",
        widgets: [
          { id: "pipeline", name: "Pipeline", type: "metric", dataEntity: "candidate", aggregation: "count", description: "Active candidates" },
          { id: "placements", name: "Placements", type: "metric", dataEntity: "placement", aggregation: "count", description: "Total placements" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "placement", aggregation: "sum", description: "Placement fees" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "event-management", name: "Event Management", tier: 2, category: "services",
    description: "Event management with events, vendors, and bookings",
    keywords: ["event", "wedding", "conference", "party", "celebration", "function"],
    entities: [
      { id: "event", name: "Event", plural: "Events", description: "Managed event", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Event name" },
        { name: "type", type: "enum", enumValues: ["wedding", "corporate", "birthday", "conference", "exhibition"], required: true, description: "Event type" },
        { name: "clientName", type: "string", required: true, description: "Client" },
        { name: "date", type: "string", required: true, description: "Event date" },
        { name: "venue", type: "string", required: true, description: "Venue" },
        { name: "guestCount", type: "number", required: true, description: "Expected guests" },
        { name: "budget", type: "number", required: true, description: "Budget in INR" },
        { name: "status", type: "enum", enumValues: ["enquiry", "planning", "confirmed", "executed", "completed"], required: true, description: "Status" },
      ]},
      { id: "vendor", name: "Vendor", plural: "Vendors", description: "Event vendor", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Vendor name" },
        { name: "category", type: "enum", enumValues: ["catering", "decoration", "photography", "music", "transport"], required: true, description: "Category" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "rating", type: "number", required: true, description: "Rating" },
      ]},
      { id: "booking", name: "VendorBooking", plural: "VendorBookings", description: "Vendor booking for event", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "eventId", type: "ref", refEntity: "event", required: true, description: "Event" },
        { name: "vendorId", type: "ref", refEntity: "vendor", required: true, description: "Vendor" },
        { name: "amount", type: "number", required: true, description: "Booking amount" },
        { name: "status", type: "enum", enumValues: ["booked", "confirmed", "completed"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-event", name: "Event Lifecycle", description: "Inquiry → Plan → Execute → Complete", trigger: "Client inquiry",
        steps: [
          { id: "inquire", name: "Inquire", description: "Client inquiry" },
          { id: "plan", name: "Plan", description: "Event planning" },
          { id: "confirm", name: "Confirm", description: "Confirm vendors" },
          { id: "execute", name: "Execute", description: "Event day" },
          { id: "complete", name: "Complete", description: "Post-event wrap-up" },
        ], outputEntity: "event" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "event", description: "Events overview" },
      { id: "events", name: "Events", route: "/events", type: "calendar", primaryEntity: "event", description: "Event calendar" },
      { id: "vendors", name: "Vendors", route: "/vendors", type: "list", primaryEntity: "vendor", description: "Vendor directory" },
      { id: "bookings", name: "Vendor Bookings", route: "/bookings", type: "list", primaryEntity: "booking", description: "Vendor bookings" },
    ],
    dashboards: [
      { id: "owner", name: "Events Dashboard", description: "Events overview", persona: "owner",
        widgets: [
          { id: "upcoming", name: "Upcoming Events", type: "metric", dataEntity: "event", aggregation: "count", description: "Events this month" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "booking", aggregation: "sum", description: "Total revenue" },
          { id: "pipeline", name: "Event Pipeline", type: "chart", dataEntity: "event", aggregation: "group-by", description: "Events by status" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "cleaning-service", name: "Cleaning Service", tier: 2, category: "services",
    description: "Cleaning service with appointments, staff, and recurring bookings",
    keywords: ["cleaning", "housekeeping", "janitorial", "clean"],
    entities: [
      { id: "appointment", name: "Appointment", plural: "Appointments", description: "Cleaning appointment", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "customerName", type: "string", required: true, description: "Customer" },
        { name: "address", type: "string", required: true, description: "Service address" },
        { name: "type", type: "enum", enumValues: ["regular", "deep-clean", "move-in", "move-out", "post-construction"], required: true, description: "Service type" },
        { name: "date", type: "string", required: true, description: "Date" },
        { name: "time", type: "string", required: true, description: "Time" },
        { name: "price", type: "number", required: true, description: "Price in INR" },
        { name: "status", type: "enum", enumValues: ["scheduled", "in-progress", "completed", "cancelled"], required: true, description: "Status" },
      ]},
      { id: "staff", name: "Staff", plural: "Staff", description: "Cleaning staff", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "availability", type: "string", required: true, description: "Available days" },
      ]},
    ],
    workflows: [
      { id: "wf-cleaning", name: "Cleaning Booking", description: "Book → Assign → Clean → Complete", trigger: "Customer booking",
        steps: [
          { id: "book", name: "Book", description: "Customer books" },
          { id: "assign", name: "Assign", description: "Assign staff" },
          { id: "clean", name: "Clean", description: "Perform cleaning" },
          { id: "verify", name: "Verify", description: "Quality check" },
        ], outputEntity: "appointment" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "appointment", description: "Service overview" },
      { id: "appointments", name: "Appointments", route: "/appointments", type: "calendar", primaryEntity: "appointment", description: "Booking calendar" },
      { id: "staff", name: "Staff", route: "/staff", type: "list", primaryEntity: "staff", description: "Staff management" },
    ],
    dashboards: [
      { id: "owner", name: "Service Dashboard", description: "Service overview", persona: "owner",
        widgets: [
          { id: "today", name: "Today's Jobs", type: "metric", dataEntity: "appointment", aggregation: "count", description: "Jobs today" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "appointment", aggregation: "sum", description: "Today's revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "repair-service", name: "Repair Service", tier: 2, category: "services",
    description: "Repair service with jobs, devices, and customer tracking",
    keywords: ["repair", "fix", "maintenance", "service center", "technician"],
    entities: [
      { id: "job", name: "RepairJob", plural: "RepairJobs", description: "Repair job", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "customerName", type: "string", required: true, description: "Customer" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "device", type: "string", required: true, description: "Device type" },
        { name: "issue", type: "string", required: true, description: "Issue description" },
        { name: "estimate", type: "number", required: true, description: "Estimate in INR" },
        { name: "status", type: "enum", enumValues: ["received", "diagnosed", "repairing", "ready", "delivered"], required: true, description: "Status" },
      ]},
      { id: "technician", name: "Technician", plural: "Technicians", description: "Repair technician", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "specialization", type: "string", required: true, description: "Specialty" },
      ]},
    ],
    workflows: [
      { id: "wf-repair", name: "Repair Process", description: "Receive → Diagnose → Repair → Deliver", trigger: "Device received",
        steps: [
          { id: "receive", name: "Receive", description: "Device received" },
          { id: "diagnose", name: "Diagnose", description: "Issue diagnosis" },
          { id: "estimate", name: "Estimate", description: "Cost estimate" },
          { id: "repair", name: "Repair", description: "Perform repair" },
          { id: "deliver", name: "Deliver", description: "Hand over to customer" },
        ], outputEntity: "job" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "job", description: "Service center overview" },
      { id: "jobs", name: "Repair Jobs", route: "/jobs", type: "list", primaryEntity: "job", description: "Active jobs" },
      { id: "technicians", name: "Technicians", route: "/technicians", type: "list", primaryEntity: "technician", description: "Technician list" },
    ],
    dashboards: [
      { id: "owner", name: "Service Dashboard", description: "Service center overview", persona: "owner",
        widgets: [
          { id: "pending", name: "Pending Jobs", type: "metric", dataEntity: "job", aggregation: "count", description: "Jobs in progress" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "job", aggregation: "sum", description: "Total revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "photography", name: "Photography Studio", tier: 2, category: "services",
    description: "Photography with sessions, bookings, and gallery",
    keywords: ["photography", "photo", "studio", "shoot", "portfolio"],
    entities: [
      { id: "session", name: "Session", plural: "Sessions", description: "Photo session", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientName", type: "string", required: true, description: "Client" },
        { name: "type", type: "enum", enumValues: ["portrait", "wedding", "product", "event", "corporate"], required: true, description: "Session type" },
        { name: "date", type: "string", required: true, description: "Date" },
        { name: "location", type: "string", required: true, description: "Location" },
        { name: "price", type: "number", required: true, description: "Price in INR" },
        { name: "status", type: "enum", enumValues: ["booked", "shot", "editing", "delivered"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-session", name: "Session Workflow", description: "Book → Shoot → Edit → Deliver", trigger: "Client inquiry",
        steps: [
          { id: "book", name: "Book", description: "Confirm session" },
          { id: "shoot", name: "Shoot", description: "Photo shoot" },
          { id: "edit", name: "Edit", description: "Post-processing" },
          { id: "deliver", name: "Deliver", description: "Deliver gallery" },
        ], outputEntity: "session" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "session", description: "Studio overview" },
      { id: "sessions", name: "Sessions", route: "/sessions", type: "calendar", primaryEntity: "session", description: "Session calendar" },
    ],
    dashboards: [
      { id: "owner", name: "Studio Dashboard", description: "Studio overview", persona: "owner",
        widgets: [
          { id: "upcoming", name: "Upcoming Sessions", type: "metric", dataEntity: "session", aggregation: "count", description: "Sessions this month" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "session", aggregation: "sum", description: "Total revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "fitness-studio", name: "Fitness Studio", tier: 2, category: "services",
    description: "Fitness studio with classes, instructors, and member bookings",
    keywords: ["fitness studio", "yoga studio", "pilates", "crossfit", "group fitness"],
    entities: [
      { id: "class", name: "FitnessClass", plural: "FitnessClasses", description: "Fitness class", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Class name" },
        { name: "instructor", type: "string", required: true, description: "Instructor" },
        { name: "type", type: "enum", enumValues: ["yoga", "pilates", "hiit", "spin", "dance", "strength"], required: true, description: "Class type" },
        { name: "capacity", type: "number", required: true, description: "Max participants" },
        { name: "duration", type: "number", required: true, description: "Duration in min" },
        { name: "schedule", type: "string", required: true, description: "Schedule" },
      ]},
      { id: "member", name: "Member", plural: "Members", description: "Studio member", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "email", type: "string", required: true, description: "Email" },
        { name: "plan", type: "enum", enumValues: ["drop-in", "monthly", "annual"], required: true, description: "Membership plan" },
      ]},
      { id: "booking", name: "ClassBooking", plural: "ClassBookings", description: "Class booking", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "memberId", type: "ref", refEntity: "member", required: true, description: "Member" },
        { name: "classId", type: "ref", refEntity: "class", required: true, description: "Class" },
        { name: "date", type: "string", required: true, description: "Date" },
        { name: "status", type: "enum", enumValues: ["booked", "attended", "no-show"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-class", name: "Class Booking", description: "Book → Attend → Track", trigger: "Member books class",
        steps: [
          { id: "book", name: "Book", description: "Reserve spot" },
          { id: "remind", name: "Remind", description: "Send reminder" },
          { id: "attend", name: "Attend", description: "Member attends" },
          { id: "track", name: "Track", description: "Log attendance" },
        ], outputEntity: "booking" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "booking", description: "Studio overview" },
      { id: "classes", name: "Classes", route: "/classes", type: "calendar", primaryEntity: "class", description: "Class schedule" },
      { id: "members", name: "Members", route: "/members", type: "list", primaryEntity: "member", description: "Member list" },
      { id: "bookings", name: "Bookings", route: "/bookings", type: "list", primaryEntity: "booking", description: "Class bookings" },
    ],
    dashboards: [
      { id: "owner", name: "Studio Dashboard", description: "Studio overview", persona: "owner",
        widgets: [
          { id: "today", name: "Today's Classes", type: "metric", dataEntity: "class", aggregation: "count", description: "Classes today" },
          { id: "members", name: "Active Members", type: "metric", dataEntity: "member", aggregation: "count", description: "Total members" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },
];

// ═══════════════════════════════════════════════════════════
// TIER 3 — EXPANDED (10 domains with entities)
// ═══════════════════════════════════════════════════════════

export const TIER3_EXPANDED: DomainBlueprint[] = [
  {
    id: "manufacturing-erp", name: "Manufacturing ERP", tier: 3, category: "industry",
    description: "Manufacturing with production, inventory, suppliers, and quality control",
    keywords: ["manufacturing", "production", "factory", "erp", "assembly"],
    entities: [
      { id: "product", name: "Product", plural: "Products", description: "Manufactured product", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Product name" },
        { name: "sku", type: "string", required: true, unique: true, description: "SKU" },
        { name: "category", type: "string", required: true, description: "Category" },
        { name: "unitCost", type: "number", required: true, description: "Unit cost" },
        { name: "stockLevel", type: "number", required: true, description: "Current stock" },
      ]},
      { id: "production-order", name: "ProductionOrder", plural: "ProductionOrders", description: "Production order", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "productId", type: "ref", refEntity: "product", required: true, description: "Product" },
        { name: "quantity", type: "number", required: true, description: "Quantity to produce" },
        { name: "startDate", type: "string", required: true, description: "Start date" },
        { name: "endDate", type: "string", required: true, description: "End date" },
        { name: "status", type: "enum", enumValues: ["planned", "in-progress", "completed", "delayed"], required: true, description: "Status" },
      ]},
      { id: "supplier", name: "Supplier", plural: "Suppliers", description: "Raw material supplier", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Supplier name" },
        { name: "material", type: "string", required: true, description: "Material supplied" },
        { name: "leadTime", type: "number", required: true, description: "Lead time in days" },
      ]},
    ],
    workflows: [
      { id: "wf-production", name: "Production Flow", description: "Plan → Source → Produce → QC → Ship", trigger: "Production order created",
        steps: [
          { id: "plan", name: "Plan", description: "Schedule production" },
          { id: "source", name: "Source", description: "Order raw materials" },
          { id: "produce", name: "Produce", description: "Manufacture" },
          { id: "qc", name: "Quality Check", description: "QC inspection" },
          { id: "ship", name: "Ship", description: "Ship to warehouse" },
        ], outputEntity: "production-order" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "production-order", description: "Factory overview" },
      { id: "production", name: "Production Orders", route: "/production", type: "list", primaryEntity: "production-order", description: "Production orders" },
      { id: "products", name: "Products", route: "/products", type: "list", primaryEntity: "product", description: "Product catalog" },
      { id: "suppliers", name: "Suppliers", route: "/suppliers", type: "list", primaryEntity: "supplier", description: "Supplier list" },
    ],
    dashboards: [
      { id: "manager", name: "Factory Dashboard", description: "Production overview", persona: "owner",
        widgets: [
          { id: "active-orders", name: "Active Orders", type: "metric", dataEntity: "production-order", aggregation: "count", description: "Orders in progress" },
          { id: "output", name: "Output", type: "metric", dataEntity: "production-order", aggregation: "sum", description: "Units produced" },
        ] },
    ],
    businessRules: [
      { id: "br-delay", name: "Delay Alert", description: "Alert on delayed orders", entity: "production-order", condition: "status == 'delayed'", action: "Notify production manager" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "wholesale-distribution", name: "Wholesale Distribution", tier: 3, category: "industry",
    description: "Wholesale with dealers, warehouses, stock, and orders",
    keywords: ["wholesale", "distribution", "dealer", "warehouse", "bulk"],
    entities: [
      { id: "dealer", name: "Dealer", plural: "Dealers", description: "Distribution dealer", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Dealer name" },
        { name: "city", type: "string", required: true, description: "City" },
        { name: "creditLimit", type: "number", required: true, description: "Credit limit" },
        { name: "outstanding", type: "number", required: true, description: "Outstanding balance" },
      ]},
      { id: "warehouse", name: "Warehouse", plural: "Warehouses", description: "Storage warehouse", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Warehouse name" },
        { name: "location", type: "string", required: true, description: "Location" },
        { name: "capacity", type: "number", required: true, description: "Capacity in units" },
      ]},
      { id: "stock", name: "StockItem", plural: "StockItems", description: "Warehouse stock", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "product", type: "string", required: true, description: "Product name" },
        { name: "warehouseId", type: "ref", refEntity: "warehouse", required: true, description: "Warehouse" },
        { name: "quantity", type: "number", required: true, description: "Quantity" },
        { name: "reorderPoint", type: "number", required: true, description: "Reorder point" },
      ]},
      { id: "order", name: "DealerOrder", plural: "DealerOrders", description: "Dealer order", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "dealerId", type: "ref", refEntity: "dealer", required: true, description: "Dealer" },
        { name: "items", type: "string", required: true, description: "Order items" },
        { name: "total", type: "number", required: true, description: "Order total" },
        { name: "status", type: "enum", enumValues: ["pending", "confirmed", "dispatched", "delivered"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-order", name: "Dealer Order", description: "Order → Pick → Dispatch → Deliver", trigger: "Dealer places order",
        steps: [
          { id: "receive", name: "Receive", description: "Order received" },
          { id: "pick", name: "Pick", description: "Pick from warehouse" },
          { id: "dispatch", name: "Dispatch", description: "Ship to dealer" },
          { id: "deliver", name: "Deliver", description: "Dealer receives" },
        ], outputEntity: "order" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "order", description: "Distribution overview" },
      { id: "dealers", name: "Dealers", route: "/dealers", type: "list", primaryEntity: "dealer", description: "Dealer network" },
      { id: "warehouses", name: "Warehouses", route: "/warehouses", type: "list", primaryEntity: "warehouse", description: "Warehouses" },
      { id: "stock", name: "Stock", route: "/stock", type: "list", primaryEntity: "stock", description: "Stock levels" },
      { id: "orders", name: "Orders", route: "/orders", type: "list", primaryEntity: "order", description: "Dealer orders" },
    ],
    dashboards: [
      { id: "owner", name: "Distribution Dashboard", description: "Operations overview", persona: "owner",
        widgets: [
          { id: "orders", name: "Orders", type: "metric", dataEntity: "order", aggregation: "count", description: "Pending orders" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "order", aggregation: "sum", description: "Total revenue" },
          { id: "low-stock", name: "Low Stock", type: "list", dataEntity: "stock", description: "Items below reorder" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "pharma-distribution", name: "Pharmaceutical Distribution", tier: 3, category: "industry",
    description: "Pharma distribution with medicines, batches, and expiry tracking",
    keywords: ["pharma", "pharmaceutical", "medicine", "drug", "drugstore"],
    entities: [
      { id: "medicine", name: "Medicine", plural: "Medicines", description: "Pharmaceutical product", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Medicine name" },
        { name: "manufacturer", type: "string", required: true, description: "Manufacturer" },
        { name: "batchNumber", type: "string", required: true, description: "Batch number" },
        { name: "expiryDate", type: "string", required: true, description: "Expiry date" },
        { name: "price", type: "number", required: true, description: "MRP in INR" },
        { name: "stock", type: "number", required: true, description: "Stock quantity" },
      ]},
      { id: "order", name: "PharmaOrder", plural: "PharmaOrders", description: "Pharmacy order", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "chemistName", type: "string", required: true, description: "Chemist name" },
        { name: "items", type: "string", required: true, description: "Order items" },
        { name: "total", type: "number", required: true, description: "Total" },
        { name: "status", type: "enum", enumValues: ["pending", "dispatched", "delivered"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-dispatch", name: "Medicine Dispatch", description: "Order → Pick → Verify → Ship", trigger: "Chemist order",
        steps: [
          { id: "receive", name: "Receive", description: "Order received" },
          { id: "verify", name: "Verify", description: "Check expiry dates" },
          { id: "pick", name: "Pick", description: "Pick medicines" },
          { id: "dispatch", name: "Dispatch", description: "Ship to chemist" },
        ], outputEntity: "order" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "order", description: "Distribution overview" },
      { id: "medicines", name: "Medicines", route: "/medicines", type: "list", primaryEntity: "medicine", description: "Medicine catalog" },
      { id: "orders", name: "Orders", route: "/orders", type: "list", primaryEntity: "order", description: "Orders" },
    ],
    dashboards: [
      { id: "owner", name: "Pharma Dashboard", description: "Operations overview", persona: "owner",
        widgets: [
          { id: "expiring", name: "Expiring Soon", type: "metric", dataEntity: "medicine", aggregation: "count", description: "Items expiring in 30 days" },
          { id: "orders", name: "Orders", type: "metric", dataEntity: "order", aggregation: "count", description: "Pending orders" },
        ] },
    ],
    businessRules: [
      { id: "br-expiry", name: "Expiry Alert", description: "Alert for medicines expiring in 30 days", entity: "medicine", condition: "expiryDate - today <= 30 days", action: "Flag for return/replacement" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "auto-dealership", name: "Automobile Dealership", tier: 3, category: "industry",
    description: "Auto dealership with vehicles, leads, and service tracking",
    keywords: ["automobile", "car", "vehicle", "dealership", "showroom"],
    entities: [
      { id: "vehicle", name: "Vehicle", plural: "Vehicles", description: "Vehicle in inventory", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "make", type: "string", required: true, description: "Make" },
        { name: "model", type: "string", required: true, description: "Model" },
        { name: "year", type: "number", required: true, description: "Year" },
        { name: "price", type: "number", required: true, description: "Price in INR" },
        { name: "status", type: "enum", enumValues: ["in-stock", "sold", "reserved", "in-service"], required: true, description: "Status" },
      ]},
      { id: "lead", name: "Lead", plural: "Leads", description: "Sales lead", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "interest", type: "string", required: true, description: "Interested in" },
        { name: "status", type: "enum", enumValues: ["new", "contacted", "test-drive", "negotiating", "booked", "lost"], required: true, description: "Status" },
      ]},
      { id: "service", name: "ServiceRecord", plural: "ServiceRecords", description: "Vehicle service", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "vehicleId", type: "ref", refEntity: "vehicle", required: true, description: "Vehicle" },
        { name: "type", type: "string", required: true, description: "Service type" },
        { name: "cost", type: "number", required: true, description: "Cost in INR" },
        { name: "date", type: "string", required: true, description: "Service date" },
      ]},
    ],
    workflows: [
      { id: "wf-sale", name: "Vehicle Sale", description: "Lead → Test Drive → Negotiate → Book → Deliver", trigger: "Customer inquiry",
        steps: [
          { id: "capture", name: "Capture", description: "Lead captured" },
          { id: "test-drive", name: "Test Drive", description: "Schedule test drive" },
          { id: "negotiate", name: "Negotiate", description: "Price negotiation" },
          { id: "book", name: "Book", description: "Token payment" },
          { id: "deliver", name: "Deliver", description: "Vehicle delivery" },
        ], outputEntity: "vehicle" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "vehicle", description: "Showroom overview" },
      { id: "inventory", name: "Inventory", route: "/inventory", type: "list", primaryEntity: "vehicle", description: "Vehicle inventory" },
      { id: "leads", name: "Leads", route: "/leads", type: "kanban", primaryEntity: "lead", description: "Lead pipeline" },
      { id: "service", name: "Service", route: "/service", type: "list", primaryEntity: "service", description: "Service center" },
    ],
    dashboards: [
      { id: "owner", name: "Dealership Dashboard", description: "Showroom overview", persona: "owner",
        widgets: [
          { id: "inventory", name: "In Stock", type: "metric", dataEntity: "vehicle", aggregation: "count", description: "Vehicles in stock" },
          { id: "leads", name: "Leads", type: "metric", dataEntity: "lead", aggregation: "count", description: "Active leads" },
          { id: "sales", name: "Sales", type: "metric", dataEntity: "vehicle", aggregation: "sum", description: "Total sales" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "construction", name: "Construction Company", tier: 3, category: "industry",
    description: "Construction with projects, contractors, and materials",
    keywords: ["construction", "building", "contractor", "project", "infrastructure"],
    entities: [
      { id: "project", name: "Project", plural: "Projects", description: "Construction project", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Project name" },
        { name: "client", type: "string", required: true, description: "Client" },
        { name: "location", type: "string", required: true, description: "Site location" },
        { name: "budget", type: "number", required: true, description: "Budget in INR" },
        { name: "startDate", type: "string", required: true, description: "Start date" },
        { name: "endDate", type: "string", required: true, description: "End date" },
        { name: "status", type: "enum", enumValues: ["planning", "in-progress", "on-hold", "completed"], required: true, description: "Status" },
      ]},
      { id: "contractor", name: "Contractor", plural: "Contractors", description: "Sub-contractor", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Contractor name" },
        { name: "specialization", type: "string", required: true, description: "Specialty" },
        { name: "phone", type: "string", required: true, description: "Phone" },
      ]},
    ],
    workflows: [
      { id: "wf-project", name: "Construction Project", description: "Plan → Execute → Monitor → Complete", trigger: "New project",
        steps: [
          { id: "plan", name: "Plan", description: "Project planning" },
          { id: "execute", name: "Execute", description: "Construction phase" },
          { id: "monitor", name: "Monitor", description: "Progress tracking" },
          { id: "complete", name: "Complete", description: "Handover" },
        ], outputEntity: "project" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "project", description: "Company overview" },
      { id: "projects", name: "Projects", route: "/projects", type: "list", primaryEntity: "project", description: "Active projects" },
      { id: "contractors", name: "Contractors", route: "/contractors", type: "list", primaryEntity: "contractor", description: "Contractor list" },
    ],
    dashboards: [
      { id: "owner", name: "Construction Dashboard", description: "Projects overview", persona: "owner",
        widgets: [
          { id: "active", name: "Active Projects", type: "metric", dataEntity: "project", aggregation: "count", description: "Running projects" },
          { id: "budget", name: "Total Budget", type: "metric", dataEntity: "project", aggregation: "sum", description: "Total project budget" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "logistics", name: "Logistics Company", tier: 3, category: "industry",
    description: "Logistics with shipments, tracking, and route optimization",
    keywords: ["logistics", "shipping", "freight", "transport", "cargo"],
    entities: [
      { id: "shipment", name: "Shipment", plural: "Shipments", description: "Shipment record", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "sender", type: "string", required: true, description: "Sender name" },
        { name: "receiver", type: "string", required: true, description: "Receiver name" },
        { name: "origin", type: "string", required: true, description: "Origin city" },
        { name: "destination", type: "string", required: true, description: "Destination city" },
        { name: "weight", type: "number", required: true, description: "Weight in kg" },
        { name: "status", type: "enum", enumValues: ["booked", "picked-up", "in-transit", "out-for-delivery", "delivered"], required: true, description: "Status" },
      ]},
      { id: "vehicle", name: "Vehicle", plural: "Vehicles", description: "Fleet vehicle", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "type", type: "string", required: true, description: "Vehicle type" },
        { name: "registration", type: "string", required: true, description: "Registration number" },
        { name: "status", type: "enum", enumValues: ["available", "on-trip", "maintenance"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-shipment", name: "Shipment Lifecycle", description: "Book → Pick Up → Transit → Deliver", trigger: "Shipment booked",
        steps: [
          { id: "book", name: "Book", description: "Shipment booked" },
          { id: "pickup", name: "Pick Up", description: "Collect from sender" },
          { id: "transit", name: "In Transit", description: "On the way" },
          { id: "deliver", name: "Deliver", description: "Deliver to receiver" },
        ], outputEntity: "shipment" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "shipment", description: "Operations overview" },
      { id: "shipments", name: "Shipments", route: "/shipments", type: "list", primaryEntity: "shipment", description: "Track shipments" },
      { id: "fleet", name: "Fleet", route: "/fleet", type: "list", primaryEntity: "vehicle", description: "Fleet management" },
    ],
    dashboards: [
      { id: "ops", name: "Operations Dashboard", description: "Logistics overview", persona: "owner",
        widgets: [
          { id: "active", name: "Active Shipments", type: "metric", dataEntity: "shipment", aggregation: "count", description: "In-transit shipments" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "shipment", aggregation: "sum", description: "Total revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "courier", name: "Courier Service", tier: 3, category: "industry",
    description: "Courier with parcels, routes, and delivery tracking",
    keywords: ["courier", "parcel", "delivery", "express", "same-day"],
    entities: [
      { id: "parcel", name: "Parcel", plural: "Parcels", description: "Courier parcel", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "sender", type: "string", required: true, description: "Sender" },
        { name: "receiver", type: "string", required: true, description: "Receiver" },
        { name: "address", type: "string", required: true, description: "Delivery address" },
        { name: "weight", type: "number", required: true, description: "Weight in kg" },
        { name: "charge", type: "number", required: true, description: "Charge in INR" },
        { name: "status", type: "enum", enumValues: ["picked", "hub", "out-for-delivery", "delivered", "returned"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-deliver", name: "Parcel Delivery", description: "Pick → Hub → Route → Deliver", trigger: "Parcel picked up",
        steps: [
          { id: "pick", name: "Pick Up", description: "Collect parcel" },
          { id: "hub", name: "Hub", description: "Sort at hub" },
          { id: "route", name: "Route", description: "Assign to route" },
          { id: "deliver", name: "Deliver", description: "Deliver to receiver" },
        ], outputEntity: "parcel" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "parcel", description: "Courier overview" },
      { id: "parcels", name: "Parcels", route: "/parcels", type: "list", primaryEntity: "parcel", description: "Track parcels" },
    ],
    dashboards: [
      { id: "owner", name: "Courier Dashboard", description: "Operations overview", persona: "owner",
        widgets: [
          { id: "today", name: "Today's Parcels", type: "metric", dataEntity: "parcel", aggregation: "count", description: "Parcels today" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "parcel", aggregation: "sum", description: "Today's revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "interior-design", name: "Interior Design Studio", tier: 3, category: "services",
    description: "Interior design with projects, quotations, and client management",
    keywords: ["interior", "design", "decor", "renovation", "furnishing"],
    entities: [
      { id: "project", name: "Project", plural: "Projects", description: "Design project", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientName", type: "string", required: true, description: "Client" },
        { name: "type", type: "enum", enumValues: ["residential", "commercial", "hospitality"], required: true, description: "Project type" },
        { name: "area", type: "number", required: true, description: "Area in sq ft" },
        { name: "budget", type: "number", required: true, description: "Budget in INR" },
        { name: "status", type: "enum", enumValues: ["consultation", "design", "execution", "completed"], required: true, description: "Status" },
      ]},
      { id: "quotation", name: "Quotation", plural: "Quotations", description: "Client quotation", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "projectId", type: "ref", refEntity: "project", required: true, description: "Project" },
        { name: "amount", type: "number", required: true, description: "Amount in INR" },
        { name: "items", type: "string", required: true, description: "Line items" },
        { name: "status", type: "enum", enumValues: ["draft", "sent", "approved", "rejected"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-design", name: "Design Process", description: "Consult → Design → Quote → Execute", trigger: "Client inquiry",
        steps: [
          { id: "consult", name: "Consult", description: "Understand requirements" },
          { id: "design", name: "Design", description: "Create design" },
          { id: "quote", name: "Quote", description: "Send quotation" },
          { id: "execute", name: "Execute", description: "Implementation" },
        ], outputEntity: "project" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "project", description: "Studio overview" },
      { id: "projects", name: "Projects", route: "/projects", type: "list", primaryEntity: "project", description: "Active projects" },
      { id: "quotations", name: "Quotations", route: "/quotations", type: "list", primaryEntity: "quotation", description: "Quotation tracker" },
    ],
    dashboards: [
      { id: "owner", name: "Studio Dashboard", description: "Studio overview", persona: "owner",
        widgets: [
          { id: "active", name: "Active Projects", type: "metric", dataEntity: "project", aggregation: "count", description: "Running projects" },
          { id: "revenue", name: "Revenue", type: "metric", dataEntity: "quotation", aggregation: "sum", description: "Total revenue" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "architecture-firm", name: "Architecture Firm", tier: 3, category: "services",
    description: "Architecture with drawings, projects, and client management",
    keywords: ["architecture", "architect", "blueprint", "design", "structural"],
    entities: [
      { id: "project", name: "Project", plural: "Projects", description: "Architecture project", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "clientName", type: "string", required: true, description: "Client" },
        { name: "type", type: "enum", enumValues: ["residential", "commercial", "institutional", "landscape"], required: true, description: "Project type" },
        { name: "site", type: "string", required: true, description: "Site location" },
        { name: "area", type: "number", required: true, description: "Built-up area" },
        { name: "status", type: "enum", enumValues: ["concept", "design", "drawing", "approval", "construction"], required: true, description: "Status" },
      ]},
      { id: "drawing", name: "Drawing", plural: "Drawings", description: "Project drawing/blueprint", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "projectId", type: "ref", refEntity: "project", required: true, description: "Project" },
        { name: "name", type: "string", required: true, description: "Drawing name" },
        { name: "revision", type: "number", required: true, description: "Revision number" },
        { name: "status", type: "enum", enumValues: ["draft", "review", "approved", "superseded"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-design", name: "Design Process", description: "Concept → Design → Drawing → Approval", trigger: "New project",
        steps: [
          { id: "concept", name: "Concept", description: "Initial concept" },
          { id: "design", name: "Design", description: "Detailed design" },
          { id: "draw", name: "Draw", description: "Technical drawings" },
          { id: "approve", name: "Approve", description: "Client/government approval" },
        ], outputEntity: "project" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "project", description: "Firm overview" },
      { id: "projects", name: "Projects", route: "/projects", type: "list", primaryEntity: "project", description: "Active projects" },
      { id: "drawings", name: "Drawings", route: "/drawings", type: "list", primaryEntity: "drawing", description: "Drawing tracker" },
    ],
    dashboards: [
      { id: "partner", name: "Firm Dashboard", description: "Firm overview", persona: "owner",
        widgets: [
          { id: "active", name: "Active Projects", type: "metric", dataEntity: "project", aggregation: "count", description: "Running projects" },
          { id: "pending-approval", name: "Pending Approvals", type: "metric", dataEntity: "drawing", aggregation: "count", description: "Drawings awaiting approval" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },
];

// ═══════════════════════════════════════════════════════════
// TIER 4 — EXPANDED (9 domains with entities)
// ═══════════════════════════════════════════════════════════

export const TIER4_EXPANDED: DomainBlueprint[] = [
  {
    id: "insurance-crm", name: "Insurance CRM", tier: 4, category: "finance",
    description: "Insurance with policies, claims, agents, and premium tracking",
    keywords: ["insurance", "policy", "claim", "premium", "underwriting"],
    entities: [
      { id: "policy", name: "Policy", plural: "Policies", description: "Insurance policy", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "customerName", type: "string", required: true, description: "Policyholder" },
        { name: "type", type: "enum", enumValues: ["life", "health", "motor", "property", "travel"], required: true, description: "Policy type" },
        { name: "premium", type: "number", required: true, description: "Annual premium" },
        { name: "sumInsured", type: "number", required: true, description: "Sum insured" },
        { name: "startDate", type: "string", required: true, description: "Start date" },
        { name: "endDate", type: "string", required: true, description: "End date" },
        { name: "status", type: "enum", enumValues: ["active", "expired", "lapsed", "cancelled"], required: true, description: "Status" },
      ]},
      { id: "claim", name: "Claim", plural: "Claims", description: "Insurance claim", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "policyId", type: "ref", refEntity: "policy", required: true, description: "Policy" },
        { name: "amount", type: "number", required: true, description: "Claim amount" },
        { name: "reason", type: "string", required: true, description: "Claim reason" },
        { name: "status", type: "enum", enumValues: ["filed", "under-review", "approved", "rejected", "paid"], required: true, description: "Status" },
      ]},
      { id: "agent", name: "Agent", plural: "Agents", description: "Insurance agent", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Agent name" },
        { name: "code", type: "string", required: true, description: "Agent code" },
        { name: "policiesSold", type: "number", required: true, description: "Policies sold" },
      ]},
    ],
    workflows: [
      { id: "wf-policy", name: "Policy Lifecycle", description: "Proposal → Underwrite → Issue → Renew", trigger: "Customer inquiry",
        steps: [
          { id: "propose", name: "Propose", description: "Create proposal" },
          { id: "underwrite", name: "Underwrite", description: "Risk assessment" },
          { id: "issue", name: "Issue", description: "Issue policy" },
          { id: "renew", name: "Renew", description: "Annual renewal" },
        ], outputEntity: "policy" },
      { id: "wf-claim", name: "Claims Process", description: "File → Review → Decide → Pay", trigger: "Claim filed",
        steps: [
          { id: "file", name: "File", description: "Claim filed" },
          { id: "review", name: "Review", description: "Under review" },
          { id: "decide", name: "Decide", description: "Approve/reject" },
          { id: "pay", name: "Pay", description: "Settle claim" },
        ], outputEntity: "claim" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "policy", description: "Company overview" },
      { id: "policies", name: "Policies", route: "/policies", type: "list", primaryEntity: "policy", description: "Policy management" },
      { id: "claims", name: "Claims", route: "/claims", type: "list", primaryEntity: "claim", description: "Claims tracker" },
      { id: "agents", name: "Agents", route: "/agents", type: "list", primaryEntity: "agent", description: "Agent network" },
    ],
    dashboards: [
      { id: "manager", name: "Insurance Dashboard", description: "Business overview", persona: "owner",
        widgets: [
          { id: "active-policies", name: "Active Policies", type: "metric", dataEntity: "policy", aggregation: "count", description: "Policies active" },
          { id: "premium", name: "Premium Collected", type: "metric", dataEntity: "policy", aggregation: "sum", description: "Total premium" },
          { id: "pending-claims", name: "Pending Claims", type: "metric", dataEntity: "claim", aggregation: "count", description: "Claims pending" },
        ] },
    ],
    businessRules: [
      { id: "br-renewal", name: "Renewal Reminder", description: "Remind 30 days before expiry", entity: "policy", condition: "endDate - today <= 30 days", action: "Send renewal notice" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "fintech", name: "Fintech Platform", tier: 4, category: "finance",
    description: "Fintech with accounts, transactions, KYC, and compliance",
    keywords: ["fintech", "payments", "wallet", "upi", "digital payment"],
    entities: [
      { id: "account", name: "Account", plural: "Accounts", description: "User account", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "userName", type: "string", required: true, description: "User name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "balance", type: "number", required: true, description: "Wallet balance" },
        { name: "kycStatus", type: "enum", enumValues: ["pending", "verified", "rejected"], required: true, description: "KYC status" },
      ]},
      { id: "transaction", name: "Transaction", plural: "Transactions", description: "Transaction record", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "accountId", type: "ref", refEntity: "account", required: true, description: "Account" },
        { name: "type", type: "enum", enumValues: ["credit", "debit", "transfer", "refund"], required: true, description: "Transaction type" },
        { name: "amount", type: "number", required: true, description: "Amount" },
        { name: "status", type: "enum", enumValues: ["success", "pending", "failed"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-transfer", name: "Money Transfer", description: "Initiate → Verify → Process → Complete", trigger: "User initiates transfer",
        steps: [
          { id: "initiate", name: "Initiate", description: "Start transfer" },
          { id: "verify", name: "Verify", description: "OTP/biometric" },
          { id: "process", name: "Process", description: "Process payment" },
          { id: "complete", name: "Complete", description: "Confirm transfer" },
        ], outputEntity: "transaction" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "transaction", description: "Platform overview" },
      { id: "accounts", name: "Accounts", route: "/accounts", type: "list", primaryEntity: "account", description: "User accounts" },
      { id: "transactions", name: "Transactions", route: "/transactions", type: "list", primaryEntity: "transaction", description: "Transaction history" },
    ],
    dashboards: [
      { id: "ops", name: "Operations Dashboard", description: "Platform overview", persona: "owner",
        widgets: [
          { id: "volume", name: "Transaction Volume", type: "metric", dataEntity: "transaction", aggregation: "sum", description: "Total volume" },
          { id: "count", name: "Transactions", type: "metric", dataEntity: "transaction", aggregation: "count", description: "Total transactions" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "lending", name: "Lending Platform", tier: 4, category: "finance",
    description: "Lending with loans, repayments, credit scoring, and collections",
    keywords: ["lending", "loan", "emi", "credit", "nbfc"],
    entities: [
      { id: "borrower", name: "Borrower", plural: "Borrowers", description: "Loan borrower", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Borrower name" },
        { name: "phone", type: "string", required: true, description: "Phone" },
        { name: "creditScore", type: "number", required: true, description: "Credit score" },
      ]},
      { id: "loan", name: "Loan", plural: "Loans", description: "Loan record", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "borrowerId", type: "ref", refEntity: "borrower", required: true, description: "Borrower" },
        { name: "amount", type: "number", required: true, description: "Loan amount" },
        { name: "tenure", type: "number", required: true, description: "Tenure in months" },
        { name: "interestRate", type: "number", required: true, description: "Interest rate %" },
        { name: "emi", type: "number", required: true, description: "Monthly EMI" },
        { name: "status", type: "enum", enumValues: ["applied", "approved", "disbursed", "active", "closed", "defaulted"], required: true, description: "Status" },
      ]},
      { id: "repayment", name: "Repayment", plural: "Repayments", description: "EMI repayment", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "loanId", type: "ref", refEntity: "loan", required: true, description: "Loan" },
        { name: "amount", type: "number", required: true, description: "Amount paid" },
        { name: "date", type: "string", required: true, description: "Payment date" },
        { name: "status", type: "enum", enumValues: ["paid", "overdue", "partial"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-loan", name: "Loan Lifecycle", description: "Apply → Approve → Disburse → Collect", trigger: "Loan application",
        steps: [
          { id: "apply", name: "Apply", description: "Application received" },
          { id: "verify", name: "Verify", description: "KYC and credit check" },
          { id: "approve", name: "Approve", description: "Loan approved" },
          { id: "disburse", name: "Disburse", description: "Disburse funds" },
          { id: "collect", name: "Collect", description: "EMI collection" },
        ], outputEntity: "loan" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "loan", description: "Portfolio overview" },
      { id: "loans", name: "Loans", route: "/loans", type: "list", primaryEntity: "loan", description: "Loan portfolio" },
      { id: "borrowers", name: "Borrowers", route: "/borrowers", type: "list", primaryEntity: "borrower", description: "Borrower list" },
      { id: "repayments", name: "Repayments", route: "/repayments", type: "list", primaryEntity: "repayment", description: "Repayment tracker" },
    ],
    dashboards: [
      { id: "manager", name: "Lending Dashboard", description: "Portfolio overview", persona: "owner",
        widgets: [
          { id: "book", name: "Loan Book", type: "metric", dataEntity: "loan", aggregation: "sum", description: "Total disbursed" },
          { id: "active", name: "Active Loans", type: "metric", dataEntity: "loan", aggregation: "count", description: "Active loans" },
          { id: "overdue", name: "Overdue EMIs", type: "metric", dataEntity: "repayment", aggregation: "count", description: "Overdue count" },
        ] },
    ],
    businessRules: [
      { id: "br-overdue", name: "EMI Overdue Alert", description: "Alert on overdue EMI", entity: "repayment", condition: "status == 'overdue'", action: "Notify collections team" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "hrms", name: "HRMS", tier: 4, category: "software",
    description: "HR management with employees, payroll, leaves, and attendance",
    keywords: ["hrms", "hr", "payroll", "employee", "human resource"],
    entities: [
      { id: "employee", name: "Employee", plural: "Employees", description: "Company employee", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Employee name" },
        { name: "department", type: "string", required: true, description: "Department" },
        { name: "designation", type: "string", required: true, description: "Designation" },
        { name: "salary", type: "number", required: true, description: "Monthly salary" },
        { name: "joinDate", type: "string", required: true, description: "Join date" },
      ]},
      { id: "attendance", name: "Attendance", plural: "Attendances", description: "Daily attendance", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "employeeId", type: "ref", refEntity: "employee", required: true, description: "Employee" },
        { name: "date", type: "string", required: true, description: "Date" },
        { name: "status", type: "enum", enumValues: ["present", "absent", "half-day", "leave"], required: true, description: "Status" },
      ]},
      { id: "leave", name: "Leave", plural: "Leaves", description: "Leave request", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "employeeId", type: "ref", refEntity: "employee", required: true, description: "Employee" },
        { name: "type", type: "enum", enumValues: ["casual", "sick", "earned", "unpaid"], required: true, description: "Leave type" },
        { name: "startDate", type: "string", required: true, description: "Start date" },
        { name: "endDate", type: "string", required: true, description: "End date" },
        { name: "status", type: "enum", enumValues: ["pending", "approved", "rejected"], required: true, description: "Status" },
      ]},
      { id: "payroll", name: "Payroll", plural: "Payrolls", description: "Monthly payroll", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "employeeId", type: "ref", refEntity: "employee", required: true, description: "Employee" },
        { name: "month", type: "string", required: true, description: "Month" },
        { name: "basic", type: "number", required: true, description: "Basic salary" },
        { name: "deductions", type: "number", required: true, description: "Deductions" },
        { name: "net", type: "number", required: true, description: "Net pay" },
      ]},
    ],
    workflows: [
      { id: "wf-employee", name: "Employee Lifecycle", description: "Join → Attend → Leave → Retire", trigger: "New hire",
        steps: [
          { id: "onboard", name: "Onboard", description: "Joining formalities" },
          { id: "attend", name: "Attend", description: "Daily attendance" },
          { id: "leave", name: "Leave", description: "Leave management" },
          { id: "payroll", name: "Payroll", description: "Monthly salary" },
        ], outputEntity: "employee" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "employee", description: "HR overview" },
      { id: "employees", name: "Employees", route: "/employees", type: "list", primaryEntity: "employee", description: "Employee directory" },
      { id: "attendance", name: "Attendance", route: "/attendance", type: "calendar", primaryEntity: "attendance", description: "Attendance tracker" },
      { id: "leaves", name: "Leaves", route: "/leaves", type: "list", primaryEntity: "leave", description: "Leave requests" },
      { id: "payroll", name: "Payroll", route: "/payroll", type: "list", primaryEntity: "payroll", description: "Payroll processing" },
    ],
    dashboards: [
      { id: "hr", name: "HR Dashboard", description: "HR overview", persona: "owner",
        widgets: [
          { id: "headcount", name: "Headcount", type: "metric", dataEntity: "employee", aggregation: "count", description: "Total employees" },
          { id: "pending-leaves", name: "Pending Leaves", type: "metric", dataEntity: "leave", aggregation: "count", description: "Leave requests pending" },
          { id: "payroll", name: "Monthly Payroll", type: "metric", dataEntity: "payroll", aggregation: "sum", description: "Total payroll" },
        ] },
    ],
    businessRules: [
      { id: "br-leave", name: "Leave Approval", description: "Auto-approve if manager absent > 3 days", entity: "leave", condition: "status == 'pending' && daysSinceRequest > 3", action: "Escalate to HR head" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "erp", name: "ERP System", tier: 4, category: "software",
    description: "ERP with procurement, finance, inventory, and HR modules",
    keywords: ["erp", "enterprise", "procurement", "finance", "resource planning"],
    entities: [
      { id: "purchase-order", name: "PurchaseOrder", plural: "PurchaseOrders", description: "Procurement order", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "vendor", type: "string", required: true, description: "Vendor" },
        { name: "items", type: "string", required: true, description: "Order items" },
        { name: "total", type: "number", required: true, description: "Total amount" },
        { name: "status", type: "enum", enumValues: ["draft", "approved", "ordered", "received", "closed"], required: true, description: "Status" },
      ]},
      { id: "journal-entry", name: "JournalEntry", plural: "JournalEntries", description: "Accounting entry", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "date", type: "string", required: true, description: "Entry date" },
        { name: "description", type: "string", required: true, description: "Description" },
        { name: "debit", type: "number", required: true, description: "Debit amount" },
        { name: "credit", type: "number", required: true, description: "Credit amount" },
      ]},
    ],
    workflows: [
      { id: "wf-procurement", name: "Procurement Cycle", description: "Requisition → Approve → Order → Receive", trigger: "Purchase requisition",
        steps: [
          { id: "requisition", name: "Requisition", description: "Request raised" },
          { id: "approve", name: "Approve", description: "Manager approval" },
          { id: "order", name: "Order", description: "PO created" },
          { id: "receive", name: "Receive", description: "Goods received" },
        ], outputEntity: "purchase-order" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "purchase-order", description: "ERP overview" },
      { id: "procurement", name: "Procurement", route: "/procurement", type: "list", primaryEntity: "purchase-order", description: "Purchase orders" },
      { id: "finance", name: "Finance", route: "/finance", type: "list", primaryEntity: "journal-entry", description: "General ledger" },
    ],
    dashboards: [
      { id: "cfo", name: "CFO Dashboard", description: "Financial overview", persona: "owner",
        widgets: [
          { id: "payables", name: "Payables", type: "metric", dataEntity: "purchase-order", aggregation: "sum", description: "Total payables" },
          { id: "entries", name: "Journal Entries", type: "metric", dataEntity: "journal-entry", aggregation: "count", description: "Entries this month" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "franchise", name: "Franchise Management", tier: 4, category: "services",
    description: "Franchise with franchisees, royalties, compliance, and territory management",
    keywords: ["franchise", "franchisee", "royalty", "outlet"],
    entities: [
      { id: "franchisee", name: "Franchisee", plural: "Franchisees", description: "Franchise outlet", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Franchisee name" },
        { name: "city", type: "string", required: true, description: "City" },
        { name: "territory", type: "string", required: true, description: "Territory" },
        { name: "investmentDate", type: "string", required: true, description: "Investment date" },
        { name: "status", type: "enum", enumValues: ["active", "suspended", "terminated"], required: true, description: "Status" },
      ]},
      { id: "royalty", name: "Royalty", plural: "Royalties", description: "Royalty payment", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "franchiseeId", type: "ref", refEntity: "franchisee", required: true, description: "Franchisee" },
        { name: "month", type: "string", required: true, description: "Month" },
        { name: "revenue", type: "number", required: true, description: "Reported revenue" },
        { name: "royaltyAmount", type: "number", required: true, description: "Royalty amount" },
        { name: "status", type: "enum", enumValues: ["calculated", "paid", "overdue"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-royalty", name: "Royalty Collection", description: "Report → Calculate → Collect → Reconcile", trigger: "Month end",
        steps: [
          { id: "report", name: "Report", description: "Franchisee reports revenue" },
          { id: "calculate", name: "Calculate", description: "Calculate royalty" },
          { id: "collect", name: "Collect", description: "Collect payment" },
          { id: "reconcile", name: "Reconcile", description: "Reconcile accounts" },
        ], outputEntity: "royalty" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "franchisee", description: "Franchise overview" },
      { id: "franchisees", name: "Franchisees", route: "/franchisees", type: "list", primaryEntity: "franchisee", description: "Franchise network" },
      { id: "royalties", name: "Royalties", route: "/royalties", type: "list", primaryEntity: "royalty", description: "Royalty tracker" },
    ],
    dashboards: [
      { id: "hq", name: "Franchise Dashboard", description: "Network overview", persona: "owner",
        widgets: [
          { id: "outlets", name: "Active Outlets", type: "metric", dataEntity: "franchisee", aggregation: "count", description: "Total outlets" },
          { id: "royalty", name: "Royalty Collected", type: "metric", dataEntity: "royalty", aggregation: "sum", description: "Total royalty" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "membership-org", name: "Membership Organization", tier: 4, category: "services",
    description: "Membership org with members, renewals, events, and engagement",
    keywords: ["membership", "association", "club", "organization", "society"],
    entities: [
      { id: "member", name: "Member", plural: "Members", description: "Organization member", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Member name" },
        { name: "email", type: "string", required: true, description: "Email" },
        { name: "membershipType", type: "enum", enumValues: ["annual", "life", "student", "honorary"], required: true, description: "Membership type" },
        { name: "joinDate", type: "string", required: true, description: "Join date" },
        { name: "renewalDate", type: "string", required: true, description: "Renewal date" },
        { name: "status", type: "enum", enumValues: ["active", "expired", "suspended"], required: true, description: "Status" },
      ]},
      { id: "event", name: "OrgEvent", plural: "OrgEvents", description: "Organization event", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Event name" },
        { name: "date", type: "string", required: true, description: "Event date" },
        { name: "attendees", type: "number", required: true, description: "Expected attendees" },
        { name: "status", type: "enum", enumValues: ["planned", "open", "closed", "completed"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-membership", name: "Membership Lifecycle", description: "Apply → Approve → Join → Renew", trigger: "New application",
        steps: [
          { id: "apply", name: "Apply", description: "Application submitted" },
          { id: "approve", name: "Approve", description: "Board approval" },
          { id: "join", name: "Join", description: "Member joins" },
          { id: "renew", name: "Renew", description: "Annual renewal" },
        ], outputEntity: "member" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "member", description: "Org overview" },
      { id: "members", name: "Members", route: "/members", type: "list", primaryEntity: "member", description: "Member directory" },
      { id: "events", name: "Events", route: "/events", type: "calendar", primaryEntity: "event", description: "Event calendar" },
    ],
    dashboards: [
      { id: "admin", name: "Org Dashboard", description: "Organization overview", persona: "owner",
        widgets: [
          { id: "members", name: "Active Members", type: "metric", dataEntity: "member", aggregation: "count", description: "Total members" },
          { id: "expiring", name: "Expiring Soon", type: "metric", dataEntity: "member", aggregation: "count", description: "Renewals due" },
        ] },
    ],
    businessRules: [
      { id: "br-renewal", name: "Renewal Reminder", description: "Remind 30 days before expiry", entity: "member", condition: "renewalDate - today <= 30 days", action: "Send renewal notice" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "nonprofit", name: "Nonprofit Management", tier: 4, category: "services",
    description: "Nonprofit with donations, campaigns, volunteers, and impact tracking",
    keywords: ["nonprofit", "ngo", "donation", "charity", "foundation"],
    entities: [
      { id: "donor", name: "Donor", plural: "Donors", description: "Donor/donor organization", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Donor name" },
        { name: "email", type: "string", required: true, description: "Email" },
        { name: "totalDonated", type: "number", required: true, description: "Total donated" },
        { name: "lastDonation", type: "string", required: true, description: "Last donation date" },
      ]},
      { id: "campaign", name: "Campaign", plural: "Campaigns", description: "Fundraising campaign", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Campaign name" },
        { name: "goal", type: "number", required: true, description: "Fundraising goal" },
        { name: "raised", type: "number", required: true, description: "Amount raised" },
        { name: "startDate", type: "string", required: true, description: "Start date" },
        { name: "endDate", type: "string", required: true, description: "End date" },
        { name: "status", type: "enum", enumValues: ["draft", "active", "completed", "cancelled"], required: true, description: "Status" },
      ]},
      { id: "donation", name: "Donation", plural: "Donations", description: "Individual donation", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "donorId", type: "ref", refEntity: "donor", required: true, description: "Donor" },
        { name: "campaignId", type: "ref", refEntity: "campaign", required: false, description: "Campaign" },
        { name: "amount", type: "number", required: true, description: "Amount" },
        { name: "date", type: "string", required: true, description: "Donation date" },
        { name: "method", type: "enum", enumValues: ["cash", "card", "bank-transfer", "upi"], required: true, description: "Payment method" },
      ]},
    ],
    workflows: [
      { id: "wf-campaign", name: "Campaign Lifecycle", description: "Plan → Launch → Collect → Report", trigger: "Campaign approved",
        steps: [
          { id: "plan", name: "Plan", description: "Campaign planning" },
          { id: "launch", name: "Launch", description: "Go live" },
          { id: "collect", name: "Collect", description: "Receive donations" },
          { id: "report", name: "Report", description: "Impact report" },
        ], outputEntity: "campaign" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "campaign", description: "Org overview" },
      { id: "campaigns", name: "Campaigns", route: "/campaigns", type: "list", primaryEntity: "campaign", description: "Active campaigns" },
      { id: "donors", name: "Donors", route: "/donors", type: "list", primaryEntity: "donor", description: "Donor list" },
      { id: "donations", name: "Donations", route: "/donations", type: "list", primaryEntity: "donation", description: "Donation history" },
    ],
    dashboards: [
      { id: "director", name: "Nonprofit Dashboard", description: "Org overview", persona: "owner",
        widgets: [
          { id: "total-raised", name: "Total Raised", type: "metric", dataEntity: "donation", aggregation: "sum", description: "Total donations" },
          { id: "donors", name: "Donors", type: "metric", dataEntity: "donor", aggregation: "count", description: "Total donors" },
          { id: "active-campaigns", name: "Active Campaigns", type: "metric", dataEntity: "campaign", aggregation: "count", description: "Running campaigns" },
        ] },
    ],
    businessRules: [],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },

  {
    id: "marketplace", name: "Multi-Vendor Marketplace", tier: 4, category: "commerce",
    description: "Marketplace with sellers, commissions, multi-vendor management, and disputes",
    keywords: ["marketplace", "multi-vendor", "seller", "vendor", "b2b marketplace"],
    entities: [
      { id: "seller", name: "Seller", plural: "Sellers", description: "Marketplace seller", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "name", type: "string", required: true, description: "Seller name" },
        { name: "category", type: "string", required: true, description: "Product category" },
        { name: "rating", type: "number", required: true, description: "Seller rating" },
        { name: "totalSales", type: "number", required: true, description: "Total sales" },
        { name: "status", type: "enum", enumValues: ["active", "suspended", "pending"], required: true, description: "Status" },
      ]},
      { id: "listing", name: "Listing", plural: "Listings", description: "Seller listing", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "sellerId", type: "ref", refEntity: "seller", required: true, description: "Seller" },
        { name: "name", type: "string", required: true, description: "Product name" },
        { name: "price", type: "number", required: true, description: "Price" },
        { name: "stock", type: "number", required: true, description: "Stock" },
        { name: "status", type: "enum", enumValues: ["active", "sold-out", "removed"], required: true, description: "Status" },
      ]},
      { id: "order", name: "MarketplaceOrder", plural: "MarketplaceOrders", description: "Multi-seller order", fields: [
        { name: "id", type: "string", required: true, unique: true, description: "ID" },
        { name: "buyerName", type: "string", required: true, description: "Buyer" },
        { name: "items", type: "string", required: true, description: "Order items" },
        { name: "total", type: "number", required: true, description: "Order total" },
        { name: "commission", type: "number", required: true, description: "Platform commission" },
        { name: "status", type: "enum", enumValues: ["placed", "processing", "shipped", "delivered"], required: true, description: "Status" },
      ]},
    ],
    workflows: [
      { id: "wf-order", name: "Marketplace Order", description: "Place → Split → Fulfill → Settle", trigger: "Buyer places order",
        steps: [
          { id: "place", name: "Place", description: "Order placed" },
          { id: "split", name: "Split", description: "Split by seller" },
          { id: "fulfill", name: "Fulfill", description: "Sellers ship" },
          { id: "settle", name: "Settle", description: "Settle with sellers" },
        ], outputEntity: "order" },
    ],
    pages: [
      { id: "dashboard", name: "Dashboard", route: "/", type: "dashboard", primaryEntity: "order", description: "Marketplace overview" },
      { id: "sellers", name: "Sellers", route: "/sellers", type: "list", primaryEntity: "seller", description: "Seller management" },
      { id: "listings", name: "Listings", route: "/listings", type: "list", primaryEntity: "listing", description: "All listings" },
      { id: "orders", name: "Orders", route: "/orders", type: "list", primaryEntity: "order", description: "Order management" },
    ],
    dashboards: [
      { id: "admin", name: "Marketplace Dashboard", description: "Platform overview", persona: "owner",
        widgets: [
          { id: "gmv", name: "GMV", type: "metric", dataEntity: "order", aggregation: "sum", description: "Gross merchandise value" },
          { id: "commission", name: "Commission", type: "metric", dataEntity: "order", aggregation: "sum", description: "Platform commission" },
          { id: "sellers", name: "Active Sellers", type: "metric", dataEntity: "seller", aggregation: "count", description: "Active sellers" },
        ] },
    ],
    businessRules: [
      { id: "br-commission", name: "Commission Auto-Deduct", description: "Deduct commission on payment", entity: "order", condition: "status == 'delivered'", action: "Transfer seller amount minus commission" },
    ],
    mockDataConfig: { minEntities: 5, maxEntities: 10, indianMarket: true, currency: "INR" },
  },
];
