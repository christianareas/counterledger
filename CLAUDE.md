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
- Explicit create/update branching instead of upserts when tracking which operation happened

## Notes
- Plaid chosen over Teller for SoFi support
- Data stored is transaction history and balances — Plaid credentials never touch this app
- Use `tx` (not `transaction`) for Drizzle transaction variable to avoid confusion with financial transactions
