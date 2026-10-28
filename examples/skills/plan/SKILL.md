---
name: plan
description: Turn the approved acceptance criteria in plans/<ticket>/ into a build plan where every step serves an AC, every file is named and every AC has a test. Use after /discover, in plan mode, for example "/plan JIRA-1234".
argument-hint: <ticket id>
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git log *) Bash(git ls-files *)
---

# Plan: ACs → build plan

Run this in plan mode (`claude --permission-mode plan`), so nothing changes until the human approves. You write one file, after the approval: `plans/<TICKET>/plan.md`. The format is in [references/plan-format.md](references/plan-format.md), and a full example is in [references/example-plan.md](references/example-plan.md).

Ticket: $ARGUMENTS

## 1. Read the intent

Read `plans/<TICKET>/acs.md` and `plans/<TICKET>/sequence.md`.

Stop if:

- either file is missing → "Run /discover <TICKET> first."
- `acs.md` has open questions → list them and stop. No plan without clear ACs.

## 2. Read the code

For every arrow in `sequence.md`, find the code that does it today, or where new code must go. Follow the team's patterns: find a similar feature and plan the same shape. Note every file you will change or create.

## 3. Steps

Numbered steps, small enough to check one by one. Each step ends with the AC it serves: `→ AC1`. A step that serves no AC is a question for the human, not a step.

## 4. Tests first

Tests come from the ACs, not from the code. They are written before any code, and they must fail first.

- One test per AC, with the AC's exact values.
- One property test per "must never" rule.
- One E2E test for the main flow.

Each test gets a row in the Tests table with the **exact command** that runs only that test. `/implement` and its Stop hook run these commands, so they must work as written.

## 5. Files

Every file you will change or create gets a row in the Files table: file, `edit` or `new`, what changes, which AC. Test files too. The drift guard in `/review` compares this table with what really changed.

## 6. Checks

The static check commands for the stacks this plan touches, from the repo's CI. `/implement` runs them before it can finish.

## 7. Risks

What could go wrong, in one line each: a migration, a shared component, a public API change, a feature flag. Each risk names the step it belongs to.

## 8. Ask for approval

This is where the human checks the intent: fixing it here takes minutes, fixing it in a PR takes days. Show all three together, in this order:

1. **The ACs** from `acs.md`: every AC, the "must never" rules and out of scope.
2. **The sequence diagram** from `sequence.md`.
3. **The plan**: steps, tests, files, checks and risks.

Then ask one question:

> Do you approve the ACs, the diagram and this plan? (Yes / No)

In plan mode this is the plan approval prompt.

- **Yes** → write `plans/<TICKET>/plan.md` with `Status: approved (<date>)`, and say: "Start a fresh session and run /implement <TICKET>."
- **No** → ask what is wrong or missing, one question at a time, until it is clear. Change the plan, show all three again, and ask again. If the answer changes an AC or the diagram, stop: run /discover again so `acs.md` and `sequence.md` change first.

Write nothing before the yes.
