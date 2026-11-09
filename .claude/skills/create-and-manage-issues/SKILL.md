---
name: create-and-manage-issues
description: Creates issues on the board, updates them, and moves their status. Use when creating an issue, updating one, or changing its status.
---

# Create and Manage Issues

Every task has an issue on the [CounterLedger board](https://github.com/users/christianareas/projects/5).

## Create an Issue

Check that no open issue already covers the task:

```bash
gh issue list --repo christianareas/counterledger --search "<words>"
```

Title the issue in CMoS title case, starting with an imperative verb, such as "Add CI Workflow to Validate PRs".

Write the body to a temporary file, in this shape. `To-Dos:` and `Out of Scope:` are plain labels, not headings. Leave out `Out of Scope:` and `Depends on` if they don't apply.

```markdown
<What the task does and why, in a sentence or two.>

To-Dos:

- [ ] <One short, imperative sentence that ends with a period.>

Out of Scope:

- <Something a reader might expect here, and why it's left out.>

Depends on #<number>.
```

Then create it. `--project` adds it to the board, and the board sets To Do.

```bash
gh issue create --repo christianareas/counterledger --project CounterLedger --title "<title>" --body-file <file>
```

## Link Dependencies

For each `Depends on` line, also add a native blocked-by link. Get both issues' IDs:

```bash
gh issue view <number> --repo christianareas/counterledger --json id --jq .id
```

Then link them, where `issueId` is the blocked issue and `blockingIssueId` is the one it depends on:

```bash
gh api graphql -f query='mutation($issueId: ID!, $blockingIssueId: ID!) { addBlockedBy(input: {issueId: $issueId, blockingIssueId: $blockingIssueId}) { issue { number } } }' -f issueId=<id> -f blockingIssueId=<id>
```

If the link already exists, this fails with "Target issue has already been taken", and nothing changes.

## Update an Issue

```bash
gh issue edit <number> --repo christianareas/counterledger --body-file <file>
```

## Move an Issue's Status

`AGENTS.md` says when each status applies and who sets it.

Find the issue's item on the board. For a Dependabot PR, use the PR's number.

```bash
gh project item-list 5 --owner christianareas --format json --limit 200 --jq '.items[] | select(.content.number == <number>) | .id'
```

If that prints nothing, add the item, and then find it again:

```bash
gh project item-add 5 --owner christianareas --url <issue-or-pr-url>
```

Then set the status, with the option for the status you want:

```bash
gh project item-edit --id <item> --project-id PVT_kwHOAGh1f84Bqp8t --field-id PVTSSF_lAHOAGh1f84Bqp8tzhpAGp4 --single-select-option-id <option>
```

| Status      | Option |
| ----------- | ------ |
| In Progress | `47fc9ee4` |
| In Review   | `61e0b9a0` |

Linking a PR to an issue sets In Progress, so set In Review after you open the PR. Then read the status back, because the board can overwrite it:

```bash
gh project item-list 5 --owner christianareas --format json --limit 200 --jq '.items[] | select(.content.number == <number>) | .status'
```
