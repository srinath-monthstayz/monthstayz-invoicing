import { Fragment } from "react";
import { getTrip } from "@/lib/trips";
import { company, fmtDate, money } from "@/lib/format";
import { CHARGE_STATUS } from "@/lib/schema";
import { buildLedger, buildSections } from "@/lib/sections";
import DocShell from "@/components/DocShell";

export const dynamic = "force-dynamic";

/**
 * RECEIPT / STATEMENT — generated as payments come in, and as the final
 * statement at the end of the stay. Lists every payment (from the Payments
 * ledger and money paid directly against a charge) with its date in one
 * merged, running table, plus every charge with its paid/unpaid status.
 */
export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  const co = company();
  const t = trip.totals;
  const settled = t.balance <= 0;
  const sections = buildSections(trip);
  const ledger = buildLedger(trip);

  return (
    <DocShell backHref={`/trips/${trip.id}`}>
      <header className="mb-8 flex items-start justify-between border-b-4 border-brand pb-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">
            {settled ? "RECEIPT — PAID IN FULL" : "PAYMENT RECEIPT"}
          </h1>
          <p className="text-sm text-slate-500">Ref. {trip.invoiceNumber}</p>
          <p className="text-sm text-slate-500">
            Issued: {fmtDate(new Date().toISOString().slice(0, 10))}
          </p>
        </div>
        <div className="text-right text-sm">
          <img src={co.logoUrl} alt={co.name} className="mb-1 ml-auto h-10" />
          <div className="text-lg font-bold">{co.name}</div>
          <div className="text-xs text-slate-500">{co.tagline}</div>
          {co.address && <div>{co.address}</div>}
          {co.email && <div>{co.email}</div>}
          {co.phone && <div>{co.phone}</div>}
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="mb-1 font-semibold uppercase text-slate-500">Received from</div>
          <div className="font-medium">{trip.guestName || "Guest"}</div>
          {trip.guestEmail && <div>{trip.guestEmail}</div>}
          {trip.guestPhone && <div>{trip.guestPhone}</div>}
        </div>
        <div>
          <div className="mb-1 font-semibold uppercase text-slate-500">Stay</div>
          <div className="font-medium">{trip.tripName}</div>
          <div>
            {fmtDate(trip.arrivalDate)} → {fmtDate(trip.checkoutDate)} ({trip.totalNights} nights)
          </div>
          {trip.subtrips.map((s) => (
            <div key={s.id}>
              + extension {fmtDate(s.arrivalDate)} → {fmtDate(s.checkoutDate)} ({s.nights} nights)
            </div>
          ))}
        </div>
      </section>

      {/* What the stay costs, by section, with paid/unpaid status */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Summary of charges</h2>
        <table className="w-full text-sm">
          <tbody>
            {sections.map((s) => (
              <Fragment key={s.key}>
                {s.key !== "master" && (
                  <tr>
                    <td colSpan={2} className="pt-3 text-xs font-semibold uppercase text-slate-400">
                      {s.label} · {fmtDate(s.arrivalDate)} → {fmtDate(s.checkoutDate)}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-slate-100">
                  <td className="py-1">
                    {s.key === "master" ? "Accommodation" : "Extension accommodation"}
                  </td>
                  <td className="py-1 text-right">{money(s.agreedCost)}</td>
                </tr>
                {s.charges.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-1">
                      {c.description}
                      <span
                        className={
                          c.status === CHARGE_STATUS.FULLY_PAID
                            ? "ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800"
                            : c.status === CHARGE_STATUS.PARTIALLY_PAID
                              ? "ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800"
                              : "ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                        }
                      >
                        {c.status}
                        {c.paid > 0 && c.datePaid ? ` · ${fmtDate(c.datePaid)}` : ""}
                      </span>
                    </td>
                    <td className="py-1 text-right">{money(c.amount)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr className="border-b border-slate-100">
              <td className="py-1">Security deposit (refundable)</td>
              <td className="py-1 text-right">{money(trip.securityDeposit)}</td>
            </tr>
            <tr className="font-bold">
              <td className="py-2">Total</td>
              <td className="py-2 text-right">{money(t.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Every payment, dated — merged across the Payments ledger and charges paid directly */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Payments received</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-600">
              <th className="py-2">#</th>
              <th className="py-2">Date</th>
              <th className="py-2">Description</th>
              <th className="py-2">Method</th>
              <th className="py-2">Reference</th>
              <th className="py-2 text-right">Amount</th>
              <th className="py-2 text-right">Balance after</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let running = t.grandTotal;
              return ledger.map((entry, i) => {
                running -= entry.amount;
                return (
                  <tr key={entry.id} className="border-b border-slate-100">
                    <td className="py-2">{i + 1}</td>
                    <td className="py-2">{fmtDate(entry.date)}</td>
                    <td className="py-2">{entry.label}</td>
                    <td className="py-2">{entry.method || "—"}</td>
                    <td className="py-2">{entry.reference || "—"}</td>
                    <td className="py-2 text-right font-medium">{money(entry.amount)}</td>
                    <td className="py-2 text-right text-slate-500">{money(Math.max(running, 0))}</td>
                  </tr>
                );
              });
            })()}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-500">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold">
              <td className="py-2" colSpan={5}>
                Total paid
              </td>
              <td className="py-2 text-right">{money(t.paid)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </section>

      <section className={`rounded-lg p-4 text-sm ${settled ? "bg-emerald-50" : "bg-brand-light"}`}>
        <div className="flex justify-between py-1">
          <span>Total (incl. refundable deposit)</span>
          <span>{money(t.grandTotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Total paid</span>
          <span>− {money(t.paid)}</span>
        </div>
        <div
          className={`flex justify-between border-t py-2 text-base font-bold ${
            settled ? "border-emerald-300 text-emerald-800" : "border-brand text-brand-dark"
          }`}
        >
          <span>{settled ? "Balance — fully settled" : "Balance remaining"}</span>
          <span>{money(Math.max(t.balance, 0))}</span>
        </div>
        {t.balance < 0 && (
          <div className="mt-2 rounded bg-white px-3 py-2 font-semibold text-emerald-700">
            Amount refundable to guest: {money(-t.balance)}
          </div>
        )}
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        This receipt lists all payments received for the stay including extensions and services.{" "}
        {co.name} — {co.email}
      </footer>
    </DocShell>
  );
}
