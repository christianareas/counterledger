# CounterLedger

A personal-finance dashboard inspired by Mint. It aggregates financial data from connected financial institutions into a single view.

It's built with Next.js (App Router), TypeScript, Drizzle, PostgreSQL on Neon, and Plaid.

## Setup

### Requirements

- Node.js 26 or later, and npm 11 or later.
- A PostgreSQL database on Neon.
- A Plaid account and its API keys.
- Optional: The Vercel CLI, to pull environment variables, and the ngrok CLI, to test Plaid webhooks locally.

### Steps

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with the variables in [Environment Variables](#environment-variables). If the Vercel CLI is linked to the project, you can pull them instead:

   ```bash
   npm run vercel:env:pull
   ```

3. Apply the database migrations:

   ```bash
   npm run db:migrate
   ```

4. Start the development server, and then open <http://localhost:3200>:

   ```bash
   npm run dev
   ```

5. Optional: To test Plaid webhooks locally, open a tunnel to the development server, and then set `PLAID_WEBHOOK_URL` to the tunnel's URL followed by `/api/plaid/webhook`:

   ```bash
   npm run dev:tunnel
   ```

   A connection keeps the webhook URL it was created with, so create a new connection to test with the tunnel.

## Environment Variables

Next.js and Drizzle Kit both read these variables from `.env.local`, which Git ignores. If a required variable is missing, the app or Drizzle Kit throws an error that names it.

| Variable            | Required | Purpose                                                                                                                                                                                                                                                |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`      | Yes      | The connection string for the Neon database. The app and Drizzle Kit both use it.                                                                                                                                                                      |
| `PLAID_ENV`         | Yes      | The Plaid environment to connect to, either `sandbox` or `production`. The app throws an error for any other value.                                                                                                                                    |
| `PLAID_CLIENT_ID`   | Yes      | The Plaid client ID.                                                                                                                                                                                                                                   |
| `PLAID_SECRET`      | Yes      | The Plaid secret for the environment in `PLAID_ENV`.                                                                                                                                                                                                   |
| `PLAID_WEBHOOK_URL` | No       | The full URL that Plaid sends webhooks to, set when the app creates a Link token. Locally, it's the ngrok URL followed by `/api/plaid/webhook`; in production, it's the Vercel URL followed by the same path. Without it, Plaid doesn't send webhooks. |

## Scripts

Run each script with `npm run <script>`.

### Development

| Script       | What It Does                                                        |
| ------------ | ------------------------------------------------------------------- |
| `dev`        | Starts the development server on port 3200.                         |
| `dev:tunnel` | Opens an ngrok tunnel to port 3200, to test Plaid webhooks locally. |
| `build`      | Builds the app for production.                                      |
| `start`      | Starts the production server. Run `build` first.                    |

### Type Checking and Linting

| Script                   | What It Does                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `typecheck`              | Type-checks the project with TypeScript, without emitting files.                           |
| `lint:all`               | Runs every linter. For now, that's `lint:code`.                                            |
| `lint:all:write`         | Runs every linter, and applies safe fixes. For now, that's `lint:code:write`.              |
| `lint:code`              | Checks formatting, lint rules, and import order with Biome.                                |
| `lint:code:write`        | Runs `lint:code`, and applies safe fixes.                                                  |
| `lint:code:write:unsafe` | Runs `lint:code`, and applies safe and unsafe fixes. Review the changes before you commit. |

### Dependencies

| Script               | What It Does                                                                                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reinstall:all`      | Deletes `node_modules`, `.next`, and `package-lock.json`, and then reinstalls every dependency.                                                                                                                                     |
| `update:all`         | Updates every dependency in `package.json` to its latest version with npm-check-updates, updates their dependencies within their ranges, migrates the Biome configuration, dedupes, and then lists outdated and installed packages. |
| `audit:dependencies` | Checks the dependencies for known vulnerabilities with `npm audit`.                                                                                                                                                                 |

### Database

| Script        | What It Does                                                                    |
| ------------- | ------------------------------------------------------------------------------- |
| `db:generate` | Generates a SQL migration in `drizzle/` from changes to `src/lib/db/schema.ts`. |
| `db:migrate`  | Applies pending migrations to the database.                                     |
| `db:push`     | Pushes the schema straight to the database, without a migration.                |

### Vercel

| Script            | What It Does                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `vercel:env:pull` | Pulls the Vercel project's environment variables into `.env.local`. It requires the Vercel CLI and a linked project. |
