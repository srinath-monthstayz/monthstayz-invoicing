/**
 * Groups a trip's charges into "Original stay" + one section per extension
 * (Subtrip), and builds one merged, dated ledger across both the Payments
 * table and money paid directly against SERVICES charges — used by the
 * Invoice and Receipt pages so extensions and mixed payment sources both
 * read as one coherent document.
 */
import type { Charge, Payment, Subtrip } from "./trips";

export type StaySection = {
  key: string;
  label: string;
  arrivalDate: string;
  checkoutDate: string;
  agreedCost: number;
  charges: Charge[];
};

export function buildSections(trip: {
  arrivalDate: string;
  checkoutDate: string;
  agreedCost: number;
  subtrips: Subtrip[];
  charges: Charge[];
}): StaySection[] {
  const sections: StaySection[] = [
    {
      key: "master",
      label: "Original stay",
      arrivalDate: trip.arrivalDate,
      checkoutDate: trip.checkoutDate,
      agreedCost: trip.agreedCost,
      charges: trip.charges.filter((c) => c.subtripIds.length === 0),
    },
  ];
  for (const s of trip.subtrips) {
    sections.push({
      key: s.id,
      label: `Extension${s.name ? `: ${s.name}` : ""}`,
      arrivalDate: s.arrivalDate,
      checkoutDate: s.checkoutDate,
      agreedCost: s.agreedCost,
      charges: trip.charges.filter((c) => c.subtripIds.includes(s.id)),
    });
  }
  return sections;
}

export type LedgerEntry = {
  id: string;
  date: string;
  label: string;
  method: string;
  reference: string;
  amount: number;
};

/** Every payment received, whichever table it was recorded against, in date order. */
export function buildLedger(trip: { payments: Payment[]; charges: Charge[] }): LedgerEntry[] {
  const entries: LedgerEntry[] = trip.payments.map((p) => ({
    id: `payment-${p.id}`,
    date: p.date,
    label: p.type || "Payment",
    method: p.method,
    reference: p.reference,
    amount: p.amount,
  }));
  for (const c of trip.charges) {
    if (c.paid > 0) {
      entries.push({
        id: `charge-${c.id}`,
        date: c.datePaid || c.date,
        label: `Charge paid — ${c.description}`,
        method: "",
        reference: "",
        amount: c.paid,
      });
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}
