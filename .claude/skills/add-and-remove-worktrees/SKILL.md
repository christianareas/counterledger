---
name: add-and-remove-worktrees
description: Sets up and enters a worktree for an issue or Dependabot PR, and removes it after the merge. Use when starting a task or merging its PR. Merges only when the user says to.
---

# Add and Remove Worktrees

Every task has its own worktree, so humans and agents can work on several things at once. This skill starts a task in a worktree and cleans up after the merge.

Merge only when the user says to.

## Start a Task

### Check Where the Session Started

A human starts the session in the main checkout, with **Worktree** off. In the terminal, that's `claude` without `--worktree`. Don't start it from another session, which has landed in the parent's worktree as well as in the main checkout.

Check that this command prints the main checkout, not a path under `.claude/worktrees/`:

```bash
git rev-parse --show-toplevel
```

In the app, also call `get_session` with `self`. It must show no `worktreePath`.

If the session is in a worktree the app created, which has a random name, stop and ask for a new session.

### Create the Worktree

If `git worktree list` already shows the task's worktree, because an earlier session started the task, skip to [Enter the Worktree](#enter-the-worktree).

Run these from the main checkout. Once a session is in a worktree, Claude Code refuses git commands aimed at the main checkout.

For an issue:

```bash
git fetch origin main
git worktree add --no-track -b <issue-number>-<short-name> .claude/worktrees/<issue-number> origin/main
```

For a Dependabot PR, use its number and its branch, which `gh pr view <number> --json headRefName` shows:

```bash
git fetch origin <branch>
git worktree add --track -b <branch> .claude/worktrees/<pr-number> origin/<branch>
```

### Copy `.env.local`

Copy the file without reading it. `.worktreeinclude` doesn't help, because it applies only to worktrees Claude Code creates. If the deny rule in `.claude/settings.json` refuses the copy, ask a human to run it.

```bash
cp .env.local .claude/worktrees/<number>/.env.local
```

### Enter the Worktree

Call `EnterWorktree` with `path` set to the worktree's absolute path. In another agent, change to that directory instead. Enter before you edit anything, because a session edits the main checkout until it does.

Stay in the worktree until you finish the task. To confirm where you are, use `git rev-parse --show-toplevel`. `get_session` keeps showing the main checkout as `cwd`.

### Install the Dependencies

```bash
npm install
```

npm warns that it skipped install scripts for esbuild and fsevents. That's expected, and the build still passes.

### Name the Session

Title the session `#<number> <PR title>`. Until there's a PR, use the issue's title. If the PR's title changes, rename the session to match.

In the app, call `set_session_title` with `session_id` set to `self`. In the terminal, run `/rename`.

### Move the Issue to In Progress

Use the `create-and-manage-issues` skill. A Dependabot PR has its own item on the board, so move that.

## Finish a Task

Do this only when the user says to merge. What `gh` does here comes from reading its source, and hasn't been run end to end, so don't skip the checks.

### Check the PR

```bash
gh pr checks <number>
```

Any non-zero exit code means don't merge yet, so tell the user. `--admin` bypasses required checks, so this is the only check before merging.

### Leave the Worktree

Stop any server you started in the worktree. Then call `ExitWorktree` with `action` set to `keep`, which returns the session to the main checkout. `gh` needs to run from there, because inside the worktree it skips the local cleanup.

### Check for Unmerged Work

```bash
git -C .claude/worktrees/<number> status --short
git -C .claude/worktrees/<number> rev-parse HEAD
gh pr view <number> --json headRefOid --jq .headRefOid
```

If `status` prints anything, stop and ask, because the removal will fail. Never add `--force` without asking. Ignored files, such as `.env.local`, `node_modules`, and `.next`, don't block the removal.

If the two commits differ, stop and ask. The merge only includes what's pushed, and `gh` force-deletes the local branch, so unpushed commits would be lost.

### Merge

```bash
gh pr merge <number> --admin --merge --delete-branch
```

Don't pass `--repo` or `-R`, which turns off the local cleanup. `.claude/settings.json` asks for approval before this runs.

### Clean Up

`gh` doesn't update `main`, so pull it. Then check that the worktree and branch are gone:

```bash
git pull
git worktree list
git branch --list <branch>
```

If the worktree removal fails, `gh` only warns, keeps the local branch, and still deletes the remote branch. If either is still there, remove it:

```bash
git worktree remove .claude/worktrees/<number>
git branch -d <branch>
```

Nothing else removes these worktrees, because the app doesn't sweep ones made with `git worktree add`. The board moves the issue to Done on its own.
