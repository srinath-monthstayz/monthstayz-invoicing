/**
 * Data layer: assembles a Trip (master trip + CRM contact + subtrips +
 * payments + services + misc charges) from Airtable and computes all
 * invoice/receipt totals in one place.
 */
import {
  asIds,
  asNumber,
  asString,
  getRecord,
  getRecordsByIds,
  listRecords,
} from "./airtable";
import { getCrmContacts, type CrmContact } from "./crm";
import {
  ADVANCE_COUNTING_TYPES,
  CHARGE,
  CHARGE_STATUS,
  DEFAULT_VISIBLE_STATUSES,
  MISC_CHARGE,
  PAYMENT,
  SUBTRIP,
  TABLES,
  TRIP,
} from "./schema";

export type Payment = {
  id: string;
  label: string;
  amount: number;
  date: string;
  method: string;
  type: string;
  reference: string;
};

export type Charge = {
  id: string;
  description: string;
  serviceType: string;
  amount: number;
  paid: number;
  status: string;
  date: string;
  dueDate: string;
  datePaid: string;
  notes: string;
  subtripIds: string[];
};

export type MiscCharge = {
  id: string;
  name: string;
  chargeType: string;
  amount: number;
  reading: number;
  readingDate: string;
  notes: string;
  photoUrl: string;
};

export type Subtrip = {
  id: string;
  name: string;
  arrivalDate: string;
  checkoutDate: string;
  nights: number;
  agreedCost: number;
  status: string;
};

export type TripSummary = {
  id: string;
  tripName: string;
  customerName: string;
  arrivalDate: string;
  checkoutDate: string;
  agreedCost: number;
  paymentStatus: string;
  inquiryStatus: string;
  balanceDue: number; // Airtable's own formula field — a quick reference for the list view only
};

export type Trip = {
  id: string;
  tripName: string;
  customer: CrmContact | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  invoiceAddress: string;
  arrivalDate: string;
  checkoutDate: string;
  totalNights: number;
  agreedCost: number;
  securityDeposit: number;
  advanceToBePaid: number;
  paymentStatus: string;
  inquiryStatus: string;
  inquiryType: string;
  checkedIn: boolean;
  checkedOut: boolean;
  invoiceNumber: string;
  subtrips: Subtrip[];
  payments: Payment[];
  charges: Charge[];
  miscCharges: MiscCharge[];
  totals: Totals;
  /** Airtable's own formula fields, shown as a secondary reference only */
  reference: {
    balanceDueFormula: number;
    totalPayableFormula: number;
  };
};

export type Totals = {
  accommodation: number; // master agreed cost + all subtrip agreed costs
  servicesBillTotal: number; // gross services/charges — the Invoice's line items
  securityDeposit: number;
  grandTotal: number; // accommodation + servicesBillTotal + securityDeposit
  paymentsTotal: number; // sum of the Payments ledger only
  servicesPaidTotal: number; // sum of SERVICES.actualPaid — paid directly against a charge
  paid: number; // paymentsTotal + servicesPaidTotal (both sources of money received)
  balance: number; // grandTotal - paid
  advanceDue: number; // advance to be paid minus advance/partial payments so far (>= 0)
};

type ListTripsOpts = {
  year?: number; // filter to a single year; omit for all years (2024+)
  includeAllStatuses?: boolean; // include Inquiry/Dead/Cancelled stages too
  search?: string; // matched in memory against trip/customer name/email/phone
};

