---
name: open-pull-requests
description: Pushes a task's branch, opens its PR as a draft, and later marks it ready for review and moves its issue to In Review. Use when opening a PR, or when a draft is ready for review. Pushes, opens the PR, and marks it ready only when the user says to.
---

# Open Pull Requests

A task's PR usually opens as a draft, soon after its first commit, and more commits follow while its issue stays In Progress. When the work is ready, the PR moves to In Review.

Push, open the PR, and mark it ready only when the user says to. Run these steps in order, from the task's worktree.

## Open a Draft

### Run the Checks

```bash
npm run typecheck
npm run lint:all
npm run build
```

If one fails, fix it, and commit the fix only when the user says to. Then run all three again.

### Check for Uncommitted Work

```bash
git status --short
```

If this prints anything, stop and ask, because the PR only includes what's committed.

### Push the Branch

```bash
git push -u origin <branch>
```

A task's worktree starts with no upstream, so `-u` sets one. Never add `--force` without asking.

### Open the PR

The PR's title matches its issue's. To get it:

```bash
gh issue view <issue-number> --repo christianareas/counterledger --json title --jq .title
```

Write the description to a temporary file, in the shape of `.github/pull_request_template.md`:

- Start with `Closes #<issue-number>`.
- Copy the issue's To-Dos, and check off each one the PR finishes. Under a To-Do, add anything a reviewer should know, such as why it was done that way.
- Copy the issue's Out of Scope items. If it has none, leave out `Out of Scope:`.

Then open the draft:

```bash
gh pr create --draft --title "<title>" --body-file <file>
```

If the user asks for a PR that's ready for review from the start, leave out `--draft`, check the session's title, and continue from [Move the Issue to In Review](#move-the-issue-to-in-review).

### Check the Session's Title

The session's title should match the PR's. If it doesn't, rename the session, as the `add-and-remove-worktrees` skill describes.

### Say the Draft Is Open

Tell the user the draft is open, and link to it. The issue stays In Progress.

## Mark the PR Ready for Review

Do this when the user says the work is ready. A Dependabot PR is already open and isn't a draft, so skip the push and [Mark It Ready](#mark-it-ready).

### Get the Branch Ready

[Run the checks](#run-the-checks), [check for uncommitted work](#check-for-uncommitted-work), and [push the branch](#push-the-branch) again.

### Mark It Ready

Update the description to match what's done, as in [Open the PR](#open-the-pr), and then mark the PR ready:

```bash
gh pr edit <number> --body-file <file>
gh pr ready <number>
```

### Move the Issue to In Review

Use the `create-and-manage-issues` skill. A Dependabot PR has its own item on the board, so move that.

### Say the PR Is Ready for Review

Tell the user the PR is ready for review, and link to it. Then ask whether to run `/code-review`, and run it only if the user says to.
