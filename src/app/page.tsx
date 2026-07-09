import Link from "next/link";
import { listTrips } from "@/lib/trips";
import { fmtDate, money } from "@/lib/format";
import AutoRefresh from "@/components/AutoRefresh";
import TripFilters from "@/components/TripFilters";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const FIRST_YEAR = 2024;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: { year?: string; all?: string; q?: string };
}) {
  const year = searchParams.year ? Number(searchParams.year) : undefined;
  const includeAllStatuses = searchParams.all === "1";
  const search = searchParams.q ?? "";

  const trips = await listTrips({ year, includeAllStatuses, search });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 1 - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i).reverse();

  return (
    <div>
      <AutoRefresh seconds={15} />
      <h1 className="mb-4 text-2xl font-bold">Trips</h1>
      <TripFilters years={years} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Trip</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Arrival</th>
              <th className="px-4 py-2">Checkout</th>
              <th className="px-4 py-2 text-right">Agreed cost</th>
              <th className="px-4 py-2 text-right">Balance due</th>
              <th className="px-4 py-2">Status</th>
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
                <td className="px-4 py-2">{t.customerName || "—"}</td>
                <td className="px-4 py-2">{fmtDate(t.arrivalDate)}</td>
                <td className="px-4 py-2">{fmtDate(t.checkoutDate)}</td>
                <td className="px-4 py-2 text-right">{money(t.agreedCost)}</td>
                <td className="px-4 py-2 text-right">
                  <span className={t.balanceDue > 0 ? "font-semibold text-amber-700" : "text-emerald-700"}>
                    {money(t.balanceDue)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={t.inquiryStatus} />
                </td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No trips found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
