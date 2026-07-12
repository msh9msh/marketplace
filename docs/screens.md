# MVP Screens — Build Order (v4 — supplier catalog + weekly sync)

## Build phase 1 — landing, auth, verification
1. **Public landing page** — dynamic charts (active suppliers, catalog
   item counts), 3-5 featured (`is_featured`) catalog items teaser, two
   entry points (pharmacy / supplier).
2. **Login / signup** — one flow, both account types, mobile OR email.
3. **Admin: verification queue** — pharmacy licenses + supplier SFDA
   licenses.

## Build phase 2 — supplier catalog
4. **Supplier: my catalog** — table of catalog items (product, price,
   discount, stock, featured toggle, status), add/edit/remove individual
   items.
5. **Supplier: bulk upload** — upload an Excel file, see validation
   results (success/error count, per-row errors), view past upload
   history (`InventoryUpload` log).
6. **Supplier: profile settings** — name, city/district, contact info
   (this is what pharmacies see on the supplier's public profile page).

## Build phase 3 — pharmacy browsing & purchase
7. **Pharmacy: browse suppliers** — list of verified suppliers, filter/
   sort by city-district match and best discount on items of interest.
8. **Supplier profile page (pharmacy-facing)** — supplier info + full
   catalog, add items to cart.
9. **Cart** — enforces single-supplier rule; attempting to add from a
   second supplier prompts to replace the cart.
10. **Checkout / payment** — pay through platform (sandbox for v1 dev).
11. **Pharmacy: my purchases** — transaction history with line items.
12. **Supplier: my sales** — transaction history, commission taken,
    payout amounts.

## Build phase 4 — supply requests (Path 2)
13. **Pharmacy: post a supply request** — surfaced when browsing/search
    comes up empty, also accessible directly.
14. **Supplier: open supply requests board** — browse and submit priced
    offers.
15. **Pharmacy: my supply requests** — view offers received, accept one
    (triggers payment).
16. **Supplier: my offers** — track submitted offers and status.

## Explicitly out of scope for v1
- GPS/lat-long distance calculation — city/district matching only
- Delivery tracking or SLA countdowns
- Admin-mediated assignment/routing
- Native iOS/Android apps
- Accept/reject step on catalog/cart purchases (only supply-request
  offers get one)
- Mixing suppliers within a single cart
