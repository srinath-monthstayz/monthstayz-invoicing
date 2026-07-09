import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchWebhookPayloads, verifyWebhookMac, type WebhookPayload } from "@/lib/airtableWebhooks";
import { CHARGE, CRM, PAYMENT, SUBTRIP, TABLES } from "@/lib/schema";

/**
 * Airtable → dashboard sync.
 *
 * Airtable webhooks POST a bare "ping" (which webhook, not what changed).
 * This handler fetches the real payloads for that webhook, works out which
 * trips they touch (via the child table's link to Master Trips, when the
 * webhook was registered with includeCellValuesInFieldIds for that field —
 * see scripts/register-webhook.mjs), and revalidates just those trip pages.
 * When a change can't be attributed to specific trips (e.g. a CRM edit, or
 * the payload fetch fails), it falls back to revalidating everything.
 *
 * Note: every page in this app already fetches with cache:"no-store", so
 * there's no Next.js cache for revalidatePath to actually invalidate today —
 * the thing keeping open pages fresh is <AutoRefresh>'s poll. This handler
 * is still worth having: it closes a real gap (the MAC header was never
 * checked before) and is correct if caching is ever introduced later.
 *
 * Register the webhook with: npm run register-webhook
 */

function macSecretFor(webhookId: string): string | null {
  const raw = process.env.AIRTABLE_WEBHOOK_SECRETS_JSON;
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[webhookId] ?? null;
  } catch {
    return null;
  }
}

const LINK_FIELD_BY_TABLE: Record<string, string> = {
  [TABLES.SUBTRIPS]: SUBTRIP.masterTrip,
  [TABLES.PAYMENTS]: PAYMENT.masterTrip,
  [TABLES.SERVICES]: CHARGE.masterTrips,
  [TABLES.CRM]: CRM.masterTrips,
};

function extractLinkedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === "string" ? v : (v as { id?: string })?.id)).filter(Boolean) as string[];
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawBody = await req.text();
  let ping: { webhook?: { id?: string } } = {};
  try {
    ping = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    // some Airtable pings arrive with an empty body — treat as "something changed"
  }

  const webhookId = ping.webhook?.id;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;

  if (webhookId) {
    const macSecret = macSecretFor(webhookId);
    if (macSecret) {
      const macHeader = req.headers.get("X-Airtable-Content-MAC");
      if (!verifyWebhookMac(rawBody, macSecret, macHeader)) {
        return NextResponse.json({ error: "bad mac" }, { status: 401 });
      }
    }
  }

  const tripIds = new Set<string>();
  let unattributedChange = false;

  if (webhookId && baseId && token) {
    try {
      const payloads = await fetchWebhookPayloads(baseId, webhookId, token);
      for (const payload of payloads as WebhookPayload[]) {
        for (const [tableId, change] of Object.entries(payload.changedTablesById ?? {})) {
          const records = { ...change.changedRecordsById, ...change.createdRecordsById };
          const recordIds = Object.keys(records);
          if (recordIds.length === 0) continue;

          if (tableId === TABLES.MASTER_TRIPS) {
            recordIds.forEach((id) => tripIds.add(id));
            continue;
          }

          const linkField = LINK_FIELD_BY_TABLE[tableId];
          let attributed = false;
          if (linkField) {
            for (const id of recordIds) {
              const linked = extractLinkedIds(records[id]?.current?.cellValuesByFieldId?.[linkField]);
              if (linked.length > 0) {
                linked.forEach((tripId) => tripIds.add(tripId));
                attributed = true;
              }
            }
          }
          if (!attributed) unattributedChange = true; // CRM changes, or link field not covered by the webhook
        }
      }
    } catch {
      unattributedChange = true;
    }
  } else {
    unattributedChange = true;
  }

  if (unattributedChange || tripIds.size === 0) {
    revalidatePath("/", "layout");
  } else {
    revalidatePath("/");
    Array.from(tripIds).forEach((id) => {
      revalidatePath(`/trips/${id}`);
      revalidatePath(`/trips/${id}/invoice`);
      revalidatePath(`/trips/${id}/receipt`);
    });
  }

  return NextResponse.json({ ok: true });
}
