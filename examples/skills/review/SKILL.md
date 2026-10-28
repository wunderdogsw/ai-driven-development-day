---
name: review
description: Review a change against its approved plan in plans/<ticket>/, with independent subagents that verify and review, then cross-check their findings and write review comments. Use before opening a PR, on an open PR, or when asked to review a branch, for example "/review JIRA-1234".
argument-hint: <ticket id>
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git ls-files *) Bash(git log *) Bash(git branch --show-current) Bash(node ${CLAUDE_SKILL_DIR}/scripts/drift-guard.mjs *) Bash(node ${CLAUDE_SKILL_DIR}/scripts/grade.mjs *) Bash(dotnet build *) Bash(dotnet test *) Bash(vendor/bin/phpstan *) Bash(vendor/bin/phpunit *) Bash(npx tsc *) Bash(npx eslint *) Bash(npx fallow *) Bash(gh pr view *) Bash(glab mr view *) mcp__ado__repo_pull_request mcp__ado__wit_work_item mcp__atlassian__getJiraIssue
---

# Review a change

You lead the review. Machines run the mechanical checks. Independent subagents verify and review. You cross-check what they found, and write the comments. You never edit code, tests or plans. The only files you write are in `plans/<TICKET>/review/`.

Ticket: $ARGUMENTS. If empty, take it from the branch name (`feature/JIRA-1234-…`). If there is none, find the open PR for the branch (GitHub: `gh pr view`; Azure DevOps: MCP `repo_pull_request`; GitLab: `glab mr view`) and use its linked ticket. If there is still none, ask.

## 1. Prepare the packet

Collect the inputs and write them to `plans/<TICKET>/review/packet.md`. Every subagent gets this file and nothing else from you.

- Base: `origin/main`.
- Changed files: `git diff --name-only origin/main` plus `git ls-files --others --exclude-standard`.
- How to see the diff: `git diff origin/main -- <file>`.
- Intent: `plans/<TICKET>/acs.md`, `sequence.md`, `plan.md`. No plan files? Read the ticket from the team's tracker (the same way as the `discover` skill's `sources.md`: Jira, Linear, GitHub, Azure Boards or GitLab), put its text in the packet, and write "No plan" at the top.
- The check commands from [references/checks.md](references/checks.md) for the stacks the change touches.
- The findings format: [references/findings.md](references/findings.md).
- **Other reviewers already on the PR.** If a PR exists, collect the comments that CodeRabbit, Greptile or the SonarCloud quality gate left on it. They go into the cross-check as one more independent source (`P`). Don't send them to the subagents.

Pre-grade the change: `node ${CLAUDE_SKILL_DIR}/scripts/grade.mjs --base origin/main` ([references/grading.md](references/grading.md)). It decides how many reviewers run in step 4.

## 2. Mechanical checks (you, no model judgement)

Run these yourself. They give the same result every time.

- Static checks from `checks.md`. Keep only what failed, at most 20 lines per command.
- File drift: `node ${CLAUDE_SKILL_DIR}/scripts/drift-guard.mjs --plan plans/<TICKET>/plan.md --base origin/main`
- Docs: changelog for new behavior, ADR for a changed decision, README for changed setup.

## 3. Verification subagents (parallel, independent)

Start both in **one message**, so they run at the same time. Give each one the packet path and its task. Nothing else.

| Subagent | Checks |
|---|---|
| `review-ac-verifier` | One test per AC exists, runs and passes, and tests the AC's values. Runs each AC test 3 times to catch flaky tests, and checks for fixed seeds and frozen clocks. Property test per "must never" rule. E2E for the main flow, with a Playwright trace (and video if the config records it). Test files changed after the plan was approved. |
| `review-flow-verifier` | Redraws the sequence diagram from the changed code without looking at the plan's one, then compares the two arrow by arrow: match, missing, new, changed. Saves both to `review/sequence-from-code.md`. If the web app runs locally, goes through the main flow with the Playwright MCP server and saves a screenshot per AC. |

Skip `review-ac-verifier` and the diagram part when there is no plan. Say so in the output.

## 4. Reviewer subagents (parallel, independent)

