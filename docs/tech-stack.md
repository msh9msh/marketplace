# Tech Stack Decisions

## Locked in
- Next.js (App Router) + TypeScript + Tailwind — single repo, frontend and
  backend together for v1. Don't split into a separate backend service yet.
- PostgreSQL + Prisma ORM.
- next-intl for Arabic/English/Urdu, with RTL handling for Arabic and Urdu.
- Deploy: Vercel for the app.
- **Supabase**: Postgres + Auth + Storage, one vendor for all three. Auth is
  phone number + OTP (matches how pharmacy staff actually operate day to
  day). Storage holds pharmacy license-verification documents.

## Needs a decision before building the related feature
- **Payment gateway**: must support mada + credit cards, and needs to be
  usable by a newly registered Saudi commercial entity. Still unconfirmed —
  candidates considered: Moyasar, HyperPay/Geidea, PayTabs, Tap. Don't
  hardcode against a specific vendor's SDK until this is confirmed — isolate
  payment calls behind a small internal interface so swapping providers later
  is a contained change. This gates `docs/roadmap.md` Phase 3.
- **E-invoicing (ZATCA) provider**: needed before the periodic statement
  feature (`docs/screens.md`, phase 2, item 10) goes live with real
  transactions. Sandbox/mock this until a provider is chosen.
- **SMS/WhatsApp notifications** (order status updates to pharmacies and
  suppliers): not scoped in detail yet — start with in-app status only, add
  notifications once the core flow works.

## Explicitly rejected for v1
- Separate NestJS/Django backend — unnecessary complexity for a solo build;
  revisit only if the Next.js API routes genuinely become a bottleneck.
- Native mobile (React Native) — PWA covers the v1 need; native apps are a
  post-validation investment, not a v1 requirement.
- Supplier-facing login/portal — adds auth complexity with no v1 payoff since
  admin relays assignments manually at this stage.
