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
    const record = await createRecord(TABLES.PAYMENTS, {
      [PAYMENT.masterTrip]: [params.id],
      [PAYMENT.name]: body.label ?? `${body.type ?? "Payment"} ${body.date}`,
      [PAYMENT.amount]: Number(body.amount),
      [PAYMENT.date]: body.date,
      [PAYMENT.method]: body.method || undefined,
      [PAYMENT.type]: body.type || undefined,
      [PAYMENT.reference]: body.reference || undefined,
    });
    revalidatePath(`/trips/${params.id}`);
    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