Start them in **one message**, together with step 3 if you can. Each one reviews alone. **Never pass one reviewer's findings to another.** Independent reviews are what make agreement mean something.

| Subagent | Looks at | Runs |
|---|---|---|
| `review-code` | Code level: bugs, error handling, nulls, security, performance, dead code, duplication, team conventions | always |
| `review-logic` | Business logic against the ACs: missing, extra, edge cases, concurrency, "must never" rules, data consistency | always |
| `review-fresh-eyes` | The diff and the ticket title only, no ACs or plan. Anything that looks wrong to someone who wasn't in the planning | pre-grade Large or Critical, or when `review-code` and `review-logic` disagree |

## 5. Cross-check the findings

Put every finding from steps 2–4 in one list. Then:

1. **Group.** Same file, lines within 10 of each other, same problem → one finding. Keep every source: "found by review-code, review-logic".
2. **Agreement.** Found by two or more independent sources (subagents, mechanical checks, or another reviewer tool on the PR) → **confirmed**.
3. **Single finding.** Found by one → check it yourself: read the lines, run the test or the check if one exists. Then **confirmed**, **rejected** (with the reason), or **unsure**.
4. **Facts beat readings.** A test run or a check output outranks a reviewer's reading. If a reviewer says AC2 is not handled but the AC2 test passes, check that the test really uses the AC2 values before you reject the finding.
5. **Disagreement.** Two subagents say opposite things → **unsure**, both views go to the human.
6. **Diagram and drift.** A `new` or `changed` arrow and a drift-guard "not in the plan" line on the same file are the same finding, found twice → confirmed. A `missing` arrow and a missing AC test from `review-ac-verifier` for the same AC → confirmed.
7. **Severity.** `blocking` only when it breaks an AC, a "must never" rule, security, data, or a check. Everything else is `non-blocking` or `nitpick`.
8. **Nothing is dropped silently.** Rejected findings are listed with their reason in `review.md`.

Unsure findings become `question:` comments. Confirmed findings become comments with their label.

## 6. Grade

Start from the script's grade. Raise it if the review found business logic, a data change or a security finding that the paths didn't show. Never lower it. See [references/grading.md](references/grading.md).

## 7. Write the comments

How to write them, with examples: [references/comments.md](references/comments.md).

**Is there a PR?** GitHub: `gh pr view --json number,url`. Azure DevOps: MCP `repo_pull_request` (`list`, source branch = current branch). GitLab: `glab mr view`.

- **Not yet a PR** → write `plans/<TICKET>/review/review.md`: the summary, the fix list (blocking first), the comments by file with `path:line`, and the rejected findings. Tell the user: "Fix the blocking items in review.md, then run /review again."
- **PR exists** → write the comments to `plans/<TICKET>/review/comments.md` first and show them. Ask: "Post N comments to PR #<n>?" Only on yes, post each on its file and line, plus one summary comment. GitHub: one review with `gh api repos/{owner}/{repo}/pulls/<n>/reviews` (inline comments in `comments`). Azure DevOps: MCP `repo_pull_request_thread_write` (`create`). GitLab: `glab api` merge request discussions with a position. This write is not pre-approved, so the user approves it.

## Output to the user

```
Review: JIRA-1234 (feature/JIRA-1234-phone-on-profile), grade Large, needs a human

Checks: 1 failed (eslint), drift: 1 unplanned file, 1 missing test file
Tests: AC1, AC2 pass 3 of 3 runs · AC3 missing · no flaky tests · E2E trace: plans/JIRA-1234/review/e2e-trace.zip
Diagram: 4 match, 1 missing (AC3), 1 new (API → Cache), 1 changed (200 OK body)
Subagents: ac-verifier, flow-verifier, review-code, review-logic, review-fresh-eyes
Findings: 6 confirmed (2 blocking), 1 unsure, 3 rejected

Blocking
1. AC3: empty phone saved as "" not NULL — ProfileService.cs:57 (review-logic, ac-verifier)
2. No test for AC3 — Api.Tests/ProfilePhoneTests.cs (ac-verifier, drift-guard)

Non-blocking
3. New cache write not in the plan — ProfileService.cs:72 (flow-verifier, drift-guard)

Written: plans/JIRA-1234/review/review.md, sequence-from-code.md
```
