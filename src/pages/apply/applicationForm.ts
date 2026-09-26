import type { ApplicationData, CoApplicant } from "@/lib/types";

export interface ApplicationFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  desired_move_in: string;
  adult_count: number;
  data: ApplicationData;
  consents: {
    accurate: boolean;
    screening: boolean;
    fee: boolean;
  };
}

export const emptyCoApplicant = (): CoApplicant => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  relationship: "",
});

export const initialFormState = (): ApplicationFormState => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  desired_move_in: "",
  adult_count: 1,
  data: {
    date_of_birth: "",
    current_address: {
      street: "",
      city: "",
      state: "KY",
      zip: "",
      move_in_date: "",
      monthly_rent: "",
      landlord_name: "",
      landlord_phone: "",
      reason_for_leaving: "",
    },
    previous_address: { street: "", city: "", state: "", zip: "", landlord_name: "", landlord_phone: "" },
    employment: {
      status: "Employed full-time",
      employer: "",
      position: "",
      supervisor_name: "",
      supervisor_phone: "",
      start_date: "",
      monthly_income: "",
      other_income: "",
    },
    co_applicants: [],
    minors_count: "0",
    pets: [],
    vehicles: [],
    references: [
      { name: "", relationship: "", phone: "" },
      { name: "", relationship: "", phone: "" },
    ],
    history: { evicted: "No", broken_lease: "No", explanation: "" },
    additional_notes: "",
  },
  consents: { accurate: false, screening: false, fee: false },
});

export const STEPS = [
  { key: "applicant", title: "Applicant", description: "Your contact details" },
  { key: "residence", title: "Residence", description: "Rental history" },
  { key: "income", title: "Income", description: "Employment & income" },
  { key: "household", title: "Household", description: "Occupants, pets & vehicles" },
  { key: "documents", title: "Documents", description: "References & uploads" },
  { key: "review", title: "Review & Pay", description: "Confirm and submit" },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message for the given step, or null if the step is complete. */
export function validateStep(step: number, f: ApplicationFormState): string | null {
  const d = f.data;
  switch (step) {
    case 0:
      if (!f.first_name.trim() || !f.last_name.trim()) return "Please enter your full name.";
      if (!EMAIL_RE.test(f.email)) return "Please enter a valid email address.";
      if (f.phone.replace(/\D/g, "").length < 10) return "Please enter a valid phone number.";
      if (!d.date_of_birth) return "Please enter your date of birth.";
      if (!f.desired_move_in) return "Please choose a desired move-in date.";
      return null;
    case 1: {
      const c = d.current_address;
      if (!c.street.trim() || !c.city.trim() || !c.state.trim() || !c.zip.trim()) return "Please enter your full current address.";
      return null;
    }
    case 2: {
      const e = d.employment;
      if (!e.monthly_income.trim()) return "Please enter your gross monthly income.";
      if (e.status.startsWith("Employed") && !e.employer.trim()) return "Please enter your employer.";
      return null;
    }
    case 3:
      for (const [i, co] of d.co_applicants.entries()) {
        if (!co.first_name.trim() || !co.last_name.trim()) return `Please enter the full name of adult applicant #${i + 2}.`;
        if (!EMAIL_RE.test(co.email)) return `Please enter a valid email for adult applicant #${i + 2}.`;
      }
      return null;
    case 4:
      if (!d.references[0]?.name.trim() || !d.references[0]?.phone.trim()) return "Please provide at least one personal reference.";
      return null;
    case 5:
      if (!f.consents.accurate || !f.consents.screening || !f.consents.fee) return "Please agree to all of the terms to continue.";
      return null;
    default:
      return null;
  }
}
