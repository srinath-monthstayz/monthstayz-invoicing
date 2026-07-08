import Link from "next/link";
import PrintButton from "./PrintButton";

/** Shared print-friendly wrapper for invoice & receipt pages. */
export default function DocShell({
  backHref,
  children,
}: {
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={backHref} className="text-sm text-brand-dark hover:underline">
          ← Back to trip
        </Link>
        <PrintButton />
      </div>
      <div className="print-page mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
