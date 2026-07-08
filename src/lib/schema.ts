/**
 * Airtable table + field mapping for the "Main" base (appND9kP55cvkDX7V).
 *
 * All reads/writes use FIELD IDS (not names), so renaming a field in
 * Airtable never breaks the app. If you add a field, add its id here.
 */

export const TABLES = {
  MASTER_TRIPS: "tblodAjjJy8FBQAY7", // ✈️ Master Trips
  SUBTRIPS: "tblCwuKfuZCMsz6Wb", // 🛩️🛩️ Subtrips
  PAYMENTS: "tblTaZDiAD3VIOeLb", // Payments
  SERVICES: "tblR8W6GPEI6ucW6e", // SERVICES (per-trip charges)
} as const;

/** ✈️ Master Trips */
export const TRIP = {
  tripName: "fldOHC5sVVtVXB5Yv", // Trip Name (formula, primary)
  guestFullName: "fldB8I68PoBtSDWeS", // Full Name (from CRM contact)
  guestEmail: "fldJQj9zP9ioGtVkr", // Email (from CRM contact)
  guestPhone: "fld78nvUdCjoBkytP", // Phone number (from CRM contact)
  property: "fldEkJorW6llGqI08", // Property (link)
  arrivalDate: "fldu81bwcyq86aBKz", // Arrival Date
  checkoutDate: "fldiQISqiSkO45tvn", // Checkout Date
  totalNights: "fld3cA85LdKuSn8y3", // Total Nights (formula)
  agreedCost: "fldCmeh4OXrF5wt5m", // Agreed cost
  securityDeposit: "fld9R07PzqUejDI5v", // Security deposit
  advanceToBePaid: "fldyDtM040KlcrP5D", // Advance to be paid
  actualAdvancePaid: "fldbOTdIWGDUpeIjt", // Actual advance paid by the customer
  paymentStatus: "fld6Fm1g7VYsmKVl1", // Payment Status (single select)
  balanceDueFormula: "fldVPjhnedhzMVrBA", // Balance Due (formula, read-only)
  invoiceNumber: "fldVxrXEO3O4iZYVK", // Invoice Number
  invoiceLink: "fld9ztCNNMdRjvkZ4", // Invoice link (url)
  invoiceAddress: "fld9bkBaS0CmhoARs", // invoice address
  payments: "fldz6XZKVct4t5ml8", // Payments (link)
  subtrips: "fldzJEymUI7GJe0LK", // Subtrips (link)
  services: "fldRHDIrfpLJFPF5t", // Customer services (link to SERVICES)
} as const;

/** 🛩️🛩️ Subtrips (stay extensions linked to a master trip) */
export const SUBTRIP = {
  name: "fldeH5ISiFnMIuO0f", // Subtrip name (formula)
  masterTrip: "fldPuAJogpRvHVblT", // Mastertrip (link)
  arrivalDate: "fldViIRqGQ2QpFva2", // Extension Arrival Date
  checkoutDate: "fld3g7BsKfSKG6V6P", // Extension Check Out Date
  nights: "fld8CK9tEiVvtlZvs", // Total number of nights (formula)
  agreedCost: "fldTP8hclBGrAqIT8", // Agreed cost for subtrip
  status: "fld9OSZrOpby2EerO", // Status of the trip (single select)
  services: "fldZ2ZYV7IL7PLpRt", // SERVICES (link)
  servicesTotal: "fldPpQRdjlklrqvJX", // Subtrip Services Total (rollup)
} as const;

/** Payments — one record per customer payment */
export const PAYMENT = {
  name: "fldbsTypuCYIdbpQO", // Payment (text label)
  masterTrip: "fld9zmgOUd7yvwhJM", // Master Trip (link)
  amount: "fldORhObFLQ70z68U", // Amount (currency). Refunds = negative amount.
  date: "flddKXQdjpiK3Y7qg", // Date
  method: "fldZUqNivFyW8XsoP", // Method (single select: Bank transfer, Cash, Wise, ...)
  type: "fldM8IDdO6YHzTZAR", // Type (single select: Advance, Balance, Security deposit, Service charge, Refund)
  reference: "fldVGqkRxBlxyFXZR", // Reference (slip no, remarks)
} as const;

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
  paymentStatus: "fldKbGhbAb2aU3Jcl", // Payment status (single select: To pay / Paid)
  date: "fldTjRzfIXRmOkany", // Date (charge added)
  dueDate: "fldDu5gVQjL8AJQ3F", // Due date
  datePaid: "fldU2CGWYjnPcmTPM", // Date of amount paid
  notes: "flde1teOe6CB9CjDp", // Notes
} as const;

export const PAYMENT_TYPES = [
  "Advance",
  "Balance",
  "Security deposit",
  "Service charge",
  "Extension",
  "Refund",
] as const;

export const PAYMENT_METHODS = [
  "Bank transfer",
  "Cash",
  "Wise",
  "Credit card",
  "PromptPay",
  "Crypto",
  "Other",
] as const;

export const CHARGE_STATUS = { TO_PAY: "To pay", PAID: "Paid" } as const;
