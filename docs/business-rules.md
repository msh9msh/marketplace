# Business Rules (v4 — supplier catalog + weekly sync + geo browsing)

## Actors
- **Pharmacy** — registers (mobile or email), gets license-verified,
  browses supplier catalogs, builds a cart from one supplier, pays, and
  can post supply requests for items no catalog has.
- **Supplier** — registers (mobile or email), gets SFDA-verified, manages
  a catalog of products (manual CRUD + weekly Excel bulk sync), and can
  submit offers on pharmacy supply requests.
- **Admin** — verifies pharmacy licenses and supplier SFDA licenses. No
  role in routing, assignment, or catalog moderation in v1.

## Supplier catalog management
- A supplier's catalog is a list of `CatalogItem`s: product name/type,
  price, discount, quantity available, and an `is_featured` flag.
- **Manual management**: a supplier can add, edit, or remove catalog items
  at any time from their dashboard — this is always available, not gated
  behind the weekly sync.
- **Weekly Excel sync**: the platform prompts each supplier weekly (in-app
  notification for v1 — no SMS/email yet) to upload an Excel file with
  their current inventory. On upload:
  - Each row is validated (required fields present, valid price/quantity).
  - Valid rows update the matching existing `CatalogItem` (matched by
    product name, or a SKU field if suppliers have one) or create a new
    one if no match exists.
  - Invalid rows are rejected with a per-row error shown to the supplier;
    a bad file must not silently wipe or corrupt the rest of the catalog.
  - Every upload is logged (`InventoryUpload`) with a status and result
    summary, so a supplier can see their sync history.
- Featured items (`is_featured = true`) are a subset of the same catalog,
  not a separate listing type — this replaces what used to be a
  standalone "Deal" model. A supplier decides which of their own items to
  feature.

## Pharmacy browsing
- Pharmacies browse a list of verified suppliers (profile pages), each
  showing their full catalog.
- The browse/search view supports filtering and sorting by:
  - **Geographic proximity**: city/district match against the pharmacy's
    own city/district (exact match ranked first, v1 has no distance
    calculation beyond that).
  - **Best discount**: for a given item, suppliers offering it can be
    ranked by discount/price.
- A limited public teaser (3-5 featured catalog items) appears
  unauthenticated on the landing page.

## Cart & checkout — single-supplier rule
- A pharmacy's cart can only contain items from **one supplier at a time**.
  Attempting to add an item from a different supplier while the cart
  already has items from another supplier must be blocked or must clearly
  prompt the pharmacy to replace the cart — never silently mix suppliers
  in one transaction.
- Checkout pays for the whole cart in one `Transaction`, with one
  `TransactionItem` per catalog line. No supplier accept/reject step —
  payment is the commitment, same as before.
- `CatalogItem.quantity_available` decrements per item purchased across
  the transaction's line items.

## Path 2: Supply requests (unchanged in spirit from v3)
- Used when a pharmacy needs an item that isn't in any supplier's catalog.
- Pharmacy posts a `SupplyRequest`; suppliers see an open-requests board
  and submit priced `SupplyOffer`s; the pharmacy reviews offers and
  explicitly accepts one (unlike catalog purchases, this path keeps an
  accept step since multiple competing offers need a resolution point).
- Accepting an offer creates a `Transaction` (source_type = supply_offer)
  and triggers payment the same way as a catalog purchase.

## Commission / payout
- Every `Transaction` (catalog cart checkout or accepted supply offer)
  computes: `total_amount` → `platform_commission_amount` (configurable
  rate) → `supplier_payout_amount`. One shared calculation function for
  both paths — don't duplicate it.
- **Commission rate**: a single global platform rate (not negotiated per
  supplier). Store it as a platform-level setting, and copy its value into
  `Transaction.commission_rate` at the moment of the transaction — so a
  later rate change doesn't retroactively alter historical transactions.
- **Supplier payout timing (v1)**: no automated payout scheduling yet.
  `Transaction.payout_status` (pending/paid) is set manually/in batch by
  admin outside the app for now (e.g., a periodic bank transfer run).
  Automating this is a later decision, blocked on the payment gateway
  choice — don't build a scheduler for it now.
- **E-invoicing (ZATCA)**: explicitly out of scope for the v1 MVP. No
  invoice-like model needed yet — `Transaction` is the only record. Revisit
  before launching with real payments.

## Cart behavior
- The cart is **client-side only** until checkout — no draft `Transaction`
  or reserved-inventory record in the database while a pharmacy is still
  browsing/building their cart.
- Stock availability (`CatalogItem.quantity_available`) is checked and
  decremented atomically at the moment of checkout/payment, not when an
  item is added to the cart. If quantity ran out between add-to-cart and
  checkout, checkout must fail with a clear error — don't let it silently
  oversell.

## Concurrent supply offers
- When a pharmacy accepts one `SupplyOffer` on a `SupplyRequest`, all
  other still-`pending` offers on that same request are automatically
  transitioned to `rejected` in the same operation — a request can only
  ever result in one accepted offer.

## What admin verification gates
- A pharmacy cannot browse-to-purchase or post a supply request until
  verified.
- A supplier cannot publish catalog items (manually or via Excel) or
  submit supply offers until verified.
- Verification is a one-time account-level gate, not per-transaction.

## Explicitly NOT in this version
- No lat/long distance calculation — city/district string matching only.
- No admin-mediated assignment or routing.
- No delivery tracking or SLA enforcement.
- No accept/reject step on catalog/cart purchases (only on supply-request
  offers).
- No mixing suppliers within a single cart/transaction.
