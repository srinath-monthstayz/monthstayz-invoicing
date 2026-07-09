"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INQUIRY_STATUSES = [
  "Inquiry",
  "Sent for pricing",
  "Price calculation done",
  "Price sent to customer",
  "Invoice to be prepared",
  "Sent Invoice",
  "Paid and confirmed",
  "Checked-In",
  "Trip completed",
  "Dead",
  "Trip cancelled",
  "Trip dates changed",
];

const INQUIRY_TYPES = ["Fresh", "Repeat", "Extend", "Upgrade", "Change of room", "Multi-trip"];

export default function TripStatusEditor({
  tripId,
  inquiryStatus,
  inquiryType,
  checkedIn,
  checkedOut,
}: {
  tripId: string;
  inquiryStatus: string;
  inquiryType: string;
  checkedIn: boolean;
  checkedOut: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Trip status</h2>
      {error && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">Stage</span>
          <select
            disabled={busy}
            className="rounded border border-slate-300 px-2 py-1"
            value={inquiryStatus}
            onChange={(e) => patch({ inquiryStatus: e.target.value })}
          >
            {INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">Type</span>
          <select
            disabled={busy}
            className="rounded border border-slate-300 px-2 py-1"
            value={inquiryType}
            onChange={(e) => patch({ inquiryType: e.target.value })}
          >
            {INQUIRY_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            disabled={busy}
            checked={checkedIn}
            onChange={(e) => patch({ checkedIn: e.target.checked })}
          />
          Checked in
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            disabled={busy}
            checked={checkedOut}
            onChange={(e) => patch({ checkedOut: e.target.checked })}
          />
          Checked out
        </label>
      </div>
    </section>
  );
}