export async function listTrips(opts: ListTripsOpts = {}): Promise<TripSummary[]> {
  const clauses = [`{Trip Name}!=''`, `{Arrival Date}!=''`, `IS_AFTER({Arrival Date}, DATETIME_PARSE("2023-12-31"))`];
  if (opts.year) clauses.push(`YEAR({Arrival Date}) = ${opts.year}`);
  if (!opts.includeAllStatuses) {
    clauses.push(`OR(${DEFAULT_VISIBLE_STATUSES.map((s) => `{Inquiry status}='${s}'`).join(",")})`);
  }

  const records = await listRecords(TABLES.MASTER_TRIPS, {
    fields: [
      TRIP.tripName,
      TRIP.crmContact,
      TRIP.arrivalDate,
      TRIP.checkoutDate,
      TRIP.agreedCost,
      TRIP.paymentStatus,
      TRIP.inquiryStatus,
      TRIP.balanceDueFormula,
    ],
    sort: [{ field: TRIP.arrivalDate, direction: "desc" }],
    filterByFormula: `AND(${clauses.join(",")})`,
  });

  const contactIds = Array.from(new Set(records.flatMap((r) => asIds(r.fields[TRIP.crmContact]))));
  const contacts = await getCrmContacts(contactIds);
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  let summaries: TripSummary[] = records.map((r) => {
    const [contactId] = asIds(r.fields[TRIP.crmContact]);
    const contact = contactId ? contactById.get(contactId) : undefined;
    return {
      id: r.id,
      tripName: asString(r.fields[TRIP.tripName]),
      customerName: contact?.fullName ?? "",
      arrivalDate: asString(r.fields[TRIP.arrivalDate]),
      checkoutDate: asString(r.fields[TRIP.checkoutDate]),
      agreedCost: asNumber(r.fields[TRIP.agreedCost]),
      paymentStatus: asString(r.fields[TRIP.paymentStatus]),
      inquiryStatus: asString(r.fields[TRIP.inquiryStatus]),
      balanceDue: asNumber(r.fields[TRIP.balanceDueFormula]),
    };
  });

  if (opts.search?.trim()) {
    const q = opts.search.trim().toLowerCase();
    summaries = summaries.filter((s) =>
      [s.tripName, s.customerName].some((v) => v.toLowerCase().includes(q))
    );
  }

  return summaries;
}

