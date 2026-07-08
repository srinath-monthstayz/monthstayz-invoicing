/**
 * Data layer: assembles a Trip (master trip + subtrips + payments + charges)
 * from Airtable and computes all invoice/receipt totals in one place.
 */
import {
  asIds,
  asNumber,
  asString,
  getRecord,
  getRecordsByIds,
  listRecords,
} from "./airtable";
import { CHARGE, CHARGE_STATUS, PAYMENT, SUBTRIP, TABLES, TRIP } from "./schema";

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
  arrivalDate: string;
  checkoutDate: string;
  agreedCost: number;
  paymentStatus: string;
  balanceDue: number;
};

export type Trip = {
  id: string;
  tripName: string;
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
  invoiceNumber: string;
  subtrips: Subtrip[];
  payments: Payment[];
  charges: Charge[];
  totals: Totals;
};

export type Totals = {
  accommodation: number; // master agreed cost + all subtrip agreed costs
  charges: number; // all services & charges
  securityDeposit: number;
  grandTotal: number; // accommodation + charges + deposit
  paid: number; // sum of all payments (refunds are negative payments)
  balance: number; // grandTotal - paid
  advanceDue: number; // advance to be paid minus what's already paid (>= 0)
};

export async function listTrips(limit = 100): Promise<TripSummary[]> {
  const records = await listRecords(TABLES.MASTER_TRIPS, {
    fields: [
      TRIP.tripName,
      TRIP.arrivalDate,
      TRIP.checkoutDate,
      TRIP.agreedCost,
      TRIP.paymentStatus,
      TRIP.balanceDueFormula,
    ],
    sort: [{ field: TRIP.arrivalDate, direction: "desc" }],
    maxRecords: limit,
    // only trips that have a name and an arrival date
    filterByFormula: `AND({Trip Name}!='', {Arrival Date}!='')`,
  });
  return records.map((r) => ({
    id: r.id,
    tripName: asString(r.fields[TRIP.tripName]),
    arrivalDate: asString(r.fields[TRIP.arrivalDate]),
    checkoutDate: asString(r.fields[TRIP.checkoutDate]),
    agreedCost: asNumber(r.fields[TRIP.agreedCost]),
    paymentStatus: asString(r.fields[TRIP.paymentStatus]),
    balanceDue: asNumber(r.fields[TRIP.balanceDueFormula]),
  }));
}

export async function getTrip(tripId: string): Promise<Trip> {
  const record = await getRecord(TABLES.MASTER_TRIPS, tripId);
  const f = record.fields;

  const [subtripRecords, paymentRecords, chargeRecords] = await Promise.all([
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
  ]);

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
      status: asString(r.fields[CHARGE.paymentStatus]) || CHARGE_STATUS.TO_PAY,
      date: asString(r.fields[CHARGE.date]),
      dueDate: asString(r.fields[CHARGE.dueDate]),
      datePaid: asString(r.fields[CHARGE.datePaid]),
      notes: asString(r.fields[CHARGE.notes]),
      subtripIds: asIds(r.fields[CHARGE.subtrips]),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const agreedCost = asNumber(f[TRIP.agreedCost]);
  const securityDeposit = asNumber(f[TRIP.securityDeposit]);
  const advanceToBePaid = asNumber(f[TRIP.advanceToBePaid]);

  const accommodation = agreedCost + subtrips.reduce((s, t) => s + t.agreedCost, 0);
  const chargesTotal = charges.reduce((s, c) => s + c.amount, 0);
  const grandTotal = accommodation + chargesTotal + securityDeposit;
  const paid = payments.reduce((s, p) => s + p.amount, 0);

  const totals: Totals = {
    accommodation,
    charges: chargesTotal,
    securityDeposit,
    grandTotal,
    paid,
    balance: grandTotal - paid,
    advanceDue: Math.max(0, advanceToBePaid - paid),
  };

  return {
    id: record.id,
    tripName: asString(f[TRIP.tripName]),
    guestName: asString(f[TRIP.guestFullName]),
    guestEmail: asString(f[TRIP.guestEmail]),
    guestPhone: asString(f[TRIP.guestPhone]),
    invoiceAddress: asString(f[TRIP.invoiceAddress]),
    arrivalDate: asString(f[TRIP.arrivalDate]),
    checkoutDate: asString(f[TRIP.checkoutDate]),
    totalNights: asNumber(f[TRIP.totalNights]),
    agreedCost,
    securityDeposit,
    advanceToBePaid,
    paymentStatus: asString(f[TRIP.paymentStatus]),
    invoiceNumber: asString(f[TRIP.invoiceNumber]) || record.id.slice(-6).toUpperCase(),
    subtrips,
    payments,
    charges,
    totals,
  };
}
