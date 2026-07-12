# Tech Stack Decisions (v4 — supplier catalog + weekly sync)

## Locked in
- Next.js (App Router) + TypeScript + Tailwind — single repo.
- PostgreSQL + Prisma ORM.
- next-intl for Arabic/English, RTL handling for Arabic.
- Auth supporting mobile number OR email for both account types.
- Excel parsing/generation: `xlsx` or `exceljs` for the supplier bulk
  catalog upload — validate every row server-side before applying any
  change; never trust client-side validation alone.
- Charting library (Recharts or Chart.js) for the landing page.
- Deploy: Vercel for the app + managed Postgres (Supabase or Neon).

## Needs a decision before building the related feature
- **Payment gateway**: mada + cards, needs to support a commission/split
  model. Isolate behind an internal interface. Still the one open gap
  that's persisted across every version of this project — resolve before
  building checkout.

## Resolved (v1 defaults — build against these, don't leave them open)
- **Commission rate**: a single global platform rate, stored in
  `PlatformSetting`, copied into each `Transaction.commission_rate` at
  creation time. Not negotiated per supplier.
- **Supplier payout timing**: no automated scheduling in v1.
  `Transaction.payout_status` is set manually/in batch by admin outside
  the app. Automate later, once the payment gateway is chosen.
- **E-invoicing (ZATCA)**: explicitly OUT of scope for v1. No invoice
  model. Revisit before real-money launch.
- **Cart persistence**: client-side only until checkout. No draft
  `Transaction` or reserved-inventory record while browsing. Stock is
  checked/decremented atomically at checkout time.
- **Concurrent supply offers**: accepting one auto-rejects all other
  pending offers on the same `SupplyRequest`, in the same operation.
- **Weekly upload reminder delivery**: in-app notification/banner only for
  v1. SMS/email/WhatsApp reminders are a later addition.

## Geographic matching (v1 scope)
- City/district string matching only. No geocoding, no lat/long, no maps
  SDK. If this needs to become precise-distance-based later, that's a
  deliberate v2 feature, not something to half-build now.

## Explicitly rejected for v1
- Separate NestJS/Django backend — unnecessary for this scope.
- Native mobile (React Native) — PWA covers the v1 need.
- Admin order-routing/assignment logic.
- A supplier accept/reject step on catalog/cart purchases.
- GPS/precise distance calculation.
- Multi-supplier carts.
