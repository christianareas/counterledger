# Agent Instructions

This project is CounterLedger, a personal-finance dashboard inspired by Mint. It aggregates financial data from connected financial institutions into a single view. To learn more, see the [README](README.md).

It's built with Next.js (App Router), TypeScript, Drizzle, PostgreSQL on Neon, and Plaid, which was chosen over Teller for its SoFi support.

It's for personal use only, not a multi-user product, but follow best practices anyway. It's local-first, with a hosted path planned for later. A SwiftUI iOS app is a longer-term goal, so keep the API layer clean and well structured.

## Directories and Files

The following sections list this project's main directories and files.

### API

- `src/app/api/plaid/`: The API routes, which handle Plaid SDK calls and orchestration.
- `src/app/api/plaid/webhook/route.ts`: The Plaid webhook endpoint, which verifies each webhook's JWT and then syncs one connection.
- `src/lib/api/errors.ts`: Reusable functions for handling caught errors.
- `src/lib/schemas/api.ts`: Zod schemas for API requests and responses.

### Plaid

- `src/lib/plaid/index.ts`: The Plaid client.
- `src/lib/plaid/adapters.ts`: Maps Plaid fields to schema fields.
- `src/lib/plaid/sync.ts`: The per-connection sync that `sync/route.ts` and `webhook/route.ts` share.

### Database

- `src/lib/db/index.ts`: The Drizzle client.
- `src/lib/db/schema.ts`: Every table.
- `src/lib/db/plaid/sql.ts`: The database operations. It has no Plaid SDK imports, and it accepts already-mapped data.
- `drizzle/`: Generated migrations.
- `drizzle.config.ts`: The migration settings.

### Non-User-Facing Files

