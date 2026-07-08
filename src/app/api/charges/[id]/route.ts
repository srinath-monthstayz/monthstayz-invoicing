import { NextRequest, NextResponse } from "next/server";
import { deleteRecord, updateRecord } from "@/lib/airtable";
import { CHARGE, CHARGE_STATUS, TABLES } from "@/lib/schema";

/** PATCH /api/charges/:id — edit a charge, or mark it Paid */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const fields: Record<string, unknown> = {};
    if (body.description !== undefined) fields[CHARGE.lineItems] = body.description;
    if (body.amount !== undefined) fields[CHARGE.amountToBePaid] = Number(body.amount);
    if (body.serviceType !== undefined) fields[CHARGE.serviceType] = body.serviceType || null;
    if (body.status !== undefined) fields[CHARGE.paymentStatus] = body.status;
    if (body.dueDate !== undefined) fields[CHARGE.dueDate] = body.dueDate || null;
    if (body.notes !== undefined) fields[CHARGE.notes] = body.notes;

    // "Mark paid" shortcut: sets status, paid amount and paid date together
    if (body.markPaid) {
      fields[CHARGE.paymentStatus] = CHARGE_STATUS.PAID;
      if (body.paidAmount !== undefined) fields[CHARGE.actualPaid] = Number(body.paidAmount);
      fields[CHARGE.datePaid] = body.datePaid || new Date().toISOString().slice(0, 10);
    }

    const record = await updateRecord(TABLES.SERVICES, params.id, fields);
    return NextResponse.json({ id: record.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE /api/charges/:id */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteRecord(TABLES.SERVICES, params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
