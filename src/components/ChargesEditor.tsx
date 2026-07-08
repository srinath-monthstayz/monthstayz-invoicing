"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Charge, Subtrip } from "@/lib/trips";
import { CHARGE_STATUS } from "@/lib/schema";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n || 0);

type Draft = {
  description: string;
  amount: string;
  date: string;
  dueDate: string;
  subtripId: string;
};

const emptyDraft = (): Draft => ({
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  subtripId: "",
});

export default function ChargesEditor({
  tripId,
  charges,
  subtrips,
}: {
  tripId: string;
  charges: Charge[];
  subtrips: Subtrip[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addCharge() {
    if (!draft.description || !draft.amount) return setError("Description and amount are required");
    await call(`/api/trips/${tripId}/charges`, "POST", draft);
    setDraft(emptyDraft());
  }

  async function markPaid(c: Charge) {
    const datePaid = prompt("Date paid (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
    if (!datePaid) return;
    await call(`/api/charges/${c.id}`, "PATCH", {
      markPaid: true,
      paidAmount: c.amount,
      datePaid,
    });
  }

  async function removeCharge(id: string) {
    if (!confirm("Delete this charge? This also removes it from Airtable.")) return;
    await call(`/api/charges/${id}`, "DELETE");
  }

  const subtripName = (ids: string[]) =>
    ids.length ? subtrips.find((s) => ids.includes(s.id))?.name || "extension" : "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Services &amp; charges</h2>
      {error && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="px-2 py-1">Added</th>
            <th className="px-2 py-1">Description</th>
            <th className="px-2 py-1 text-right">Amount</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Date paid</th>
            <th className="px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {charges.map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="px-2 py-2">{c.date || "—"}</td>
              <td className="px-2 py-2">
                {c.description}
                {c.subtripIds.length > 0 && (
                  <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {subtripName(c.subtripIds)}
                  </span>
                )}
              </td>
              <td className="px-2 py-2 text-right font-medium">{money(c.amount)}</td>
              <td className="px-2 py-2">
                <span
                  className={
                    c.status === CHARGE_STATUS.PAID
                      ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                      : "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                  }
                >
                  {c.status}
                </span>
              </td>
              <td className="px-2 py-2">{c.datePaid || "—"}</td>
              <td className="px-2 py-2 text-right">
                {c.status !== CHARGE_STATUS.PAID && (
                  <button
                    disabled={busy}
                    onClick={() => markPaid(c)}
                    className="mr-2 text-emerald-700 hover:underline"
                  >
                    Mark paid
                  </button>
                )}
                <button onClick={() => removeCharge(c.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {/* Add-charge row */}
          <tr className="border-t border-slate-200 bg-slate-50">
            <td className="px-2 py-1">
              <input
                type="date"
                className="w-full rounded border border-slate-300 px-2 py-1"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </td>
            <td className="px-2 py-1">
              <div className="flex gap-1">
                <input
                  placeholder="e.g. Electricity, Cleaning, Airport pickup"
                  className="w-full rounded border border-slate-300 px-2 py-1"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
                {subtrips.length > 0 && (
                  <select
                    className="rounded border border-slate-300 px-1 py-1 text-xs"
                    value={draft.subtripId}
                    onChange={(e) => setDraft({ ...draft, subtripId: e.target.value })}
                    title="Attach to extension"
                  >
                    <option value="">Master trip</option>
                    {subtrips.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || "Extension"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </td>
            <td className="px-2 py-1">
              <input
                type="number"
                placeholder="Amount"
                className="w-full rounded border border-slate-300 px-2 py-1 text-right"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </td>
            <td className="px-2 py-1 text-slate-500">To pay</td>
            <td className="px-2 py-1" />
            <td className="px-2 py-1 text-right">
              <button
                disabled={busy}
                onClick={addCharge}
                className="rounded bg-brand px-3 py-1 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {busy ? "Saving…" : "Add charge"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Each row is a record in the Airtable <b>SERVICES</b> table linked to this trip. Unpaid
        charges appear on the invoice as “To pay”; paid ones appear on the receipt with the paid
        date.
      </p>
    </section>
  );
}
