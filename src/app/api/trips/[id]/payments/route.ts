import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createRecord } from "@/lib/airtable";
import { PAYMENT, TABLES } from "@/lib/schema";

/** POST /api/trips/:id/payments — record a new customer payment */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.amount || !body.date) {
      return NextResponse.json({ error: "amount and date are required" }, { status: 400 });
    }
    const fields: Record<string, unknown> = {
      [PAYMENT.masterTrip]: [params.id],
      [PAYMENT.name]: body.label ?? `${body.type ?? "Payment"} ${body.date}`,
      [PAYMENT.amount]: Number(body.amount),
      [PAYMENT.date]: body.date,
      [PAYMENT.method]: body.method || undefined,
      [PAYMENT.type]: body.type || undefined,
    };
    if (body.subtripId && PAYMENT.subtrip) {
      // Real link field exists — use it, keep reference as the user's own note.
      fields[PAYMENT.subtrip] = [body.subtripId];
      fields[PAYMENT.reference] = body.reference || undefined;
    } else if (body.subtripId) {
      // No dedicated link field yet — fall back to tagging the extension in Reference.
      fields[PAYMENT.reference] = [body.reference, `[extension ${body.subtripId}]`]
        .filter(Boolean)
        .join(" ");
    } else {
      fields[PAYMENT.reference] = body.reference || undefined;
    }

    const record = await createRecord(TABLES.PAYMENTS, fields);
    revalidatePath(`/trips/${params.id}`);
    revalidatePath(`/trips/${params.id}/invoice`);
    revalidatePath(`/trips/${params.id}/receipt`);
    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
