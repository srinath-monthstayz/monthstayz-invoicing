# Airtable configuration

The app works against the existing **Main** base (`appND9kP55cvkDX7V`) and does
not require restructuring it. It uses six tables that already exist, plus one
optional manual field. It intentionally does **not** touch the legacy
`Invoices` table (`tblkeqCvog91i5dIH`) or the Invoice Ninja / Make.com
automation that used it — this app replaces that pipeline.

## 🛃CRM (`tbljAtpRqo0s1siQe`)

Source of truth for guest identity: Full Name, Email, Phone number, Country,
Passport number, Notes. Link a trip's guest via Master Trips' **CRM contact**
field and their details appear automatically on the trip page, invoice and
receipt. If a trip has no CRM contact linked, the app falls back to Master
Trips' own flat lookup fields (which don't include Country).

## ✈️ Master Trips (`tblodAjjJy8FBQAY7`)

The trip lifecycle field the app reads/writes is **Inquiry status** (Inquiry →
… → Paid and confirmed → Checked-In → Trip completed, or Dead/Cancelled). The
trip list defaults to showing `Sent Invoice` / `Paid and confirmed` /
`Checked-In` / `Trip completed` — toggle "show all statuses" to see the rest.

Fields the dashboard can edit directly: Inquiry status, Inquiry Type, checked
in / Checked Out, Advance to be paid, Security deposit, Agreed cost.

> The base's own **Balance Due** and **TOTAL AMOUNT PAYABLE ON ARRIVAL**
> formulas are shown on the trip page as a secondary reference only. The
> authoritative numbers on invoices/receipts are computed by the app from the
> Payments table **and** SERVICES' own paid amounts together, so extensions
> and part-payments are always reflected exactly.

## Payments table (`tblTaZDiAD3VIOeLb`) — the payment ledger

One record per customer payment. Fields used:

| Field | Used for |
|---|---|
| Payment | Label (auto-filled by the app) |
| Master Trip | Link to ✈️ Master Trips — **required** |
| Amount | Payment amount in THB. **Refunds are negative amounts.** |
| Date | Date the money was received |
| Method | Bank transfer / Cash / Cryptocurrency / Card |
| Type | Advance / Partial / Balance / Full / Security Deposit / Other |
| Reference | Slip number or note |

**Optional manual step:** add a link field named e.g. `Subtrip` on Payments,
linking to Subtrips, so payments made specifically toward an extension can be
tagged with a real relationship instead of a note in Reference. Not required
— the app works without it and upgrades automatically once you add it and
paste its field id into `PAYMENT.subtrip` in `src/lib/schema.ts`.

"Security Deposit" isn't a real option in the Type field yet — the first
payment of that type creates it automatically (writes use `typecast:true`).

## SERVICES table (`tblR8W6GPEI6ucW6e`) — billable charges

One record per service/charge on a trip. Fields used:

| Field | Used for |
|---|---|
| ✈️ Master Trips | Link to the trip — **required** |
| Subtrips | Optional link when a charge belongs to an extension |
| Line items | Free-text description shown on invoice/receipt |
| Amount to be paid | Charge amount (gross — always shown on the Invoice) |
| Payment status | `Not paid` / `Partially paid` / `Fully paid` — set automatically from amount vs. actual paid |
| Actual amount paid by the customer / Date of amount paid | Set via the trip page's "Edit / mark paid" |

## Misc Charges (`tbl74DEJKI8PChdpl`) — utility readings, reference only

Kept deliberately separate from SERVICES: it has no payment-status fields,
links to a Property rather than cleanly to one trip, and its photos are for
staff reconciliation, not customer billing. The trip page shows these
read-only under "Utility readings (reference)" via Master Trips' **Misc
Charges** link field. If a reading should be billed to the guest, create a
matching SERVICES row by hand — the app does not auto-convert one into the
other (to avoid double-billing or mis-attributing a shared meter reading).

## 🛩️🛩️ Subtrips (`tblCwuKfuZCMsz6Wb`) — stay extensions

Create a Subtrip linked to the master trip (field **Mastertrip**) with
**Extension Arrival Date**, **Extension Check Out Date** and **Agreed cost for
subtrip**. It immediately appears on the trip page, and the invoice/receipt
show it as its own "Extension" section with its own charges, rolled into one
grand total with the original stay.

## Access control

Set `APP_PASSWORD` to enable a shared team login gate (a single password for
the whole team, no per-user accounts). Leave it unset only for local testing
— once CRM data (including passport numbers) is visible, an open URL is a
real exposure.

## If a field gets deleted / recreated

Every field is referenced by its **field ID** in
[`../src/lib/schema.ts`](../src/lib/schema.ts). Renaming is always safe.
If a field is deleted and recreated, paste the new field ID into `schema.ts`.
(Find field IDs at <https://airtable.com/developers/web/api/introduction> →
your base docs, or via the API's schema endpoint.)

One exception: the trip list's year/status filter uses Airtable
`filterByFormula`, which addresses fields by **display name** (`Arrival Date`,
`Inquiry status`) — renaming those two fields in Airtable would silently break
the trip list filter (nothing else is affected).
