import { Fragment } from "react";
import { getTrip } from "@/lib/trips";
import { company, fmtDate, money } from "@/lib/format";
import { buildSections } from "@/lib/sections";
import DocShell from "@/components/DocShell";

export const dynamic = "force-dynamic";

/**
 * INVOICE — issued when the customer agrees to the price, before any money
 * has moved. Gross figures only (no paid/unpaid split — that's the
 * Receipt's job): agreed cost, security deposit, every charge at full
 * amount, and the advance still due to confirm the booking.
 */
export default async function InvoicePage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  const co = company();
  const t = trip.totals;
  const sections = buildSections(trip);

  return (
    <DocShell backHref={`/trips/${trip.id}`}>
      <header className="mb-8 flex items-start justify-between border-b-4 border-brand pb-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">INVOICE</h1>
          <p className="text-sm text-slate-500">No. {trip.invoiceNumber}</p>
          <p className="text-sm text-slate-500">Date: {fmtDate(new Date().toISOString().slice(0, 10))}</p>
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
          <div className="mb-1 font-semibold uppercase text-slate-500">Billed to</div>
          <div className="font-medium">{trip.guestName || "Guest"}</div>
          {trip.guestEmail && <div>{trip.guestEmail}</div>}
          {trip.guestPhone && <div>{trip.guestPhone}</div>}
          {trip.customer?.country && <div>{trip.customer.country}</div>}
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
          {sections.map((s) => (
            <Fragment key={s.key}>
              {s.key !== "master" && (
                <tr key={`${s.key}-header`}>
                  <td colSpan={2} className="pt-3 text-xs font-semibold uppercase text-slate-400">
                    {s.label} · {fmtDate(s.arrivalDate)} → {fmtDate(s.checkoutDate)}
                  </td>
                </tr>
              )}
              <tr key={`${s.key}-accommodation`} className="border-b border-slate-100">
                <td className="py-2">
                  {s.key === "master" ? "Accommodation" : "Extension accommodation"} —{" "}
                  {fmtDate(s.arrivalDate)} to {fmtDate(s.checkoutDate)}
                </td>
                <td className="py-2 text-right">{money(s.agreedCost)}</td>
              </tr>
              {s.charges.map((c) => (
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
            </Fragment>
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

      <section className="rounded-lg bg-brand-light p-4 text-sm">
        <div className="flex justify-between py-1">
          <span>Agreed accommodation + extensions</span>
          <span>{money(t.accommodation)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Services &amp; charges</span>
          <span>{money(t.servicesBillTotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Security deposit (refundable)</span>
          <span>{money(trip.securityDeposit)}</span>
        </div>
        <div className="flex justify-between border-t border-brand py-2 text-base font-bold text-brand-dark">
          <span>Total payable</span>
          <span>{money(t.grandTotal)}</span>
        </div>
        <div className="mt-2 rounded bg-white px-3 py-2 font-semibold text-amber-700">
          Advance / reservation deposit to be paid now to confirm this booking: {money(t.advanceDue)}
        </div>
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        The security deposit is refundable at checkout subject to property condition. The balance
        of the agreed cost is payable on arrival unless agreed otherwise. Thank you for choosing{" "}
        {co.name}.
      </footer>
    </DocShell>
  );
}
