import { getTrip } from "@/lib/trips";
import { company, fmtDate, money } from "@/lib/format";
import { CHARGE_STATUS } from "@/lib/schema";
import DocShell from "@/components/DocShell";

export const dynamic = "force-dynamic";

/**
 * RECEIPT / STATEMENT — issued after every payment, and as the final
 * statement at the end of the stay. Lists every payment with its date in a
 * running table, all charges with paid dates, and the remaining balance.
 * When the balance is zero it reads as the final receipt for the whole stay.
 */
export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  const co = company();
  const t = trip.totals;
  const settled = t.balance <= 0;

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
          <div className="text-lg font-bold">{co.name}</div>
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

      {/* What the stay costs */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Summary of charges</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-1">Accommodation (master trip)</td>
              <td className="py-1 text-right">{money(trip.agreedCost)}</td>
            </tr>
            {trip.subtrips.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-1">Extension {fmtDate(s.arrivalDate)} → {fmtDate(s.checkoutDate)}</td>
                <td className="py-1 text-right">{money(s.agreedCost)}</td>
              </tr>
            ))}
            {trip.charges.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="py-1">
                  {c.description}
                  <span
                    className={
                      c.status === CHARGE_STATUS.PAID
                        ? "ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800"
                        : "ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800"
                    }
                  >
                    {c.status === CHARGE_STATUS.PAID
                      ? `Paid${c.datePaid ? " " + fmtDate(c.datePaid) : ""}`
                      : "To pay"}
                  </span>
                </td>
                <td className="py-1 text-right">{money(c.amount)}</td>
              </tr>
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

      {/* Every payment, dated */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Payments received</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-600">
              <th className="py-2">#</th>
              <th className="py-2">Date</th>
              <th className="py-2">Type</th>
              <th className="py-2">Method</th>
              <th className="py-2">Reference</th>
              <th className="py-2 text-right">Amount</th>
              <th className="py-2 text-right">Balance after</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let running = t.grandTotal;
              return trip.payments.map((p, i) => {
                running -= p.amount;
                return (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2">{i + 1}</td>
                    <td className="py-2">{fmtDate(p.date)}</td>
                    <td className="py-2">{p.type || "Payment"}</td>
                    <td className="py-2">{p.method || "—"}</td>
                    <td className="py-2">{p.reference || "—"}</td>
                    <td className="py-2 text-right font-medium">{money(p.amount)}</td>
                    <td className="py-2 text-right text-slate-500">{money(Math.max(running, 0))}</td>
                  </tr>
                );
              });
            })()}
            {trip.payments.length === 0 && (
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

      <section
        className={`rounded-lg p-4 text-sm ${settled ? "bg-emerald-50" : "bg-brand-light"}`}
      >
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
        This receipt lists all payments received for the stay including extensions and services.
        {co.name} — {co.email}
      </footer>
    </DocShell>
  );
}
