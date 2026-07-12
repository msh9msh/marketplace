# Data Model

This is the target schema for the MVP. Translate directly into Prisma models;
field names below are the intended column names. See `docs/business-rules.md`
for *why* each field exists before changing any of them.

## Pharmacy
- id
- name
- license_number, license_doc_url
- verification_status: enum [pending, verified, rejected]
- contact_phone, contact_email, city, address
- created_at

## Supplier
- id
- name, sfda_license_number
- contract_status: enum [active, paused, terminated]
- sla_hours: int (default 48)
- created_at

## SupplierContract
- id, supplier_id
- payout_days: int — see "Supplier payout timing" in business-rules.md.
  This is the field that used to be assumed-immediate; it's now an explicit,
  per-supplier, negotiated value.
- rebate_rate: decimal — the platform's margin mechanic (see "How the
  platform makes money" in business-rules.md). Negotiated per supplier, not
  a platform-wide constant. Netted out of `SupplierPayout.amount`.
- target_type: enum [quantity, amount]
- target_value, period_start, period_end
- achieved_value — updated by a background job whenever an order tied to
  this supplier reaches `received`/auto-confirmed status.
- One active target per supplier at a time — target fields live directly on
  this row rather than a separate history table. Renegotiating a target
  mid-period means updating this row, not inserting a new one; if per-period
  target history is ever needed later, that's a deliberate v2 change, not an
  oversight.

## Product
- id, name, type, category

## SupplierPrice
- id, supplier_id, product_id
- price
- effective_from — keep history; don't overwrite, insert a new row when a
  supplier updates a price.

## Order
- id, pharmacy_id, product_id, quantity
- locked_price — captured at creation from the lowest `SupplierPrice` for
  that product among active suppliers. Immutable after creation.
- status: enum [awaiting_payment, pending_review, assigned, in_progress,
  delivered, received, issue, unavailable]
- assigned_supplier_id (nullable until assignment)
- actual_supplier_price (nullable until assignment) — internal only
- created_at — this is the SLA clock start
- assigned_at, delivered_at, received_confirmed_at (nullable, set as the
  order progresses)
- sla_deadline — computed: created_at + supplier.sla_hours
- sla_breached — boolean, set by a background job comparing now() to
  sla_deadline while status isn't yet `delivered`/`received`

## Payment
- id, order_id, pharmacy_id
- amount — equals locked_price × quantity
- method: enum [mada, card]
- status: enum [pending, paid, failed, refunded]
- paid_at

## SupplierPayout
- id, order_id, supplier_id
- amount — equals `actual_supplier_price × quantity × (1 - rebate_rate)`,
  i.e. the supplier's contracted rebate is netted out here, not collected
  separately. See "How the platform makes money" in business-rules.md.
- status: enum [pending, paid]
- scheduled_for — computed from order.delivered_at (or the relevant batch
  cutoff) + supplier_contract.payout_days
- paid_at

## Invoice (periodic statement)
- id, pharmacy_id, period_start, period_end
- total_amount, status: enum [draft, sent] — note: this is a *record*, not a
  payment request, since every underlying order is already paid. Needed for
  ZATCA e-invoicing compliance.
- order_ids (join table: InvoiceOrder)

## AdminAlert
- id, order_id
- type: enum [unassigned_timeout, sla_breach_risk, no_supplier_available]
- triggered_at, resolved: boolean

## Notes for implementation
- Money fields are integers in halalas (÷100 for display), never floats.
- Every enum above should be a Prisma enum, not a free-text string column.
- `Order.status` transitions should go through a single service function
  (e.g. `transitionOrderStatus`), not be set directly in multiple places —
  this is where SLA/alert side effects should live.
