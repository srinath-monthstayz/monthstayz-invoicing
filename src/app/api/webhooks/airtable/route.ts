import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Airtable → dashboard sync.
 *
 * Airtable webhooks POST a light "ping" here whenever records change in the
 * watched tables (Master Trips, Subtrips, Payments, SERVICES). Pages fetch
 * with cache:no-store, so data is always live on load; this hook plus the
 * <AutoRefresh> client poller make open pages update without a manual reload.
 *
 * Register the webhook with: npm run register-webhook
 */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Payload only says "something changed" — bust all trip pages.
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
