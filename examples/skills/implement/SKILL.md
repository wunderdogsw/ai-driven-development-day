---
name: implement
description: Build a ticket from its approved plan in plans/<ticket>/. Tests first, then code, and Claude can only finish when every AC test and check passes. Use in a fresh session after /plan, for example "/implement JIRA-1234".
argument-hint: <ticket id>
disable-model-invocation: true
hooks:
  PreToolUse:
    - matcher: "Edit|Write|MultiEdit|NotebookEdit|Bash"
      hooks:
        - type: command
          command: node "${CLAUDE_PROJECT_DIR}/.claude/skills/implement/scripts/lock.mjs"
  Stop:
    - hooks:
        - type: command
          command: node "${CLAUDE_PROJECT_DIR}/.claude/skills/implement/scripts/ac-gate.mjs"
          timeout: 600
---

# Implement: approved plan → working code

You build exactly what `plans/<TICKET>/plan.md` says. A separate subagent writes the tests first, from the ACs only. Two hooks come with this skill and stay on for the rest of the session:

- **Lock** (before every edit): during the build, the approved test files, `acs.md`, `sequence.md` and `plan.md` can't be changed.
- **AC gate** (when you try to finish): runs every test command and check in the plan. If one fails, you keep working.

Ticket: $ARGUMENTS

## 1. Check the plan

Read `plans/<TICKET>/acs.md`, `sequence.md` and `plan.md`.

Stop if `plan.md` is missing, has no `Status: approved` line, or has no Tests table: "There is no approved plan. Run /plan <TICKET> first."

Write `plans/.implementing`:

```json
{ "ticket": "<TICKET>", "phase": "tests" }
```

## 2. Tests from the intent (phase: tests)

Start the `test-writer` subagent with the ticket id. It writes every test in the Tests table from `acs.md` only, before any code, and runs them. **You don't write or change tests yourself.** The tests and the code come from two different agents, so they can't share one misreading of the plan.

Check what it returns: every test exists, uses the AC's values, and **fails for the right reason** (the behavior is missing, not a typo or a build error). If not, send it back with what is wrong.

Show the user the tests and the failing output, then ask:

> These are the tests for AC1–AC3 and the "must never" rule, written from the ACs only. They fail because the feature doesn't exist yet. Approve them? After this they are locked.

Only on yes, change `plans/.implementing` to `"phase": "build"`. From now on the lock hook blocks every edit to these tests. On no, ask what is wrong and send it back to `test-writer`.

## 3. Build (phase: build)

Follow the steps in `plan.md` in order. After each step:

- run the test commands for that step's AC;
- use the skills the plan names (for example `add-ef-migration`).

Change only the files in the Files table. If you must change another file, stop and ask: the plan was wrong, and a human should decide.

If a test fails, fix the code, not the test. The lock blocks test edits; don't try to get around it. If you believe a test is wrong, stop and explain why to the user.

## 4. Check against the ACs

Before you finish, start the `review-logic` subagent with the ticket. It reads the code against each AC: missing, extra, edge cases. Fix every blocking finding.

## 5. Finish

When you stop, the AC gate runs every command in the Tests table and the Checks list.

- **All pass** → the gate removes `plans/.implementing`, and the hooks stop doing anything.
- **Something fails** → the gate sends you back with the output. Fix it.
- **Fails 5 times in a row** → the gate lets you stop and tells the user. Write what blocks you.

Then report:

```
JIRA-1234 built.
Tests: 5 of 5 pass (AC1, AC2, AC3, must never, E2E)
Checks: 3 of 3 pass
Files: 11 of 11 from the plan, no others
Next: run /review JIRA-1234
```

Nothing is committed. The human reviews and commits.
