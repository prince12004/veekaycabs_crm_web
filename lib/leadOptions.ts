// Mirrors crm/server models/Lead.js. ACTIVE_STATUSES are the ones that can
// still be picked; leads already in an older status keep showing it.
export const ACTIVE_STATUSES = [
  "New", "Assigned", "Contacted", "Interested", "Follow-up", "Quotation Sent",
  "Booking Confirmed", "No Response", "Not Interested", "Price Issue", "Lost",
];

export const SOURCES = ["Meta Ads", "Google Ads", "SEO/Organic", "Website", "WhatsApp", "Phone Call", "JustDial", "Referral", "Manual"];

// Mirrors Lead.ESCALATION_STATUSES — a salesperson picking one of these sends
// the lead to Super Admin for review.
export const ESCALATION = [
  "Not Interested", "Customer Issue", "Price Issue", "Payment Issue",
  "Service Issue", "Service Unavailable", "Other Issue",
];
export const SUPER_ADMIN_REVIEW = [...ESCALATION, "Interested"];
export const REASON_REQUIRED = [...ESCALATION, "Lost"];

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "New": { bg: "#DBEAFE", text: "#1E40AF" },
  "Assigned": { bg: "#EDE9FE", text: "#5B21B6" },
  "Contacted": { bg: "#FEF3C7", text: "#92400E" },
  "Interested": { bg: "#D1FAE5", text: "#065F46" },
  "Booking Confirmed": { bg: "#D1FAE5", text: "#065F46" },
  "Lost": { bg: "#FEE2E2", text: "#991B1B" },
};
export const defaultBadge = { bg: "#F1F2F7", text: "#4A4A6A" };
