export const LEAD_STATUSES = [
  { value: "new", label: "New", tone: "brand" },
  { value: "contacted", label: "Contacted", tone: "sky" },
  { value: "qualified", label: "Qualified", tone: "emerald" },
  { value: "unqualified", label: "Unqualified", tone: "slate" },
  { value: "converted", label: "Converted", tone: "violet" },
] as const;

export const LEAD_SOURCES = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "ads", label: "Ads" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

export const ROLES = [
  { value: "owner", label: "Owner", description: "Full control including billing" },
  { value: "admin", label: "Admin", description: "Manage members, settings and all records" },
  { value: "manager", label: "Manager", description: "Manage pipeline, assign and view all records" },
  { value: "sales_rep", label: "Sales Rep", description: "Work on assigned leads and deals" },
  { value: "viewer", label: "Viewer", description: "Read-only access to records and reports" },
] as const;

export const TASK_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "follow_up", label: "Follow-up" },
  { value: "general", label: "General" },
] as const;

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export const INDUSTRIES = ["Hotels", "Real estate", "Clinics", "Gyms", "Restaurants", "Software services", "Manufacturing", "Education", "Retail", "Other"];
export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD"];
export const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Australia/Sydney", "UTC"];

export const SOURCE_COLORS: Record<string, string> = {
  website: "#6c63f1",
  referral: "#10b981",
  ads: "#f59e0b",
  email: "#0ea5e9",
  phone: "#8b5cf6",
  whatsapp: "#22c55e",
  event: "#ec4899",
  other: "#94a3b8",
};

export const STALE_DAYS = 14;
