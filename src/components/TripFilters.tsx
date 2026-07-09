"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function TripFilters({ years }: { years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    router.push(sp.toString() ? `${pathname}?${sp}` : pathname);
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: value || null }), 300);
  }

  const year = params.get("year") ?? "";
  const all = params.get("all") === "1";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        value={year}
        onChange={(e) => update({ year: e.target.value || null })}
      >
        <option value="">All years (2024+)</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={all}
          onChange={(e) => update({ all: e.target.checked ? "1" : null })}
        />
        Show all statuses (incl. inquiries &amp; cancelled)
      </label>
      <input
        type="search"
        placeholder="Search trip or customer…"
        className="ml-auto w-64 rounded border border-slate-300 px-3 py-1.5 text-sm"
        value={q}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
