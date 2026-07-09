/**
 * Airtable table + field mapping for the "Main" base (appND9kP55cvkDX7V).
 *
 * All reads/writes use FIELD IDS (not names), so renaming a field in
 * Airtable never breaks the app. If you add a field, add its id here.
 *
 * The legacy "Invoices" table (tblkeqCvog91i5dIH) — the old Invoice Ninja /
 * Make.com automation — is intentionally NOT mapped. This app replaces it.
 */

export const TABLES = {
  MASTER_TRIPS: "tblodAjjJy8FBQAY7", // ✈️ Master Trips
  SUBTRIPS: "tblCwuKfuZCMsz6Wb", // 🛩️🛩️ Subtrips
  PAYMENTS: "tblTaZDiAD3VIOeLb", // Payments
  SERVICES: "tblR8W6GPEI6ucW6e", // SERVICES (per-trip charges)
  MISC_CHARGES: "tbl74DEJKI8PChdpl", // Misc Charges (utility readings etc.)
  CRM: "tbljAtpRqo0s1siQe", // 🛃CRM
} as const;

/** ✈️ Master Trips */
export const TRIP = {
  tripName: "fldOHC5sVVtVXB5Yv", // Trip Name (formula, primary)
  crmContact: "fldY3YO3qh41ApmxJ", // CRM contact (link) — preferred source of guest identity
  // Legacy flat lookups, used only as a fallback if crmContact is empty
  guestFullName: "fldB8I68PoBtSDWeS", // Full Name (from CRM contact)
  guestEmail: "fldJQj9zP9ioGtVkr", // Email (from CRM contact)
  guestPhone: "fld78nvUdCjoBkytP", // Phone number (from CRM contact)
  property: "fldEkJorW6llGqI08", // Property (link, reversed)
  properties: "fldHOvke9O6O3nA7I", // Properties (link, direct — canonical)
  arrivalDate: "fldu81bwcyq86aBKz", // Arrival Date
  checkoutDate: "fldiQISqiSkO45tvn", // Checkout Date
  totalNights: "fld3cA85LdKuSn8y3", // Total Nights (formula)
  agreedCost: "fldCmeh4OXrF5wt5m", // Agreed cost
  securityDeposit: "fld9R07PzqUejDI5v", // Security deposit
  advanceToBePaid: "fldyDtM040KlcrP5D", // Advance to be paid
  actualAdvancePaid: "fldbOTdIWGDUpeIjt", // Actual advance paid by the customer (legacy, superseded by Payments ledger)
  paymentStatus: "fld6Fm1g7VYsmKVl1", // Payment Status (single select)
  inquiryStatus: "fldxU0AyJl5bkeDg2", // Inquiry status (single select) — the real trip lifecycle field
  inquiryType: "fldgsJ8a2SgBVU5VT", // Inquiry Type (single select: Fresh/Repeat/Extend/Upgrade/...)
  checkedIn: "fld4uG4e12dQuENhH", // checked in (checkbox)
  checkedOut: "fldvCgNWTFuNwDjXd", // Checked Out (checkbox)
  balanceDueFormula: "fldVPjhnedhzMVrBA", // Balance Due (formula, read-only reference)
  totalPayableFormula: "fldnLActSFas2OoIx", // TOTAL AMOUNT PAYABLE ON ARRIVAL (formula, read-only reference)
  invoiceNumber: "fldVxrXEO3O4iZYVK", // Invoice Number (legacy Invoice Ninja ref, display-only)
  invoiceAddress: "fld9bkBaS0CmhoARs", // invoice address
  payments: "fldz6XZKVct4t5ml8", // Payments (link)
  subtrips: "fldzJEymUI7GJe0LK", // Subtrips (link)
  services: "fldRHDIrfpLJFPF5t", // Customer services (link to SERVICES)
  miscCharges: "fldPguKaMrHiyeyCu", // Misc Charges (link)
} as const;

/** 🛃CRM — customer identity, the source of truth for guest details */
export const CRM = {
  fullName: "fldpo40NaPfxcwstg", // Full Name (formula)
  firstName: "fldpQDbt3mhS7JENm",
  lastName: "fldeMrtoK6oqx1tNW",
  phone: "flddoNYFVjr1w4uq6", // Phone number
  email: "fldMYbufyr9jnkmIV", // Email
  country: "fldHJKqcdtCkVmmG5", // Country
  passport: "fldj8bmJGIRs3zj1N", // Passport number
  masterTrips: "fldUG51htW0GY5Vdw", // ✈️ Master Trips (link)
  notes: "fldJtAuDXBfHMp1os", // Notes
} as const;

/** 🛩️🛩️ Subtrips (stay extensions linked to a master trip) */
export const SUBTRIP = {
  name: "fldeH5ISiFnMIuO0f", // Subtrip name (formula)
  masterTrip: "fldPuAJogpRvHVblT", // Mastertrip (link)
  arrivalDate: "fldViIRqGQ2QpFva2", // Extension Arrival Date
  checkoutDate: "fld3g7BsKfSKG6V6P", // Extension Check Out Date
  nights: "fld8CK9tEiVvtlZvs", // Total number of nights (formula)
  agreedCost: "fldTP8hclBGrAqIT8", // Agreed cost for subtrip
  status: "fld9OSZrOpby2EerO", // Status of the trip (single select: Extended / Trip Completed)
  services: "fldZ2ZYV7IL7PLpRt", // SERVICES (link)
  servicesTotal: "fldPpQRdjlklrqvJX", // Subtrip Services Total (rollup)
} as const;

