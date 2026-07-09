"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Charge, Subtrip } from "@/lib/trips";
import { CHARGE_SERVICE_TYPES, CHARGE_STATUS } from "@/lib/schema";
import { classifyCharge } from "@/lib/chargeStatus";
import { money } from "@/lib/format";

type AddDraft = {
  description: string;
  serviceType: string;
  amount: string;
  date: string;
  dueDate: string;
  subtripId: string;
};

type EditDraft = {
  description: string;
  serviceType: string;
  amount: string;
  paidAmount: string;
  datePaid: string;
};

const emptyAddDraft = (): AddDraft => ({
  description: "",
  serviceType: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  subtripId: "",
});

function statusBadgeClass(status: string) {
  if (status === CHARGE_STATUS.FULLY_PAID) return "bg-emerald-100 text-emerald-800";
  if (status === CHARGE_STATUS.PARTIALLY_PAID) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

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
  const [addDraft, setAddDraft] = useState<AddDraft>(emptyAddDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    description: "",
    serviceType: "",
    amount: "",
    paidAmount: "",
    datePaid: "",
  });
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
    if (!addDraft.description || !addDraft.amount) return setError("Description and amount are required");
    await call(`/api/trips/${tripId}/charges`, "POST", addDraft);
    setAddDraft(emptyAddDraft());
  }

  function startEdit(c: Charge) {
    setEditingId(c.id);
    setEditDraft({
      description: c.description,
      serviceType: c.serviceType || "",
      amount: String(c.amount),
      paidAmount: String(c.paid || ""),
      datePaid: c.datePaid || "",
    });
  }

  async function saveEdit(id: string) {
    const amount = Number(editDraft.amount) || 0;
    const paidAmount = Number(editDraft.paidAmount) || 0;
    await call(`/api/charges/${id}`, "PATCH", {
      description: editDraft.description,
      serviceType: editDraft.serviceType,
      amount,
      paidAmount,
      datePaid: editDraft.datePaid || (paidAmount > 0 ? new Date().toISOString().slice(0, 10) : null),
      status: classifyCharge(amount, paidAmount),
    });
    setEditingId(null);
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
            <th className="px-2 py-1">Type</th>
            <th className="px-2 py-1 text-right">Amount</th>
            <th className="px-2 py-1 text-right">Paid</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Date paid</th>
            <th className="px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {charges.map((c) =>
            editingId === c.id ? (
              <tr key={c.id} className="border-t border-slate-100 bg-brand-light">
                <td className="px-2 py-1 text-slate-500">{c.date || "—"}</td>
                <td className="px-2 py-1">
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    value={editDraft.description}
                    onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    value={editDraft.serviceType}
                    onChange={(e) => setEditDraft({ ...editDraft, serviceType: e.target.value })}
                  >
                    <option value="">—</option>
                    {CHARGE_SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-right"
                    value={editDraft.amount}
                    onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    placeholder="Paid so far"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-right"
                    value={editDraft.paidAmount}
                    onChange={(e) => setEditDraft({ ...editDraft, paidAmount: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                      classifyCharge(Number(editDraft.amount) || 0, Number(editDraft.paidAmount) || 0)
                    )}`}
                  >
                    {classifyCharge(Number(editDraft.amount) || 0, Number(editDraft.paidAmount) || 0)}
                  </span>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="date"
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    value={editDraft.datePaid}
                    onChange={(e) => setEditDraft({ ...editDraft, datePaid: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1 text-right">
                  <button disabled={busy} onClick={() => saveEdit(c.id)} className="mr-2 font-medium text-brand-dark">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-slate-500">
                    Cancel
                  </button>
                </td>
              </tr>
            ) : (
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
                <td className="px-2 py-2 text-slate-600">{c.serviceType || "—"}</td>
                <td className="px-2 py-2 text-right font-medium">{money(c.amount)}</td>
                <td className="px-2 py-2 text-right text-slate-600">{c.paid ? money(c.paid) : "—"}</td>
                <td className="px-2 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-2 py-2">{c.datePaid || "—"}</td>
                <td className="px-2 py-2 text-right">
                  <button disabled={busy} onClick={() => startEdit(c)} className="mr-2 text-brand-dark hover:underline">
                    Edit / mark paid
                  </button>
                  <button onClick={() => removeCharge(c.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            )
          )}

          {/* Add-charge row */}
          <tr className="border-t border-slate-200 bg-slate-50">
            <td className="px-2 py-1">
              <input
                type="date"
                className="w-full rounded border border-slate-300 px-2 py-1"
                value={addDraft.date}
                onChange={(e) => setAddDraft({ ...addDraft, date: e.target.value })}
              />
            </td>
            <td className="px-2 py-1">
              <div className="flex gap-1">
                <input
                  placeholder="e.g. Electricity, Cleaning, Airport pickup"
                  className="w-full rounded border border-slate-300 px-2 py-1"
                  value={addDraft.description}
                  onChange={(e) => setAddDraft({ ...addDraft, description: e.target.value })}
                />
                {subtrips.length > 0 && (
                  <select
                    className="rounded border border-slate-300 px-1 py-1 text-xs"
                    value={addDraft.subtripId}
                    onChange={(e) => setAddDraft({ ...addDraft, subtripId: e.target.value })}
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
              <select
                className="w-full rounded border border-slate-300 px-2 py-1"
                value={addDraft.serviceType}
                onChange={(e) => setAddDraft({ ...addDraft, serviceType: e.target.value })}
              >
                <option value="">Select type…</option>
                {CHARGE_SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-2 py-1">
              <input
                type="number"
                placeholder="Amount"
                className="w-full rounded border border-slate-300 px-2 py-1 text-right"
                value={addDraft.amount}
                onChange={(e) => setAddDraft({ ...addDraft, amount: e.target.value })}
              />
            </td>
            <td className="px-2 py-1 text-right text-slate-400">—</td>
            <td className="px-2 py-1 text-slate-500">Not paid</td>
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
        Each row is a record in the Airtable <b>SERVICES</b> table linked to this trip. &quot;Edit /
        mark paid&quot; lets you set how much has been paid — the status (Not paid / Partially paid /
        Fully paid) updates automatically.
      </p>
    </section>
  );
}
