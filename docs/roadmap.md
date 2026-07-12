# Build Roadmap

This merges `screens.md`'s build order with the open strategic gaps identified
during planning (margin model, regulatory risk, SLA credibility, catalog
sourcing, admin scaling). Each phase lists what it builds, what it depends on
being decided first, and what "done" means before moving to the next phase.
Do not start a phase whose gating decisions are still open — that's exactly
how the price-locking and SLA-clock logic would get "simplified away" under
deadline pressure.

## Phase 0 — Validate & Decide (no code)

**Goal:** de-risk the business model and lock the decisions that reshape the
data model, before spending the ~150K SAR MVP dev budget.

### Resolved
- **Margin model: negotiated supplier rebate.** `locked_price` stays the raw
  lowest quoted price, no pharmacy-side markup. Platform margin comes from
  `SupplierContract.rebate_rate`, netted out of `SupplierPayout.amount`.
  Written into `business-rules.md` and `data-model.md`.
- **DB host + Auth + Storage: Supabase**, one vendor for all three. Auth is
  phone number + OTP. Storage holds license-verification documents. Written
  into `tech-stack.md` and `CLAUDE.md`.
- **Target model: one active target per supplier**, fields stay on
  `SupplierContract` as originally drafted in `data-model.md` (no separate
  `SupplierTarget` history table for v1).
- **SLA-breach floor clause**: drafted (see contract template note below);
  needs a lawyer pass before it goes into any real supplier contract.

### Still open
- **Payment gateway**: mada + card support, unconfirmed. Candidates:
  Moyasar, HyperPay/Geidea, PayTabs, Tap. Isolate behind an internal
  interface per `tech-stack.md` so this doesn't block scaffolding — but it
  gates Phase 3 (nothing pays without it).
- **Preliminary legal/regulatory read** with SFDA/e-commerce/ZATCA counsel —
  specifically who is the invoiced "seller of record." Gates Phase 3
  (Payment/Invoice shape) and Phase 5 (e-invoicing).
- **Run the manual pilot** (3–5 suppliers, 5–10 pharmacies, WhatsApp/Excel)
  to validate: is the rebate-based spread reliably favorable in practice, and
  do suppliers actually hit 48h without a portal? Use the pilot tracking
  columns agreed earlier (pharmacy, item, qty, locked price, actual supplier
  price, spread, timestamps, SLA met Y/N, payment/payout dates, issues).

**Exit criteria:** payment gateway picked (or explicitly deferred behind the
interface into Phase 3), regulatory read back from counsel, pilot data gives
at least directional confidence the rebate spread is profitable.

## Phase 1 — Foundation

**Goal:** a deployable skeleton with the schema, i18n, and auth in place.

- Repo scaffold: Next.js (App Router) + TypeScript strict + Tailwind.
- Prisma schema from `data-model.md`, updated with whatever Phase 0 decided
  (margin field, resolved `SupplierContract`/`SupplierTarget` shape). Every
  enum as a Prisma enum. Money fields as integer halalas.
- `transitionOrderStatus` service function stubbed now, even before order
  logic exists — this is where SLA/alert side effects must live per
  `data-model.md`, so build it as a single choke point from the start rather
  than retrofitting later.
- i18n skeleton: next-intl wired for ar/en/ur with RTL handling, empty
  dictionaries, language switcher — before any real screen, per `CLAUDE.md`.
- Auth: Supabase Auth, phone + OTP, two roles (pharmacy, admin).
- Deploy pipeline: Vercel + Supabase (Postgres + Storage), first migration
  run.

**Exit criteria:** empty app deploys, login works for both roles, switching
language flips direction correctly on a placeholder page.

## Phase 2 — Pharmacy Onboarding & Supplier/Contract Admin

**Builds on:** `screens.md` phase 1, items 1–3.

- Pharmacy sign up/login with license upload → `pending` verification state.
- Admin: pharmacy verification queue (approve/reject).
- Admin: supplier & contract management (manual entry) — including the
  SLA-breach floor clause and `payout_days` fields from `business-rules.md`.
- Seed `Product` catalog from SFDA's registered-drug list rather than
  building it order-by-order — flagged in Phase 0 discussion as the
  bottleneck behind "any item" if left fully manual.

**Exit criteria:** a pharmacy can register and get verified; an admin can
onboard a supplier with a contract, price list, and target.

## Phase 3 — Order Creation & Payment

**Builds on:** `screens.md` phase 1 item 4, phase 2 item 9. **Gated by:**
Phase 0's margin model and payment gateway decisions.

- Item search → type → quantity → locked price (lowest active `SupplierPrice`
  + the chosen margin) → pay.
- Payment integration against the chosen gateway, sandbox credentials only
  (per `CLAUDE.md`'s "do not" list).
- `Order.created_at` set on confirmed payment — this is the SLA clock start,
  not order creation time — verify this explicitly, it's the rule most likely
  to get subtly wrong.

**Exit criteria:** a pharmacy can pay for a real order end-to-end in sandbox
and see it land as `pending_review` with the SLA countdown already running.

## Phase 4 — Assignment & Fulfillment Tracking

**Builds on:** `screens.md` phase 1 items 5–8.

- Admin: new orders queue sorted by SLA deadline proximity, visible
  countdown.
- Admin: assignment screen (compare `actual_supplier_price` + target
  progress), sets `assigned_supplier_id`.
- `AdminAlert` triggers: `unassigned_timeout` (2h default), `sla_breach_risk`,
  `no_supplier_available`.
- Pharmacy: my orders list + order detail (confirm receipt / report issue),
  24h auto-confirm job.

**Exit criteria:** an order can go from paid → assigned → delivered →
received (or auto-confirmed) with alerts firing on the documented triggers.

## Phase 5 — Money & Reporting

**Builds on:** `screens.md` phase 2 items 10–13. **Gated by:** Phase 0's
regulatory read (affects who issues the invoice).

- `SupplierPayout` scheduling off `payout_days` per contract.
- Periodic statement/invoice view (record, not a payment request), ZATCA
  compliance confirmed against Phase 0's legal read.
- Admin: margin report — now meaningful once Phase 0 defined an actual
  margin mechanic, not just locked vs. actual price comparison.
- Admin: SLA compliance report.
- Pharmacy: analytics (spend, savings).

**Exit criteria:** a full weekly/monthly cycle can be run against pilot data
and the margin report shows real (not assumed) unit economics.

## Phase 6 — Hardening & Scale Readiness

- Staffing plan for admin order assignment tied to order volume (the 20
  orders/day steady-state in `Capital_Calculator.xlsx` assumes one admin;
  revisit before volume exceeds what one person can review inside the 2h
  escalation window, including nights/weekends).
- SMS/WhatsApp notifications (deferred in `tech-stack.md` until core flow
  works — this is that point).
- Monitoring on the background jobs (target progress, SLA breach, auto-
  confirm) since they're load-bearing for payouts and alerts.

## Phase 7 — Explicitly Deferred (post-MVP / v2)

Carried over as-is from `CLAUDE.md`/`tech-stack.md` — do not pull these
forward without a deliberate re-scoping conversation:

- Supplier self-service login/portal.
- Automated supplier-assignment algorithm.
- Native iOS/Android apps.
- Split into a separate NestJS/backend service.
