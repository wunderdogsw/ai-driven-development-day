---
name: part3
description: Run Part 3 of the hands-on day (talking to the agent). Checks the skill and agent descriptions in the participant's repo and the prompts they write, and says what is good or how to improve it. Use when the participant types /part3.
disable-model-invocation: true
---

Read `AGENTS.md` at the repository root completely and follow it. Then run Part 3 as written below.

This part runs **after the Part 3 talk** ("Talking to the agent").

## Writing rule for this part

Everything you write, and every description or prompt you suggest, uses plain English that an 18-year-old understands on first read. No metaphors. No extra words. If a description works with 20 words, don't use 40.

## First message

Read `.workshop/progress.json` and the active target's `profile.json` and `findings.md`. If there is no active target, say they need `/start` first, or follow "No repo?" in `AGENTS.md`. Set Part 3 to `in_progress`. Send:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Part 3 — Talking to the agent        (repo: <name>)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What happens
1. Descriptions — I check the description of every skill and agent in your repo.
2. Try one — we check that Claude picks a skill from a normal request.
3. Prompts — you paste prompts you wrote, I show what is good and what is missing.

Nothing is committed or pushed to your repo. Drafts stay in a separate copy that you can delete.

Say "go" to start.
```

## 3.1 Descriptions

Explain in two lines: "Claude sees only the name and description of each skill and agent until it uses one. The description decides if Claude picks it at the right time."

Collect, in `targets/<name>/`:

- Project skills: `.claude/skills/*/SKILL.md` and `.agents/skills/*/SKILL.md` (frontmatter `name`, `description`, `when_to_use`, `disable-model-invocation`, `allowed-tools`).
- Project agents: `.claude/agents/*.md` (frontmatter `name`, `description`, `tools`, `model`).
- Old commands: `.claude/commands/*.md`.
- The drafts from Part 2 count too.

Skills installed from a vendor library (for example Vercel's) are maintained by the vendor. Check them, but suggest no rewrite; only note if one overlaps with a team skill.

Check each description against the current Claude Code skills and subagents docs. At the time of writing:

| Check | Good when |
|---|---|
| What + when | It says what the skill does **and** when to use it. |
| Key use case first | The first sentence holds the main use. The listing cuts `description` + `when_to_use` at 1,536 characters. |
| Real words | It uses the words a teammate would type ("add a column", "migration", "run the app"), not only internal names. |
| No overlap | No two skills or agents claim the same request. |
| Side effects | A skill that deploys, deletes or posts has `disable-model-invocation: true`, so only a human can start it. |
| Agents | The description says when to hand work to the agent. `tools` gives only what it needs (a reviewer gets no `Edit`). |
| Short and plain | No filler, no "IMPORTANT", no CAPS. |

Send one block per skill or agent, most important first:

```
**add-ef-migration** — Improve
Now: "Migration helper."
Suggested: "Add an EF Core migration for a model change and test it. Use when someone asks to add, rename or remove a column or table."
Why: Claude doesn't know when "migration helper" applies, so it may write the migration by hand.
```

For a good one, one line: `**run-local** — Good: says what and when, uses the words people type.`

If the repo has no skills or agents, say so in one line and go to 3.3.

For good descriptions to point at, use the examples: `examples/skills/*/SKILL.md` and `examples/agents/*.md` (https://wunderdogsw.github.io/ai-driven-development-day/examples/).

End with: "Which suggestions do you want as drafts? Reply with the names, 'all' or 'none'." Write the drafts in `targets/<name>/`, uncommitted, one at a time, as `AGENTS.md` says. Write the results under `## Part 3: Descriptions` in `findings.md`.

✓ 3.1 Descriptions done

## 3.2 Try one

Explain in one line: "A description is only good if Claude picks the skill from a normal request."

Pick one skill with a changed or doubtful description. Ask the participant to write the request a teammate would type, **without the skill's name**. Then they try it in a second terminal:

```bash
cd <absolute path to targets/<name>>
claude
```

They type the request and watch whether Claude uses the skill. Ask them before they try: "Do you think it picks the skill?" Compare after.

If they want numbers, offer the `claude plugin eval` setup from Part 2 (2.5) with a `tool_used` grader, run with and without the new description. Report the result and the cost.

✓ 3.2 Try one done

## 3.3 Prompts

Ask: "Paste 2–3 prompts you wrote to an agent recently. Real ones, as you typed them." If they have none at hand, ask them to write the prompt they would use for a real ticket they work on now.

Check each prompt against the Part 3 talk:

| Check | Good when |
|---|---|
| The file | It points to where to look (`@path`, a folder, a service). |
| The symptom | It says what is wrong or what is wanted, with real values. |
| Done | It says what "done" looks like (a failing test first, a passing command). |
| Size | It says how big: smallest working change, or "be ambitious" with edge, empty and error states. |
| Evidence | It asks for the command and its output, not "tests pass". |
| Context | It gives what Claude can't see: a screenshot, a log (`cat log \| claude -p`), a ticket. |
| No myths | No CAPS "IMPORTANT", no "think harder", no "don't be lazy". |

Send one block per prompt:

```
**Prompt 1** — Improve
Good: names the service.
Missing: what "done" looks like, and evidence.
Suggested: "Login fails after the session times out. Look at token refresh in src/Api/Auth/TokenService.cs. Write a failing test first, then fix it. Show me the dotnet test command and its output."
Why: Claude stops when it thinks it's done. A failing test and the output show it is really done.
```

If a prompt is one they type often, suggest a skill they can call directly (for example `/implement <ticket>`), with one line of Why: "Same steps every time, and the same result for juniors and seniors." Offer to draft it.

Write the results under `## Part 3: Prompts` in `findings.md`.

✓ 3.3 Prompts done

## Part complete

Set Part 3 to `complete`. Send:

```
✓ Part 3 complete.

**Descriptions:** <n good, n improved, one line>
**Prompts:** <the one thing to add most often, one line>

Nothing is committed or pushed to your repo.

---

**Next, Part 4:** we build a discovery skill that turns a ticket into precise acceptance criteria. Type /part4 after the Part 4 talk.
```
