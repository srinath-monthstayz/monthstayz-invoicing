import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createRecord } from "@/lib/airtable";
import { CHARGE, CHARGE_STATUS, TABLES } from "@/lib/schema";

/** POST /api/trips/:id/charges — add a service / charge to a trip */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.description || body.amount === undefined) {
      return NextResponse.json({ error: "description and amount are required" }, { status: 400 });
    }
    const fields: Record<string, unknown> = {
      [CHARGE.masterTrips]: [params.id],
      [CHARGE.lineItems]: body.description,
      [CHARGE.amountToBePaid]: Number(body.amount),
      [CHARGE.paymentStatus]: body.status ?? CHARGE_STATUS.NOT_PAID,
      [CHARGE.date]: body.date || new Date().toISOString().slice(0, 10),
    };
    if (body.serviceType) fields[CHARGE.serviceType] = body.serviceType;
    if (body.dueDate) fields[CHARGE.dueDate] = body.dueDate;
    if (body.notes) fields[CHARGE.notes] = body.notes;
    if (body.subtripId) fields[CHARGE.subtrips] = [body.subtripId];
    const record = await createRecord(TABLES.SERVICES, fields);
    revalidatePath(`/trips/${params.id}`);
    revalidatePath(`/trips/${params.id}/invoice`);
    revalidatePath(`/trips/${params.id}/receipt`);
    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
