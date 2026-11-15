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

- `.claude/settings.json`: Makes Claude Code ask before it copies `.env*` files, commits, pushes, merges, opens a PR, or marks one ready. It also blocks Claude Code from reading `.env*` files or moving worktrees.
- `.claude/skills/`: Skills for recurring tasks, one folder per skill. See also [Rules and Skills](#rules-and-skills).
- `.claude/worktrees/`: One worktree per task. Git ignores it.
- `.github/`: The PR and issue templates.
- `biome.json`: Biome's settings, for code and config files.
- `.rumdl.toml`: rumdl's settings, for Markdown files.
- `postman/` and `.postman/`: Postman's Git sync writes these.

## Rules and Skills

A rule is a constraint or convention you should always follow. A skill is a procedure (or set of procedures) that may also include scripts and resources. To learn more, see:

- [Steering Claude Code: When to use `CLAUDE.md`, skills, hooks, and subagents](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more)
- [Agent Skills](https://agentskills.io)

For this project, rules belong in this file (`AGENTS.md`), and skills belong in `.claude/skills/`. If a rule increases in scope (for example, from one step to several, or from a concise sentence to a convoluted one—or a paragraph), consider promoting it to a skill. Propose any such change to a human for approval.

Rules and skills are listed in the following sections, organized by the type of task. If you add a new rule or skill, follow this project's patterns.

Don't document something that's documented elsewhere. Link to it instead. For example, don't document how to use [Drizzle's transactions](https://orm.drizzle.team/docs/transactions). However, you can add further guidance. For example, you can say to name the transaction variable `tx` and why.

### Manage Issues

- Before you get started, find or ask for an issue on the [CounterLedger board](https://github.com/users/christianareas/projects/5). If there's none, use the `create-and-manage-issues` skill to create one. Dependabot PRs have no issue. The board adds each one on its own, by its `dependencies` label, which #9 sets up.
- If a task's scope changes, update the issue and PR to match.
- If a PR handles something another open issue lists, remove it from that issue, and say what you removed.
- Status is To Do when the issue or Dependabot PR is added, In Progress when its worktree is created and while its PR is a draft, In Review when its PR is ready for review, and Done when the PR merges. The board sets To Do and Done; humans and agents set In Progress and In Review.
- When an issue moves to In Review, ask whether to run `/code-review`. Run a review only when the user asks for one.

Skills:

- [`create-and-manage-issues`](.claude/skills/create-and-manage-issues/SKILL.md): Creates issues on the board, updates them, and moves their status. Use when creating an issue, updating one, or changing its status.

### Work in a Worktree

- A human starts each task's session in the main checkout, with **Worktree** off. Use the `add-and-remove-worktrees` skill to set up and remove the task's worktree.
- Enter the worktree before you edit anything. Until then, a session edits the main checkout.
- Name a task's worktree `.claude/worktrees/<issue-number>/`, on branch `<issue-number>-<short-name>`. A Dependabot PR's worktree uses the PR number, on Dependabot's branch. Issues and PRs share one number sequence, so a PR's number never matches an issue's.
- Title a task's session `#<number> <PR title>`, with the issue's number, or the PR's for a Dependabot PR. Until there's a PR, use the issue's title.
- Don't move a worktree the app created for a session. The session's write hook stays registered to the old path, which strands the session.
- Give each worktree its own `.env.local`, copied from the main checkout, and its own `npm install`.
- All worktrees share one Neon database and one ngrok tunnel, so only one worktree at a time runs migrations or tests webhooks.
- A change to `.claude/settings.json` on a branch doesn't apply to a session that started in the main checkout, and a change to `.claude/skills/` may not, so test them after they merge.

Skills:

- [`add-and-remove-worktrees`](.claude/skills/add-and-remove-worktrees/SKILL.md): Sets up and enters a worktree for an issue or Dependabot PR, and removes it after the merge. Use when starting a task or merging its PR. Merges only when the user says to.

### Branch and Commit

- Don't commit or push unless asked. Each set of changes needs its own go-ahead. Humans ask for a change and then review the diff, and there's no diff to review once it's committed.
- Make one commit per logical change, so each message describes its whole commit.
- Make one logical change at a time, and propose its commit message with it, so each diff is small enough to review quickly.
- Stage each change once you've made it, so `git diff --staged` shows exactly what its commit will contain. Before you start a change for a different commit, ask whether to commit the staged one.
- Don't commit debugging code, such as `console.log` calls, or secrets, such as `.env*` files, API keys, or tokens.
- Write commit messages in the past tense, short and ending with a period, such as "Limited PLAID_ENV to sandbox and production."
- Don't read `.env*` files. To copy one, ask the user first, and then use `cp`.
- This repository is public. Don't name private repositories or organizations in it, or in issues, PRs, or commits.

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

### Add Scripts

- If a human or agent runs a command often, you should propose adding it to `scripts` in `package.json`. Its name and order should follow the file's pattern.
- If the script or command needs further context, add a rule to this file in an appropriate location.

### Manage Dependencies

- Write every `package.json` dependency as `^<full version>`, such as `"jose": "^6.2.15"`, not `^6` or an exact pin.
- Before you adopt a dependency, explain the trade-offs and ask.
- Use npm. #11 tracks whether to change package managers.

### Name Things

- Use CMoS (18th edition) title case and Merriam-Webster for headings, issue and PR titles, statuses, and workflow names. For example, write "To Do" and "Auto-Add".

### Lint and Validate

- If you edit Markdown, run `npm run lint:markdown`.
- If you edit code or config files, run `npm run lint:code`. If you edit `.ts` or `.tsx` files, also run `npm run typecheck`.
- Before you open a PR or push, run `npm run typecheck`, `npm run lint:all`, and `npm run build`.
- Biome skips the files the repository's `.gitignore` lists, but not the ones a global excludes file lists. List a tool's local files, such as `.claude/settings.local.json`, in `.gitignore`, or Biome lints them.
- Biome is the only code linter. Don't add ESLint back, or turn on Biome's YAML or Markdown handling, without asking. Biome's Markdown formatter rewrites rumdl's tables.
- Add each new linter to `lint:all`.

### Run the Development Server

- Humans run the development server on ports 3200–3209. Agents use 3210–3219, one per worktree, with `npx next dev -p <port>`.
- Before you start, see what's running. `lsof -nP -iTCP:3210-3219 -sTCP:LISTEN` lists what's listening on the agents' ports.
- `dev:tunnel` forwards to port 3200, so an agent on another port runs `ngrok http <port>`.
- When you're done, stop your server. You can also stop a server in the agents' range that's no longer in use, but don't stop, restart, or reuse one outside it, which a human may be using.

### Open and Merge Pull Requests

- Use the `open-pull-requests` skill to open a PR, as a draft unless the user asks otherwise.
- When a PR is ready for review, say so. Don't say it needs the owner's approval, because GitHub doesn't let anyone approve their own PR.
- Merge only when the user says to, using the `add-and-remove-worktrees` skill. `main` requires one approval as a deliberate self-review checkpoint, so don't suggest dropping it.

Skills:

- [`open-pull-requests`](.claude/skills/open-pull-requests/SKILL.md): Pushes a task's branch, opens its PR as a draft, and later marks it ready for review and moves its issue to In Review. Use when opening a PR, or when a draft is ready for review. Pushes, opens the PR, and marks it ready only when the user says to.

## Accepted Risks

Don't raise these in reviews:

- `plaid/legacy`: Four files import it until #13 migrates to the new Plaid SDK.
- The open-ended `engines.node` range (`>=26`): It's deliberate, to run the latest Node.js. If a new major version breaks something, that gets looked into then.

<!-- BEGIN:nextjs-agent-rules -->

## This Is NOT the Next.js You Know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
