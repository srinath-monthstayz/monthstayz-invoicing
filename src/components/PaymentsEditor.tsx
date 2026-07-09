"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Payment, Subtrip } from "@/lib/trips";
import { PAYMENT_METHODS, PAYMENT_TYPES } from "@/lib/schema";
import { money } from "@/lib/format";

type Draft = {
  amount: string;
  date: string;
  method: string;
  type: string;
  reference: string;
  subtripId: string;
};

const emptyDraft = (): Draft => ({
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  method: "Bank transfer",
  type: "Advance",
  reference: "",
  subtripId: "",
});

export default function PaymentsEditor({
  tripId,
  payments,
  subtrips,
}: {
  tripId: string;
  payments: Payment[];
  subtrips: Subtrip[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
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

  async function addPayment() {
    if (!draft.amount || !draft.date) return setError("Amount and date are required");
    await call(`/api/trips/${tripId}/payments`, "POST", draft);
    setDraft(emptyDraft());
  }

  async function savePayment(id: string) {
    await call(`/api/payments/${id}`, "PATCH", draft);
    setEditingId(null);
    setDraft(emptyDraft());
  }

  async function removePayment(id: string) {
    if (!confirm("Delete this payment? This also removes it from Airtable.")) return;
    await call(`/api/payments/${id}`, "DELETE");
  }

  function startEdit(p: Payment) {
    setEditingId(p.id);
    setDraft({
      amount: String(p.amount),
      date: p.date,
      method: p.method || "Bank transfer",
      type: p.type || "Advance",
      reference: p.reference,
      subtripId: "",
    });
  }

  const inputs = (
    <>
      <td className="px-2 py-1">
        <input
          type="date"
          className="w-full rounded border border-slate-300 px-2 py-1"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
        />
      </td>
      <td className="px-2 py-1">
        <select
          className="w-full rounded border border-slate-300 px-2 py-1"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value })}
        >
          {PAYMENT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1">
        <select
          className="w-full rounded border border-slate-300 px-2 py-1"
          value={draft.method}
          onChange={(e) => setDraft({ ...draft, method: e.target.value })}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <input
            placeholder="Slip no. / note"
            className="w-full rounded border border-slate-300 px-2 py-1"
            value={draft.reference}
            onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
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
          placeholder="Amount (negative = refund)"
          className="w-full rounded border border-slate-300 px-2 py-1 text-right"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
        />
      </td>
    </>
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Payments received</h2>
      {error && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Type</th>
            <th className="px-2 py-1">Method</th>
            <th className="px-2 py-1">Reference</th>
            <th className="px-2 py-1 text-right">Amount</th>
            <th className="px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {payments.map((p) =>
            editingId === p.id ? (
              <tr key={p.id} className="border-t border-slate-100 bg-brand-light">
                {inputs}
                <td className="px-2 py-1 text-right">
                  <button disabled={busy} onClick={() => savePayment(p.id)} className="mr-2 font-medium text-brand-dark">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-slate-500">
                    Cancel
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-2 py-2">{p.date}</td>
                <td className="px-2 py-2">{p.type || "—"}</td>
                <td className="px-2 py-2">{p.method || "—"}</td>
                <td className="px-2 py-2">{p.reference || "—"}</td>
                <td className="px-2 py-2 text-right font-medium">{money(p.amount)}</td>
                <td className="px-2 py-2 text-right">
                  <button onClick={() => startEdit(p)} className="mr-2 text-brand-dark hover:underline">
                    Edit
                  </button>
                  <button onClick={() => removePayment(p.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            )
          )}
          {editingId === null && (
            <tr className="border-t border-slate-200 bg-slate-50">
              {inputs}
              <td className="px-2 py-1 text-right">
                <button
                  disabled={busy}
                  onClick={addPayment}
                  className="rounded bg-brand px-3 py-1 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Add payment"}
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Each row is a record in the Airtable <b>Payments</b> table linked to this trip. Enter a
        refund as a negative amount. &quot;Advance&quot;/&quot;Partial&quot; payments count toward
        the advance still due; &quot;Balance&quot;/&quot;Full&quot; do not.
      </p>
    </section>
  );
}
