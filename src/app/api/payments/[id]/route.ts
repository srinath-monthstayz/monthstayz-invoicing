import { NextRequest, NextResponse } from "next/server";
import { deleteRecord, updateRecord } from "@/lib/airtable";
import { PAYMENT, TABLES } from "@/lib/schema";

/** PATCH /api/payments/:id — edit a payment */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const fields: Record<string, unknown> = {};
    if (body.amount !== undefined) fields[PAYMENT.amount] = Number(body.amount);
    if (body.date !== undefined) fields[PAYMENT.date] = body.date;
    if (body.method !== undefined) fields[PAYMENT.method] = body.method || null;
    if (body.type !== undefined) fields[PAYMENT.type] = body.type || null;
    if (body.reference !== undefined) fields[PAYMENT.reference] = body.reference;
    if (body.label !== undefined) fields[PAYMENT.name] = body.label;
    if (body.subtripId !== undefined && PAYMENT.subtrip) {
      fields[PAYMENT.subtrip] = body.subtripId ? [body.subtripId] : [];
    }
    const record = await updateRecord(TABLES.PAYMENTS, params.id, fields);
    return NextResponse.json({ id: record.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE /api/payments/:id — remove a payment entered by mistake */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteRecord(TABLES.PAYMENTS, params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
