# Data Model (v4 — supplier catalog + weekly sync + geo browsing)

Translate directly into Prisma models. See `docs/business-rules.md` for
*why* each field exists.

## Pharmacy
- id, authUserId
- name
- license_number, license_doc_url
- verification_status: enum [pending, verified, rejected]
- login_identifier_type: enum [mobile, email]
- mobile (nullable), email (nullable)
- city, district (nullable) — used for geographic matching
- address
- created_at

## Supplier
- id, authUserId
- name
- sfda_license_number, sfda_license_doc_url
- verification_status: enum [pending, verified, rejected]
- login_identifier_type: enum [mobile, email]
- mobile (nullable), email (nullable)
- city, district (nullable) — used for geographic matching
- created_at

## CatalogItem
Replaces the old standalone `Deal` model — a supplier's full catalog.
- id, supplier_id
- product_name, product_type
- sku (nullable) — used to match rows on Excel re-upload if present
- price, discount_percentage (nullable) — store the discounted price the
  pharmacy actually pays as the effective price; keep both the base price
  and discount if the supplier wants the original shown as a strike-through
- quantity_available — decrements on purchase
- is_featured: boolean — supplier-controlled flag for landing-page/browse
  highlighting; NOT a separate model
- status: enum [active, inactive] — supplier can deactivate without
  deleting (preserves history for past transactions)
- created_at, updated_at

## InventoryUpload
Log of weekly (or ad hoc) Excel bulk-sync uploads.
- id, supplier_id
- file_url
- status: enum [processing, completed, completed_with_errors, failed]
- row_count, success_count, error_count
- error_details (nullable, JSON) — per-row error messages
- uploaded_at

## SupplyRequest
- id, pharmacy_id
- product_name, product_type
- quantity
- note (nullable)
- status: enum [open, fulfilled, closed]
- created_at

## SupplyOffer
- id, supply_request_id, supplier_id
- price
- message (nullable)
- status: enum [pending, accepted, rejected] — when one offer on a request
  is accepted, all other pending offers on the same request are
  auto-transitioned to rejected in the same operation (see
  business-rules.md, "Concurrent supply offers")
- created_at, responded_at (nullable)

## PlatformSetting
Single-row (or key-value) config table for platform-wide settings.
- id
- commission_rate — the current global rate, copied into each
  `Transaction.commission_rate` at creation time
- updated_at

## Transaction
One row per checkout, regardless of how many catalog items are in the
cart. Enforces single-supplier-per-cart at the application level (all
`TransactionItem`s in a `Transaction` must belong to the same
`supplier_id`).
- id
- source_type: enum [catalog_purchase, supply_offer]
- pharmacy_id, supplier_id
- total_amount
- commission_rate — copied from the current global platform rate at the
  moment of transaction (not looked up dynamically later; historical
  transactions must not change if the rate changes afterward)
- platform_commission_amount, supplier_payout_amount
- payment_status: enum [pending, paid, failed, refunded]
- payment_method: enum [mada, card]
- payout_status: enum [pending, paid] — set manually/in batch by admin in
  v1; no automated payout scheduling yet
- paid_at, created_at

## TransactionItem
- id, transaction_id
- catalog_item_id (nullable — null when source_type = supply_offer)
- supply_offer_id (nullable — null when source_type = catalog_purchase)
- product_name, quantity, unit_price, line_total

## Notes for implementation
- Prices/amounts are integers in halalas, never floats.
- Every enum above should be a Prisma enum.
- The single-supplier-per-cart rule is enforced in application logic when
  building/committing a `Transaction`, not something the schema alone can
  guarantee — validate it explicitly before creating `TransactionItem`
  rows.
- The commission calculation must be one shared function called from both
  the catalog-checkout flow and the supply-offer-acceptance flow.
- No standalone `Deal`, `Order`, `Payment` (as its own model), `Invoice`,
  or `AdminAlert` models in this version.
