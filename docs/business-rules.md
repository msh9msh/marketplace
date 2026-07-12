# Business Rules & Order Lifecycle

## The problem this platform solves
Many private-sector community pharmacies in Saudi Arabia cannot reliably
restock: some are blocked or restricted by suppliers over past payment
issues, others can't meet a supplier's minimum order quantity. The platform
fixes both by acting as a paid intermediary: the pharmacy pays the platform
upfront (removing the supplier's credit risk) and the platform accepts any
quantity (removing the minimum-order barrier).

## Actors
- **Pharmacy** — creates orders, pays upfront, tracks status, confirms
  receipt.
- **Supplier** — SFDA-licensed, under contract with the platform (target +
  SLA + payout terms). No login/portal in v1; managed by admin.
- **Admin** — reviews new (paid) orders, manually assigns each to a supplier,
  manages supplier contracts, targets, and pricing.

## End-to-end order flow
1. Pharmacy registers, uploads license → admin verifies manually → account
   activated.
2. Supplier is onboarded in the background: SFDA license, signed contract
   (quantity/revenue target, 48h delivery SLA, payout terms).
3. Pharmacy creates an order (item + type + quantity). The system shows the
   lowest available price across contracted suppliers and locks it as
   `Order.locked_price`.
4. Pharmacy pays upfront through the payment gateway. On confirmed payment:
   `Order.status = pending_review`, `Order.created_at` is set — **this is
   when the 48-hour SLA clock starts**.
5. Order appears in the admin queue, sorted by closest to SLA deadline.
   Admin manually picks a supplier (comparing `actual_supplier_price` and
   the supplier's progress toward their period target) and assigns the
   order → `Order.status = assigned`, `assigned_supplier_id` and
   `actual_supplier_price` are recorded.
6. Supplier fulfills and delivers within what remains of the 48-hour window.
7. Pharmacy confirms receipt, or reports an issue (shortage/damage/delay).
   If the pharmacy does not confirm within a defined grace period (default:
   24h after delivery), the order auto-confirms — this keeps invoicing and
   supplier payouts from stalling on an inactive pharmacy.
8. Platform pays the supplier's dues per the supplier's contracted payout
   schedule (see "Supplier payout timing" below).
9. A periodic statement (weekly/monthly) lists all of the pharmacy's orders
   for the period — this is a record/e-invoicing artifact, not a payment
   request, since every order was already paid at creation.
10. Background jobs update: supplier's cumulative progress toward their
    target, the internal margin report, and the SLA-compliance report.

## Price locking (do not simplify this away)
- `locked_price` is the lowest price available across contracted suppliers
  for that item at the moment the pharmacy creates the order.
- It never changes after that point, regardless of which supplier the order
  is actually assigned to.
- `locked_price` carries no platform markup — it is the raw lowest quoted
  price. This is intentional: it keeps the "guaranteed lowest price" claim
  literally true, not "lowest price plus our fee."
- `actual_supplier_price` (recorded at assignment) is for internal
  reconciliation only and is never shown to the pharmacy.

## How the platform makes money (supplier rebate, not a pharmacy-side markup)
- Margin comes from a per-supplier negotiated rebate,
  `SupplierContract.rebate_rate`, not from adding anything to the
  pharmacy-facing price.
- At payout time: `SupplierPayout.amount = actual_supplier_price × quantity ×
  (1 - rebate_rate)`. The rebate is netted directly out of what the platform
  pays the supplier — there is no separate invoice or collection step from
  the supplier.
- `rebate_rate` is negotiated per supplier, same spirit as `payout_days` —
  don't hardcode a single platform-wide rate.
- Consequence worth flagging explicitly: because margin depends on
  `rebate_rate`, not on minimizing `actual_supplier_price`, admin's
  assignment choice should account for both the supplier's actual price and
  their rebate rate together (net cost to the platform), not price alone —
  a higher-priced supplier with a better rebate can be the more profitable
  assignment even though `actual_supplier_price` alone looks worse. This is
  still consistent with rule 1 below: the pharmacy never sees any of this,
  since `locked_price` doesn't move regardless of assignment.
- If `actual_supplier_price` (net of rebate) ends up above `locked_price`,
  the platform absorbs that difference on that order — same as before, this
  is what makes the guaranteed-lowest-price promise real.

## The 48-hour SLA clock
- Starts at `Order.created_at` (payment confirmation), **not** at
  `Order.assigned_at`.
- Consequence: if admin takes two hours to assign an order, the supplier
  effectively has 46 hours left, not 48. This must be visible to admin as a
  shrinking countdown, and must trigger an `AdminAlert` (type:
  `unassigned_timeout`) if an order sits unassigned past a short internal
  threshold (default: 2 hours).
- SLA breach policy (who compensates whom when 48h is exceeded) is a
  contractual term with each supplier, not a platform-wide constant — model
  it per-contract, don't hardcode a single penalty rule.

## Supplier payout timing — negotiable, not fixed
- Do not assume suppliers are paid immediately on delivery.
- `SupplierContract.payout_days` is the number of days after delivery (or
  after a periodic batch cutoff) that the platform pays the supplier's dues.
  Common patterns: 0 (immediate), 7 (weekly batch), 15/30 (trade credit).
- This directly affects the platform's working-capital needs: if
  `payout_days >= payment_gateway_settlement_days`, the platform is
  effectively financed by pharmacy prepayments and needs little to no
  standing working capital for this gap. Don't bake in an assumption that
  the platform must front cash to suppliers quickly.

## No order pooling
- Earlier design considered making small orders wait to be pooled with other
  pharmacies' orders to hit a supplier's minimum order quantity. This was
  explicitly dropped: because pharmacies pay upfront, suppliers accept any
  quantity, guaranteed by the platform's payment. **Do not reintroduce a
  "wait for pooling" order status.**

## Unavailable item / no supplier
- If no contracted supplier can fulfill an item, the order should surface a
  clear `unavailable` state and trigger an `AdminAlert` (type:
  `no_supplier_available`) so admin can source an alternative quickly,
  rather than the order silently stalling.

## What the platform is not
- Not a drug wholesaler/distributor. It never takes ownership of or stores
  inventory. There is no warehouse concept anywhere in this system.
- Not a lender in the traditional sense — pharmacies pay before goods move,
  so there's no pharmacy-side credit extended by the platform.
