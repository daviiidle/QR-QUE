# QR QUE

No-app, browser-based QR ordering + payment for bubble tea / milk tea shops.
Customers scan a QR → pick drinks with modifiers → pay with Stripe → live status page.
Staff see paid orders in real time and advance status: `received → making → ready → completed`.

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Postgres, Auth, Realtime) · Stripe Checkout**.

---

## 1. Prerequisites

- Node 20+
- A Supabase project (free tier is fine) — get `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`
- A Stripe account — get `STRIPE_SECRET_KEY`
- The Stripe CLI for local webhook testing: https://stripe.com/docs/stripe-cli

## 2. Install

```bash
pnpm install    # or npm install / yarn
cp .env.local.example .env.local   # fill in values
```

## 3. Database setup

Apply the two migrations, then optionally seed a demo shop.

Using the Supabase Dashboard SQL editor:

1. Paste `supabase/migrations/0001_init.sql` and run.
2. Paste `supabase/migrations/0002_rls.sql` and run.
3. (Optional) paste `supabase/seed.sql` to create the demo shop `/s/demo`.

Or with `psql`:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_rls.sql
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

### Create an owner user

1. In Supabase Dashboard → Authentication → Users → **Add user** with email + password.
2. Link them to the demo shop:

```sql
insert into shop_users (shop_id, user_id, role)
values ('11111111-1111-1111-1111-111111111111', '<that user id>', 'owner');
```

Now sign in at `/login`.

### Enable Realtime

Migration `0001` already adds `orders` to the `supabase_realtime` publication. Make sure Realtime is enabled for the `public` schema in Supabase Dashboard → Database → Replication.

## 4. Stripe webhook (local)

```bash
# terminal 1
pnpm dev

# terminal 2
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the whsec_... signing secret it prints and paste into STRIPE_WEBHOOK_SECRET in .env.local
```

## 5. Try it

- Customer flow: `http://localhost:3000/s/demo`
- Staff dashboard: `http://localhost:3000/dashboard` (after logging in)
- Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.

---

## Project layout

```
app/
  s/[shopSlug]/              customer menu + cart
  o/[shortCode]/             customer live order status
  dashboard/                 staff + owner UI
  api/
    checkout/                create Stripe session + pending order
    webhooks/stripe/         promote order to 'received' on payment success
    orders/[shortCode]/      server-side order lookup
  login/                     email/password sign-in
actions/                     "use server" write paths (menu, modifiers, orders, settings, auth)
lib/
  supabase/{server,browser,service}.ts
  pricing.ts                 authoritative server-side re-pricing
  auth.ts                    shop membership resolution
  stripe.ts, money.ts, shortcode.ts, cn.ts
stores/cart.ts               zustand + localStorage cart
supabase/migrations/         SQL schema + RLS
```

## How the money flow works

1. Client POSTs cart to `/api/checkout`.
2. Server re-prices everything from DB (`lib/pricing.ts`), creates an order row with status `pending_payment`, generates a `short_code`, creates a Stripe Checkout Session with `metadata.order_id`, stores the session id.
3. Client is redirected to Stripe; on success Stripe redirects to `/o/{short_code}?paid=1`.
4. `/api/webhooks/stripe` verifies the signature and, on `checkout.session.completed`, promotes the order to `received` (idempotent — only updates rows still in `pending_payment`).
5. The customer's order page and every staff dashboard subscribe to `postgres_changes` on `orders`; the status flip is live.

## Security notes

- Never trust client-supplied prices. `lib/pricing.ts` recomputes everything server-side.
- Service-role key is only used in `lib/supabase/service.ts` (imported in server-only files via `"server-only"`).
- RLS is on every table; customer reads go through the `/api/orders/[shortCode]` endpoint, not directly to Supabase.
- Webhook uses the raw request body (`req.text()`) so Stripe signatures verify.
- Money is integer cents everywhere. Never floats.
- `short_code` is 10 chars from an unambiguous alphabet via `nanoid`.

## Deploy (Vercel)

1. Push to GitHub and import into Vercel.
2. Add the same env vars from `.env.local.example` in Vercel Project Settings.
3. Update `NEXT_PUBLIC_APP_URL` to your prod domain.
4. In the Stripe Dashboard, create a webhook endpoint pointing at
   `https://your-domain.com/api/webhooks/stripe` for the events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `checkout.session.async_payment_failed`
5. Copy the production `whsec_...` into Vercel as `STRIPE_WEBHOOK_SECRET`.

## What's intentionally missing (ship-first MVP)

- Delivery / tables / reservations
- Tips, coupons, loyalty, inventory
- Receipt email/SMS (order page replaces it)
- Refunds UI (do them in the Stripe dashboard)
- Printer / KDS integration
- Image upload (paste a URL for now)
- Self-serve shop signup (manual insert for your first shops)
- Staff invite emails — owner adds staff by creating users in Supabase and inserting `shop_users` rows

These are all straightforward to add later on top of this schema without migrations.
