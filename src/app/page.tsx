import Link from "next/link";
import { listTrips } from "@/lib/trips";
import { fmtDate, money } from "@/lib/format";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await listTrips(150);
  return (
    <div>
      <AutoRefresh seconds={30} />
      <h1 className="mb-4 text-2xl font-bold">Trips</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Trip</th>
              <th className="px-4 py-2">Arrival</th>
              <th className="px-4 py-2">Checkout</th>
              <th className="px-4 py-2 text-right">Agreed cost</th>
              <th className="px-4 py-2 text-right">Balance due</th>
              <th className="px-4 py-2">Payment status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-brand-light">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trips/${t.id}`} className="text-brand-dark hover:underline">
                    {t.tripName || t.id}
                  </Link>
                </td>
                <td className="px-4 py-2">{fmtDate(t.arrivalDate)}</td>
                <td className="px-4 py-2">{fmtDate(t.checkoutDate)}</td>
                <td className="px-4 py-2 text-right">{money(t.agreedCost)}</td>
                <td className="px-4 py-2 text-right">
                  <span className={t.balanceDue > 0 ? "font-semibold text-amber-700" : "text-emerald-700"}>
                    {money(t.balanceDue)}
                  </span>
                </td>
                <td className="px-4 py-2">{t.paymentStatus || "—"}</td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No trips found in Airtable.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
