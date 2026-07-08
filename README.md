# MonthStayz Invoicing

Invoice, receipt and payment-tracking dashboard for MonthStayz Thailand short-term
rentals, **two-way synced with the Airtable "Main" base**.

## What it does

- **Invoice per trip** — agreed cost, security deposit, advance to be paid
  (normally 50%), stay extensions, and services/charges marked **To pay**.
- **Receipt / statement per trip** — every payment the customer made, with date,
  method, type and reference, in a running table with the balance after each
  payment. When the balance hits zero it becomes the **final receipt for the
  entire stay** (master trip + extensions + all services).
- **Multiple part-payments** — customers often pay the advance in 2–3
  instalments before arrival; each one is a row in the Payments table and the
  receipt always reflects the up-to-date balance.
- **Services & charges** — electricity, cleaning, airport pickup, etc. are
  tracked per trip: shown as *To pay* on the invoice, and as *Paid* with the
  paid date on the receipt.
- **Stay extensions** — a Subtrip in Airtable linked to the master trip shows up
  automatically under the trip, its cost is added to the invoice total, and its
  charges can be attached to the extension.
- **Two-way sync** — the dashboard reads and writes Airtable directly (Airtable
  is the single source of truth, there is no second database):
  - Dashboard → Airtable: adding/editing payments and charges writes to
    Airtable instantly.
  - Airtable → dashboard: every page loads live data; Airtable webhooks +
    a 30-second auto-refresh update open pages when something changes in
    Airtable.

## Airtable tables used

| Table | ID | Role |
|---|---|---|
| ✈️ Master Trips | `tblodAjjJy8FBQAY7` | The trip: guest, dates, agreed cost, deposit, advance |
| 🛩️🛩️ Subtrips | `tblCwuKfuZCMsz6Wb` | Stay extensions linked to a master trip |
| Payments | `tblTaZDiAD3VIOeLb` | One record per customer payment (amount, date, method, type, reference) |
| SERVICES | `tblR8W6GPEI6ucW6e` | Per-trip services & charges with To pay / Paid status and dates |

All field mappings live in [`src/lib/schema.ts`](src/lib/schema.ts) and use
**field IDs**, so renaming fields in Airtable never breaks the app.
See [docs/AIRTABLE-SETUP.md](docs/AIRTABLE-SETUP.md) for the small amount of
Airtable configuration expected.

## Setup

```bash
npm install
cp .env.example .env       # then fill in AIRTABLE_TOKEN etc.
npm run dev                # http://localhost:3000
```

Create the Airtable personal access token at <https://airtable.com/create/tokens>
with scopes `data.records:read`, `data.records:write`, `schema.bases:read`,
`webhook:manage`, granted to the **Main** base.

### Deploy (Vercel recommended)

1. Push this repo to GitHub and import it in Vercel.
2. Add the `.env` values as Vercel environment variables.
3. Set `APP_URL` to your deployed URL.
4. Register the Airtable → app webhooks:

```bash
npm run register-webhook
```

> Airtable webhooks expire after 7 days of no notifications. If the dashboard
> has been idle for over a week, run `npm run register-webhook` again (it
> replaces the old hooks). Even without webhooks, pages always load live data
> and auto-refresh every 30 seconds.

## Daily workflow

1. **Inquiry confirmed** → create the trip in Airtable as you do today.
   It appears on the dashboard automatically.
2. Open the trip → **Invoice** → Print / Save as PDF → send to the customer.
   The invoice shows the advance still due (agreed advance minus anything paid).
3. **Customer pays** (any number of times) → open the trip → add a payment
   (date, amount, method, reference). Open **Receipt / Statement** → send it.
   It lists every payment to date and the balance remaining.
4. **Services during the stay** → add charges on the trip page (or in
   Airtable). They show as *To pay* on the invoice; use **Mark paid** when the
   customer settles them and the paid date is recorded.
5. **Stay extended** → create a Subtrip in Airtable linked to the master trip
   (as you do today). Its cost joins the invoice/receipt totals automatically.
6. **Checkout** → the Receipt page now shows every payment for the whole stay;
   when the balance is zero it prints as **RECEIPT — PAID IN FULL**. Refund the
   security deposit and record it as a negative payment of type *Refund*.

## Project structure

```
src/
  lib/
    schema.ts        # Airtable table & field-ID mapping (edit here if fields change)
    airtable.ts      # REST client (reads/writes by field ID, typecast on)
    trips.ts         # Assembles trip + subtrips + payments + charges, computes totals
    format.ts        # THB money & date formatting, company details
  app/
    page.tsx                     # Trips dashboard
    trips/[id]/page.tsx          # Trip detail: totals, extensions, charges, payments
    trips/[id]/invoice/page.tsx  # Printable invoice
    trips/[id]/receipt/page.tsx  # Printable receipt / running statement
    api/
      trips/[id]/payments/route.ts  # POST new payment
      payments/[id]/route.ts        # PATCH / DELETE payment
      trips/[id]/charges/route.ts   # POST new charge
      charges/[id]/route.ts         # PATCH / DELETE charge, mark-paid
      webhooks/airtable/route.ts    # Airtable change notifications
  components/
    PaymentsEditor.tsx   # Editable payments table
    ChargesEditor.tsx    # Editable charges table with Mark paid
    AutoRefresh.tsx      # 30s polling so Airtable edits appear live
    DocShell.tsx         # Print-friendly document wrapper
scripts/
  register-webhook.mjs   # Creates the Airtable webhooks
```
