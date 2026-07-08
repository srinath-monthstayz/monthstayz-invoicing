import { getTrip } from "@/lib/trips";
import { company, fmtDate, money } from "@/lib/format";
import { CHARGE_STATUS } from "@/lib/schema";
import DocShell from "@/components/DocShell";

export const dynamic = "force-dynamic";

/**
 * INVOICE — issued at inquiry/confirmation time.
 * Shows agreed cost (master + extensions), security deposit, services still
 * "To pay", the advance due now, and any payments already received.
 */
export default async function InvoicePage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  const co = company();
  const t = trip.totals;
  const unpaidCharges = trip.charges.filter((c) => c.status !== CHARGE_STATUS.PAID);
  const paidCharges = trip.charges.filter((c) => c.status === CHARGE_STATUS.PAID);

  return (
    <DocShell backHref={`/trips/${trip.id}`}>
      <header className="mb-8 flex items-start justify-between border-b-4 border-brand pb-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">INVOICE</h1>
          <p className="text-sm text-slate-500">No. {trip.invoiceNumber}</p>
          <p className="text-sm text-slate-500">Date: {fmtDate(new Date().toISOString().slice(0, 10))}</p>
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
          <div className="mb-1 font-semibold uppercase text-slate-500">Billed to</div>
          <div className="font-medium">{trip.guestName || "Guest"}</div>
          {trip.guestEmail && <div>{trip.guestEmail}</div>}
          {trip.guestPhone && <div>{trip.guestPhone}</div>}
          {trip.invoiceAddress && <div className="whitespace-pre-line">{trip.invoiceAddress}</div>}
        </div>
        <div>
          <div className="mb-1 font-semibold uppercase text-slate-500">Stay</div>
          <div className="font-medium">{trip.tripName}</div>
          <div>
            {fmtDate(trip.arrivalDate)} → {fmtDate(trip.checkoutDate)} ({trip.totalNights} nights)
          </div>
        </div>
      </section>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-600">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-2">
              Accommodation — {fmtDate(trip.arrivalDate)} to {fmtDate(trip.checkoutDate)} (
              {trip.totalNights} nights)
            </td>
            <td className="py-2 text-right">{money(trip.agreedCost)}</td>
          </tr>
          {trip.subtrips.map((s) => (
            <tr key={s.id} className="border-b border-slate-100">
              <td className="py-2">
                Stay extension — {fmtDate(s.arrivalDate)} to {fmtDate(s.checkoutDate)} ({s.nights}{" "}
                nights)
              </td>
              <td className="py-2 text-right">{money(s.agreedCost)}</td>
            </tr>
          ))}
          {unpaidCharges.map((c) => (
            <tr key={c.id} className="border-b border-slate-100">
              <td className="py-2">
                {c.description}
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                  To pay{c.dueDate ? ` by ${fmtDate(c.dueDate)}` : ""}
                </span>
              </td>
              <td className="py-2 text-right">{money(c.amount)}</td>
            </tr>
          ))}
          {paidCharges.map((c) => (
            <tr key={c.id} className="border-b border-slate-100 text-slate-500">
              <td className="py-2">
                {c.description}
                <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800">
                  Paid {c.datePaid ? fmtDate(c.datePaid) : ""}
                </span>
              </td>
              <td className="py-2 text-right">{money(c.amount)}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-100">
            <td className="py-2">Security deposit (refundable)</td>
            <td className="py-2 text-right">{money(trip.securityDeposit)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 text-base font-bold">
            <td className="py-2">Total payable</td>
            <td className="py-2 text-right">{money(t.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {trip.payments.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">
            Payments received so far
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {trip.payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-1">
                    {fmtDate(p.date)} — {p.type || "Payment"}
                    {p.method ? ` (${p.method})` : ""}
                  </td>
                  <td className="py-1 text-right">{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="rounded-lg bg-brand-light p-4 text-sm">
        <div className="flex justify-between py-1">
          <span>Total payable</span>
          <span>{money(t.grandTotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Paid to date</span>
          <span>− {money(t.paid)}</span>
        </div>
        <div className="flex justify-between border-t border-brand py-2 text-base font-bold text-brand-dark">
          <span>Balance</span>
          <span>{money(t.balance)}</span>
        </div>
        {t.advanceDue > 0 && (
          <div className="mt-2 rounded bg-white px-3 py-2 font-semibold text-amber-700">
            Advance to be paid now to confirm this booking: {money(t.advanceDue)}
          </div>
        )}
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        The security deposit is refundable at checkout subject to property condition. The balance
        of the agreed cost is payable on arrival unless agreed otherwise. Thank you for choosing{" "}
        {co.name}.
      </footer>
    </DocShell>
  );
}
