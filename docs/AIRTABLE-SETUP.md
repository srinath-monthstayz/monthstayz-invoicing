# Airtable configuration

The app works against the existing **Main** base (`appND9kP55cvkDX7V`) and does
not require restructuring it. It uses four tables that already exist. A few
small conventions make everything line up:

## Payments table (`tblTaZDiAD3VIOeLb`)

One record per customer payment. Fields used:

| Field | Used for |
|---|---|
| Payment | Label (auto-filled by the app, e.g. "Advance 2026-07-08") |
| Master Trip | Link to ✈️ Master Trips — **required** |
| Amount | Payment amount in THB. **Refunds are negative amounts.** |
| Date | Date the money was received |
| Method | Bank transfer / Cash / Wise / … (select options are created automatically on first use) |
| Type | Advance / Balance / Security deposit / Service charge / Extension / Refund |
| Reference | Slip number or note |

Payments for an extension are recorded against the **master trip** — the
receipt is one statement for the whole stay.

## SERVICES table (`tblR8W6GPEI6ucW6e`)

One record per service/charge on a trip. Fields used:

| Field | Used for |
|---|---|
| ✈️ Master Trips | Link to the trip — **required** |
| Subtrips | Optional link when a charge belongs to an extension |
| Line items | Free-text description shown on invoice/receipt |
| Amount to be paid | Charge amount |
| Payment status | `To pay` → shows on invoice; `Paid` → shows on receipt |
| Date of amount paid | Set by the dashboard's **Mark paid** button |
| Actual amount paid by the customer | Set by **Mark paid** |
| Date / Due date / Notes | Optional extras |

## 🛩️🛩️ Subtrips (`tblCwuKfuZCMsz6Wb`) — stay extensions

Create a Subtrip linked to the master trip (field **Mastertrip**) with
**Extension Arrival Date**, **Extension Check Out Date** and **Agreed cost for
subtrip**. It immediately appears on the trip page and its cost is included in
the invoice and receipt totals.

## ✈️ Master Trips (`tblodAjjJy8FBQAY7`)

Fields read by the app: Trip Name, CRM lookups (Full Name, Email, Phone),
Arrival/Checkout Date, Total Nights, Agreed cost, Security deposit, Advance to
be paid, Payment Status, Balance Due, Invoice Number, invoice address, and the
link fields Payments / Subtrips / Customer services.

> Tip: the base's existing **Balance Due** formula is only used on the trips
> list for a quick glance. The authoritative balance on invoices/receipts is
> computed from the Payments table (grand total − sum of payments), so
> part-payments are always reflected exactly.

## If a field gets deleted / recreated

Every field is referenced by its **field ID** in
[`../src/lib/schema.ts`](../src/lib/schema.ts). Renaming is always safe.
If a field is deleted and recreated, paste the new field ID into `schema.ts`.
(Find field IDs at <https://airtable.com/developers/web/api/introduction> →
your base docs, or via the API's schema endpoint.)
