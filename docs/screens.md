# MVP Screens — Build Order

Low-fidelity wireframes for these already exist (ask the project owner for
`wireframes_en.html` if not present in this repo) — match their layout intent,
not their visual styling; real styling should follow the frontend-design
approach for this specific product, not copy the wireframe's placeholder look.

## Build phase 1 — pharmacy can order, admin can fulfill
1. Pharmacy sign up / login (with license upload + pending verification state)
2. Admin: pharmacy verification queue
3. Admin: supplier & contract management (manual data entry is fine — no
   supplier self-service UI in v1)
4. Pharmacy: new order screen (item search → type → quantity → locked price
   → pay)
5. Admin: new orders queue, sorted by SLA deadline proximity, with a visible
   countdown per order
6. Admin: order assignment screen (compare eligible suppliers' actual price
   + target progress, assign)
7. Pharmacy: my orders list (status + countdown)
8. Pharmacy: order detail (fulfillment timeline, confirm receipt / report
   issue)

## Build phase 2 — money & reporting
9. Payment integration (sandbox first)
10. Pharmacy: periodic statement / invoice view
11. Admin: margin report
12. Admin: SLA compliance report
13. Pharmacy: analytics (total spend, savings)

## Explicitly out of scope for v1
- Supplier login/portal (admin relays assignment manually — e.g. via
  WhatsApp/email until this is worth building)
- Native iOS/Android apps
- Automated supplier-assignment algorithm (admin decides manually — this is
  intentional, not a shortcut, since early assignment decisions need human
  judgment about which supplier relationship to prioritize)
