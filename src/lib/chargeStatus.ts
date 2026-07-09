import { CHARGE_STATUS } from "./schema";

/**
 * Classifies a charge's payment status from its billed amount and the
 * amount actually paid so far. Shared between the "mark paid" API route and
 * the ChargesEditor UI's live preview while editing, so they never disagree.
 */
export function classifyCharge(amount: number, paid: number): string {
  if (paid <= 0) return CHARGE_STATUS.NOT_PAID;
  if (paid >= amount) return CHARGE_STATUS.FULLY_PAID;
  return CHARGE_STATUS.PARTIALLY_PAID;
}
