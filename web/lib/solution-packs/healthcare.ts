import type { SolutionPack } from "../solution-engine"

export const HealthcarePack: SolutionPack = {
  id: "healthcare",
  name: "Healthcare Clinic",

  domains: ["healthcare", "clinic", "medical"],

  keywords: [
    "healthcare",
    "clinic",
    "hospital",
    "patient",
    "doctor",
    "appointment",
    "medical",
    "prescription",
    "health",
    "physician",
    "diagnosis",
    "treatment",
  ],

  solution: {
    domain: "healthcare",
    businessType: "clinic",

    userProblems: [
      "patient registration",
      "appointment scheduling",
      "doctor availability",
      "prescription management",
      "billing and insurance",
    ],

    businessGoals: [
      "reduce patient wait times",
      "improve appointment utilization",
      "streamline billing",
      "enhance patient care",
    ],

    systems: [
      {
        name: "Patient Management",
        purpose: "Register and manage patient records",
        entities: ["Patient", "MedicalRecord", "Insurance"],
        workflows: [
          "register_patient",
          "collect_history",
          "update_record",
          "schedule_followup",
        ],
        metrics: [
          "patient_satisfaction",
          "return_rate",
          "average_visit_duration",
        ],
      },
      {
        name: "Appointment Scheduling",
        purpose: "Book and manage patient appointments",
        entities: ["Appointment", "Doctor", "Slot"],
        workflows: [
          "book_appointment",
          "confirm",
          "check_in",
          "consult",
          "bill",
        ],
        metrics: [
          "utilization_rate",
          "no_show_rate",
          "average_wait_time",
        ],
      },
      {
        name: "Prescription Management",
        purpose: "Create and track prescriptions",
        entities: ["Prescription", "Medicine", "Dosage"],
        workflows: [
          "create_prescription",
          "add_medicines",
          "dispense",
          "refill",
        ],
        metrics: [
          "prescriptions_per_day",
          "medicine_accuracy",
          "refill_rate",
        ],
      },
    ],
  },
}
