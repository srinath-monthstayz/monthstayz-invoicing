/**
 * Thin Airtable REST client. All record reads use returnFieldsByFieldId so
 * the app is keyed to field IDs (see schema.ts), and all writes use
 * typecast:true so new single-select options are created automatically.
 */

const API = "https://api.airtable.com/v0";

function baseId() {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID is not set");
  return id;
}

function headers() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

async function airtableFetch(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, headers: headers(), cache: "no-store" });
  if (res.status === 429) {
    // Airtable rate limit: wait and retry once
    await new Promise((r) => setTimeout(r, 1200));
    return airtableFetch(url, init);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${init?.method ?? "GET"} ${res.status}: ${body}`);
  }
  return res.json();
}

export async function listRecords(
  tableId: string,
  opts: {
    fields?: string[];
    filterByFormula?: string;
    sort?: { field: string; direction?: "asc" | "desc" }[];
    maxRecords?: number;
  } = {}
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    params.set("returnFieldsByFieldId", "true");
    if (opts.filterByFormula) params.set("filterByFormula", opts.filterByFormula);
    if (opts.maxRecords) params.set("maxRecords", String(opts.maxRecords));
    opts.fields?.forEach((f) => params.append("fields[]", f));
    opts.sort?.forEach((s, i) => {
      params.set(`sort[${i}][field]`, s.field);
      params.set(`sort[${i}][direction]`, s.direction ?? "asc");
    });
    if (offset) params.set("offset", offset);
    const data = await airtableFetch(`${API}/${baseId()}/${tableId}?${params}`);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

export async function getRecord(tableId: string, recordId: string): Promise<AirtableRecord> {
  return airtableFetch(`${API}/${baseId()}/${tableId}/${recordId}?returnFieldsByFieldId=true`);
}

/** Fetch specific records by id (chunked OR(RECORD_ID()=...) queries). */
export async function getRecordsByIds(
  tableId: string,
  ids: string[],
  fields?: string[]
): Promise<AirtableRecord[]> {
  if (ids.length === 0) return [];
  const out: AirtableRecord[] = [];
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    out.push(...(await listRecords(tableId, { filterByFormula: formula, fields })));
  }
  return out;
}

export async function createRecord(
  tableId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const data = await airtableFetch(`${API}/${baseId()}/${tableId}`, {
    method: "POST",
    body: JSON.stringify({
      records: [{ fields }],
      typecast: true,
      returnFieldsByFieldId: true,
    }),
  });
  return data.records[0];
}

export async function updateRecord(
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const data = await airtableFetch(`${API}/${baseId()}/${tableId}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
      typecast: true,
      returnFieldsByFieldId: true,
    }),
  });
  return data.records[0];
}

export async function deleteRecord(tableId: string, recordId: string): Promise<void> {
  await airtableFetch(`${API}/${baseId()}/${tableId}/${recordId}`, { method: "DELETE" });
}

/* ---- helpers for reading typed field values ---- */

export const asString = (v: unknown): string =>
  Array.isArray(v) ? String(v[0] ?? "") : v == null ? "" : String(v);

export const asNumber = (v: unknown): number => {
  const n = Array.isArray(v) ? Number(v[0]) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const asIds = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
