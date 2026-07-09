import Link from "next/link";
import { getTrip } from "@/lib/trips";
import { fmtDate, money } from "@/lib/format";
import AutoRefresh from "@/components/AutoRefresh";
import PaymentsEditor from "@/components/PaymentsEditor";
import ChargesEditor from "@/components/ChargesEditor";
import CustomerCard from "@/components/CustomerCard";
import TripStatusEditor from "@/components/TripStatusEditor";
import UtilityReadings from "@/components/UtilityReadings";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  const t = trip.totals;
  const baseId = process.env.AIRTABLE_BASE_ID ?? "";

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={15} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-brand-dark hover:underline">
            ← All trips
          </Link>
          <h1 className="text-2xl font-bold">{trip.tripName}</h1>
          <p className="flex flex-wrap items-center gap-2 text-slate-600">
            <span>
              {trip.guestName} · {fmtDate(trip.arrivalDate)} → {fmtDate(trip.checkoutDate)} ·{" "}
              {trip.totalNights} nights
            </span>
            <StatusBadge status={trip.inquiryStatus} />
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/trips/${trip.id}/invoice`}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Invoice
          </Link>
          <Link
            href={`/trips/${trip.id}/receipt`}
            className="rounded-md border border-brand px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light"
          >
            Receipt / Statement
          </Link>
        </div>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total payable" value={money(t.grandTotal)} />
        <Stat label="Paid so far" value={money(t.paid)} tone="good" />
        <Stat label="Balance" value={money(t.balance)} tone={t.balance > 0 ? "warn" : "good"} />
        <Stat label="Advance still due" value={money(t.advanceDue)} />
      </div>
      <p className="text-xs text-slate-500">
        Airtable reference — Balance Due: {money(trip.reference.balanceDueFormula)} · Total payable
        on arrival: {money(trip.reference.totalPayableFormula)} (these are the base&apos;s own
        formula fields; the figures above account for subtrips and services paid directly, so they
        are the authoritative ones for invoices/receipts).
      </p>

      <CustomerCard
        customer={trip.customer}
        fallbackName={trip.guestName}
        fallbackEmail={trip.guestEmail}
        fallbackPhone={trip.guestPhone}
        baseId={baseId}
      />

      <TripStatusEditor
        tripId={trip.id}
        inquiryStatus={trip.inquiryStatus}
        inquiryType={trip.inquiryType}
        checkedIn={trip.checkedIn}
        checkedOut={trip.checkedOut}
      />

      {/* Stay breakdown: master trip + extensions */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Stay (master trip + extensions)</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-1">Segment</th>
              <th className="py-1">Dates</th>
              <th className="py-1 text-right">Nights</th>
              <th className="py-1 text-right">Agreed cost</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="py-2 font-medium">Master trip</td>
              <td className="py-2">
                {fmtDate(trip.arrivalDate)} → {fmtDate(trip.checkoutDate)}
              </td>
              <td className="py-2 text-right">{trip.totalNights}</td>
              <td className="py-2 text-right">{money(trip.agreedCost)}</td>
            </tr>
            {trip.subtrips.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-2">
                  ↳ Extension {s.name && `(${s.name})`}
                  <span className="ml-1 text-xs text-slate-400">{s.status}</span>
                </td>
                <td className="py-2">
                  {fmtDate(s.arrivalDate)} → {fmtDate(s.checkoutDate)}
                </td>
                <td className="py-2 text-right">{s.nights}</td>
                <td className="py-2 text-right">{money(s.agreedCost)}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 font-semibold">
              <td className="py-2" colSpan={3}>
                Accommodation total
              </td>
              <td className="py-2 text-right">{money(t.accommodation)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">
          Extensions are Subtrip records in Airtable linked to this master trip. Add one there
          and it appears here automatically.
        </p>
      </section>

      {/* Services & charges */}
      <ChargesEditor tripId={trip.id} charges={trip.charges} subtrips={trip.subtrips} />

      {/* Payments */}
      <PaymentsEditor tripId={trip.id} payments={trip.payments} subtrips={trip.subtrips} />

      {/* Utility readings (read-only reference) */}
      <UtilityReadings items={trip.miscCharges} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const color =
    tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
