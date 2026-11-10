# Deploying Get Cowry

Everything runs on [Render](https://render.com) from `render.yaml`:

| Piece | Render service | Address |
| --- | --- | --- |
| Website | `cowry-web` (static site) | getcowry.com, www.getcowry.com |
| Backend API | `cowry-api` (web service, always on) | api.getcowry.com |
| Database | `cowry-db` (Postgres) | private |

The domain stays at Squarespace Domains; only its DNS records change.

## 1. Create the Render account

Sign up at render.com with your **business email**, then connect GitHub and allow access to `Crestintalliance/GET-COWRY`.

## 2. Deploy the Blueprint

1. Render dashboard → **New** → **Blueprint** → pick `GET-COWRY`, branch `main`.
2. Render reads `render.yaml` and asks for the secret values:
   - `ESIMACCESS_ACCESS_CODE`, `ESIMACCESS_SECRET_KEY`: from the eSIM Access developer console
   - `STRIPE_SECRET_KEY`: start with your **test** key (`sk_test_…`)
   - `STRIPE_WEBHOOK_SECRET`: put a placeholder for now, replaced in step 4
   - `VITE_WHATSAPP_NUMBER`: your WhatsApp business number, digits only (e.g. `15551234567`)
3. Not ready to test real eSIMs yet? Change `SUPPLIER` to `mock` on `cowry-api` (Environment tab). The site then sells fake eSIMs, still through Stripe test checkout.
4. Apply. The first deploy takes a few minutes. The API creates its database tables on its own when it starts.

Check: open the `cowry-api` URL Render gives you (`https://cowry-api-xxxx.onrender.com/api/health`), which should show `{"ok":true}`.

## 3. Point getcowry.com at Render

**In Render**, add custom domains:
- `cowry-web` → Settings → Custom Domains → add `getcowry.com` and `www.getcowry.com`
- `cowry-api` → Settings → Custom Domains → add `api.getcowry.com`

Render then shows the exact DNS records to create. Use those values. They will look like this:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | the IP Render shows (often `216.24.57.1`) |
| CNAME | `www` | `cowry-web.onrender.com` (as shown) |
| CNAME | `api` | `cowry-api.onrender.com` (as shown) |

**In Squarespace** (domains.squarespace.com → getcowry.com → **DNS**):
1. Remove the existing Squarespace website records (the "Squarespace Defaults" A records for `@` and the `www` CNAME pointing to Squarespace). Leave email (MX) and any TXT verification records alone.
2. Add the three records above under **Custom records**.
3. Back in Render, press **Verify** on each domain. DNS can take from a few minutes up to 48 hours; Render issues the HTTPS certificates automatically.

## 4. Connect Stripe

1. Stripe dashboard (test mode first) → **Developers → Webhooks → Add endpoint**
   - URL: `https://api.getcowry.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
2. Copy the endpoint's signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` on `cowry-api`. Render redeploys.
3. In Stripe settings set the **statement descriptor** to `GETCOWRY`.
4. Buy a plan on getcowry.com with Stripe test card `4242 4242 4242 4242`. The order page should show the QR code.

## 5. Going live

Only when all of these are true:
- [ ] A real eSIM bought through the site installed and connected on your own phone
- [ ] Terms, Refund and Privacy pages written and reviewed
- [ ] Sales tax question answered by an accountant
- [ ] Email delivery of the QR code added (currently the QR code shows on the order page only)
- [ ] eSIM Access balance topped up

Then switch Stripe to live mode: replace `STRIPE_SECRET_KEY` with `sk_live_…`, create the same webhook in live mode, and update `STRIPE_WEBHOOK_SECRET`.

## Costs

Roughly: API "starter" plan plus a small Postgres database, a few dollars a month each; the static website is free. Check render.com/pricing for current prices. Once getcowry.com points at Render, the Squarespace **website** plan is no longer used. Cancel it at its renewal date, but keep the **domain**.
