const COLORS: Record<string, string> = {
  Inquiry: "bg-slate-100 text-slate-600",
  "Sent for pricing": "bg-slate-100 text-slate-600",
  "Price calculation done": "bg-slate-100 text-slate-600",
  "Price sent to customer": "bg-sky-100 text-sky-700",
  "Invoice to be prepared": "bg-amber-100 text-amber-800",
  "Sent Invoice": "bg-amber-100 text-amber-800",
  "Paid and confirmed": "bg-emerald-100 text-emerald-800",
  "Checked-In": "bg-teal-100 text-teal-800",
  "Trip completed": "bg-brand-light text-brand-dark",
  Dead: "bg-slate-200 text-slate-500",
  "Trip cancelled": "bg-red-100 text-red-700",
  "Trip dates changed": "bg-orange-100 text-orange-700",
};

export default function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-slate-400">—</span>;
  const cls = COLORS[status] ?? "bg-slate-100 text-slate-700";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}
