import { NextRequest, NextResponse } from "next/server";
import { deleteRecord, updateRecord } from "@/lib/airtable";
import { CHARGE, TABLES } from "@/lib/schema";
import { classifyCharge } from "@/lib/chargeStatus";

/** PATCH /api/charges/:id — edit a charge, including recording a paid amount/date */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const fields: Record<string, unknown> = {};
    if (body.description !== undefined) fields[CHARGE.lineItems] = body.description;
    if (body.amount !== undefined) fields[CHARGE.amountToBePaid] = Number(body.amount);
    if (body.serviceType !== undefined) fields[CHARGE.serviceType] = body.serviceType || null;
    if (body.dueDate !== undefined) fields[CHARGE.dueDate] = body.dueDate || null;
    if (body.notes !== undefined) fields[CHARGE.notes] = body.notes;
    if (body.paidAmount !== undefined) fields[CHARGE.actualPaid] = Number(body.paidAmount);
    if (body.datePaid !== undefined) fields[CHARGE.datePaid] = body.datePaid || null;

    if (body.status !== undefined) {
      fields[CHARGE.paymentStatus] = body.status;
    } else if (body.paidAmount !== undefined && body.amount !== undefined) {
      // Caller didn't compute a status — derive it so it never drifts from the amounts.
      fields[CHARGE.paymentStatus] = classifyCharge(Number(body.amount), Number(body.paidAmount));
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
