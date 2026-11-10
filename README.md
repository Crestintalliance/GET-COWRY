# Get Cowry

Travel eSIMs for trips home to Africa. A brand of Crest International Alliance LLC.

- `apps/api`: the backend API that both the website and the mobile app use
- `apps/web`: the getcowry.com store (React + Vite), English and French, Night Green design

Open http://localhost:5173, pick a country and plan, enter any email, then press "Simulate payment" to get a test eSIM QR code. No card is charged until Stripe keys are added.

Set `VITE_WHATSAPP_NUMBER` (international format, e.g. 15551234567) in `apps/web/.env` so the Help links open WhatsApp; without it they fall back to hello@getcowry.com.

## What the API does

1. **Catalog:** pulls eSIM plans from the supplier, applies Cowry's pricing rule, and hides plans that keep less than $3 per sale.
2. **Checkout:** creates an order and a Stripe Checkout page.
3. **Fulfillment:** when Stripe confirms payment, buys the eSIM from the supplier and stores the activation code (QR code) for the buyer.

Suppliers sit behind one `SupplierAdapter` interface (`apps/api/src/suppliers/`). eSIM Access is the first; more can be added without touching the rest of the app. Every order records which supplier issued it, for top-ups and refunds.

## Run it locally

Requires Node 20+ and pnpm.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # defaults work as-is: mock supplier, no-card checkout, in-memory orders
pnpm dev                                   # website on http://localhost:5173, API on :4000
pnpm test                                  # unit and API tests
```

Try it:

```bash
curl localhost:4000/api/countries
curl localhost:4000/api/countries/gn/plans
curl -X POST localhost:4000/api/checkout -H 'content-type: application/json' \
  -d '{"countryCode":"GN","planCode":"GN-5GB-30D","email":"you@example.com","locale":"fr"}'
# Dev only (no Stripe keys set): mark that order paid, which issues a fake eSIM
curl -X POST localhost:4000/api/dev/orders/<orderId>/pay
curl "localhost:4000/api/orders/<orderId>?token=<token>"
```

## Going live, step by step

1. **eSIM Access sandbox:** set `SUPPLIER=esimaccess` and your access code (and secret key, if eSIM Access gives you one). Check `/api/countries/gn/plans` returns real Guinea plans. The request signing and field names in `src/suppliers/esimaccess.ts` follow eSIM Access's public docs; confirm them against your developer console and adjust if anything differs.
2. **Stripe test mode:** add `sk_test_` keys. Forward webhooks locally with `stripe listen --forward-to localhost:4000/api/webhooks/stripe` and use the printed `whsec_` as `STRIPE_WEBHOOK_SECRET`.
3. **Postgres:** set `DATABASE_URL`, then `pnpm --filter @cowry/api db:migrate`.
4. **Email:** replace `ConsoleNotifier` (`src/notify.ts`) with a real email provider so buyers receive their QR code.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/countries` | Countries with a "from" price |
| GET | `/api/countries/:code/plans` | Plans for one country |
| POST | `/api/checkout` | Start checkout, returns the payment URL |
| GET | `/api/orders/:id?token=` | Order status and eSIM (buyer only) |
| POST | `/api/webhooks/stripe` | Stripe payment confirmation |
| POST | `/api/dev/orders/:id/pay` | Development only, when no Stripe keys are set |

## Known gaps (next steps)

- Terms, refund and privacy pages are placeholders: write and review them before launch
- The React Native app
- Real email delivery of the QR code
- Top-ups, and automatic refunds when the supplier fails (failed orders are flagged `fulfillment_failed` and logged for manual refund)
- A second supplier, routed per country
- Sales tax handling: confirm with an accountant before launch
