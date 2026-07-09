# MonthStayz Invoicing

Invoice, receipt and payment-tracking dashboard for MonthStayz Thailand short-term
rentals, **two-way synced with the Airtable "Main" base**. Replaces the previous
Invoice Ninja / Make.com automation.

## What it does

- **CRM-linked trips** — every trip shows its guest's name, email, phone,
  country and passport pulled directly from the 🛃CRM table.
- **Multi-year trip list** — filter by year (2024 onward), toggle to include
  inquiries/cancelled trips, search by trip or customer.
- **Invoice per trip** — agreed cost, security deposit, advance/reservation
  deposit due (normally 50%, editable per trip), stay extensions, and every
  service/charge at full amount.
- **Receipt / statement per trip** — every payment the customer made — from
  the Payments ledger *and* money paid directly against a charge — merged
  into one dated, running table with the balance after each entry. When the
  balance hits zero it becomes the **final receipt for the entire stay**
  (master trip + extensions + all services).
- **Multiple part-payments** — customers often pay the advance in 2–3
  instalments before arrival; each is a row in the Payments table and the
  receipt always reflects the up-to-date balance.
- **Services & charges** — electricity, cleaning, airport pickup, etc.,
  tracked per trip with a 3-way status (Not paid / Partially paid / Fully
  paid) and a paid date, editable inline.
- **Stay extensions** — a Subtrip in Airtable linked to the master trip shows
  up automatically, its cost and charges roll into the invoice/receipt as
  their own "Extension" section, with a combined grand total.
- **Two-way sync** — Airtable is the single source of truth:
  - Dashboard → Airtable: adding/editing payments, charges and trip status
    writes to Airtable instantly.
  - Airtable → dashboard: pages always load live data; a 15-second
    auto-refresh plus Airtable webhooks (with signature verification and
    targeted revalidation) update open pages when something changes.
- **Shared team login** — a single password gates the whole dashboard.

## Airtable tables used

| Table | ID | Role |
|---|---|---|
| 🛃CRM | `tbljAtpRqo0s1siQe` | Guest identity: name, email, phone, country, passport |
| ✈️ Master Trips | `tblodAjjJy8FBQAY7` | The trip: dates, agreed cost, deposit, advance, lifecycle stage |
| 🛩️🛩️ Subtrips | `tblCwuKfuZCMsz6Wb` | Stay extensions linked to a master trip |
| Payments | `tblTaZDiAD3VIOeLb` | One record per customer payment (amount, date, method, type) |
| SERVICES | `tblR8W6GPEI6ucW6e` | Per-trip services & charges with a 3-way paid status and dates |
| Misc Charges | `tbl74DEJKI8PChdpl` | Utility meter readings — read-only reference, kept separate from billable charges |

All field mappings live in [`src/lib/schema.ts`](src/lib/schema.ts) and use
**field IDs**, so renaming fields in Airtable never breaks the app.
See [docs/AIRTABLE-SETUP.md](docs/AIRTABLE-SETUP.md) for the small amount of
Airtable configuration expected.

## Setup

```bash
npm install
cp .env.example .env       # then fill in AIRTABLE_TOKEN, APP_PASSWORD, etc.
npm run dev                # http://localhost:3000
```

Create the Airtable personal access token at <https://airtable.com/create/tokens>
with scopes `data.records:read`, `data.records:write`, `schema.bases:read`,
`webhook:manage`, granted to the **Main** base.

Set `APP_PASSWORD` to something real before sharing the URL with the team —
without it the login gate is disabled.

### Deploy (Vercel recommended)

1. Push this repo to GitHub and import it in Vercel.
2. Add the `.env` values as Vercel environment variables.
3. Set `APP_URL` to your deployed URL.
4. Register the Airtable → app webhooks:

```bash
npm run register-webhook
```

This prints an `AIRTABLE_WEBHOOK_SECRETS_JSON` value — add it to your
environment too so the webhook route can verify Airtable's signature.

> Airtable webhooks expire after 7 days of no notifications. If the dashboard
> has been idle for over a week, run `npm run register-webhook` again (it
> replaces the old hooks). Even without webhooks, pages always load live data
> and auto-refresh every 15 seconds.

## Daily workflow

1. **Inquiry confirmed** → create the trip and link the CRM contact in
   Airtable as you do today. It appears on the dashboard automatically.
2. Open the trip → **Invoice** → Print / Save as PDF → send to the customer.
   Shows the advance still due (advance to be paid minus Advance/Partial
   payments logged so far).
3. **Customer pays** (any number of times) → open the trip → add a payment
   (date, amount, method, type). Open **Receipt / Statement** → send it. It
   lists every payment to date — including anything paid directly against a
   charge — and the balance remaining.
4. **Services during the stay** → add charges on the trip page (or in
   Airtable). Use **Edit / mark paid** to record how much has been paid; the
   status updates automatically.
5. **Stay extended** → create a Subtrip in Airtable linked to the master trip
   (as you do today). It shows up as its own "Extension" section on the
   invoice/receipt.
6. **Checkout** → the Receipt page shows every payment for the whole stay;
   when the balance is zero it prints as **RECEIPT — PAID IN FULL**. Refund
   the security deposit as a negative payment.

## Project structure

```
src/
  lib/
    schema.ts        # Airtable table & field-ID mapping (edit here if fields change)
    airtable.ts      # REST client (reads/writes by field ID, typecast on)
    crm.ts           # CRM contact lookups
    trips.ts         # Assembles trip + CRM + subtrips + payments + charges, computes totals
    sections.ts       # Groups charges into stay/extension sections; merges the payment ledger
    chargeStatus.ts   # Shared Not paid/Partially paid/Fully paid classifier
    auth.ts           # Shared-password session token
    format.ts         # THB money & date formatting, company/branding details
  middleware.ts       # Password gate
  app/
    login/page.tsx                # Team sign-in
    page.tsx                      # Trips dashboard (year/status/search filters)
    trips/[id]/page.tsx           # Trip detail: totals, CRM card, status editor, extensions, charges, payments
    trips/[id]/invoice/page.tsx   # Printable invoice
    trips/[id]/receipt/page.tsx   # Printable receipt / running statement
    api/
      login, logout                 # Password gate
      trips/[id]/route.ts           # PATCH trip status/deposit/advance
      trips/[id]/payments/route.ts  # POST new payment
      payments/[id]/route.ts        # PATCH / DELETE payment
      trips/[id]/charges/route.ts   # POST new charge
      charges/[id]/route.ts         # PATCH / DELETE charge, mark-paid
      webhooks/airtable/route.ts    # Airtable change notifications (signature-verified, targeted revalidation)
  components/
    PaymentsEditor.tsx, ChargesEditor.tsx   # Editable tables
    CustomerCard.tsx, TripStatusEditor.tsx, UtilityReadings.tsx
    StatusBadge.tsx, TripFilters.tsx
    AutoRefresh.tsx, DocShell.tsx, PrintButton.tsx, LogoutButton.tsx
scripts/
  register-webhook.mjs   # Creates the Airtable webhooks
```
