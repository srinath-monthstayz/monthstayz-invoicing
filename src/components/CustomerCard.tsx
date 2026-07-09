import { TABLES } from "@/lib/schema";
import type { CrmContact } from "@/lib/crm";

export default function CustomerCard({
  customer,
  fallbackName,
  fallbackEmail,
  fallbackPhone,
  baseId,
}: {
  customer: CrmContact | null;
  fallbackName: string;
  fallbackEmail: string;
  fallbackPhone: string;
  baseId: string;
}) {
  const airtableUrl = customer ? `https://airtable.com/${baseId}/${TABLES.CRM}/${customer.id}` : null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customer</h2>
        {airtableUrl && (
          <a
            href={airtableUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-dark hover:underline"
          >
            Open in Airtable ↗
          </a>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Field label="Name" value={customer?.fullName || fallbackName} />
        <Field label="Email" value={customer?.email || fallbackEmail} />
        <Field label="Phone" value={customer?.phone || fallbackPhone} />
        <Field label="Country" value={customer?.country} />
        <Field label="Passport" value={customer?.passport} />
      </dl>
      {customer?.notes && (
        <p className="mt-3 whitespace-pre-line border-t border-slate-100 pt-3 text-sm text-slate-600">
          {customer.notes}
        </p>
      )}
      {!customer && (
        <p className="mt-2 text-xs text-slate-500">
          No CRM contact linked to this trip yet — link one in Airtable's ✈️ Master Trips table
          (field &quot;CRM contact&quot;) and it will appear here.
        </p>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{value || "—"}</div>
    </div>
  );
}
