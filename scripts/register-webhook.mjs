/**
 * Registers Airtable webhooks that ping this app whenever records change in
 * Master Trips, Subtrips, Payments or SERVICES — the Airtable → dashboard
 * half of the two-way sync. Airtable scopes one webhook per table, so this
 * creates four.
 *
 * Usage:  npm run register-webhook
 * Requires AIRTABLE_TOKEN with the webhook:manage scope, AIRTABLE_BASE_ID,
 * APP_URL and WEBHOOK_SECRET in .env (or the environment).
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

const WATCHED_TABLES = {
  "tblodAjjJy8FBQAY7": "Master Trips",
  "tblCwuKfuZCMsz6Wb": "Subtrips",
  "tblTaZDiAD3VIOeLb": "Payments",
  "tblR8W6GPEI6ucW6e": "SERVICES",
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
for (const [tableId, name] of Object.entries(WATCHED_TABLES)) {
  const res = await fetch(api, {
    method: "POST",
    headers,
    body: JSON.stringify({
      notificationUrl,
      specification: {
        options: {
          filters: {
            dataTypes: ["tableData"],
            recordChangeScope: tableId,
          },
        },
      },
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`Failed for ${name}:`, JSON.stringify(body, null, 2));
    process.exit(1);
  }
  created.push({ id: body.id, table: name, tableId });
  console.log(`Webhook created for ${name}: ${body.id}`);
}

writeFileSync(".webhook.json", JSON.stringify(created, null, 2));
console.log("Notifications will POST to:", notificationUrl);
console.log("Webhook ids saved to .webhook.json");
