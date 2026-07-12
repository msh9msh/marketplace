# Project: Community Pharmacy Deals Marketplace (working name: TBD)

> **Revision history — read this first.**
> v1 (discarded): blind broker — platform collected payment upfront,
> admin-assigned orders, 48h SLA guarantee, hidden locked price.
> v2 (discarded): open listing marketplace with NO payment on the platform
> — request/accept then contact reveal, negotiation off-platform.
> v3 (discarded, but conceptually mostly carried forward): payment back on
> the platform via commission, single ad-hoc `Deal` postings + a
> `SupplyRequest`/`SupplyOffer` path.
> **v4 (current, this file): suppliers get a full catalog/profile, not just
> one-off deal postings.** Payment/commission model from v3 is retained.
> The supply-request path from v3 is retained for items outside any
> supplier's catalog. What's new in v4: supplier catalog with per-item
> stock and discount, a weekly Excel bulk-update mechanism, pharmacy
> browsing by geographic proximity (city/district) and best discount, and
> a hard rule that one order/cart can only contain items from a single
> supplier. If you see anything describing a supplier with only one
> standalone `Deal` and no catalog, that's stale — trust this file and
> `docs/` only.

## What this is
A two-sided marketplace connecting private-sector community pharmacies in
Saudi Arabia with SFDA-licensed pharmaceutical suppliers.

- **Every supplier has a profile page**: a full catalog of their products,
  each with available stock and the discount/price they're offering. A
  supplier can flag specific catalog items as "featured deals" that get
  extra visibility (landing page, browse view highlights) — featured items
  are not a separate data model, just a flag on a catalog item.
- **Pharmacies browse suppliers**, filterable/sortable by geographic
  proximity (city/district — no GPS precision needed for v1) and by best
  discount on the items they care about. They build a cart from a single
  supplier's catalog and pay through the platform (commission-based,
  no accept/reject step — same as a food-delivery checkout).
- **When no supplier's catalog has what a pharmacy needs**, the pharmacy
  can post a supply request; suppliers see a board of these and submit
  priced offers; the pharmacy accepts one, which triggers payment through
  the platform the same way.

Full flow detail: `docs/business-rules.md`.

## Scope for v1 build (build this first, nothing more)
- Web only. No native iOS/Android app yet — ship a responsive PWA.
- Single Next.js app (frontend + backend in one repo).
- Two languages: Arabic and English. Arabic is RTL.
- Public landing page with dynamic charts and featured-deal highlights
  (catalog items flagged `is_featured`), then two auth paths: pharmacy and
  supplier, both supporting mobile number OR email login.
- Payment is in scope — sandbox/test credentials only until explicit
  go-ahead for production.
- Geographic matching is city/district-level string matching in v1 — no
  GPS/lat-long distance calculation. Don't over-build this.

## Tech stack (v1 build)
- Next.js (App Router), TypeScript, Tailwind CSS
- PostgreSQL via Prisma ORM
- Auth: mobile number OR email login for both pharmacy and supplier
  account types.
- Payment gateway: mada + credit cards, needs to support a commission/
  split-payment model — isolate behind an internal interface (see
  `docs/tech-stack.md`).
- Excel parsing: a library like `xlsx`/`exceljs` for the weekly supplier
  catalog bulk-update upload.
- Charts: Recharts or Chart.js for the landing page.
- i18n: next-intl
- Deploy target: Vercel (app) + managed Postgres.

## Reference docs — read before touching the related area
- `docs/business-rules.md` — catalog management (manual + weekly Excel
  sync), the single-supplier-per-cart rule, both purchase paths, and
  commission calculation. Read this before writing any catalog, cart, or
  transaction logic.
- `docs/data-model.md` — full schema: Pharmacy, Supplier, CatalogItem,
  SupplyRequest, SupplyOffer, Transaction, TransactionItem,
  InventoryUpload, etc. Read this before writing any Prisma schema or
  migration.
- `docs/screens.md` — the MVP screen list, in priority order.

## Non-negotiable rules for this version
1. **One cart/order = one supplier.** A pharmacy cannot check out with
   items from more than one supplier in a single transaction. Enforce this
   at the cart level (adding an item from a different supplier should
   either replace the cart or be blocked with a clear prompt), not just at
   payment time.
2. A supplier can manage their catalog manually (add/edit/remove items,
   any time) AND via a weekly Excel bulk-upload. The weekly upload is a
   sync/reminder mechanism, not the only way to update the catalog — don't
   gate manual editing behind it.
3. Deal purchases (from the catalog) still require no supplier accept/
   reject step — payment is the commitment. Only supply-request offers
   (Path 2) get an explicit pharmacy-accept step.
4. `CatalogItem.quantity_available` decrements per purchase across however
   many line items a transaction contains; it's shared inventory, not
   per-listing like the old single-`Deal` model.
5. Geographic proximity in v1 is city/district string matching — do not
   build lat/long distance calculation or a maps integration yet.
6. Both pharmacy and supplier accounts require admin verification
   (license / SFDA license) before they can transact.
7. The platform does not take ownership of inventory itself and does not
   model a platform-side warehouse — `CatalogItem.quantity_available` is
   the supplier's own declared stock, informational for matching/ordering
   purposes, not goods physically held by the platform.

## Conventions
- TypeScript everywhere, strict mode on.
- Server Actions preferred over hand-rolled API routes; use Route Handlers
  for anything a third party (payment webhook, etc.) needs to call.
- All user-facing strings go through the i18n dictionary.
- Every Prisma model change ships with a migration.
- Money is always stored as integer halalas, never a float.
- Excel upload processing should validate rows before applying any change,
  and report per-row errors back to the supplier rather than silently
  skipping or partially applying a bad file.

## Do not
- Do not build native mobile apps yet.
- Do not integrate a live payment gateway against production credentials
  without explicit go-ahead.
- Do not build admin-mediated order assignment or an SLA countdown.
- Do not build a supplier accept/reject step on catalog/cart purchases.
- Do not build GPS/lat-long distance matching in v1 — city/district only.
- Do not invent business rules not in `docs/business-rules.md`.
