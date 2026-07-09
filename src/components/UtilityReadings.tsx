import type { MiscCharge } from "@/lib/trips";
import { fmtDate, money } from "@/lib/format";

/** Read-only reference block — Misc Charges (meter readings etc.) stay separate from billable SERVICES. */
export default function UtilityReadings({ items }: { items: MiscCharge[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Utility readings (reference)</h2>
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Type</th>
            <th className="px-2 py-1 text-right">Reading</th>
            <th className="px-2 py-1 text-right">Amount</th>
            <th className="px-2 py-1">Notes</th>
            <th className="px-2 py-1">Photo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id} className="border-t border-slate-100">
              <td className="px-2 py-2">{fmtDate(m.readingDate)}</td>
              <td className="px-2 py-2">{m.chargeType || m.name || "—"}</td>
              <td className="px-2 py-2 text-right">{m.reading || "—"}</td>
              <td className="px-2 py-2 text-right">{money(m.amount)}</td>
              <td className="px-2 py-2 text-slate-500">{m.notes || "—"}</td>
              <td className="px-2 py-2">
                {m.photoUrl ? (
                  <a href={m.photoUrl} target="_blank" rel="noreferrer" className="text-brand-dark hover:underline">
                    View
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Meter readings recorded in Airtable&apos;s Misc Charges table — kept separate from billable
        services. Staff convert a reading into a SERVICES charge manually if it should appear on the
        invoice.
      </p>
    </section>
  );
}