export const SUBTRIP_STATUS = {
  EXTENDED: "Extended",
  COMPLETED: "Trip Completed",
} as const;

/** Payments — one record per customer payment (the payment ledger) */
export const PAYMENT = {
  name: "fldbsTypuCYIdbpQO", // Payment (text label)
  masterTrip: "fld9zmgOUd7yvwhJM", // Master Trip (link) — required
  // Optional link to Subtrips: this field does NOT exist yet in Airtable.
  // Add it by hand (Payments → new "Subtrip" link field → Subtrips table),
  // then paste its field id here. Left "" until then; the app feature-detects
  // it and falls back to tagging extension payments via `reference` text.
  subtrip: "",
  amount: "fldORhObFLQ70z68U", // Amount (currency). Refunds = negative amount.
  date: "flddKXQdjpiK3Y7qg", // Date
  method: "fldZUqNivFyW8XsoP", // Method (single select)
  type: "fldM8IDdO6YHzTZAR", // Type (single select)
  reference: "fldVGqkRxBlxyFXZR", // Reference (slip no, remarks)
} as const;

// Real live Airtable choices (confirmed via API) — writes use typecast:true,
// which auto-creates any new option, but keep these spelled exactly the same
// as what's already in Airtable to avoid near-duplicate options.
export const PAYMENT_TYPES = [
  "Advance",
  "Partial",
  "Balance",
  "Full",
  "Security Deposit", // not yet a real option — first write auto-creates it
  "Other",
] as const;

export const PAYMENT_METHODS = ["Bank transfer", "Cash", "Cryptocurrency", "Card"] as const;

// Payment types that count against `Advance to be paid` when computing how
// much advance is still due.
export const ADVANCE_COUNTING_TYPES = ["Advance", "Partial"] as const;

/** SERVICES — per-trip services & charges (electricity, cleaning, ...) */
export const CHARGE = {
  name: "fldE3ZcEiVJ3b1iCH", // Name (formula, primary — not writable)
  masterTrips: "fldxJNjOePrgsgxvT", // ✈️ Master Trips (link)
  subtrips: "fldUGtwNfMtV2rbIK", // Subtrips (link)
  serviceType: "fldwGhC8ScpRoFqPe", // Services type (single select)
  lineItems: "fldSt1clU9AMdWxnF", // Line items (free-text description)
  amountToBePaid: "fldrXFS8PuieuNTEZ", // Amount to be paid (currency)
  actualPaid: "fldMAB8bnkQCkdXuk", // Actual amount paid by the customer
  balanceFormula: "fldnHm2S1qY8a8N5e", // Balance amount to be paid (formula, read-only)
  paymentStatus: "fldKbGhbAb2aU3Jcl", // Payment status (single select: Not paid/Partially paid/Fully paid)
  legacyStatus: "fldthm3W2Yb7sitHU", // Status (single select: Paid/Unpaid) — read-only, old rows only
  date: "fldTjRzfIXRmOkany", // Date (charge added)
  dueDate: "fldDu5gVQjL8AJQ3F", // Due date
  datePaid: "fldU2CGWYjnPcmTPM", // Date of amount paid
  notes: "flde1teOe6CB9CjDp", // Notes
} as const;

export const CHARGE_SERVICE_TYPES = [
  "Electricity",
  "Cleaning service",
  "Laundry",
  "Airport Transfer",
  "Deep clean after check out",
  "Other",
] as const;

export const CHARGE_STATUS = {
  NOT_PAID: "Not paid",
  PARTIALLY_PAID: "Partially paid",
  FULLY_PAID: "Fully paid",
} as const;

/** Misc Charges — utility meter readings / ad hoc charges, read-only reference */
export const MISC_CHARGE = {
  name: "fldtMFaOHROBdvIIR",
  property: "fldhgCYD8yw4mM4RA", // (link)
  reading: "fldPUuvlXJQpc5vDU",
  amount: "fldHI3UQdiEmq0iF2",
  photo: "fldz3doZJNvzHsAPB", // (attachments)
  masterTrips: "fldbTLtzEMpqUw7Qs", // (link)
  chargeType: "fldZdcBeNduVPiixw",
  readingDate: "fldDhbq51ij7uMqqM",
  notes: "fld9FYI1aiNZ4Bcua",
} as const;

// Trip lifecycle stages (Inquiry status) that count as a real, billable
// booking by default on the trip list. Toggle "show all" to see the rest
// (Inquiry / Sent for pricing / Dead / Trip cancelled / ...).
export const DEFAULT_VISIBLE_STATUSES = [
  "Sent Invoice",
  "Paid and confirmed",
  "Checked-In",
  "Trip completed",
] as const;