export async function getTrip(tripId: string): Promise<Trip> {
  const record = await getRecord(TABLES.MASTER_TRIPS, tripId);
  const f = record.fields;
  const [crmContactId] = asIds(f[TRIP.crmContact]);

  const [subtripRecords, paymentRecords, chargeRecords, miscChargeRecords, contacts] = await Promise.all([
    getRecordsByIds(TABLES.SUBTRIPS, asIds(f[TRIP.subtrips]), [
      SUBTRIP.name,
      SUBTRIP.arrivalDate,
      SUBTRIP.checkoutDate,
      SUBTRIP.nights,
      SUBTRIP.agreedCost,
      SUBTRIP.status,
    ]),
    getRecordsByIds(TABLES.PAYMENTS, asIds(f[TRIP.payments]), [
      PAYMENT.name,
      PAYMENT.amount,
      PAYMENT.date,
      PAYMENT.method,
      PAYMENT.type,
      PAYMENT.reference,
    ]),
    getRecordsByIds(TABLES.SERVICES, asIds(f[TRIP.services]), [
      CHARGE.lineItems,
      CHARGE.serviceType,
      CHARGE.amountToBePaid,
      CHARGE.actualPaid,
      CHARGE.paymentStatus,
      CHARGE.date,
      CHARGE.dueDate,
      CHARGE.datePaid,
      CHARGE.notes,
      CHARGE.subtrips,
    ]),
    getRecordsByIds(TABLES.MISC_CHARGES, asIds(f[TRIP.miscCharges]), [
      MISC_CHARGE.name,
      MISC_CHARGE.chargeType,
      MISC_CHARGE.amount,
      MISC_CHARGE.reading,
      MISC_CHARGE.readingDate,
      MISC_CHARGE.notes,
      MISC_CHARGE.photo,
    ]),
    getCrmContacts(crmContactId ? [crmContactId] : []),
  ]);

  const customer = contacts[0] ?? null;

  const subtrips: Subtrip[] = subtripRecords
    .map((r) => ({
      id: r.id,
      name: asString(r.fields[SUBTRIP.name]),
      arrivalDate: asString(r.fields[SUBTRIP.arrivalDate]),
      checkoutDate: asString(r.fields[SUBTRIP.checkoutDate]),
      nights: asNumber(r.fields[SUBTRIP.nights]),
      agreedCost: asNumber(r.fields[SUBTRIP.agreedCost]),
      status: asString(r.fields[SUBTRIP.status]),
    }))
    .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate));

  const payments: Payment[] = paymentRecords
    .map((r) => ({
      id: r.id,
      label: asString(r.fields[PAYMENT.name]),
      amount: asNumber(r.fields[PAYMENT.amount]),
      date: asString(r.fields[PAYMENT.date]),
      method: asString(r.fields[PAYMENT.method]),
      type: asString(r.fields[PAYMENT.type]),
      reference: asString(r.fields[PAYMENT.reference]),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const charges: Charge[] = chargeRecords
    .map((r) => ({
      id: r.id,
      description: asString(r.fields[CHARGE.lineItems]) || asString(r.fields[CHARGE.serviceType]),
      serviceType: asString(r.fields[CHARGE.serviceType]),
      amount: asNumber(r.fields[CHARGE.amountToBePaid]),
      paid: asNumber(r.fields[CHARGE.actualPaid]),
      status: asString(r.fields[CHARGE.paymentStatus]) || CHARGE_STATUS.NOT_PAID,
      date: asString(r.fields[CHARGE.date]),
      dueDate: asString(r.fields[CHARGE.dueDate]),
      datePaid: asString(r.fields[CHARGE.datePaid]),
      notes: asString(r.fields[CHARGE.notes]),
      subtripIds: asIds(r.fields[CHARGE.subtrips]),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const miscCharges: MiscCharge[] = miscChargeRecords
    .map((r) => {
      const attachments = r.fields[MISC_CHARGE.photo] as { url?: string }[] | undefined;
      const photoUrl = Array.isArray(attachments) ? attachments[0]?.url ?? "" : "";
      return {
        id: r.id,
        name: asString(r.fields[MISC_CHARGE.name]),
        chargeType: asString(r.fields[MISC_CHARGE.chargeType]),
        amount: asNumber(r.fields[MISC_CHARGE.amount]),
        reading: asNumber(r.fields[MISC_CHARGE.reading]),
        readingDate: asString(r.fields[MISC_CHARGE.readingDate]),
        notes: asString(r.fields[MISC_CHARGE.notes]),
        photoUrl,
      };
    })
    .sort((a, b) => b.readingDate.localeCompare(a.readingDate));

  const agreedCost = asNumber(f[TRIP.agreedCost]);
  const securityDeposit = asNumber(f[TRIP.securityDeposit]);
  const advanceToBePaid = asNumber(f[TRIP.advanceToBePaid]);

  const accommodation = agreedCost + subtrips.reduce((s, t) => s + t.agreedCost, 0);
  const servicesBillTotal = charges.reduce((s, c) => s + c.amount, 0);
  const grandTotal = accommodation + servicesBillTotal + securityDeposit;

  const paymentsTotal = payments.reduce((s, p) => s + p.amount, 0);
  const servicesPaidTotal = charges.reduce((s, c) => s + c.paid, 0);
  const paid = paymentsTotal + servicesPaidTotal;

  const advancePaidSoFar = payments
    .filter((p) => (ADVANCE_COUNTING_TYPES as readonly string[]).includes(p.type))
    .reduce((s, p) => s + p.amount, 0);

  const totals: Totals = {
    accommodation,
    servicesBillTotal,
    securityDeposit,
    grandTotal,
    paymentsTotal,
    servicesPaidTotal,
    paid,
    balance: grandTotal - paid,
    advanceDue: Math.max(0, advanceToBePaid - advancePaidSoFar),
  };

  return {
    id: record.id,
    tripName: asString(f[TRIP.tripName]),
    customer,
    guestName: customer?.fullName || asString(f[TRIP.guestFullName]),
    guestEmail: customer?.email || asString(f[TRIP.guestEmail]),
    guestPhone: customer?.phone || asString(f[TRIP.guestPhone]),
    invoiceAddress: asString(f[TRIP.invoiceAddress]),
    arrivalDate: asString(f[TRIP.arrivalDate]),
    checkoutDate: asString(f[TRIP.checkoutDate]),
    totalNights: asNumber(f[TRIP.totalNights]),
    agreedCost,
    securityDeposit,
    advanceToBePaid,
    paymentStatus: asString(f[TRIP.paymentStatus]),
    inquiryStatus: asString(f[TRIP.inquiryStatus]),
    inquiryType: asString(f[TRIP.inquiryType]),
    checkedIn: Boolean(f[TRIP.checkedIn]),
    checkedOut: Boolean(f[TRIP.checkedOut]),
    invoiceNumber: asString(f[TRIP.invoiceNumber]) || record.id.slice(-6).toUpperCase(),
    subtrips,
    payments,
    charges,
    miscCharges,
    totals,
    reference: {
      balanceDueFormula: asNumber(f[TRIP.balanceDueFormula]),
      totalPayableFormula: asNumber(f[TRIP.totalPayableFormula]),
    },
  };
}
