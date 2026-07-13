# Build Roadmap

This file tracks pre-build strategic decisions only (Phase 0 below). For the
actual build order and current progress, `docs/screens.md` is the source of
truth — do not maintain a second phase list here that can drift out of sync
with it.

> **v4 note:** earlier drafts of this file were written against the v3
> `SupplierContract`/rebate margin model with `Order`, SLA-breach clocks,
> `AdminAlert`, and admin-mediated assignment. None of that exists in v4 —
> see `CLAUDE.md`'s revision history. This file has been trimmed to match.

## Phase 0 — Validate & Decide (no code)

**Goal:** de-risk the business model and lock the decisions that reshape the
data model, before spending the ~150K SAR MVP dev budget.

### Resolved
- **DB host + Auth + Storage: Supabase**, one vendor for all three. Auth is
  phone number + OTP. Storage holds license-verification documents. Written
  into `tech-stack.md` and `CLAUDE.md`.
- **Margin model: single global commission rate**, not a per-supplier
  negotiated rebate. See `PlatformSetting.commission_rate` in
  `data-model.md` and the commission/payout section of `business-rules.md`.

### Still open
- **Payment gateway**: mada + card support, unconfirmed. Candidates:
  Moyasar, HyperPay/Geidea, PayTabs, Tap. Isolate behind an internal
  interface per `tech-stack.md` so this doesn't block scaffolding — but it
  gates checkout/payment work in `screens.md`.
- **Preliminary legal/regulatory read** with SFDA/e-commerce/ZATCA counsel —
  specifically who is the invoiced "seller of record." Gates the payment/
  transaction shape and any future e-invoicing work.
- **Run a manual pilot** (a handful of suppliers and pharmacies) to validate
  the commission model and catalog/checkout flow before scaling.

**Exit criteria:** payment gateway picked (or explicitly deferred behind the
interface), regulatory read back from counsel, pilot data gives at least
directional confidence in the commission model.
