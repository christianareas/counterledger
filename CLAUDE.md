# CounterLedger
A personal-finance dashboard inspired by Mint. It aggregates financial data from connected financial institutions into a single view.

## Tech Stack
- Framework: Next.js (App Router)
- Database: PostgreSQL via Neon
- ORM: Drizzle
- Bank connectivity: Plaid
- Language: TypeScript

## Goals
- Personal use only — not a multi-user product.
- Local-first to start, with a hosted path planned for later.
- iOS app (SwiftUI) as a longer-term goal, so the API layer should be clean and well-structured from the start.

## Architecture
- Routes handle Plaid SDK calls and orchestration
- Adapters (`src/lib/plaid/adapters.ts`) map Plaid fields to schema fields at the boundary
- DB layer (`src/lib/db/plaid/sql.ts`) has zero Plaid SDK imports — accepts already-mapped data
- Shared sync logic (`src/lib/plaid/sync.ts`) used by both the sync route and the webhook route
- Explicit create/update branching instead of upserts when tracking which operation happened

## Webhooks
- Plaid sends `SYNC_UPDATES_AVAILABLE` to `POST /api/plaid/webhook` when new transaction data is available
- JWT verification using `jose` — signature check + body hash comparison, inlined in the route
- Initial sync triggered in `exchange-public-token` to activate webhooks for new items
- Webhook URL configured via `PLAID_WEBHOOK_URL` env var
- Local testing via ngrok (`npm run dev:tunnel`)

## Notes
- Plaid chosen over Teller for SoFi support
- Data stored is transaction history and balances — Plaid credentials never touch this app
- Use `tx` (not `transaction`) for Drizzle transaction variable to avoid confusion with financial transactions
