# Project: Community Pharmacy Purchasing Platform (working name: TBD)

## What this is
A B2B marketplace/broker connecting private-sector community pharmacies in Saudi
Arabia with SFDA-licensed pharmaceutical suppliers. The platform does not hold
inventory. Full business context: `docs/business-rules.md`.

One-line pitch: a pharmacy orders any item in any quantity, pays upfront, and
the platform guarantees delivery within 48 hours by routing the order to a
contracted supplier — removing the credit-risk and minimum-order-quantity
barriers pharmacies normally face.

## Scope for v1 (build this first, nothing more)
- Web only. No native iOS/Android app yet — ship a responsive PWA.
- Single Next.js app (frontend + backend in one repo). No separate NestJS
  service — that split is a v2 optimization, not a v1 requirement.
- Three languages: Arabic, English, Urdu. Arabic and Urdu are RTL. Build the
  i18n layer from the first screen, not as a retrofit.
- Manual admin assignment of orders to suppliers (no auto-routing algorithm
  in v1 — see `docs/business-rules.md` for why this is manual by design).

## Tech stack (v1)
- Next.js (App Router), TypeScript, Tailwind CSS
- PostgreSQL via Prisma ORM
- Auth: Supabase Auth, phone number + OTP login — two user types: pharmacy,
  admin. Suppliers are managed by admin, not separate login accounts in v1.
- Payments: local gateway supporting mada + cards (provider still unconfirmed
  — do not hardcode against one vendor's SDK; isolate behind an internal
  interface per `docs/tech-stack.md`)
- i18n: next-intl
- Deploy target: Vercel (app) + Supabase (Postgres + Auth + Storage)

## Reference docs — read before touching the related area
- `docs/data-model.md` — full schema: Pharmacy, Supplier, Order, Payment,
  SupplierPayout, Invoice, AdminAlert, etc. Read this before writing any
  Prisma schema or migration.
- `docs/business-rules.md` — the order lifecycle, the 48-hour SLA clock, price
  locking, and the negotiable supplier-payout timing. Read this before
  writing any order-status or payment logic — the rules are easy to get
  subtly wrong and were iterated on deliberately.
- `docs/screens.md` — the MVP screen list for pharmacy app and admin
  dashboard, in priority order.

## Non-negotiable business rules (do not "simplify" these away)
1. `locked_price` is captured on the order at creation time and never changes,
   even if the order is later assigned to a supplier with a different price.
   `locked_price` is the raw lowest supplier price — the platform carries no
   markup on it. Platform margin comes entirely from a per-supplier
   negotiated rebate (`SupplierContract.rebate_rate`), netted out of that
   supplier's payout, never shown to the pharmacy.
2. The 48-hour SLA clock starts at `order.created_at` (when the pharmacy
   pays), not at `order.assigned_at`. An admin sitting on an unassigned order
   silently eats into the supplier's delivery window — this must surface as
   an alert, not fail silently.
3. Supplier payout timing is a configurable, per-supplier contract term
   (`SupplierContract.payout_days`), not a hardcoded assumption. Do not
   assume suppliers are paid immediately on delivery.
4. Any quantity is accepted on an order — there is no minimum-order-quantity
   gate and no "wait to pool orders" state. Do not reintroduce order pooling.
5. The platform never takes ownership of inventory. Don't model a warehouse,
   stock levels, or fulfillment-by-platform anywhere.

## Conventions
- TypeScript everywhere, strict mode on.
- Server Actions preferred over hand-rolled API routes where Next.js supports
  it; use Route Handlers for anything a third party (webhook, MCP, mobile
  app later) needs to call.
- All user-facing strings go through the i18n dictionary — never hardcode a
  string in a component, even placeholder text.
- Every Prisma model change ships with a migration, not a manual DB edit.
- Money is always stored as integer halalas (smallest currency unit), never
  as a float.

## Do not
- Do not build native mobile apps yet.
- Do not integrate ZATCA e-invoicing or a live payment gateway against
  production credentials until there is an explicit go-ahead — use sandbox/
  test credentials for all of v1 development.
- Do not add supplier self-service login/portal in v1 — admin manages
  suppliers directly.
- Do not invent business rules not in `docs/business-rules.md`. Ask instead
  of guessing when something is ambiguous.
