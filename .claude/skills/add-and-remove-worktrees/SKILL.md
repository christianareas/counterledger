---
name: add-and-remove-worktrees
description: Sets up and enters a worktree for an issue or Dependabot PR, and removes it after the merge. Use when starting a task or merging its PR. Merges only when the user says to.
---

# Add and Remove Worktrees

Every task has its own worktree, so humans and agents can work on several things at once. This skill starts a task in a worktree and cleans up after the merge.

Merge only when the user says to.

## Start a Task

### Check Where the Session Started

A human starts the session in the main checkout, not in a worktree. For example, in the Claude app, **Worktree** is off, and in the terminal, it's `claude` without `--worktree`. Don't start it from another session, which has landed in the parent's worktree as well as in the main checkout.

Check that this command prints the main checkout, not a path under `.claude/worktrees/`:

```bash
git rev-parse --show-toplevel
```

With Claude, you can also call `get_session` with `self`, which must show no `worktreePath`.

If your session started in a worktree of its own, which has a random name, stop and ask for a new session.

If it prints the task's own worktree, `.claude/worktrees/<number>`, you're resuming the task there. Skip to [Copy `.env.local`](#copy-envlocal), and copy the file from `../../../.env.local`.

### Create the Worktree

Run these from the main checkout, before you change to the worktree. Claude, for example, refuses git commands aimed at the main checkout once it's in a worktree.

If `git worktree list` already shows the task's worktree, because an earlier session started the task, skip to [Copy `.env.local`](#copy-envlocal).

If `git branch --list <branch>` shows the task's branch, but `git worktree list` doesn't show its worktree, because something removed it, create the worktree on the existing branch. Leave out `-b`, which fails when the branch already exists:

```bash
git worktree add .claude/worktrees/<number> <branch>
```

If the branch exists only on the remote, which `git ls-remote --heads origin <branch>` shows, create the worktree from it, so it keeps the PR's commits. Start a Dependabot PR this way too, with its number and its branch, which `gh pr view <number> --json headRefName` shows:

```bash
git fetch origin <branch>
git worktree add --track -b <branch> .claude/worktrees/<number> origin/<branch>
```

Otherwise, start a new branch for the issue:

```bash
git fetch origin main
git worktree add --no-track -b <issue-number>-<short-name> .claude/worktrees/<issue-number> origin/main
```

### Copy `.env.local`

If the worktree already has a `.env.local`, skip this step. Otherwise, ask the user for permission to copy it, and show them the command. Once they agree, copy the file without reading it. If you can't run the copy, ask the user to run it. With Claude, `.worktreeinclude` doesn't help, because it applies only to worktrees Claude creates.

```bash
cp .env.local .claude/worktrees/<number>/.env.local
```

### Change to the Worktree

Change to the worktree's directory before you edit anything, because until you do, your edits land in the main checkout. With Claude, use `EnterWorktree` with `path` set to the worktree's absolute path instead, which also keeps your git commands from reaching the main checkout.

Stay in the worktree until you finish the task. To confirm where you are, use `git rev-parse --show-toplevel`. With Claude, `get_session` keeps showing the main checkout as `cwd`.

### Install the Dependencies

```bash
npm install
```

npm warns that it skipped install scripts for esbuild and fsevents. That's expected, and the build still passes.

### Name the Session

If you can name sessions, title the session `#<number> <PR title>`, with the issue's number, or the PR's for a Dependabot PR. Until there's a PR, use the issue's title. If the PR's title changes, rename the session to match.

For example, Claude can call `set_session_title` with `session_id` set to `self`.

### Move the Issue to In Progress

Use the `create-and-manage-issues` skill. A Dependabot PR has its own item on the board, so move that.

## Finish a Task

Do this only when the user says to merge. What `gh` does here comes from reading its source, and hasn't been run end to end, so don't skip the checks.

### Check the PR

```bash
gh pr checks <number>
gh pr view <number> --json isDraft --jq .isDraft
```

Any non-zero exit code from `gh pr checks` means don't merge yet, so tell the user. If the second command prints `true`, the PR is still a draft, so ask whether to mark it ready first, with the `open-pull-requests` skill. `--admin` bypasses required checks, so these are the only checks before merging.

### Change to the Main Checkout

Stop any server you started in the worktree. Then change to the main checkout, because inside the worktree, `gh` skips the local cleanup. With Claude, if you used `EnterWorktree`, call `ExitWorktree` with `action` set to `keep` instead.

### Check for Unmerged Work

```bash
git -C .claude/worktrees/<number> status --short
git -C .claude/worktrees/<number> rev-parse HEAD
gh pr view <number> --json headRefOid --jq .headRefOid
```

If `status` prints anything, stop and ask, because the removal will fail. Don't add `--force` without asking. Ignored files, such as `.env.local`, `node_modules`, and `.next`, don't block the removal.

If the two commits differ, stop and ask. The merge only includes what's pushed, and `gh` force-deletes the local branch, so unpushed commits would be lost.

### Merge

```bash
gh pr merge <number> --admin --merge --delete-branch
```

Don't pass `--repo` or `-R`, which turns off the local cleanup. With Claude, `.claude/settings.json` asks the user to approve this command.

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

Don't count on anything else to remove them. The Claude app, for example, doesn't remove worktrees made with `git worktree add`. The board moves the issue to Done on its own.