- `.claude/settings.json`: Denies reading `.env*` files, and asks before `gh pr merge`.
- `.claude/skills/`: Skills for recurring tasks, one folder per skill. See also [Skills](#skills).
- `.claude/worktrees/`: One worktree per task. Git ignores it.
- `.github/`: The PR and issue templates.
- `biome.json`: Biome's settings, for code and config files.
- `.rumdl.toml`: rumdl's settings, for Markdown files.
- `postman/` and `.postman/`: Postman's Git sync writes these.

## Rules

Rules are short instructions that apply to many tasks, or that you need before you start one. When a rule, or a group of rules, grows into steps for one kind of task, move it to a skill in `.claude/skills/` and add it to [Skills](#skills).

### Manage Issues

- Before you get started, find or ask for an issue on the [CounterLedger board](https://github.com/users/christianareas/projects/5). If there's none, use the `create-and-manage-issues` skill to create one. Dependabot PRs have no issue, and the board adds each PR on its own.
- If a task's scope changes, update the issue and PR to match.
- If a PR handles something another open issue lists, remove it from that issue, and say what you removed.
- Status is To Do when the issue or Dependabot PR is added, In Progress when its worktree is created, In Review when its PR is ready for review, and Done when the PR merges. The board sets To Do and Done; humans and agents set In Progress and In Review.
- Before you move an issue to In Review, run `/code-review` on the branch and address its findings.

### Work in a Worktree

- A human starts each task's session in the main checkout, with **Worktree** off. Use the `add-and-remove-worktrees` skill to set up and remove the task's worktree.
- Enter the worktree before you edit anything. Until then, a session edits the main checkout.
- Name a task's worktree `.claude/worktrees/<issue-number>/`, on branch `<issue-number>-<short-name>`. A Dependabot PR's worktree uses the PR number, on Dependabot's branch. Issues and PRs share one number sequence, so a PR's number never matches an issue's.
- Title a task's session `#<number> <PR title>`, with the issue's number, or the PR's for a Dependabot PR. Until there's a PR, use the issue's title.
- Never move a worktree the app created for a session. The session's write hook stays registered to the old path, which strands the session.
- Give each worktree its own `.env.local`, copied from the main checkout, and its own `npm install`.
- All worktrees share one Neon database and one ngrok tunnel, so only one worktree at a time runs migrations or tests webhooks.
- A change to `.claude/settings.json` on a branch doesn't apply to a session that started in the main checkout, and a change to `.claude/skills/` may not, so test them after they merge.

### Branch and Commit

- Never commit or push unless asked. Each set of changes needs its own go-ahead. Humans ask for a change and then review the diff, and there's no diff to review once it's committed.
- Make one commit per logical change, so each message describes its whole commit.
- Write commit messages in the past tense, short and ending with a period, such as "Limited PLAID_ENV to sandbox and production."
- Never read `.env*` files. To copy one, use `cp`.
- This repository is public. Never name private repositories or organizations in it, or in issues, PRs, or commits.

### Write Code

- Have routes own the Plaid SDK calls, adapters own the field mapping, and `src/lib/db/plaid/sql.ts` own the database operations. Map Plaid data to the schema's shape as soon as a route receives it.
- Keep the initial sync in `exchange-public-token`. Plaid requires it to activate webhooks.
- Prefer inline, flat code that reads top to bottom over extracted helper functions. For example, webhook verification stays inline in its route.
- Spell out variable names, and name them for what they represent in the domain, such as `plaidAccount`, not `a`.
- Name a Drizzle transaction variable `tx`, not `transaction`, to avoid confusion with financial transactions.
- Say created, updated, and deleted, not added, modified, and removed.
- Use section comment banners (`// ----`) as visual separators.
- When one thing is done a certain way, do it that way everywhere.
- Import with the `@/*` path alias, which maps to `src/*`.

### Write API Routes

- Use try/catch in every API route, and return an explicit error response with status 500.
- Make responses reflect what happened. For example, report 0 updated if nothing changed.
- Return 204 for a webhook event that's received but not acted on.
- Keep auth and verification error messages generic, so they don't leak specifics.
- Throw a separate error for each missing environment variable.
- Keep snake_case keys in Zod schemas for external payloads, such as Plaid webhooks.

### Use the Database

- Generate UUID primary keys in application code with `randomUUID()`, not `defaultRandom()`, and point foreign keys at UUID primary key columns.
- Prefix Plaid-sourced fields with `plaid`, such as `plaidItemId`.
- Use explicit create and update branches instead of upserts when you need to track which operation happened.
- Have query helpers return `undefined`, not `null`, when there's no result, with no null coalescing.
- The app stores financial institutions, accounts, balances, and transaction history, along with each connection's `plaidAccessToken`. Bank logins go through Plaid and never touch this app.

### Manage Dependencies

- Write every `package.json` dependency as `^<full version>`, such as `"jose": "^6.2.15"`, never `^6` or an exact pin.
- Before you adopt a dependency, explain the trade-offs and ask.
- Use npm. #11 tracks whether to change package managers.

### Name Things

- Use CMoS (18th edition) title case and Merriam-Webster for headings, issue and PR titles, statuses, and workflow names. For example, write "To Do" and "Auto-Add".

### Lint and Validate

- If you edit Markdown, run `npm run lint:markdown`.
- If you edit code or config files, run `npm run lint:code`. If you edit `.ts` or `.tsx` files, also run `npm run typecheck`.
- Before you open a PR or push, run `npm run typecheck`, `npm run lint:all`, and `npm run build`.
- Biome is the only code linter. Don't add ESLint back, or turn on Biome's YAML or Markdown handling, without asking. Biome's Markdown formatter rewrites rumdl's tables.
- Add each new linter to `lint:all`.

### Run the Development Server

- Humans run the development server on ports 3200–3209. Agents use 3210–3219, one per worktree, with `npx next dev -p <port>`.
- `dev:tunnel` forwards to port 3200, so an agent on another port runs `ngrok http <port>`.
- When you're done, stop your server. Never stop or reuse a server outside the agents' range.

### Open and Merge Pull Requests

- Title a PR to match its issue, and keep the title and description matching its current scope.
- Use `.github/pull_request_template.md`. A description starts with `Closes #<issue-number>`.
- Say a PR is ready for review. Never say it needs the owner's approval, because GitHub doesn't let anyone approve their own PR.
- Merge only when the user says to, using the `add-and-remove-worktrees` skill. `main` requires one approval as a deliberate self-review checkpoint, so don't suggest dropping it.

## Accepted Risks

Don't raise these in reviews:

- `plaid/legacy`: Four files import it until #13 migrates to the new Plaid SDK.
- The open-ended `engines.node` range (`>=26`): It's deliberate, to run the latest Node.js. If a new major version breaks something, that gets looked into then.

## Skills

When a skill's description matches your task, read and follow its instructions in `.claude/skills/<name>/SKILL.md`:

- `add-and-remove-worktrees`: Sets up and enters a worktree for an issue or Dependabot PR, and removes it after the merge. Use when starting a task or merging its PR. Merges only when the user says to.
- `create-and-manage-issues`: Creates issues on the board, updates them, and moves their status. Use when creating an issue, updating one, or changing its status.

To keep a skill usable by any agent, put only `name` and `description` in its front matter.

<!-- BEGIN:nextjs-agent-rules -->

## This Is NOT the Next.js You Know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
