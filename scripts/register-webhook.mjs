/**
 * Registers Airtable webhooks that ping this app whenever records change in
 * Master Trips, Subtrips, Payments, SERVICES or CRM — the Airtable →
 * dashboard half of the two-way sync. Airtable scopes one webhook per table,
 * so this creates five. Each webhook also asks Airtable to include the
 * changed record's link-to-Master-Trips cell value in the payload, so the
 * app can tell exactly which trip(s) to refresh instead of busting everything.
 *
 * Usage:  npm run register-webhook
 * Requires AIRTABLE_TOKEN with the webhook:manage scope, AIRTABLE_BASE_ID,
 * APP_URL and WEBHOOK_SECRET in .env (or the environment).
 *
 * After running, copy the printed AIRTABLE_WEBHOOK_SECRETS_JSON value into
 * your environment (Vercel project settings) so the webhook route can verify
 * Airtable's X-Airtable-Content-MAC header.
 *
 * Note: Airtable webhooks expire after 7 days unless notifications keep
 * flowing. If the app has been idle for a week, run this script again —
 * it deletes the previous webhooks (saved in .webhook.json) first.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// minimal .env loader (no dependency)
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, APP_URL, WEBHOOK_SECRET } = process.env;
if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !APP_URL) {
  console.error("Set AIRTABLE_TOKEN, AIRTABLE_BASE_ID and APP_URL first.");
  process.exit(1);
}

// tableId -> { name, linkFieldId } where linkFieldId is that table's own
// link field pointing back to Master Trips (used so the webhook payload
// includes the cell value the app needs to attribute a change to a trip).
const WATCHED_TABLES = {
  tblodAjjJy8FBQAY7: { name: "Master Trips", linkFieldId: null },
  tblCwuKfuZCMsz6Wb: { name: "Subtrips", linkFieldId: "fldPuAJogpRvHVblT" }, // Mastertrip
  tblTaZDiAD3VIOeLb: { name: "Payments", linkFieldId: "fld9zmgOUd7yvwhJM" }, // Master Trip
  tblR8W6GPEI6ucW6e: { name: "SERVICES", linkFieldId: "fldxJNjOePrgsgxvT" }, // ✈️ Master Trips
  tbljAtpRqo0s1siQe: { name: "CRM", linkFieldId: "fldUG51htW0GY5Vdw" }, // ✈️ Master Trips
};

const api = `https://api.airtable.com/v0/bases/${AIRTABLE_BASE_ID}/webhooks`;
const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

// clean up webhooks from a previous run
if (existsSync(".webhook.json")) {
  const prev = JSON.parse(readFileSync(".webhook.json", "utf8"));
  for (const hook of prev) {
    const res = await fetch(`${api}/${hook.id}`, { method: "DELETE", headers });
    console.log(`Deleted old webhook ${hook.id}: ${res.status}`);
  }
}

const notificationUrl = `${APP_URL.replace(/\/$/, "")}/api/webhooks/airtable?secret=${encodeURIComponent(WEBHOOK_SECRET ?? "")}`;

const created = [];
const secrets = {};
for (const [tableId, { name, linkFieldId }] of Object.entries(WATCHED_TABLES)) {
  const options = {
    filters: {
      dataTypes: ["tableData"],
      recordChangeScope: tableId,
    },
  };
  if (linkFieldId) {
    options.includes = { includeCellValuesInFieldIds: [linkFieldId] };
  }
  const res = await fetch(api, {
    method: "POST",
    headers,
    body: JSON.stringify({ notificationUrl, specification: { options } }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`Failed for ${name}:`, JSON.stringify(body, null, 2));
    process.exit(1);
  }
  created.push({ id: body.id, table: name, tableId });
  if (body.macSecretBase64) secrets[body.id] = body.macSecretBase64;
  console.log(`Webhook created for ${name}: ${body.id}`);
}

writeFileSync(".webhook.json", JSON.stringify(created, null, 2));
console.log("Notifications will POST to:", notificationUrl);
console.log("Webhook ids saved to .webhook.json");
console.log("\nSet this environment variable so the webhook route can verify Airtable's signature:");
console.log(`AIRTABLE_WEBHOOK_SECRETS_JSON=${JSON.stringify(JSON.stringify(secrets))}`);
