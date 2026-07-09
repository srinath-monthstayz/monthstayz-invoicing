import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateRecord } from "@/lib/airtable";
import { TABLES, TRIP } from "@/lib/schema";

/** PATCH /api/trips/:id — edit the Master Trip record itself (status, deposit/advance overrides) */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const fields: Record<string, unknown> = {};
    if (body.inquiryStatus !== undefined) fields[TRIP.inquiryStatus] = body.inquiryStatus;
    if (body.inquiryType !== undefined) fields[TRIP.inquiryType] = body.inquiryType;
    if (body.checkedIn !== undefined) fields[TRIP.checkedIn] = Boolean(body.checkedIn);
    if (body.checkedOut !== undefined) fields[TRIP.checkedOut] = Boolean(body.checkedOut);
    if (body.advanceToBePaid !== undefined) fields[TRIP.advanceToBePaid] = Number(body.advanceToBePaid);
    if (body.securityDeposit !== undefined) fields[TRIP.securityDeposit] = Number(body.securityDeposit);
    if (body.agreedCost !== undefined) fields[TRIP.agreedCost] = Number(body.agreedCost);

    const record = await updateRecord(TABLES.MASTER_TRIPS, params.id, fields);
    revalidatePath(`/trips/${params.id}`);
    revalidatePath(`/trips/${params.id}/invoice`);
    revalidatePath(`/trips/${params.id}/receipt`);
    revalidatePath("/");
    return NextResponse.json({ id: record.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
