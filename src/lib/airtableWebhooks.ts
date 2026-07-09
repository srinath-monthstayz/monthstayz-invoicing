import { createHmac } from "crypto";

const API = "https://api.airtable.com/v0";

export type WebhookPayload = {
  changedTablesById?: Record<
    string,
    {
      changedRecordsById?: Record<string, { current?: { cellValuesByFieldId?: Record<string, unknown> } }>;
      createdRecordsById?: Record<string, { current?: { cellValuesByFieldId?: Record<string, unknown> } }>;
    }
  >;
};

/** Airtable webhooks POST a bare ping — the actual changes must be fetched separately. */
export async function fetchWebhookPayloads(
  baseId: string,
  webhookId: string,
  token: string
): Promise<WebhookPayload[]> {
  const payloads: WebhookPayload[] = [];
  let cursor: number | undefined;
  for (;;) {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", String(cursor));
    const res = await fetch(`${API}/bases/${baseId}/webhooks/${webhookId}/payloads?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Airtable webhook payloads ${res.status}: ${await res.text()}`);
    const data = await res.json();
    payloads.push(...(data.payloads ?? []));
    cursor = data.cursor;
    if (!data.mightHaveMore) break;
  }
  return payloads;
}

/** Verifies Airtable's X-Airtable-Content-MAC header against the webhook's stored secret. */
export function verifyWebhookMac(rawBody: string, macSecretBase64: string, macHeader: string | null): boolean {
  if (!macHeader) return false;
  const expected = createHmac("sha256", Buffer.from(macSecretBase64, "base64")).update(rawBody).digest("hex");
  return expected === macHeader;
}
